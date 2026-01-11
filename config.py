 #config.py

import os

# Telegram
BOT_TOKEN = os.getenv("TOKEN")

# MongoDB
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "telegram_bot"

# Admin IDs (add yours here)
ADMINS = [
    6930579635,  # example
]

def is_admin(user_id: int) -> bool:
    return user_id in ADMINS
