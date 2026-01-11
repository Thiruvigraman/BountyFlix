  # main.py

import os, time, asyncio, threading
from flask import Flask, jsonify
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes
from telegram.error import BadRequest

from callbacks import alphabet_menu, titles_menu, seasons_menu, download_menu
from admin import *
from database import get_content_by_slug, inc_stat, get_stats, get_pinned_menu, save_pinned_menu
from rate_limit import is_allowed
from config import OWNER_ID, CHANNEL_ID

app = Flask(__name__)
START_TIME = time.time()

@app.route("/")
def home():
    return "BountyFlix alive 🟢"

@app.route("/health")
def health():
    return jsonify({"status": "ok", "uptime": int(time.time() - START_TIME)})

async def pin_alphabet_menu(app):
    old = get_pinned_menu()
    if old:
        try:
            await app.bot.delete_message(CHANNEL_ID, old["message_id"])
        except BadRequest:
            pass

    msg = await app.bot.send_message(
        CHANNEL_ID,
        "🎬 <b>Welcome to AnimeExplorers</b>\n\nSelect a letter 👇",
        reply_markup=alphabet_menu(),
        parse_mode="HTML"
    )
    await app.bot.pin_chat_message(CHANNEL_ID, msg.message_id, disable_notification=True)
    save_pinned_menu(msg.message_id)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_allowed(update.effective_user.id, "command"):
        return
    await update.message.reply_text(
        "🎬 <b>Browse Anime & Movies</b>",
        reply_markup=alphabet_menu(),
        parse_mode="HTML"
    )

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID:
        return
    await update.message.reply_text(
        "/start\n/addanime\n/broadcast\n/stats\n/help"
    )

async def stats_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != OWNER_ID:
        return
    s = get_stats() or {}
    await update.message.reply_text(str(s))

async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    uid = q.from_user.id
    if not is_allowed(uid, "callback"):
        return
    await q.answer()
    d = q.data

    if d.startswith("approve") or d.startswith("reject"):
        await globals()[d.split(":")[0] + "_callback"](update, context)
        return

    if d.startswith("letter:"):
        inc_stat("alphabet_clicks")
        l = d.split(":")[1]
        await q.edit_message_text(f"🔤 {l}", reply_markup=titles_menu(l))

    elif d.startswith("anime:"):
        inc_stat("anime_clicks")
        slug = d.split(":")[1]
        c = get_content_by_slug(slug)
        await q.edit_message_text(c["title"], reply_markup=seasons_menu(slug))

    elif d.startswith("season:"):
        inc_stat("season_clicks")
        _, slug, s = d.split(":")
        await q.edit_message_text("Choose", reply_markup=download_menu(slug, int(s)))

    elif d.startswith("redirect:"):
        inc_stat("download_clicks")
        _, slug, s = d.split(":")
        c = get_content_by_slug(slug)
        for ss in c["seasons"]:
            if ss["season"] == int(s):
                await context.bot.send_message(uid, ss["redirect"])

async def bot_main():
    appb = ApplicationBuilder().token(os.getenv("TOKEN")).build()
    appb.add_handler(CommandHandler("start", start))
    appb.add_handler(CommandHandler("help", help_cmd))
    appb.add_handler(CommandHandler("stats", stats_cmd))
    appb.add_handler(CommandHandler("addanime", addanime_submit))
    appb.add_handler(CommandHandler("broadcast", broadcast_submit))
    appb.add_handler(CallbackQueryHandler(callback_handler))

    await pin_alphabet_menu(appb)
    await appb.run_polling()

def start_bot():
    while True:
        try:
            asyncio.run(bot_main())
        except Exception as e:
            print("CRASH:", e)
            time.sleep(5)

if __name__ == "__main__":
    threading.Thread(target=lambda: app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))).start()
    start_bot()