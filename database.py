 # database.py

from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# SHARED with old bot
users_col = db["users"]

# BountyFlix collections
titles_col = db["bountyflix_titles"]

def get_all_user_ids():
    ids = []
    for u in users_col.find({}):
        if "user_id" in u:
            ids.append(u["user_id"])
        elif "user id" in u:
            ids.append(u["user id"])
    return list(set(ids))

def add_title(name: str):
    titles_col.insert_one({"name": name})

def get_titles():
    return list(titles_col.find({}))