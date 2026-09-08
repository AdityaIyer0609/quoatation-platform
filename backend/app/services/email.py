"""Send a quotation email with the frozen PDF attached."""

from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import get_settings
from app.models import Quote


class SmtpNotConfiguredError(RuntimeError):
    pass


def smtp_configured() -> bool:
    settings = get_settings()
    return bool(settings.smtp_host.strip() and settings.smtp_from.strip())


def send_quote_email(quote: Quote, pdf_bytes: bytes) -> None:
    if not smtp_configured():
        raise SmtpNotConfiguredError(
            "Email is not configured. Set SMTP_HOST and SMTP_FROM in the server environment."
        )
    settings = get_settings()
    customer = quote.customer
    message = EmailMessage()
    sender = settings.smtp_from.strip()
    message["From"] = sender
    message["To"] = customer.email
    message["Subject"] = f"Quotation {quote.number}"
    manual = False
    if isinstance(quote.pricing_snapshot, dict):
        manual = bool(quote.pricing_snapshot.get("requiresManualPricing")) or quote.pricing_snapshot.get("unitPrice") is None
    status_note = " Manual pricing is required." if manual else ""
    message.set_content(
        f"Dear {customer.first_name},\n\n"
        f"Please find quotation {quote.number} attached.{status_note}\n\n"
        "QuoteCraft Manufacturing\n"
    )
    filename = f"{quote.number}.pdf"
    message.add_attachment(pdf_bytes, maintype="application", subtype="pdf", filename=filename)

    host = settings.smtp_host.strip()
    port = settings.smtp_port
    context = ssl.create_default_context()
    if settings.smtp_use_tls:
        with smtplib.SMTP(host, port, timeout=20) as smtp:
            smtp.starttls(context=context)
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=20) as smtp:
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
