"""Add BOM snapshot JSON on quotes.

Revision ID: 0002_bom_snapshot
Revises: 0001_initial
Create Date: 2026-09-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_bom_snapshot"
down_revision: Union[str, Sequence[str], None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    json_type = postgresql.JSONB(astext_type=sa.Text())
    op.add_column("quotes", sa.Column("bom_snapshot", json_type, nullable=True))


def downgrade() -> None:
    op.drop_column("quotes", "bom_snapshot")
