import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'study_planner.db')
conn = sqlite3.connect(db_path)
try:
    conn.execute("ALTER TABLE users ADD COLUMN google_id VARCHAR(255)")
    print('google_id Column added successfully')
except sqlite3.OperationalError as e:
    print(f'Error (might already exist): {e}')

try:
    conn.execute("ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255)")
    print('mfa_secret Column added successfully')
except sqlite3.OperationalError as e:
    print(f'Error (might already exist): {e}')

try:
    conn.execute("ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0")
    print('mfa_enabled Column added successfully')
except sqlite3.OperationalError as e:
    print(f'Error (might already exist): {e}')
conn.commit()
conn.close()
