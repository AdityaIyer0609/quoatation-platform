"""Immutable freeze fields on quote_versions.

Revision ID: 0006_quote_versions_freeze
Revises: 0005_sales_rbac
Create Date: 2026-09-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006_quote_versions_freeze"
down_revision: Union[str, Sequence[str], None] = "0005_sales_rbac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    json_type = postgresql.JSONB(astext_type=sa.Text())
    op.add_column("quote_versions", sa.Column("bom_snapshot", json_type, nullable=True))
    op.add_column("quote_versions", sa.Column("pricing_snapshot", json_type, nullable=True))
    op.add_column("quote_versions", sa.Column("quantity", sa.Integer(), nullable=True))
    op.add_column("quote_versions", sa.Column("unit_price", sa.Numeric(12, 2), nullable=True))
    op.add_column("quote_versions", sa.Column("total_amount", sa.Numeric(14, 2), nullable=True))
    op.add_column(
        "quote_versions",
        sa.Column("rule_version", sa.String(40), nullable=False, server_default="book4-16-04-26"),
    )
    op.add_column("quote_versions", sa.Column("created_by_staff_id", sa.Integer(), nullable=True))
    op.add_column(
        "quote_versions",
        sa.Column("created_by_name", sa.String(160), nullable=False, server_default=""),
    )
    op.add_column(
        "quote_versions",
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_foreign_key(
        "fk_quote_versions_created_by_staff_id",
        "quote_versions",
        "staff_users",
        ["created_by_staff_id"],
        ["id"],
    )
    op.execute(
        sa.text(
            """
            UPDATE quote_versions AS version
            SET
                bom_snapshot = quote.bom_snapshot,
                pricing_snapshot = quote.pricing_snapshot,
                quantity = COALESCE((quote.pricing_snapshot->>'quantity')::int, 0),
                unit_price = NULLIF(quote.pricing_snapshot->>'unitPrice', '')::numeric,
                total_amount = NULLIF(quote.pricing_snapshot->>'totalAmount', '')::numeric,
                rule_version = COALESCE(quote.pricing_snapshot->>'ruleVersion', 'book4-16-04-26')
            FROM quotes AS quote
            WHERE version.quote_id = quote.id
              AND version.bom_snapshot IS NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE quote_versions
            SET is_current = true
            WHERE id IN (
                SELECT DISTINCT ON (quote_id) id
                FROM quote_versions
                ORDER BY quote_id, version DESC
            )
            """
        )
    )


def downgrade() -> None:
    op.drop_constraint("fk_quote_versions_created_by_staff_id", "quote_versions", type_="foreignkey")
    op.drop_column("quote_versions", "is_current")
    op.drop_column("quote_versions", "created_by_name")
    op.drop_column("quote_versions", "created_by_staff_id")
    op.drop_column("quote_versions", "rule_version")
    op.drop_column("quote_versions", "total_amount")
    op.drop_column("quote_versions", "unit_price")
    op.drop_column("quote_versions", "quantity")
    op.drop_column("quote_versions", "pricing_snapshot")
    op.drop_column("quote_versions", "bom_snapshot")
