"""Замер скорости через Google PageSpeed Insights API (мобильная версия).

Ключ API (необязателен, но без него жёсткие лимиты): переменная окружения PSI_API_KEY.

Пример:
    python modules/seo/scripts/pagespeed.py https://example.uz https://example.uz/catalog --out clients/x/seo/data/psi-2026-10-28.json
"""
import argparse
import json
import os
import statistics
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

# Корень репозитория — ближайшая папка вверх с CLAUDE.md и clients/ (скрипт может лежать на любой глубине).
ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())
load_dotenv(ROOT / ".env")

API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"


def run(url, strategy):
    params = {"url": url, "strategy": strategy, "category": "performance"}
    if os.getenv("PSI_API_KEY"):
        params["key"] = os.environ["PSI_API_KEY"]
    r = requests.get(API, params=params, timeout=120)
    r.raise_for_status()
    d = r.json()
    lh = d["lighthouseResult"]
    audits = lh["audits"]
    field = d.get("loadingExperience", {}).get("metrics", {})

    def fv(key):
        m = field.get(key)
        return m.get("percentile") if m else None

    return {
        "url": url,
        "strategy": strategy,
        "performance_score": round(lh["categories"]["performance"]["score"] * 100),
        "lab": {
            "lcp_ms": audits["largest-contentful-paint"]["numericValue"],
            "cls": audits["cumulative-layout-shift"]["numericValue"],
            "tbt_ms": audits["total-blocking-time"]["numericValue"],
            "fcp_ms": audits["first-contentful-paint"]["numericValue"],
        },
        "field_p75": {  # реальные пользователи (CrUX), если хватает трафика
            "lcp_ms": fv("LARGEST_CONTENTFUL_PAINT_MS"),
            "cls_x100": fv("CUMULATIVE_LAYOUT_SHIFT_SCORE"),
            "inp_ms": fv("INTERACTION_TO_NEXT_PAINT"),
        },
        "top_opportunities": sorted(
            [
                {"id": k, "title": v.get("title"), "savings_ms": v["details"].get("overallSavingsMs", 0)}
                for k, v in audits.items()
                if v.get("details", {}).get("type") == "opportunity" and v["details"].get("overallSavingsMs", 0) > 0
            ],
            key=lambda x: -x["savings_ms"],
        )[:5],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("urls", nargs="+")
    ap.add_argument("--strategy", default="mobile", choices=["mobile", "desktop"])
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    results, errors = [], []
    for u in a.urls:
        try:
            results.append(run(u, a.strategy))
            print(f"ok {u}", file=sys.stderr)
        except Exception as e:
            errors.append({"url": u, "error": str(e)[:300]})
            print(f"FAIL {u}: {e}", file=sys.stderr)
    scores = [r["performance_score"] for r in results]
    lcps = [r["lab"]["lcp_ms"] for r in results]
    summary = {
        "median_score": statistics.median(scores) if scores else None,
        "median_lcp_ms": statistics.median(lcps) if lcps else None,
        "measured": len(results),
        "failed": len(errors),
    }
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "results": results, "errors": errors}, f, ensure_ascii=False, indent=2)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
