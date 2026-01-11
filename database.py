 # database.py

from pymongo import MongoClient
import os, sys, time
from config import DB_NAME

try:
    client = MongoClient(
        os.getenv("MONGO_URI"),
        serverSelectionTimeoutMS=5000
    )
    client.admin.command("ping")
    print("✅ MongoDB connected")
except Exception as e:
    print("❌ MongoDB failed:", e)
    sys.exit(1)

db = client[DB_NAME]

# shared collection (old bot)
users_col = db["users"]

# bountyflix collections
titles_col = db["bountyflix_titles"]

def get_all_user_ids():
    ids = []
    for u in users_col.find({}):
        if "user_id" in u:
            ids.append(u["user_id"])
        elif "user id" in u:
            ids.append(u["user id"])
    return list(set(ids))

def get_user_count():
    return users_col.count_documents({})

def add_title(name: str):
    titles_col.insert_one({"name": name})

def get_titles():
    return list(titles_col.find({}))