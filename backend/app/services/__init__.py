from app.services.auth import authenticate, create_customer, get_customer_by_email, update_profile
from app.services.quotes import (
    accept_quote,
    create_quote,
    dashboard,
    get_quote,
    list_quotes,
    preview_quote,
    reject_quote,
    request_revision,
    serialize_quote,
)

__all__ = [
    "authenticate",
    "create_customer",
    "get_customer_by_email",
    "update_profile",
    "accept_quote",
    "create_quote",
    "dashboard",
    "get_quote",
    "list_quotes",
    "preview_quote",
    "reject_quote",
    "request_revision",
    "serialize_quote",
]
