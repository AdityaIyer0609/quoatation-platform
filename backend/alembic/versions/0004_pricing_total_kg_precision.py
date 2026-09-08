"""Widen pricing_snapshots.total_kg to 4 decimal places.

Revision ID: 0004_pricing_total_kg_precision
Revises: 0003_pricing_snapshot
Create Date: 2026-09-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_pricing_total_kg_precision"
down_revision: Union[str, Sequence[str], None] = "0003_pricing_snapshot"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "pricing_snapshots",
        "total_kg",
        existing_type=sa.Numeric(12, 2),
        type_=sa.Numeric(12, 4),
        existing_nullable=False,
    )
    op.execute(
        sa.text(
            """
            UPDATE pricing_snapshots AS snapshot
            SET total_kg = (quote.pricing_snapshot->>'totalKgPerBag')::numeric
            FROM quotes AS quote
            WHERE snapshot.quote_id = quote.id
              AND quote.pricing_snapshot ? 'totalKgPerBag'
            """
        )
    )


def downgrade() -> None:
    op.alter_column(
        "pricing_snapshots",
        "total_kg",
        existing_type=sa.Numeric(12, 4),
        type_=sa.Numeric(12, 2),
        existing_nullable=False,
    )
