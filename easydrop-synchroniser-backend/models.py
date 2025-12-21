from typing import Optional, List

from pydantic import BaseModel

class Item(BaseModel):
    id: int
    model: str
    brand: str
    code: str
    manufacturer: str
    material: str
    drop: int
    link: Optional[str] = ""
    image: Optional[str] = None
    drop_price: int
    is_active: Optional[bool] = True
    selected_image: Optional[int] = None
    nal: int

class Size(BaseModel):
    id: int
    item_id: int
    val: str
    sock: str
    qty: int
    reserved_qty: int

class SizeResponse(BaseModel):
    count: Optional[int] = None
    next: Optional[str] = None
    previous: Optional[str] = None
    results: List[Size]