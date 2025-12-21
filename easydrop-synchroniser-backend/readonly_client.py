"""
Read-only client for interacting with the Easydrop API.
"""
import time
from typing import List, Dict, Any

import requests

from models import Item, SizeResponse

BASE_URL = "https://easydrop.one/api/v1"
REQUEST_DELAY_SECONDS = 1


class ReadOnlyClient:
    """A client for making read-only requests to the Easydrop API."""

    def __init__(self, api_key: str):
        """
        Initializes the ReadOnlyClient.

        Args:
            api_key: The API key for authorization.
        """
        if not api_key:
            raise ValueError("API key cannot be empty.")
        self._headers = {"Authorization": api_key}
        self.base_url = BASE_URL
        self.request_delay = REQUEST_DELAY_SECONDS

    def get_product(self, item_id: int) -> List[Item]:
        """Fetches a product from the store by its ID."""
        url = f"{self.base_url}/item/?id={item_id}"
        print(f"Fetching product with id: {item_id}")
        response = requests.get(url, headers=self._headers)
        response.raise_for_status()
        time.sleep(self.request_delay)
        data = response.json()
        items: List[Item] = [Item(**item) for item in data]
        return items

    def get_sizes(self, item_id: int) -> SizeResponse:
        """Fetches sizes for a given item ID."""
        url = f"{self.base_url}/size/?item_id={item_id}"
        print(f"Fetching sizes for item_id: {item_id}")
        response = requests.get(url, headers=self._headers)
        response.raise_for_status()
        time.sleep(self.request_delay)
        return SizeResponse(results=response.json())
