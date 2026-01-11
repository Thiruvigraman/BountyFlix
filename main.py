#main.py

import os
import time
import asyncio
import threading
from flask import Flask, jsonify

from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)

from config import BOT_TOKEN, is_admin
from callbacks import main_menu, movies_menu
from admin import handle_broadcast, handle_add_title, admin_panel
from rate_limit import is_allowed

# ---------------- HEALTH ----------------
app = Flask(__name__)
START_TIME = time.time()
LAST_HEARTBEAT = time.time()
BOT_OK = True

@app.route("/")
def home():
    return "BountyFlix alive 🟢"

@app.route("/health")
def health():
    return jsonify({
        "status": "ok" if BOT_OK else "error",
        "uptime": int(time.time() - START_TIME),
        "heartbeat": int(time.time() - LAST_HEARTBEAT),
    }), 200


def run_web():
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)


# ---------------- BOT HANDLERS ----------------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if not is_allowed(uid, "command"):
        return
    await update.message.reply_text(
        "🎬 Welcome to BountyFlix",
        reply_markup=main_menu()
    )


async def admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if not is_allowed(uid, "admin"):
        return
    if not is_admin(uid):
        await update.message.reply_text("❌ Admin only")
        return

    await update.message.reply_text(
        "👑 Admin Panel",
        reply_markup=admin_panel()
    )


async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    uid = query.from_user.id

    if not is_allowed(uid, "callback"):
        await query.answer("⏳ Slow down")
        return

    await query.answer()

    if query.data == "movies":
        await query.edit_message_text(
            "🎬 Available Movies:",
            reply_markup=movies_menu()
        )

    elif query.data == "back":
        await query.edit_message_text(
            "🏠 Main Menu",
            reply_markup=main_menu()
        )


# ---------------- RUN BOT ----------------
async def run_bot():
    global BOT_OK, LAST_HEARTBEAT

    app_bot = ApplicationBuilder().token(BOT_TOKEN).build()

    app_bot.add_handler(CommandHandler("start", start))
    app_bot.add_handler(CommandHandler("admin", admin))
    app_bot.add_handler(CommandHandler("broadcast", handle_broadcast))
    app_bot.add_handler(CommandHandler("addtitle", handle_add_title))
    app_bot.add_handler(CallbackQueryHandler(callback_handler))

    BOT_OK = True
    await app_bot.initialize()
    await app_bot.start()
    await app_bot.bot.initialize()

    print("🤖 Telegram bot started")

    while True:
        LAST_HEARTBEAT = time.time()
        await asyncio.sleep(10)


def start_bot_loop():
    while True:
        try:
            asyncio.run(run_bot())
        except Exception as e:
            print("❌ Bot crashed, restarting:", e)
            time.sleep(5)


# ---------------- ENTRY ----------------
if __name__ == "__main__":
    threading.Thread(target=run_web).start()
    start_bot_loop()