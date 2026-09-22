"""Editable Book4 pricing formulas.

Revision ID: 0007_pricing_books
Revises: 0006_quote_versions_freeze
Create Date: 2026-09-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0007_pricing_books"
down_revision: Union[str, Sequence[str], None] = "0006_quote_versions_freeze"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    json_type = postgresql.JSONB(astext_type=sa.Text())
    op.create_table(
        "pricing_books",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(80), nullable=False, server_default="Book4"),
        sa.Column("rule_version", sa.String(80), nullable=False, server_default="book4-16-04-26"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("payload", json_type, nullable=False),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("updated_by_id", sa.Integer(), sa.ForeignKey("staff_users.id"), nullable=True),
        sa.Column("updated_by_name", sa.String(160), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_pricing_books_is_active", "pricing_books", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_pricing_books_is_active", table_name="pricing_books")
    op.drop_table("pricing_books")
