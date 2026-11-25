"""One-off: copy QuoteCraft Postgres rows into a NEW SQL Server database.

Reads MSSQL_SA_PASSWORD from the environment. Does not write into ERP DBs.
"""
from __future__ import annotations

import json
import os
import sys
from decimal import Decimal
from datetime import date, datetime, timezone

import psycopg
import pymssql

PG_DSN = os.environ.get("PG_DSN")
MSSQL_HOST = os.environ.get("MSSQL_HOST", "103.240.33.122")
MSSQL_PORT = int(os.environ.get("MSSQL_PORT", "5115"))
MSSQL_USER = os.environ.get("MSSQL_USER", "sa")
TARGET_DB = os.environ.get("MSSQL_DATABASE", "QuotationPlatform")

TABLES = [
    "staff_users",
    "customers",
    "quotes",
    "quote_versions",
    "quote_status_history",
    "pricing_snapshots",
    "pricing_books",
    "audit_events",
]

def ensure_database(cursor) -> None:
    cursor.execute("SELECT name FROM sys.databases WHERE name = %s", (TARGET_DB,))
    if cursor.fetchone() is None:
        cursor.execute(f"CREATE DATABASE [{TARGET_DB}]")

DROP_DDL = r"""
IF OBJECT_ID('dbo.audit_events', 'U') IS NOT NULL DROP TABLE dbo.audit_events
IF OBJECT_ID('dbo.pricing_books', 'U') IS NOT NULL DROP TABLE dbo.pricing_books
IF OBJECT_ID('dbo.pricing_snapshots', 'U') IS NOT NULL DROP TABLE dbo.pricing_snapshots
IF OBJECT_ID('dbo.quote_status_history', 'U') IS NOT NULL DROP TABLE dbo.quote_status_history
IF OBJECT_ID('dbo.quote_versions', 'U') IS NOT NULL DROP TABLE dbo.quote_versions
IF OBJECT_ID('dbo.quotes', 'U') IS NOT NULL DROP TABLE dbo.quotes
IF OBJECT_ID('dbo.customers', 'U') IS NOT NULL DROP TABLE dbo.customers
IF OBJECT_ID('dbo.staff_users', 'U') IS NOT NULL DROP TABLE dbo.staff_users
"""

TABLE_DDL = r"""
CREATE TABLE dbo.staff_users (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    hashed_password NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    role NVARCHAR(32) NOT NULL,
    is_active BIT NOT NULL,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL
);

CREATE TABLE dbo.customers (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    hashed_password NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    designation NVARCHAR(120) NOT NULL,
    company NVARCHAR(255) NOT NULL,
    gst NVARCHAR(50) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(100) NOT NULL,
    pincode NVARCHAR(20) NOT NULL,
    country NVARCHAR(100) NOT NULL,
    assigned_staff_id INT NULL,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL
);

CREATE TABLE dbo.quotes (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    number NVARCHAR(32) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    created_by_staff_id INT NULL,
    status NVARCHAR(32) NOT NULL,
    manual_pricing_status NVARCHAR(32) NULL,
    manual_pricing_note NVARCHAR(MAX) NULL,
    manual_pricing_at DATETIMEOFFSET NULL,
    manual_pricing_by_id INT NULL,
    product_name NVARCHAR(255) NOT NULL,
    specification NVARCHAR(MAX) NOT NULL,
    bom_snapshot NVARCHAR(MAX) NULL,
    pricing_snapshot NVARCHAR(MAX) NULL,
    valid_until DATETIMEOFFSET NULL,
    lead_time NVARCHAR(80) NOT NULL,
    payment_terms NVARCHAR(80) NOT NULL,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL
);

CREATE TABLE dbo.quote_versions (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    quote_id INT NOT NULL,
    version INT NOT NULL,
    status NVARCHAR(32) NOT NULL,
    specification NVARCHAR(MAX) NOT NULL,
    bom_snapshot NVARCHAR(MAX) NULL,
    pricing_snapshot NVARCHAR(MAX) NULL,
    quantity INT NULL,
    unit_price DECIMAL(12,2) NULL,
    total_amount DECIMAL(14,2) NULL,
    rule_version NVARCHAR(40) NOT NULL,
    created_by_staff_id INT NULL,
    created_by_name NVARCHAR(160) NOT NULL,
    note NVARCHAR(MAX) NULL,
    is_current BIT NOT NULL,
    created_at DATETIMEOFFSET NOT NULL
);

CREATE TABLE dbo.quote_status_history (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    quote_id INT NOT NULL,
    from_status NVARCHAR(32) NULL,
    to_status NVARCHAR(32) NOT NULL,
    event NVARCHAR(120) NOT NULL,
    detail NVARCHAR(MAX) NOT NULL,
    event_type NVARCHAR(20) NOT NULL,
    created_at DATETIMEOFFSET NOT NULL
);

CREATE TABLE dbo.pricing_snapshots (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    quote_id INT NULL,
    quote_version_id INT NULL,
    currency NVARCHAR(8) NOT NULL,
    unit_price DECIMAL(12,2) NULL,
    quantity INT NOT NULL,
    total_amount DECIMAL(14,2) NULL,
    total_kg DECIMAL(12,4) NOT NULL,
    source NVARCHAR(40) NOT NULL,
    rule_version NVARCHAR(40) NOT NULL,
    breakdown NVARCHAR(MAX) NULL,
    created_at DATETIMEOFFSET NOT NULL
);

CREATE TABLE dbo.pricing_books (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(80) NOT NULL,
    rule_version NVARCHAR(80) NOT NULL,
    is_active BIT NOT NULL,
    payload NVARCHAR(MAX) NOT NULL,
    notes NVARCHAR(MAX) NOT NULL,
    updated_by_id INT NULL,
    updated_by_name NVARCHAR(160) NOT NULL,
    created_at DATETIMEOFFSET NOT NULL
);

CREATE TABLE dbo.audit_events (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    actor_type NVARCHAR(20) NOT NULL,
    actor_id INT NULL,
    actor_email NVARCHAR(255) NOT NULL,
    action NVARCHAR(80) NOT NULL,
    entity_type NVARCHAR(40) NOT NULL,
    entity_id INT NULL,
    detail NVARCHAR(MAX) NOT NULL,
    created_at DATETIMEOFFSET NOT NULL
);
"""

