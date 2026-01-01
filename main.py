import os
import json
import time
import requests
from pymongo import MongoClient
from flask import Flask, request, Response

app = Flask(__name__)

# -------------------------
# Environment Variables
# -------------------------
BOT_TOKEN = os.getenv("BOT_TOKEN")
TG_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

REDIS_URL = os.getenv("REDIS_URL")
REDIS_TOKEN = os.getenv("REDIS_TOKEN")

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")

ADMIN_IDS = list(map(int, os.getenv("ADMIN_IDS", "").split(",")))

# -------------------------
# MongoDB Setup
# -------------------------
client = MongoClient(MONGO_URI)
db = client[MONGO_DB]
users_col = db["users"]
admins_col = db["admins"]

# -------------------------
# Redis Helpers (Upstash)
# -------------------------
def redis_get(key):
    r = requests.get(f"{REDIS_URL}/get/{key}",
                     headers={"Authorization": f"Bearer {REDIS_TOKEN}"})
    return r.json().get("result")

def redis_set(key, value, ttl=60):
    requests.post(f"{REDIS_URL}/set/{key}",
                  headers={"Authorization": f"Bearer {REDIS_TOKEN}"},
                  json={"value": value, "ex": ttl})

def redis_incr(key):
    requests.post(f"{REDIS_URL}/incr/{key}",
                  headers={"Authorization": f"Bearer {REDIS_TOKEN}"})

# -------------------------
# Telegram Helpers
# -------------------------
def send_message(chat_id, text):
    requests.post(f"{TG_API}/sendMessage", json={"chat_id": chat_id, "text": text})

# -------------------------
# Admin Check
# -------------------------
def is_admin(user_id):
    if user_id in ADMIN_IDS:
        return True
    if admins_col.find_one({"user_id": user_id}):
        return True
    return False

# -------------------------
# Add / Update User
# -------------------------
def add_user(user_id, username):
    users_col.update_one(
        {"user_id": user_id},
        {"$set": {"username": username}},
        upsert=True
    )

# -------------------------
# Stats
# -------------------------
START_TIME = time.time()

def update_stats(user_id):
    # Total messages
    redis_incr("total_msgs")
    redis_incr("msgs_today")
    # Active users (last 24h)
    redis_set(f"active:{user_id}", 1, ttl=86400)

def get_stats():
    total = redis_get("total_msgs") or 0
    today = redis_get("msgs_today") or 0
    # Count active users
    r = requests.get(f"{REDIS_URL}/keys/active:*", headers={"Authorization": f"Bearer {REDIS_TOKEN}"})
    active_keys = r.json().get("result") or []
    uptime = int(time.time() - START_TIME)
    return {
        "total_messages": int(total),
        "messages_today": int(today),
        "active_users_24h": len(active_keys),
        "uptime_seconds": uptime
    }

# -------------------------
# Flask Webhook
# -------------------------
@app.route("/", methods=["POST"])
def webhook():
    update = request.get_json()

    if "message" not in update:
        return Response("ok", status=200)

    msg = update["message"]
    chat_id = msg["chat"]["id"]
    user = msg["from"]
    user_id = user["id"]
    username = user.get("username", "")
    text = msg.get("text", "")

    # Add user and update stats
    add_user(user_id, username)
    update_stats(user_id)

    # ---------------- Admin Commands ----------------
    if text.startswith("/stats") and is_admin(user_id):
        stats = get_stats()
        send_message(chat_id,
                     f"📊 Bot Stats\n"
                     f"👥 Active (24h): {stats['active_users_24h']}\n"
                     f"💬 Messages today: {stats['messages_today']}\n"
                     f"💬 Total messages: {stats['total_messages']}\n"
                     f"⏱ Uptime: {stats['uptime_seconds']}s")
        return Response("ok", status=200)

    if text.startswith("/addadmin") and is_admin(user_id):
        try:
            new_id = int(text.split()[1])
            admins_col.update_one(
                {"user_id": new_id},
                {"$set": {"user_id": new_id}},
                upsert=True
            )
            send_message(chat_id, f"✅ Admin {new_id} added")
        except:
            send_message(chat_id, "❌ Usage: /addadmin <user_id>")
        return Response("ok", status=200)

    # ---------------- Normal Response ----------------
    send_message(chat_id, "🚀 Bot online & fast!")
    return Response("ok", status=200)

# -------------------------
# Dashboard
# -------------------------
@app.route("/dashboard", methods=["GET"])
def dashboard():
    stats = get_stats()
    html = f"""
    <html>
    <head><title>Bot Dashboard</title></head>
    <body>
    <h1>📊 Bot Dashboard</h1>
    <p>👥 Active Users (24h): {stats['active_users_24h']}</p>
    <p>💬 Messages Today: {stats['messages_today']}</p>
    <p>💬 Total Messages: {stats['total_messages']}</p>
    <p>⏱ Uptime: {stats['uptime_seconds']} seconds</p>
    </body>
    </html>
    """
    return Response(html, mimetype="text/html")

# -------------------------
# Run Flask
# -------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))