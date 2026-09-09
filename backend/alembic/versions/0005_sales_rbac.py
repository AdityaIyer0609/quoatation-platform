"""Staff users, customer assignment, quote audit fields.

Revision ID: 0005_sales_rbac
Revises: 0004_pricing_total_kg_precision
Create Date: 2026-09-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005_sales_rbac"
down_revision: Union[str, Sequence[str], None] = "0004_pricing_total_kg_precision"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "staff_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_staff_users_email", "staff_users", ["email"], unique=True)
    op.create_index("ix_staff_users_role", "staff_users", ["role"])

    op.add_column("customers", sa.Column("assigned_staff_id", sa.Integer(), nullable=True))
    op.create_index("ix_customers_assigned_staff_id", "customers", ["assigned_staff_id"])
    op.create_foreign_key(
        "fk_customers_assigned_staff_id",
        "customers",
        "staff_users",
        ["assigned_staff_id"],
        ["id"],
    )

    op.add_column("quotes", sa.Column("created_by_staff_id", sa.Integer(), nullable=True))
    op.add_column("quotes", sa.Column("manual_pricing_status", sa.String(32), nullable=True))
    op.add_column("quotes", sa.Column("manual_pricing_note", sa.Text(), nullable=True))
    op.add_column("quotes", sa.Column("manual_pricing_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("quotes", sa.Column("manual_pricing_by_id", sa.Integer(), nullable=True))
    op.create_index("ix_quotes_created_by_staff_id", "quotes", ["created_by_staff_id"])
    op.create_index("ix_quotes_manual_pricing_status", "quotes", ["manual_pricing_status"])
    op.create_foreign_key(
        "fk_quotes_created_by_staff_id",
        "quotes",
        "staff_users",
        ["created_by_staff_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_quotes_manual_pricing_by_id",
        "quotes",
        "staff_users",
        ["manual_pricing_by_id"],
        ["id"],
    )

    op.create_table(
        "audit_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("actor_type", sa.String(20), nullable=False, server_default="staff"),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("actor_email", sa.String(255), nullable=False, server_default=""),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("entity_type", sa.String(40), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_events_actor_id", "audit_events", ["actor_id"])
    op.create_index("ix_audit_events_action", "audit_events", ["action"])
    op.create_index("ix_audit_events_entity_type", "audit_events", ["entity_type"])
    op.create_index("ix_audit_events_entity_id", "audit_events", ["entity_id"])

    from app.core.security import hash_password

    op.execute(
        sa.text(
            """
            INSERT INTO staff_users (email, hashed_password, first_name, last_name, role, is_active)
            VALUES (:email, :password, 'Ada', 'Admin', 'admin', true)
            """
        ).bindparams(
            email="admin@quotecraft.local",
            password=hash_password("Admin@123"),
        )
    )

    op.execute(
        sa.text(
            """
            UPDATE quotes
            SET manual_pricing_status = 'pending'
            WHERE pricing_snapshot IS NOT NULL
              AND (
                CAST(pricing_snapshot AS jsonb) ->> 'requiresManualPricing' = 'true'
                OR (pricing_snapshot::jsonb ->> 'unitPrice') IS NULL
              )
            """
        )
    )


def downgrade() -> None:
    op.drop_table("audit_events")
    op.drop_constraint("fk_quotes_manual_pricing_by_id", "quotes", type_="foreignkey")
    op.drop_constraint("fk_quotes_created_by_staff_id", "quotes", type_="foreignkey")
    op.drop_index("ix_quotes_manual_pricing_status", table_name="quotes")
    op.drop_index("ix_quotes_created_by_staff_id", table_name="quotes")
    op.drop_column("quotes", "manual_pricing_by_id")
    op.drop_column("quotes", "manual_pricing_at")
    op.drop_column("quotes", "manual_pricing_note")
    op.drop_column("quotes", "manual_pricing_status")
    op.drop_column("quotes", "created_by_staff_id")
    op.drop_constraint("fk_customers_assigned_staff_id", "customers", type_="foreignkey")
    op.drop_index("ix_customers_assigned_staff_id", table_name="customers")
    op.drop_column("customers", "assigned_staff_id")
    op.drop_index("ix_staff_users_role", table_name="staff_users")
    op.drop_index("ix_staff_users_email", table_name="staff_users")
    op.drop_table("staff_users")
