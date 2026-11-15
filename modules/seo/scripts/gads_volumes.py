"""Google Ads Keyword Planner через API: частотность запросов ядра → seo/data/volumes.csv (источник planner).

Заменяет ручной путь «export → загрузить в Keyword Planner → import»: берёт те же запросы, что `keyword_volumes.py export`,
и дописывает результат в тот же volumes.csv, поэтому `keyword_volumes.py score` работает без изменений.

Ключи (в .env, не в чате): GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET,
GOOGLE_ADS_REFRESH_TOKEN (получить: gads_auth.py), GOOGLE_ADS_CUSTOMER_ID (без дефисов);
через MCC — GOOGLE_ADS_LOGIN_CUSTOMER_ID. Версия API — GOOGLE_ADS_API_VERSION (по умолчанию v24).

Запуск из корня репозитория:
    python modules/seo/scripts/gads_volumes.py --client forma-3d --dry-run   # только показать запросы
    python modules/seo/scripts/gads_volumes.py --client forma-3d

Без расходов в аккаунте Google отдаёт диапазоны вместо точных чисел: они пишутся как volume_min/volume_max.
Запрос, по которому Google не вернул объём, пропускается («нет данных», а не «нет спроса»).
"""
import argparse
import csv
import datetime as dt
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent))
from keyword_volumes import ROOT, VOL_FIELDS, norm, read_clusters  # noqa: E402

load_dotenv(ROOT / ".env")

UZBEKISTAN_GEO = "geoTargetConstants/2860"
# Русский язык — languageConstants/1031. ID узбекского не зашит (не проверен): uz-запросы идут без языкового фильтра.
LANG_CONSTANTS = {"ru": "languageConstants/1031"}
BATCH = 700  # лимит API — 1000 ключевых слов на вызов
ENV = ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET",
       "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"]


def queries_by_lang(client):
    """{ 'ru': [...], 'uz': [...] } без повторов; пояснения в скобках отбрасываются."""
    import re

    found, seen = {"ru": [], "uz": []}, set()
    for c in read_clusters(client):
        for q, lang in c["queries"]:
            q = re.sub(r"\(.*?\)", "", q).strip()
            key = norm(q)
            if not key or key in seen:
                continue
            seen.add(key)
            found["ru" if lang == "ru" else "uz"].append(q)
    return found


def access_token():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials

    creds = Credentials(
        None,
        refresh_token=os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        client_id=os.environ["GOOGLE_ADS_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
    )
    creds.refresh(Request())
    return creds.token


def fetch_batch(token, keywords, lang):
    import requests

    cid = os.environ["GOOGLE_ADS_CUSTOMER_ID"].replace("-", "")
    version = os.environ.get("GOOGLE_ADS_API_VERSION", "v24")
    headers = {
        "Authorization": f"Bearer {token}",
        "developer-token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "Content-Type": "application/json",
    }
    if os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID"):
        headers["login-customer-id"] = os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"].replace("-", "")
    body = {"keywords": keywords, "geoTargetConstants": [UZBEKISTAN_GEO], "keywordPlanNetwork": "GOOGLE_SEARCH"}
    if lang in LANG_CONSTANTS:
        body["language"] = LANG_CONSTANTS[lang]
    url = f"https://googleads.googleapis.com/{version}/customers/{cid}:generateKeywordHistoricalMetrics"
    r = requests.post(url, headers=headers, json=body, timeout=60)
    if r.status_code != 200:
        sys.exit(f"Google Ads API {r.status_code}: {r.text[:600]}")
    return r.json().get("results", [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--client", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    qs = queries_by_lang(a.client)
    total = sum(len(v) for v in qs.values())
    print(f"Запросов: {total} ({', '.join(f'{k}: {len(v)}' for k, v in qs.items())}). Гео: Узбекистан.")
    if a.dry_run or not total:
        return
    missing = [k for k in ENV if not os.environ.get(k)]
    if missing:
        sys.exit("Нет переменных в .env: " + ", ".join(missing))

    token = access_token()
    today = dt.date.today().isoformat()
    out, skipped = [], 0
    for lang, items in qs.items():
        for i in range(0, len(items), BATCH):
            for res in fetch_batch(token, items[i:i + BATCH], lang):
                avg = res.get("keywordMetrics", {}).get("avgMonthlySearches")
                if avg is None:
                    skipped += 1
                    continue
                avg = int(avg)
                out.append({"query": norm(res.get("text", "")), "volume_min": avg, "volume_max": avg, "volume": avg,
                            "source": "planner", "geo": "UZ", "date": today})
    path = ROOT / "clients" / a.client / "seo" / "data" / "volumes.csv"
    path.parent.mkdir(parents=True, exist_ok=True)
    new = not path.exists()
    with open(path, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=VOL_FIELDS)
        if new:
            w.writeheader()
        w.writerows(out)
    nonzero = sum(1 for o in out if o["volume"] > 0)
    print(f"Записано: {len(out)} (с объёмом > 0: {nonzero}), без данных: {skipped} в {path}")
    print(f"Дальше: python modules/seo/scripts/keyword_volumes.py score --client {a.client}")


if __name__ == "__main__":
    main()
