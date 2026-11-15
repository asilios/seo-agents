"""Разовое получение refresh token для Google Ads API (scope adwords).

Нужны GOOGLE_ADS_CLIENT_ID и GOOGLE_ADS_CLIENT_SECRET в .env (OAuth client типа Desktop app).
Запуск из корня репозитория:
    python modules/seo/scripts/gads_auth.py

Откроется браузер: войти под почтой, которая добавлена в Test users и имеет доступ к MCC, и разрешить доступ.
Скрипт НЕ печатает токен в чат и не пишет его в .env сам: он сохраняет его в secrets/gads-refresh-token.txt
(папка secrets/ в .gitignore). Оттуда значение переносится в .env как GOOGLE_ADS_REFRESH_TOKEN.
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())
load_dotenv(ROOT / ".env")


def main():
    cid, secret = os.environ.get("GOOGLE_ADS_CLIENT_ID"), os.environ.get("GOOGLE_ADS_CLIENT_SECRET")
    if not cid or not secret:
        sys.exit("Нет GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET в .env")
    from google_auth_oauthlib.flow import InstalledAppFlow

    flow = InstalledAppFlow.from_client_config(
        {"installed": {"client_id": cid, "client_secret": secret,
                       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                       "token_uri": "https://oauth2.googleapis.com/token",
                       "redirect_uris": ["http://localhost"]}},
        scopes=["https://www.googleapis.com/auth/adwords"],
    )
    # prompt=consent и offline — чтобы Google точно выдал refresh token
    creds = flow.run_local_server(port=0, access_type="offline", prompt="consent")
    if not creds.refresh_token:
        sys.exit("Google не вернул refresh token. Отзовите доступ на myaccount.google.com/permissions и повторите.")
    out = ROOT / "secrets" / "gads-refresh-token.txt"
    out.parent.mkdir(exist_ok=True)
    out.write_text(creds.refresh_token, encoding="utf-8")
    print(f"Готово. Refresh token сохранён в {out}. Скопируйте его в .env в GOOGLE_ADS_REFRESH_TOKEN и удалите файл.")


if __name__ == "__main__":
    main()
