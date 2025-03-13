import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')

try:
    db = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME
    )
    print("Database connection successful!")
except mysql.connector.Error as err:
    print(f"Error: {err}")
