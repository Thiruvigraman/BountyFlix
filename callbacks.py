  # callbacks.py

from telegram import Update
from telegram.ext import CallbackContext
from database import add_user, get_titles


def start(update: Update, context: CallbackContext):
    user_id = update.effective_user.id
    add_user(user_id)

    update.message.reply_text("Welcome! Choose:\nMovies / Series")


def callback_handler(update: Update, context: CallbackContext):
    query = update.callback_query
    query.answer()

    data = query.data

    if data == "movies":
        titles = get_titles()
        text = "\n".join([t["name"] for t in titles])
        query.edit_message_text(text or "No titles found")

    elif data == "back":
        query.edit_message_text("Back to menu")

    else:
        query.edit_message_text("Unknown option")  # FIX