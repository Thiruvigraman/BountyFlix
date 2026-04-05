 #admin.py

from telegram import Update
from telegram.ext import CallbackContext
from database import get_all_user_ids, add_title

ADMIN_ID = 6778132055


def admin(update: Update, context: CallbackContext):
    if update.effective_user.id != ADMIN_ID:
        return
    update.message.reply_text("Admin panel")


def handle_broadcast(update: Update, context: CallbackContext):
    if update.effective_user.id != ADMIN_ID:
        return

    message = " ".join(context.args)
    users = get_all_user_ids()

    sent = 0
    for user_id in users:
        try:
            context.bot.send_message(chat_id=user_id, text=message)
            sent += 1
        except Exception:
            continue  # FIX: prevent crash

    update.message.reply_text(f"Broadcast sent to {sent} users")


def handle_add_title(update: Update, context: CallbackContext):
    if update.effective_user.id != ADMIN_ID:
        return

    name = " ".join(context.args)
    if not name:
        update.message.reply_text("Usage: /addtitle <name>")
        return

    add_title(name)
    update.message.reply_text("Title added")