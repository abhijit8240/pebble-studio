# Pebble Studio

A calm, local-first content studio built around three AI agents, with one shared interface.

| Agent | What it does | Status |
|---|---|---|
| **SEO content** | Writes off-page blog drafts and guest-post / Reddit / Quora copy from your brand memory, in an AEO-friendly style | Done |
| **Generate image** | Photorealistic product visuals grounded in real reference photos, with comment-based edits | Done (needs Gemini billing) |
| **Generate script** | Reel and short-video scripts | Planned |

## What makes the SEO agent useful

- **Brand memory**: drop `.txt`, `.md` or `.pdf` guidelines into the Memory panel; the agent reads them on every draft (cached via Anthropic prompt caching to keep cost low).
- **Excel topic queue**: upload an `.xlsx` (see `samples/seo_queue_template.xlsx`), pick a row, generate, and the app writes **Status** and **Generated On** back to the sheet.
- **Past drafts** survive page refreshes (saved as Markdown with front matter).
- **Auto-archive**: every draft is appended, newest first, to a Word document.
- **Copy formatted / Copy markdown**: rich-text copy for WYSIWYG editors (Quora, Reddit rich composer) and plain Markdown for the rest.
- **Note presets** (comparison, buying guide, roundup, Q&A) plus one-click website / email sign-offs.
- **Optional safety check**: a second model call reviews a draft for spammy or risky claims.

## Tech stack

- Python, Flask backend, vanilla HTML / CSS / JS frontend (no build step)
- Anthropic API (Claude) for text; Google Gemini image model for images
- openpyxl (Excel), python-docx (Word archive), pypdf (PDF memory), Pillow
- pywebview + PyInstaller for an optional Windows `.exe`

## Run it locally

```bash
python -m venv venv
source venv/Scripts/activate      # Windows Git Bash
# source venv/bin/activate         # macOS / Linux
pip install -r requirements.txt
cp .env.example .env              # then add your own API keys
python app.py                     # open http://127.0.0.1:5000
```

API keys can also be pasted in the in-app **Settings** (gear icon); they are stored in a local `config.json` that is git-ignored.

## Folders

- `memory/seo`, `memory/script`: brand guideline files for each agent
- `memory/image/<product>/`: reference photos you drop in yourself; generated images go to `output/`
- `data/`, `drafts/`, `archive/`: created automatically at runtime

All of these hold private working data and are excluded by `.gitignore`.

## Build a Windows app (optional)

```bash
pip install pyinstaller
pyinstaller pebble_studio.spec    # produces dist/Studio.exe
```

When packaged, user data lives in `%APPDATA%\PebbleStudio`, so the exe itself carries no keys or content.

## Security notes

- Never commit `.env` or `config.json`.
- Image generation uses a paid Gemini model; the free tier returns a quota error.
