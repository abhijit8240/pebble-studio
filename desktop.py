"""
Desktop entry point for Studio. Starts the existing Flask app (app.py, completely
unchanged in how it works) in a background thread, then opens it in a real, native window
via pywebview — no address bar, no tabs, just the app itself.

This file is what PyInstaller packages into the .exe. app.py stays exactly as it is;
nothing about the web version breaks or changes.
"""

import threading
import time

import webview

import app as flask_app


HOST = "127.0.0.1"
PORT = 5000


def start_server():
    # debug/reload must stay off here — Flask's reloader spawns a subprocess and re-runs
    # this whole script, which conflicts badly with already running inside a background
    # thread of the desktop window process.
    flask_app.app.run(host=HOST, port=PORT, debug=False, use_reloader=False)


def main():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1)  # give Flask a moment to start listening before the window loads it

    webview.create_window(
        "Studio",
        f"http://{HOST}:{PORT}",
        width=1440,
        height=900,
        min_size=(1000, 650),
    )
    webview.start()


if __name__ == "__main__":
    main()
