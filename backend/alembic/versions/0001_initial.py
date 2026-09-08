"""Initial customer, quote, version, history, and pricing tables.

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    json_type = postgresql.JSONB(astext_type=sa.Text())

    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=False, server_default=""),
        sa.Column("designation", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("company", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("gst", sa.String(length=50), nullable=False, server_default=""),
        sa.Column("address", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("city", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("state", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("pincode", sa.String(length=20), nullable=False, server_default=""),
        sa.Column("country", sa.String(length=100), nullable=False, server_default="India"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_customers_email", "customers", ["email"], unique=True)

    op.create_table(
        "quotes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("number", sa.String(length=32), nullable=False),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="quoted"),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("specification", json_type, nullable=False),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("lead_time", sa.String(length=80), nullable=False, server_default="21–28 days"),
        sa.Column("payment_terms", sa.String(length=80), nullable=False, server_default="40% advance"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_quotes_number", "quotes", ["number"], unique=True)
    op.create_index("ix_quotes_customer_id", "quotes", ["customer_id"])
    op.create_index("ix_quotes_status", "quotes", ["status"])

    op.create_table(
        "quote_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("quote_id", sa.Integer(), sa.ForeignKey("quotes.id"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("specification", json_type, nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_quote_versions_quote_id", "quote_versions", ["quote_id"])

    op.create_table(
        "quote_status_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("quote_id", sa.Integer(), sa.ForeignKey("quotes.id"), nullable=False),
        sa.Column("from_status", sa.String(length=32), nullable=True),
        sa.Column("to_status", sa.String(length=32), nullable=False),
        sa.Column("event", sa.String(length=120), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("event_type", sa.String(length=20), nullable=False, server_default="neutral"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_quote_status_history_quote_id", "quote_status_history", ["quote_id"])

    op.create_table(
        "pricing_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("quote_id", sa.Integer(), sa.ForeignKey("quotes.id"), nullable=True),
        sa.Column("quote_version_id", sa.Integer(), sa.ForeignKey("quote_versions.id"), nullable=True),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="INR"),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("total_kg", sa.Numeric(12, 2), nullable=False),
        sa.Column("source", sa.String(length=40), nullable=False, server_default="mock"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_pricing_snapshots_quote_id", "pricing_snapshots", ["quote_id"])
    op.create_index("ix_pricing_snapshots_quote_version_id", "pricing_snapshots", ["quote_version_id"])


def downgrade() -> None:
    op.drop_table("pricing_snapshots")
    op.drop_table("quote_status_history")
    op.drop_table("quote_versions")
    op.drop_table("quotes")
    op.drop_table("customers")
