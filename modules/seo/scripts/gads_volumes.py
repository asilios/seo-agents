"""Google Ads Keyword Planner: частотность запросов из семантического ядра (бесплатно, через Google Ads API).

Берёт запросы из clients/<client>/seo/keywords/clusters.md (строки «Запросы ru:» и «Запросы uz-Latn:»)
или из файла (--queries, по одному на строку) и пишет CSV со средним месячным объёмом, конкуренцией и ставками.

Ключи (в .env, не в чате): GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET,
GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID (без дефисов); для доступа через MCC — GOOGLE_ADS_LOGIN_CUSTOMER_ID.
Версия API — GOOGLE_ADS_API_VERSION (по умолчанию v21; если Google её отключил, поставить актуальную).

Запуск из корня репозитория:
    python modules/seo/scripts/gads_volumes.py --client forma-3d
    python modules/seo/scripts/gads_volumes.py --client forma-3d --dry-run     # только показать запросы, без вызова API

Важно: у аккаунта без расходов Google отдаёт диапазоны, а не точные числа (в CSV это видно по округлённым значениям).
"""
import argparse
import csv
import datetime as dt
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())
load_dotenv(ROOT / ".env")

UZBEKISTAN_GEO = "geoTargetConstants/2860"
# Русский язык — languageConstants/1031. Для узбекского ID не зашит (не проверен): запросы uz идут без языкового фильтра.
LANG_CONSTANTS = {"ru": "languageConstants/1031"}
BATCH = 700  # лимит API на один вызов — 1000 ключевых слов; берём с запасом
ENV = ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET",
       "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"]


def read_clusters(path):
    """Достаёт запросы по языкам из строк «- Запросы ru: a, b, c» и «- Запросы uz-Latn: ...»."""
    found = {"ru": [], "uz": []}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\s*-\s*Запросы\s+(ru|uz-Latn)\s*:\s*(.+)$", line)
        if not m:
            continue
        lang = "ru" if m.group(1) == "ru" else "uz"
        # пояснения в скобках («pla glow (светящийся)») отбрасываем
        for q in m.group(2).split(","):
            q = re.sub(r"\(.*?\)", "", q).strip().lower()
            if q and q not in found[lang]:
                found[lang].append(q)
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
    version = os.environ.get("GOOGLE_ADS_API_VERSION", "v21")
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


def micros(v):
    return round(int(v) / 1_000_000, 2) if v not in (None, "") else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--client", required=True)
    ap.add_argument("--queries", help="файл с запросами (по одному в строке) вместо clusters.md; язык — ru")
    ap.add_argument("--out")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    base = ROOT / "clients" / a.client / "seo"
    if a.queries:
        qs = {"ru": [l.strip().lower() for l in Path(a.queries).read_text(encoding="utf-8").splitlines() if l.strip()]}
    else:
        qs = read_clusters(base / "keywords" / "clusters.md")
    total = sum(len(v) for v in qs.values())
    print(f"Запросов: {total} ({', '.join(f'{k}: {len(v)}' for k, v in qs.items())}). Гео: Узбекистан.")
    if a.dry_run or not total:
        for lang, items in qs.items():
            print(f"[{lang}] " + "; ".join(items))
        return

    missing = [k for k in ENV if not os.environ.get(k)]
    if missing:
        sys.exit("Нет переменных в .env: " + ", ".join(missing) + ". Как получить — core/setup/requirements.yaml, пункт gads-keyword-planner.")

    token = access_token()
    out = Path(a.out) if a.out else base / "data" / f"gads-volumes-{dt.date.today().isoformat()}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for lang, items in qs.items():
        for i in range(0, len(items), BATCH):
            for res in fetch_batch(token, items[i:i + BATCH], lang):
                m = res.get("keywordMetrics", {})
                rows.append([res.get("text", ""), lang, m.get("avgMonthlySearches", 0),
                             m.get("competition", ""), m.get("competitionIndex", ""),
                             micros(m.get("lowTopOfPageBidMicros")), micros(m.get("highTopOfPageBidMicros"))])
    rows.sort(key=lambda r: -int(r[2] or 0))
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["query", "lang", "avg_monthly_searches", "competition", "competition_index",
                    "low_bid", "high_bid"])
        w.writerows(rows)
    with_volume = sum(1 for r in rows if int(r[2] or 0) > 0)
    print(f"Записано {len(rows)} строк, с объёмом > 0: {with_volume} → {out}")
    print("Ставки — в валюте аккаунта. Нули означают «Google не показывает данных», а не «спроса нет».")


if __name__ == "__main__":
    main()
