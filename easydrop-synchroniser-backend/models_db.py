from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base

class ProductMapping(Base):
    __tablename__ = "product_mappings"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, index=True)
    target_id = Column(Integer, index=True)
    product_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
