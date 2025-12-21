"""
Client for interacting with the Easydrop API, including write operations.
"""
import requests

from readonly_client import ReadOnlyClient


class Client(ReadOnlyClient):
    """
    A client for making read and write requests to the Easydrop API.
    Inherits read-only methods from ReadOnlyClient.
    """

    def update_product_price(self, item_id: int, price: float):
        """Updates the price for a product."""
        url = f"{self.base_url}/item/"
        payload = {"id": item_id, "drop_price": price}
        print(f"Updating product {item_id} with price: {price}")
        response = requests.put(url, headers=self._headers, json=payload)
        response.raise_for_status()
        print(f"Successfully updated price for item {item_id}.")

    def update_size_quantity(self, size_id: int, size_val: str, new_quantity: int):
        """Updates the quantity of a specific size."""
        url = f"{self.base_url}/size/"
        payload = {"id": size_id, "val": size_val, "qty": new_quantity}
        print(f"Updating size {size_id} ('{size_val}') with quantity: {new_quantity}")
        response = requests.put(url, headers=self._headers, json=payload)
        response.raise_for_status()
        print(f"Successfully updated quantity for size {size_id}.")
