import os
import asyncio
import time
from datetime import datetime
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
        """
        print("--- Starting High-Performance Async Synchronization ---")
        start_time = time.time()
        db_start_time = datetime.now()
        
        # Track which mappings actually had changes
        changed_mappings = []

        try:
            if not self.source_api_key or not self.target_api_key:
                raise Exception("API Keys not found in environment.")

            # 1. Fetch Mappings
            mappings = db.query(models_db.ProductMapping).all()
            if not mappings:
                print("No mappings found. Exiting.")
                return

            # 2. Bulk Fetch Data
            async with AsyncClient(self.source_api_key, ssl=False) as source_client, \
                       AsyncClient(self.target_api_key, ssl=False) as target_client:
                
                # Fetch everything in parallel
                results = await asyncio.gather(
                    source_client.get_all_items(),
                    target_client.get_all_items(),
                    source_client.get_all_sizes(),
                    target_client.get_all_sizes()
                )
                
                source_items_list, target_items_list, source_sizes_list, target_sizes_list = results

                # 3. Data Transformation
                source_items_map = {int(item['id']): item for item in source_items_list}
                target_items_map = {int(item['id']): item for item in target_items_list}
                source_sizes_map = self._build_sizes_map(source_sizes_list)
                target_sizes_map = self._build_sizes_map(target_sizes_list)

                # 4. Compare logic
                item_update_tasks = []
                size_update_tasks = []
                sem = asyncio.Semaphore(self.concurrency_limit)
                
                for mapping in mappings:
                    s_id = mapping.source_id
                    t_id = mapping.target_id
                    mapping_has_changes = False
                    mapping_changes_details = []

                    s_item = source_items_map.get(s_id)
                    t_item = target_items_map.get(t_id)

                    if not s_item or not t_item:
                        continue

                    # Compare Item Level
                    s_price = s_item.get('drop_price')
                    s_nal = s_item.get('nal')
                    t_price = t_item.get('drop_price')
                    t_nal = t_item.get('nal')

                    if s_price != t_price or s_nal != t_nal:
                        item_update_tasks.append(self._bounded_update_item(sem, target_client, t_id, s_price, s_nal))
                        mapping_has_changes = True
                        if s_price != t_price:
                            mapping_changes_details.append(f"Ціна: {t_price} -> {s_price}")
                        if s_nal != t_nal:
                            mapping_changes_details.append(f"Наявність: {t_nal} -> {s_nal}")

                    # Compare Size Level
                    s_item_sizes = source_sizes_map.get(s_id, {})
                    t_item_sizes = target_sizes_map.get(t_id, {})

                    for val, t_size_data in t_item_sizes.items():
                        if val in s_item_sizes:
                            s_qty = s_item_sizes[val]['qty']
                            if t_size_data['qty'] != s_qty:
                                size_update_tasks.append(self._bounded_update_size(sem, target_client, t_size_data['id'], val, s_qty))
                                mapping_has_changes = True
                                mapping_changes_details.append(f"Розмір {val}: {t_size_data['qty']} -> {s_qty}")

                    if mapping_has_changes:
                        changed_mappings.append({
                            "mapping": mapping,
                            "details": "; ".join(mapping_changes_details)
                        })

                # 5. Execute Updates Sequentially (Items first, then Sizes)
                total_updates = len(item_update_tasks) + len(size_update_tasks)
                if total_updates > 0:
                    print(f"Executing {total_updates} updates (Items: {len(item_update_tasks)}, Sizes: {len(size_update_tasks)})...")
                    
                    if item_update_tasks:
                        await asyncio.gather(*item_update_tasks)
                    
                    if size_update_tasks:
                        await asyncio.gather(*size_update_tasks)
                    
                    # Log each changed mapping
                    db_end_time = datetime.now()
                    for item in changed_mappings:
                        m = item["mapping"]
                        new_log = models_db.SyncLog(
                            started_at=db_start_time,
                            completed_at=db_end_time,
                            status="SUCCESS",
                            product_name=m.product_name,
                            source_id=m.source_id,
                            target_id=m.target_id,
                            details=item["details"]
                        )
                        db.add(new_log)
                    db.commit()
                else:
                    print("Sync complete. No changes detected.")

        except Exception as e:
            print(f"Synchronization failed: {e}")
            # Optional: Log the overall failure if needed, but per-product logging is preferred
            db.rollback()
        finally:
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
            try:
                item_id = int(size.get('item_id'))
            except (ValueError, TypeError):
                continue # Skip invalid IDs
                
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