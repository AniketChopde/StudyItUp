import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'study_planner.db')
conn = sqlite3.connect(db_path)
try:
    conn.execute("ALTER TABLE study_plans ADD COLUMN language VARCHAR DEFAULT 'English'")
    print('Column added successfully')
except sqlite3.OperationalError as e:
    print(f'Error (might already exist): {e}')
conn.commit()
conn.close()
