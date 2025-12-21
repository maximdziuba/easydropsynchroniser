from sqlalchemy.orm import Session
import models_db, schemas

def get_mappings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models_db.ProductMapping).offset(skip).limit(limit).all()

def create_mapping(db: Session, mapping: schemas.ProductMappingCreate):
    db_mapping = models_db.ProductMapping(**mapping.model_dump())
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    return db_mapping

def delete_mapping(db: Session, mapping_id: int):
    db_mapping = db.query(models_db.ProductMapping).filter(models_db.ProductMapping.id == mapping_id).first()
    if db_mapping:
        db.delete(db_mapping)
        db.commit()
    return db_mapping

def get_setting(db: Session, key: str):
    return db.query(models_db.SystemSetting).filter(models_db.SystemSetting.key == key).first()

def set_setting(db: Session, key: str, value: str):
    db_setting = get_setting(db, key)
    if not db_setting:
        db_setting = models_db.SystemSetting(key=key, value=value)
        db.add(db_setting)
    else:
        db_setting.value = value
    db.commit()
    db.refresh(db_setting)
    return db_setting

# User Management

def get_user_by_username(db: Session, username: str):
    return db.query(models_db.User).filter(models_db.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models_db.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_password(db: Session, username: str, new_hashed_password: str):
    db_user = get_user_by_username(db, username)
    if db_user:
        db_user.hashed_password = new_hashed_password
        db.commit()
        db.refresh(db_user)
    return db_user
