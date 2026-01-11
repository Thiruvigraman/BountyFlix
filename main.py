#main.py

from telegram.ext import Updater, CommandHandler
from telegram.error import Forbidden, BadRequest
from flask import Flask
import threading

from config import BOT_TOKEN, is_admin
from database import get_all_user_ids

# --- Flask keep-alive ---
app = Flask(__name__)

@app.route("/")
def home():
    return "BountyFlix bot is alive 🟢"

def run_web():
    app.run(host="0.0.0.0", port=8080)

# --- Telegram handlers ---
def start(update, context):
    update.message.reply_text("🎬 Welcome to BountyFlix!")

def broadcast(update, context):
    user_id = update.effective_user.id

    if not is_admin(user_id):
        update.message.reply_text("❌ Admins only, baby.")
        return

    if not context.args:
        update.message.reply_text("Usage: /broadcast <message>")
        return

    message = " ".join(context.args)
    users = get_all_user_ids()

    sent = 0
    failed = 0

    for uid in users:
        try:
            context.bot.send_message(uid, message)
            sent += 1
        except (Forbidden, BadRequest):
            failed += 1

    update.message.reply_text(
        f"📢 Broadcast done\n✅ Sent: {sent}\n❌ Failed: {failed}"
    )

def main():
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("broadcast", broadcast))

    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    threading.Thread(target=run_web).start()
    main()