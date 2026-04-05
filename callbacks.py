  # callbacjs.py

from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import CallbackContext
from database import add_user, get_titles


def main_menu():
    keyboard = [
        [InlineKeyboardButton("🎬 Movies", callback_data="movies")],
        [InlineKeyboardButton("📺 Series", callback_data="series")]
    ]
    return InlineKeyboardMarkup(keyboard)


def back_button():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("⬅️ Back", callback_data="back")]
    ])


def start(update: Update, context: CallbackContext):
    user_id = update.effective_user.id
    add_user(user_id)

    update.message.reply_text(
        "Welcome! Choose an option:",
        reply_markup=main_menu()
    )


def callback_handler(update: Update, context: CallbackContext):
    query = update.callback_query
    query.answer()

    data = query.data

    if data == "movies":
        titles = get_titles()
        text = "\n".join([f"• {t['name']}" for t in titles]) or "No titles found"

        query.edit_message_text(
            f"🎬 Movies:\n\n{text}",
            reply_markup=back_button()
        )

    elif data == "series":
        query.edit_message_text(
            "📺 Series section coming soon",
            reply_markup=back_button()
        )

    elif data == "back":
        query.edit_message_text(
            "Welcome! Choose an option:",
            reply_markup=main_menu()
        )

    else:
        query.edit_message_text("Unknown option")