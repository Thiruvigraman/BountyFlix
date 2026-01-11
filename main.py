 #main.py

import os, time, asyncio, threading
from flask import Flask, jsonify

from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes
)

from callbacks import alphabet_menu, titles_menu, seasons_menu, download_menu
from admin import admin_panel, addanime_submit, admin_callbacks
from database import get_content_by_slug, inc_stat, get_stats
from config import is_admin

# ---------- FLASK ----------

app = Flask(__name__)
START_TIME = time.time()

@app.route("/")
def home():
    return "BountyFlix alive 🟢"

@app.route("/health")
def health():
    return jsonify({"status": "ok", "uptime": int(time.time() - START_TIME)})

def run_web():
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 10000)))

# ---------- COMMANDS ----------

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎬 <b>Available Movies</b>",
        reply_markup=alphabet_menu(),
        parse_mode="HTML"
    )

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("❌ Admins only")
        return

    await update.message.reply_text(
        "/start\n/addanime\n/admin\n/stats\n/help"
    )

async def stats_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("❌ Admins only")
        return

    s = get_stats()
    uptime = int(time.time() - START_TIME)

    await update.message.reply_text(
        f"📊 Stats\n"
        f"Alphabet: {s.get('alphabet_clicks', 0)}\n"
        f"Anime: {s.get('anime_clicks', 0)}\n"
        f"Season: {s.get('season_clicks', 0)}\n"
        f"Downloads: {s.get('download_clicks', 0)}\n\n"
        f"Uptime: {uptime}s"
    )

# ---------- CALLBACKS ----------

async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    data = q.data
    await q.answer()

    if data.startswith("admin:") or data.startswith("delete:"):
        await admin_callbacks(update, context)
        return

    if data.startswith("letter:"):
        inc_stat("alphabet_clicks")
        l = data.split(":")[1]
        await q.edit_message_text(
            f"🔤 {l}",
            reply_markup=titles_menu(l)
        )

    elif data.startswith("anime:"):
        inc_stat("anime_clicks")
        slug = data.split(":")[1]
        c = get_content_by_slug(slug)
        await q.edit_message_text(
            c["title"],
            reply_markup=seasons_menu(slug)
        )

    elif data.startswith("season:"):
        inc_stat("season_clicks")
        _, slug, s = data.split(":")
        await q.edit_message_text(
            "⬇ Download",
            reply_markup=download_menu(slug, int(s))
        )

    elif data.startswith("redirect:"):
        inc_stat("download_clicks")
        _, slug, s = data.split(":")
        c = get_content_by_slug(slug)
        for ss in c["seasons"]:
            if ss["season"] == int(s):
                await context.bot.send_message(q.from_user.id, ss["redirect"])

# ---------- RUN ----------

async def bot_main():
    app_bot = ApplicationBuilder().token(os.getenv("TOKEN")).build()

    app_bot.add_handler(CommandHandler("start", start))
    app_bot.add_handler(CommandHandler("help", help_cmd))
    app_bot.add_handler(CommandHandler("stats", stats_cmd))
    app_bot.add_handler(CommandHandler("admin", admin_panel))
    app_bot.add_handler(CommandHandler("addanime", addanime_submit))
    app_bot.add_handler(CallbackQueryHandler(callback_handler))

    await app_bot.run_polling()

def start_bot():
    while True:
        try:
            asyncio.run(bot_main())
        except Exception as e:
            print("CRASH:", e)
            time.sleep(5)

if __name__ == "__main__":
    threading.Thread(target=run_web).start()
    start_bot()