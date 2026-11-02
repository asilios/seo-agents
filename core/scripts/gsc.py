"""Google Search Console: выгрузка запросов/страниц и сравнение двух периодов.

Доступ: сервисный аккаунт Google Cloud с включённым Search Console API.
Email сервисного аккаунта нужно добавить пользователем в Search Console клиента (права «Ограниченный» достаточно).
Путь к JSON-ключу — в переменной окружения GSC_CREDENTIALS.

Выгрузка:
    python core/scripts/gsc.py --site sc-domain:example.uz --days 28 --out clients/x/seo/data/gsc-2026-10-28.csv
Сравнение:
    python core/scripts/gsc.py --compare clients/x/seo/data/gsc-2026-09-28.csv clients/x/seo/data/gsc-2026-10-28.csv
"""
import argparse
import csv
import datetime as dt
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Корень репозитория — ближайшая папка вверх с CLAUDE.md и clients/ (скрипт может лежать на любой глубине).
ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())
load_dotenv(ROOT / ".env")


def fetch(site, days, out):
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(
        str(ROOT / os.environ["GSC_CREDENTIALS"]),  # относительный путь — от корня репозитория
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    svc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
    end = dt.date.today() - dt.timedelta(days=3)  # данные GSC запаздывают на 2–3 дня
    start = end - dt.timedelta(days=days - 1)
    rows, start_row = [], 0
    while True:
        body = {
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
            "dimensions": ["query", "page"],
            "rowLimit": 25000,
            "startRow": start_row,
        }
        resp = svc.searchanalytics().query(siteUrl=site, body=body).execute()
        batch = resp.get("rows", [])
        rows += batch
        if len(batch) < 25000:
            break
        start_row += 25000
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["query", "page", "clicks", "impressions", "ctr", "position", "period_start", "period_end"])
        for r in rows:
            w.writerow([r["keys"][0], r["keys"][1], r["clicks"], r["impressions"],
                        round(r["ctr"], 4), round(r["position"], 2), start, end])
    print(json.dumps(totals(load(out)), ensure_ascii=False, indent=2))


def load(path):
    with open(path, encoding="utf-8") as f:
        return [
            {**r, "clicks": float(r["clicks"]), "impressions": float(r["impressions"]), "position": float(r["position"])}
            for r in csv.DictReader(f)
        ]


def totals(rows):
    clicks = sum(r["clicks"] for r in rows)
    impr = sum(r["impressions"] for r in rows)
    # средняя позиция, взвешенная по показам
    pos = sum(r["position"] * r["impressions"] for r in rows) / impr if impr else None
    queries = {}
    for r in rows:
        q = queries.setdefault(r["query"], {"impressions": 0, "pw": 0})
        q["impressions"] += r["impressions"]
        q["pw"] += r["position"] * r["impressions"]
    qpos = {k: v["pw"] / v["impressions"] for k, v in queries.items() if v["impressions"]}
    return {
        "clicks": int(clicks),
        "impressions": int(impr),
        "ctr": round(clicks / impr, 4) if impr else None,
        "avg_position": round(pos, 2) if pos else None,
        "queries_with_impressions": len(qpos),
        "queries_top10": sum(1 for p in qpos.values() if p <= 10),
        "queries_pos_8_30": sum(1 for p in qpos.values() if 8 <= p <= 30),
    }


def by(rows, key):
    agg = {}
    for r in rows:
        a = agg.setdefault(r[key], {"clicks": 0, "impressions": 0})
        a["clicks"] += r["clicks"]
        a["impressions"] += r["impressions"]
    return agg


def compare(prev_path, curr_path):
    prev, curr = load(prev_path), load(curr_path)
    tp, tc = totals(prev), totals(curr)
    delta = {k: (round(tc[k] - tp[k], 4) if tc[k] is not None and tp[k] is not None else None) for k in tc}
    out = {"previous": tp, "current": tc, "delta": delta}
    for key in ("query", "page"):
        a, b = by(prev, key), by(curr, key)
        changes = [
            {key: k, "clicks_prev": int(a.get(k, {}).get("clicks", 0)), "clicks_curr": int(b.get(k, {}).get("clicks", 0))}
            for k in set(a) | set(b)
        ]
        for c in changes:
            c["diff"] = c["clicks_curr"] - c["clicks_prev"]
        changes.sort(key=lambda c: c["diff"])
        out[f"top_{key}_gainers"] = changes[::-1][:10]
        out[f"top_{key}_losers"] = [c for c in changes[:10] if c["diff"] < 0]
    print(json.dumps(out, ensure_ascii=False, indent=2))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site")
    ap.add_argument("--days", type=int, default=28)
    ap.add_argument("--out")
    ap.add_argument("--compare", nargs=2, metavar=("PREV_CSV", "CURR_CSV"))
    a = ap.parse_args()
    if a.compare:
        compare(*a.compare)
    elif a.site and a.out:
        fetch(a.site, a.days, a.out)
    else:
        ap.error("нужно --site и --out, либо --compare PREV CURR")
        sys.exit(2)


if __name__ == "__main__":
    main()