FK_DDL = r"""
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_customers_assigned_staff')
ALTER TABLE dbo.customers ADD CONSTRAINT fk_customers_assigned_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES dbo.staff_users(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_quotes_customer')
ALTER TABLE dbo.quotes ADD CONSTRAINT fk_quotes_customer
    FOREIGN KEY (customer_id) REFERENCES dbo.customers(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_quotes_created_by_staff')
ALTER TABLE dbo.quotes ADD CONSTRAINT fk_quotes_created_by_staff
    FOREIGN KEY (created_by_staff_id) REFERENCES dbo.staff_users(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_quotes_manual_pricing_by')
ALTER TABLE dbo.quotes ADD CONSTRAINT fk_quotes_manual_pricing_by
    FOREIGN KEY (manual_pricing_by_id) REFERENCES dbo.staff_users(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_quote_versions_quote')
ALTER TABLE dbo.quote_versions ADD CONSTRAINT fk_quote_versions_quote
    FOREIGN KEY (quote_id) REFERENCES dbo.quotes(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_quote_status_history_quote')
ALTER TABLE dbo.quote_status_history ADD CONSTRAINT fk_quote_status_history_quote
    FOREIGN KEY (quote_id) REFERENCES dbo.quotes(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_pricing_snapshots_quote')
ALTER TABLE dbo.pricing_snapshots ADD CONSTRAINT fk_pricing_snapshots_quote
    FOREIGN KEY (quote_id) REFERENCES dbo.quotes(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_pricing_snapshots_version')
ALTER TABLE dbo.pricing_snapshots ADD CONSTRAINT fk_pricing_snapshots_version
    FOREIGN KEY (quote_version_id) REFERENCES dbo.quote_versions(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_pricing_books_updated_by')
ALTER TABLE dbo.pricing_books ADD CONSTRAINT fk_pricing_books_updated_by
    FOREIGN KEY (updated_by_id) REFERENCES dbo.staff_users(id);
"""

COLUMNS = {
    "staff_users": [
        "id", "email", "hashed_password", "first_name", "last_name", "role",
        "is_active", "created_at", "updated_at",
    ],
    "customers": [
        "id", "email", "hashed_password", "first_name", "last_name", "phone",
        "designation", "company", "gst", "address", "city", "state", "pincode",
        "country", "created_at", "updated_at", "assigned_staff_id",
    ],
    "quotes": [
        "id", "number", "customer_id", "status", "product_name", "specification",
        "valid_until", "lead_time", "payment_terms", "created_at", "updated_at",
        "bom_snapshot", "pricing_snapshot", "created_by_staff_id",
        "manual_pricing_status", "manual_pricing_note", "manual_pricing_at",
        "manual_pricing_by_id",
    ],
    "quote_versions": [
        "id", "quote_id", "version", "status", "specification", "note",
        "created_at", "bom_snapshot", "pricing_snapshot", "quantity",
        "unit_price", "total_amount", "rule_version", "created_by_staff_id",
        "created_by_name", "is_current",
    ],
    "quote_status_history": [
        "id", "quote_id", "from_status", "to_status", "event", "detail",
        "event_type", "created_at",
    ],
    "pricing_snapshots": [
        "id", "quote_id", "quote_version_id", "currency", "unit_price",
        "quantity", "total_amount", "total_kg", "source", "created_at",
        "breakdown", "rule_version",
    ],
    "pricing_books": [
        "id", "name", "rule_version", "is_active", "payload", "notes",
        "updated_by_id", "updated_by_name", "created_at",
    ],
    "audit_events": [
        "id", "actor_type", "actor_id", "actor_email", "action", "entity_type",
        "entity_id", "detail", "created_at",
    ],
}

