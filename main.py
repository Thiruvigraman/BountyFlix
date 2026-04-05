#main.py

import logging
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler

from config import BOT_TOKEN
from callbacks import start, callback_handler
from admin import admin, handle_broadcast, handle_add_title

logging.basicConfig(level=logging.INFO)


def main():
    updater = Updater(BOT_TOKEN, use_context=True)
    dp = updater.dispatcher

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("admin", admin))
    dp.add_handler(CommandHandler("broadcast", handle_broadcast))
    dp.add_handler(CommandHandler("addtitle", handle_add_title))
    dp.add_handler(CallbackQueryHandler(callback_handler))

    updater.start_polling(drop_pending_updates=True)
    updater.idle()


if __name__ == "__main__":
    main()