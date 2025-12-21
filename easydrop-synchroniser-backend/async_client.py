import aiohttp
import asyncio
from typing import List, Dict, Any, Optional

class AsyncClient:
    def __init__(self, api_key: str, base_url: str = "https://easydrop.one/api/v1", ssl: bool = False):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {"Authorization": api_key}
        self.session: Optional[aiohttp.ClientSession] = None
        self.ssl: bool = ssl

    async def __aenter__(self):
        connector = aiohttp.TCPConnector(ssl=self.ssl)
        self.session = aiohttp.ClientSession(headers=self.headers, connector=connector)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def _fetch(self, endpoint: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Generic fetch method handling both list responses and paginated dict responses ('results').
        Fetches all pages if pagination is detected.
        """
        if not self.session:
            raise RuntimeError("Client session not initialized. Use 'async with'.")

        all_results = []
        url = f"{self.base_url}{endpoint}"
        current_params = params.copy() if params else {}
        
        # Initial large limit to try and get everything in one go
        if 'limit' not in current_params:
            current_params['limit'] = 5000

        while url:
            async with self.session.get(url, params=current_params) as response:
                response.raise_for_status()
                data = await response.json()

                if isinstance(data, list):
                    all_results.extend(data)
                    # If it's a raw list, we assume no pagination metadata is provided 
                    # or we reached the end if we rely on a single big fetch.
                    # To be safe regarding the "strict" prompt saying it's a list:
                    # We just return this list.
                    break 
                elif isinstance(data, dict) and 'results' in data:
                    # Handle DRF-style pagination if it happens to occur
                    results = data.get('results', [])
                    all_results.extend(results)
                    url = data.get('next') # Update URL for next page
                    current_params = {} # Params are usually encoded in the 'next' URL
                else:
                    # Unexpected format, treat as single object or error? 
                    # Based on specs, we expect List or Dict w/ results.
                    # If it is just a dict representing one object, wrap it.
                    all_results.append(data)
                    break

        return all_results

    async def get_all_items(self) -> List[Dict[str, Any]]:
        return await self._fetch("/item/")

    async def get_all_sizes(self) -> List[Dict[str, Any]]:
        return await self._fetch("/size/")

    async def update_item_price(self, item_id: int, price: int, nal: int):
        if not self.session:
            raise RuntimeError("Client session not initialized.")
        
        payload = {
            "id": item_id,
            "drop_price": price,
            "nal": nal
        }
        async with self.session.put(f"{self.base_url}/item/", json=payload) as response:
            if response.status >= 400:
                text = await response.text()
                print(f"Failed to update item {item_id}: {response.status} - {text}")
            response.raise_for_status()

    async def update_size_quantity(self, size_id: int, val: str, qty: int):
        if not self.session:
            raise RuntimeError("Client session not initialized.")

        payload = {
            "id": size_id,
            "val": val,
            "qty": qty
        }
        async with self.session.put(f"{self.base_url}/size/", json=payload) as response:
            if response.status >= 400:
                text = await response.text()
                print(f"Failed to update size {size_id}: {response.status} - {text}")
            response.raise_for_status()
