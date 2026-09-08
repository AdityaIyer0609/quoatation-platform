"""Store frozen Book4 pricing breakdown on quotes.

Revision ID: 0003_pricing_snapshot
Revises: 0002_bom_snapshot
Create Date: 2026-09-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_pricing_snapshot"
down_revision: Union[str, Sequence[str], None] = "0002_bom_snapshot"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    json_type = postgresql.JSONB(astext_type=sa.Text())
    op.add_column("quotes", sa.Column("pricing_snapshot", json_type, nullable=True))
    op.add_column("pricing_snapshots", sa.Column("breakdown", json_type, nullable=True))
    op.add_column(
        "pricing_snapshots",
        sa.Column("rule_version", sa.String(length=40), nullable=False, server_default="book4-16-04-26"),
    )
    op.alter_column("pricing_snapshots", "unit_price", existing_type=sa.Numeric(12, 2), nullable=True)
    op.alter_column("pricing_snapshots", "total_amount", existing_type=sa.Numeric(14, 2), nullable=True)
    op.alter_column(
        "pricing_snapshots",
        "currency",
        existing_type=sa.String(length=8),
        server_default="USD",
        existing_nullable=False,
    )
    op.alter_column(
        "pricing_snapshots",
        "source",
        existing_type=sa.String(length=40),
        server_default="book4",
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "pricing_snapshots",
        "source",
        existing_type=sa.String(length=40),
        server_default="mock",
        existing_nullable=False,
    )
    op.alter_column(
        "pricing_snapshots",
        "currency",
        existing_type=sa.String(length=8),
        server_default="INR",
        existing_nullable=False,
    )
    op.alter_column("pricing_snapshots", "total_amount", existing_type=sa.Numeric(14, 2), nullable=False)
    op.alter_column("pricing_snapshots", "unit_price", existing_type=sa.Numeric(12, 2), nullable=False)
    op.drop_column("pricing_snapshots", "rule_version")
    op.drop_column("pricing_snapshots", "breakdown")
    op.drop_column("quotes", "pricing_snapshot")
