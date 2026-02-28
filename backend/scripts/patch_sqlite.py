import sqlite3
import os

DB_PATH = "study_planner.db"

def patch_db():
    print(f"Opening connection to {DB_PATH}...")
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Columns to add
    migrations = [
        ("user_xp", "coins", "INTEGER DEFAULT 0"),
        ("user_xp", "guild_id", "CHAR(36)"),
        ("user_streaks", "streak_multiplier", "FLOAT DEFAULT 1.0"),
        ("user_streaks", "streak_shields", "INTEGER DEFAULT 0"),
    ]

    for table, column, col_type in migrations:
        try:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [info[1] for info in cursor.fetchall()]
            if column not in columns:
                print(f"Adding {column} to {table}...")
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
                print(f"Success.")
            else:
                print(f"{table}.{column} already exists.")
        except Exception as e:
            print(f"Failed to migrate {table}.{column}: {e}")

    conn.commit()
    conn.close()
    print("Patch complete.")

if __name__ == "__main__":
    patch_db()
