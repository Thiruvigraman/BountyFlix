# database.py

from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

db = client["bountyflix"]
users_col = db["users"]
titles_col = db["titles"]


def add_user(user_id):
    users_col.update_one(
        {"user_id": user_id},
        {"$set": {"user_id": user_id}},
        upsert=True
    )


def get_all_user_ids():
    return [u["user_id"] for u in users_col.find({}, {"user_id": 1})]


def add_title(name):
    titles_col.insert_one({"name": name})


def get_titles(limit=10):
    return list(titles_col.find({}, {"name": 1}).limit(limit))