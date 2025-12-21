import asyncio
import os
from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from contextlib import asynccontextmanager
import atexit
from datetime import timedelta

import models_db, schemas, crud, auth
from database import engine, get_db
from sync_service import SyncService

# Create Tables
models_db.Base.metadata.create_all(bind=engine)

scheduler = BackgroundScheduler()
sync_service = SyncService()

def run_scheduled_sync():
    """Wrapper to run sync with a fresh DB session"""
    print("Executing scheduled sync...")
    db = next(get_db())
    try:
        # Run async method in a new event loop since this is a thread
        asyncio.run(sync_service.run_synchronization(db))
    finally:
        db.close()

def reschedule_job(interval_minutes: int):
    """Updates the scheduler job with a new interval"""
    try:
        scheduler.remove_job('sync_job')
    except Exception:
        pass # Job might not exist
    
    if interval_minutes > 0:
        scheduler.add_job(
            run_scheduled_sync, 
            IntervalTrigger(minutes=interval_minutes), 
            id='sync_job',
            replace_existing=True
        )
        print(f"Rescheduled sync job to run every {interval_minutes} minutes.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load settings and start scheduler
    db = next(get_db())
    try:
        setting = crud.get_setting(db, "sync_interval")
        interval = int(setting.value) if setting else 10 # Default 10 min
        
        print(f"Starting scheduler with interval: {interval} minutes")
        scheduler.add_job(
            run_scheduled_sync, 
            IntervalTrigger(minutes=interval), 
            id='sync_job',
            replace_existing=True
        )
        scheduler.start()
        
        # Check and Create Admin User if not exists
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        existing_user = crud.get_user_by_username(db, admin_username)
        if not existing_user:
            admin_hash = os.getenv("ADMIN_PASSWORD_HASH")
            if not admin_hash:
                print("ADMIN_PASSWORD_HASH not found in env. Defaulting to password: 'secret'")
                admin_hash = auth.get_password_hash("secret")
            
            print(f"Creating initial admin user: {admin_username}")
            user_in = schemas.UserCreate(username=admin_username, password="") 
            crud.create_user(db, user_in, admin_hash)
        
    finally:
        db.close()
    
    yield
    
    # Shutdown
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth Endpoint ---

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/change-password")
def change_password(
    password_data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(auth.get_current_user)
):
    # Verify old password
    if not auth.verify_password(password_data.old_password, current_user.hashed_password):
         raise HTTPException(status_code=400, detail="Incorrect old password")
    
    # Hash new password
    new_hash = auth.get_password_hash(password_data.new_password)
    crud.update_user_password(db, current_user.username, new_hash)
    
    return {"message": "Password updated successfully"}


# --- Endpoints ---

@app.get("/mappings", response_model=list[schemas.ProductMapping])
def read_mappings(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(auth.get_current_user)
):
    mappings = crud.get_mappings(db, skip=skip, limit=limit)
    return mappings

@app.post("/mappings", response_model=schemas.ProductMapping)
def create_mapping(
    mapping: schemas.ProductMappingCreate, 
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(auth.get_current_user)
):
    return crud.create_mapping(db, mapping=mapping)

@app.delete("/mappings/{mapping_id}")
def delete_mapping(
    mapping_id: int, 
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(auth.get_current_user)
):
    db_mapping = crud.delete_mapping(db, mapping_id)
    if db_mapping is None:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return {"message": "Mapping deleted successfully"}

@app.get("/settings", response_model=schemas.SyncSettings)
def get_settings(
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(auth.get_current_user)
):
    setting = crud.get_setting(db, "sync_interval")
    interval = int(setting.value) if setting else 10
    return schemas.SyncSettings(sync_interval=interval)

@app.post("/settings", response_model=schemas.SyncSettings)
def update_settings(
    settings: schemas.SyncSettings, 
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(auth.get_current_user)
):
    crud.set_setting(db, "sync_interval", str(settings.sync_interval))
    reschedule_job(settings.sync_interval)
    return settings

@app.post("/sync/run")
async def run_sync_manually(
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(auth.get_current_user)
):
    """Manually trigger the sync process"""
    await sync_service.run_synchronization(db)
    return {"message": "Synchronization triggered successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)