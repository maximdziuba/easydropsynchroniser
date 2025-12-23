from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ProductMappingBase(BaseModel):
    source_id: int
    target_id: int
    product_name: Optional[str] = None

class ProductMappingCreate(ProductMappingBase):
    pass

class ProductMappingUpdate(BaseModel):
    source_id: Optional[int] = None
    target_id: Optional[int] = None
    product_name: Optional[str] = None

class ProductMapping(ProductMappingBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SyncSettings(BaseModel):
    sync_interval: int
    last_sync_run: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class SyncLog(BaseModel):
    id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    product_name: Optional[str] = None
    source_id: Optional[int] = None
    target_id: Optional[int] = None
    details: Optional[str] = None

    class Config:
        from_attributes = True