JSON_COLS = {
    "quotes": {"specification", "bom_snapshot", "pricing_snapshot"},
    "quote_versions": {"specification", "bom_snapshot", "pricing_snapshot"},
    "pricing_snapshots": {"breakdown"},
    "pricing_books": {"payload"},
}


def json_default(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    raise TypeError(type(value))


def convert(table: str, col: str, value):
    if value is None:
        return None
    if col in JSON_COLS.get(table, set()):
        if isinstance(value, (dict, list)):
            return json.dumps(value, default=json_default)
        return str(value)
    if isinstance(value, datetime) and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def fetch_pg(table: str) -> list[tuple]:
    if not PG_DSN:
        sys.exit("PG_DSN is not set")
    cols = COLUMNS[table]
    sql = f'SELECT {", ".join(cols)} FROM {table} ORDER BY id'
    with psycopg.connect(PG_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
    out = []
    for row in rows:
        out.append(tuple(convert(table, col, val) for col, val in zip(cols, row)))
    return out


def connect_master():
    password = os.environ.get("MSSQL_SA_PASSWORD")
    if not password:
        sys.exit("MSSQL_SA_PASSWORD is not set")
    return pymssql.connect(
        server=MSSQL_HOST,
        port=MSSQL_PORT,
        user=MSSQL_USER,
        password=password,
        database="master",
        login_timeout=20,
        timeout=60,
        autocommit=True,
    )


def connect_target():
    password = os.environ.get("MSSQL_SA_PASSWORD")
    return pymssql.connect(
        server=MSSQL_HOST,
        port=MSSQL_PORT,
        user=MSSQL_USER,
        password=password,
        database=TARGET_DB,
        login_timeout=20,
        timeout=60,
    )


def exec_batches(cursor, sql: str):
    for part in sql.split(";"):
        stmt = part.strip()
        if stmt:
            cursor.execute(stmt)


def insert_table(conn, table: str, rows: list[tuple]):
    cols = COLUMNS[table]
    placeholders = ", ".join(["%s"] * len(cols))
    col_sql = ", ".join(cols)
    cur = conn.cursor()
    if not rows:
        conn.commit()
        return 0
    cur.execute(f"SET IDENTITY_INSERT dbo.{table} ON")
    cur.executemany(
        f"INSERT INTO dbo.{table} ({col_sql}) VALUES ({placeholders})",
        rows,
    )
    cur.execute(f"SET IDENTITY_INSERT dbo.{table} OFF")
    max_id = max(row[0] for row in rows)
    cur.execute(f"DBCC CHECKIDENT ('dbo.{table}', RESEED, {max_id})")
    conn.commit()
    return len(rows)


def main():
    print("Reading local Postgres...")
    data = {table: fetch_pg(table) for table in TABLES}
    for table, rows in data.items():
        print(f"  {table}: {len(rows)}")

    print("Connecting to SQL Server master...")
    master = connect_master()
    ensure_database(master.cursor())
    master.close()
    print(f"Database {TARGET_DB} ready")

    print("Recreating tables with IDENTITY...")
    target = connect_target()
    tcur = target.cursor()
    exec_batches(tcur, DROP_DDL)
    exec_batches(tcur, TABLE_DDL)
    target.commit()

    print("Loading rows...")
    for table in TABLES:
        n = insert_table(target, table, data[table])
        print(f"  loaded {table}: {n}")

    print("Adding foreign keys if missing...")
    try:
        exec_batches(target.cursor(), FK_DDL)
        target.commit()
    except Exception as exc:
        print(f"FK warning (data still loaded): {exc}")

    print("Verify counts:")
    cur = target.cursor()
    for table in TABLES:
        cur.execute(f"SELECT COUNT(*) FROM dbo.{table}")
        print(f"  {table}: {cur.fetchone()[0]}")
    target.close()
    print("done")


if __name__ == "__main__":
    main()
