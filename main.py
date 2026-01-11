  # main.py

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

from callbacks import (
    alphabet_menu,
    titles_menu,
    seasons_menu,
    download_menu,
)
from admin import (
    addanime_submit,
    approve_callback,
    reject_callback,
    broadcast_submit,
    approve_broadcast_callback,
    reject_broadcast_callback,
)
from database import get_content_by_slug
from rate_limit import is_allowed

# ---------------- HEALTH SERVER ----------------

app = Flask(__name__)
START_TIME = time.time()

@app.route("/")
def home():
    return "BountyFlix alive 🟢"

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "uptime": int(time.time() - START_TIME),
    }), 200


def run_web():
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)

# ---------------- COMMANDS ----------------

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎬 <b>Browse Anime & Movies</b>\n\nSelect a letter 👇",
        reply_markup=alphabet_menu(),
        parse_mode="HTML"
    )

# ---------------- CALLBACK HANDLER ----------------

async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data
    await query.answer()

    if data.startswith("approve:"):
        await approve_callback(update, context)
        return

    if data.startswith("reject:"):
        await reject_callback(update, context)
        return

    if data.startswith("approve_broadcast:"):
        await approve_broadcast_callback(update, context)
        return

    if data.startswith("reject_broadcast:"):
        await reject_broadcast_callback(update, context)
        return

    if data.startswith("letter:"):
        letter = data.split(":")[1]
        await query.edit_message_text(
            f"🔤 <b>Titles starting with {letter}</b>",
            reply_markup=titles_menu(letter),
            parse_mode="HTML"
        )

    elif data.startswith("anime:"):
        slug = data.split(":")[1]
        content = get_content_by_slug(slug)
        await query.edit_message_text(
            f"🎬 <b>{content['title']}</b>\nSelect season 👇",
            reply_markup=seasons_menu(slug),
            parse_mode="HTML"
        )

    elif data.startswith("season:"):
        _, slug, season = data.split(":")
        season = int(season)
        content = get_content_by_slug(slug)
        await query.edit_message_text(
            f"🎬 <b>{content['title']}</b>\nSeason {season}",
            reply_markup=download_menu(slug, season),
            parse_mode="HTML"
        )

    elif data.startswith("redirect:"):
        _, slug, season = data.split(":")
        season = int(season)
        content = get_content_by_slug(slug)
        for s in content["seasons"]:
            if s["season"] == season:
                await context.bot.send_message(
                    chat_id=query.from_user.id,
                    text=s["redirect"]
                )
                return

# ---------------- BOT RUNNER ----------------

async def bot_main():
    app_bot = ApplicationBuilder().token(os.getenv("TOKEN")).build()

    app_bot.add_handler(CommandHandler("start", start))
    app_bot.add_handler(CommandHandler("addanime", addanime_submit))
    app_bot.add_handler(CommandHandler("broadcast", broadcast_submit))
    app_bot.add_handler(CallbackQueryHandler(callback_handler))

    print("🤖 BountyFlix bot started")
    await app_bot.run_polling()

def start_bot():
    while True:
        try:
            asyncio.run(bot_main())
        except Exception as e:
            print("❌ Bot crashed:", e)
            time.sleep(5)

# ---------------- ENTRY ----------------

if __name__ == "__main__":
    threading.Thread(target=run_web).start()
    start_bot()