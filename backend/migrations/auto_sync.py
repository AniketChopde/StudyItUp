import sqlite3
from sqlalchemy import create_engine, inspect
from models import Base  # adjust import to your Base location

DATABASE_URL = "sqlite:///./study_planner.db"

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)


def get_existing_columns(conn, table_name):
    cursor = conn.execute(f"PRAGMA table_info({table_name})")
    return {row[1] for row in cursor.fetchall()}


def sync_schema():
    conn = sqlite3.connect("study_planner.db")
    cursor = conn.cursor()

    for table in Base.metadata.sorted_tables:
        table_name = table.name

        # Create table if not exists
        if not inspector.has_table(table_name):
            print(f"Creating table: {table_name}")
            table.create(engine)
            continue

        existing_columns = get_existing_columns(conn, table_name)

        for column in table.columns:
            if column.name not in existing_columns:
                col_type = column.type.compile(engine.dialect)
                default = ""

                if column.default is not None:
                    default = f" DEFAULT {column.default.arg}"

                print(f"Adding column '{column.name}' to '{table_name}'")
                cursor.execute(
                    f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}{default}"
                )

    conn.commit()
    conn.close()
    print("✅ Schema sync complete.")


if __name__ == "__main__":
    sync_schema()