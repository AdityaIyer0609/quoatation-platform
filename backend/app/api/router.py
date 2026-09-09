from fastapi import APIRouter

from app.api.routes import admin, auth, profile, quotes, sales

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(quotes.router)
api_router.include_router(sales.router)
api_router.include_router(admin.router)
