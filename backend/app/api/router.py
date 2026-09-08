from fastapi import APIRouter

from app.api.routes import auth, profile, quotes

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(quotes.router)
