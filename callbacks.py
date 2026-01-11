 # callbacks.py

from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from database import get_letters_available, get_titles_by_letter

# ------------------ ALPHABET MENU ------------------

def alphabet_menu():
    letters = get_letters_available()  # only letters that exist
    keyboard = []

    row = []
    for letter in letters:
        row.append(
            InlineKeyboardButton(letter, callback_data=f"letter:{letter}")
        )
        if len(row) == 5:
            keyboard.append(row)
            row = []

    if row:
        keyboard.append(row)

    return InlineKeyboardMarkup(keyboard)


# ------------------ TITLES BY LETTER ------------------

def titles_menu(letter: str):
    titles = get_titles_by_letter(letter)
    keyboard = []

    for t in titles:
        keyboard.append([
            InlineKeyboardButton(
                t["title"],
                callback_data=f"anime:{t['slug']}"
            )
        ])

    keyboard.append([
        InlineKeyboardButton("⬅ Back", callback_data="back:alphabet")
    ])

    return InlineKeyboardMarkup(keyboard)