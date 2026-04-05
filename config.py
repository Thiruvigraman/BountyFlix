 #config.py

import os

BOT_TOKEN = os.getenv("BOT_TOKEN")
MONGO_URI = os.getenv("MONGO_URI")

if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN not set")

if not MONGO_URI:
    raise ValueError("MONGO_URI not set")