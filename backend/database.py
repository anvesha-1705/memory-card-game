import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "game_data.db")


def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_db()

    schema_path = os.path.join(BASE_DIR, "schema.sql")

    with open(schema_path, "r") as file:
        connection.executescript(file.read())

    connection.commit()
    connection.close()