import sqlite3
import os
import sys

# Add backend to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Import Base
from database.connection_sqlite import Base

# Import all models so they register
import models.study_plan
import models.user
import models.quiz
import models.engagement
import models.gamification


DB_PATH = os.path.join(BASE_DIR, "study_planner.db")


def get_existing_columns(cursor, table_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    return {row[1] for row in cursor.fetchall()}


def table_exists(cursor, table_name):
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?;",
        (table_name,),
    )
    return cursor.fetchone() is not None


def sync_schema():
    print("🔄 Starting schema sync...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    for table in Base.metadata.sorted_tables:
        table_name = table.name

        if not table_exists(cursor, table_name):
            print(f"🆕 Creating table: {table_name}")
            create_sql = str(table.compile(dialect=sqlite3))
            table.create(bind=None)
            continue

        existing_columns = get_existing_columns(cursor, table_name)

        for column in table.columns:
            if column.name not in existing_columns:
                col_type = column.type.compile(dialect=Base.metadata.bind)
                print(f"➕ Adding column '{column.name}' to '{table_name}'")
                cursor.execute(
                    f"ALTER TABLE {table_name} ADD COLUMN {column.name} {column.type}"
                )

    conn.commit()
    conn.close()
    print("✅ Schema sync complete.")


if __name__ == "__main__":
    sync_schema()