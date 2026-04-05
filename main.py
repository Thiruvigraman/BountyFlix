#main.py

import threading
import time
import logging
import os
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler
from flask import Flask

from config import BOT_TOKEN
from callbacks import start, callback_handler
from admin import admin, handle_broadcast, handle_add_title

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)


@app.route("/")
def health():
    return {"status": "ok"}


def run_web():
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 10000)))


def run_bot():
    if not BOT_TOKEN:
        raise ValueError("BOT_TOKEN is missing")

    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("admin", admin))
    dp.add_handler(CommandHandler("broadcast", handle_broadcast))
    dp.add_handler(CommandHandler("addtitle", handle_add_title))
    dp.add_handler(CallbackQueryHandler(callback_handler))

    updater.start_polling()
    updater.idle()  # FIX: proper blocking


if __name__ == "__main__":
    threading.Thread(target=run_web).start()
    run_bot()