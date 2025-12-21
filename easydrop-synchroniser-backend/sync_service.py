import os
import asyncio
import time
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from async_client import AsyncClient
import models_db

# Load env variables
load_dotenv()

class SyncService:
    def __init__(self):
        self.source_api_key = os.getenv("SOURCE_API_KEY")
        self.target_api_key = os.getenv("TARGET_API_KEY")
        self.concurrency_limit = 20  # Limit parallel updates to avoid overwhelming the API

    async def run_synchronization(self, db: Session):
        """
        Main async synchronization logic.
        1. Fetch Mappings
        2. Bulk Fetch Data (Source/Target Items & Sizes)
        3. Build Maps
        4. Compare & Queue Updates
        5. Execute Updates
        """
        print("--- Starting High-Performance Async Synchronization ---")
        start_time = time.time()

        if not self.source_api_key or not self.target_api_key:
            print("Error: API Keys not found in environment.")
            return

        # 1. Fetch Mappings
        mappings = db.query(models_db.ProductMapping).all()
        print(f"Loaded {len(mappings)} mappings from DB.")
        if not mappings:
            print("No mappings found. Exiting.")
            return

        # 2. Bulk Fetch Data
        async with AsyncClient(self.source_api_key, ssl=False) as source_client, \
                   AsyncClient(self.target_api_key, ssl=False) as target_client:
            
            print("Fetching bulk data from Source and Target...")
            
            # Fetch everything in parallel
            try:
                results = await asyncio.gather(
                    source_client.get_all_items(),
                    target_client.get_all_items(),
                    source_client.get_all_sizes(),
                    target_client.get_all_sizes()
                )
                
                source_items_list, target_items_list, source_sizes_list, target_sizes_list = results
                
                print(f"Fetched: {len(source_items_list)} source items, {len(target_items_list)} target items.")
                print(f"Fetched: {len(source_sizes_list)} source sizes, {len(target_sizes_list)} target sizes.")

            except Exception as e:
                print(f"Error during bulk fetch: {e}")
                return

            # 3. Data Transformation (In-Memory Maps)
            # Item Maps: ID -> Item Data
            source_items_map = {item['id']: item for item in source_items_list}
            target_items_map = {item['id']: item for item in target_items_list}

            # Size Maps: ItemID -> { SizeVal: SizeData }
            source_sizes_map = self._build_sizes_map(source_sizes_list)
            target_sizes_map = self._build_sizes_map(target_sizes_list)

            # 4. Compare logic
            update_tasks = []
            
            # Semaphore to control concurrency of updates
            sem = asyncio.Semaphore(self.concurrency_limit)

            print("Analyzing differences...")
            
            for mapping in mappings:
                s_id = mapping.source_id
                t_id = mapping.target_id

                # Get Objects
                s_item = source_items_map.get(s_id)
                t_item = target_items_map.get(t_id)

                if not s_item:
                    print(f"Warning: Source item {s_id} not found in fetched data.")
                    continue
                if not t_item:
                    print(f"Warning: Target item {t_id} not found in fetched data.")
                    continue

                # --- Compare Item Level (Price, Nal) ---
                # Default to 0 if key missing, though spec implies fields exist
                s_price = s_item.get('drop_price')
                s_nal = s_item.get('nal')
                
                t_price = t_item.get('drop_price')
                t_nal = t_item.get('nal')

                if s_price != t_price or s_nal != t_nal:
                    print(f"Queuing Item Update: Target {t_id} (Price: {t_price}->{s_price}, Nal: {t_nal}->{s_nal})")
                    update_tasks.append(
                        self._bounded_update_item(sem, target_client, t_id, s_price, s_nal)
                    )

                # --- Compare Size Level ---
                s_item_sizes = source_sizes_map.get(s_id, {})
                t_item_sizes = target_sizes_map.get(t_id, {})

                # Iterate through TARGET sizes to find matches in SOURCE
                # We update Target sizes that exist. 
                # (Assuming we don't create new sizes on Target, only update existing ones per spec "UPDATE Size Quantity")
                for val, t_size_data in t_item_sizes.items():
                    t_size_id = t_size_data['id']
                    t_qty = t_size_data['qty']

                    # Find matching size in source
                    if val in s_item_sizes:
                        s_qty = s_item_sizes[val]['qty']
                        
                        if t_qty != s_qty:
                            print(f"Queuing Size Update: Target {t_id} Size {val} (Qty: {t_qty}->{s_qty})")
                            update_tasks.append(
                                self._bounded_update_size(sem, target_client, t_size_id, val, s_qty)
                            )
                    else:
                        # Size exists in Target but not Source. 
                        # Option: Set qty to 0? Or ignore? 
                        # Usually for sync, if source doesn't have it, it might mean 0 stock.
                        # However, strictly following "Update only if quantity is different" and "Match by val",
                        # if it's not in source map, we can't be sure if it's missing or just 0.
                        # If source map comes from "All Sizes", and it's missing, it effectively means it doesn't exist/0.
                        # I will NOT update it to 0 unless explicitly told, to be safe. 
                        # But standard logic implies sync = make same. 
                        # The user prompt: "Synchronize Inventory... Source to Target".
                        # I'll stick to updating only if I have a positive match to be safe.
                        pass

            # 5. Execute Updates
            if update_tasks:
                print(f"Executing {len(update_tasks)} updates...")
                await asyncio.gather(*update_tasks)
            else:
                print("Sync complete. No updates needed.")

        print(f"--- Synchronization Finished in {time.time() - start_time:.2f} seconds ---")

    def _build_sizes_map(self, sizes_list: List[Dict[str, Any]]) -> Dict[int, Dict[str, Dict[str, Any]]]:
        """
        Organizes sizes into a nested map:
        {
            item_id: {
                "size_val": { "id": size_id, "qty": qty, ... }
            }
        }
        """
        sizes_map = {}
        for size in sizes_list:
            item_id = size.get('item_id')
            val = str(size.get('val')) # Ensure string for key
            
            if item_id not in sizes_map:
                sizes_map[item_id] = {}
            
            sizes_map[item_id][val] = size
        return sizes_map

    async def _bounded_update_item(self, sem, client, item_id, price, nal):
        async with sem:
            await client.update_item_price(item_id, price, nal)

    async def _bounded_update_size(self, sem, client, size_id, val, qty):
        async with sem:
            await client.update_size_quantity(size_id, val, qty)

