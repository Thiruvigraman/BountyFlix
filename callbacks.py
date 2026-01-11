  # callbacks.py

from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from database import get_titles

def main_menu():
    keyboard = [
        [InlineKeyboardButton("🎬 Movies", callback_data="movies")],
    ]
    return InlineKeyboardMarkup(keyboard)

def movies_menu():
    titles = get_titles()
    keyboard = []

    for t in titles[:10]:
        keyboard.append(
            [InlineKeyboardButton(t["name"], callback_data="noop")]
        )

    keyboard.append([InlineKeyboardButton("⬅ Back", callback_data="back")])
    return InlineKeyboardMarkup(keyboard)