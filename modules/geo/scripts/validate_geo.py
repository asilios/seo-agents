"""Проверка данных модуля GEO: профиль по JSON Schema и формат queries.csv.

Пример:
    python modules/geo/scripts/validate_geo.py --client forma-3d

Код возврата: 0 — ошибок нет, 1 — есть ошибки. Предупреждения (warn) не меняют код.
Нужны PyYAML и jsonschema (requirements.txt).
"""
import argparse
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())
SCHEMA = ROOT / "core" / "schemas" / "geo-profile.schema.json"
COLUMNS = ["id", "text", "lang", "intent", "region", "priority", "status"]
INTENTS = {"supplier", "compare", "price", "local", "info"}
STATUSES = {"pending", "approved", "retired"}
CYRILLIC = re.compile(r"[А-Яа-яЁё]")
UZ_CYRILLIC_HINT = re.compile(r"[ўқғҳЎҚҒҲ]")


def check_profile(path: Path) -> tuple[dict | None, list[str]]:
    errors: list[str] = []
    if not path.exists():
        return None, [f"нет файла {path.relative_to(ROOT)}"]
    profile = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    validator = Draft202012Validator(json.loads(SCHEMA.read_text(encoding="utf-8")))
    for e in sorted(validator.iter_errors(profile), key=lambda e: list(e.path)):
        where = ".".join(str(p) for p in e.path) or "(корень)"
        errors.append(f"profile.yaml: {where}: {e.message}")
    return profile, errors


def check_queries(path: Path, profile: dict | None) -> tuple[list[str], list[str], int]:
    errors: list[str] = []
    warns: list[str] = []
    if not path.exists():
        return [f"нет файла {path.relative_to(ROOT)}"], warns, 0
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != COLUMNS:
            return [f"queries.csv: колонки {reader.fieldnames}, ожидались {COLUMNS}"], warns, 0
        rows = list(reader)
    languages = set((profile or {}).get("languages", []))
    ids = Counter(r["id"] for r in rows)
    texts = Counter((r["lang"], r["text"].strip().lower()) for r in rows)
    for n, r in enumerate(rows, start=2):
        tag = f"queries.csv:{n} ({r['id']})"
        if ids[r["id"]] > 1:
            errors.append(f"{tag}: повторяется id")
        if not r["text"].strip():
            errors.append(f"{tag}: пустой текст")
        if r["lang"] not in {"ru", "uz", "en"}:
            errors.append(f"{tag}: lang={r['lang']!r}")
        elif languages and r["lang"] not in languages:
            errors.append(f"{tag}: язык {r['lang']} не входит в profile.languages")
        if r["intent"] not in INTENTS:
            errors.append(f"{tag}: intent={r['intent']!r}")
        if r["status"] not in STATUSES:
            errors.append(f"{tag}: status={r['status']!r}")
        if r["priority"] not in {"1", "2", "3"}:
            errors.append(f"{tag}: priority={r['priority']!r}")
        if texts[(r["lang"], r["text"].strip().lower())] > 1:
            warns.append(f"{tag}: дубль текста")
        if r["lang"] == "uz" and CYRILLIC.search(r["text"]):
            warns.append(f"{tag}: кириллица в uz-запросе (в проекте uz — латиница)")
        if r["lang"] == "ru" and not CYRILLIC.search(r["text"]):
            warns.append(f"{tag}: в ru-запросе нет кириллицы")
        brand = ((profile or {}).get("brand") or {})
        names = [brand.get("name", ""), brand.get("domain", ""), *brand.get("aliases", [])]
        if r["intent"] != "info" and any(n and n.lower() in r["text"].lower() for n in names):
            warns.append(f"{tag}: в вопросе названа компания клиента (правило 4 modules/geo/CLAUDE.md)")
    return errors, warns, len(rows)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):  # консоль Windows бывает в cp1251
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--client", required=True)
    args = ap.parse_args()
    base = ROOT / "clients" / args.client / "geo"
    profile, errors = check_profile(base / "profile.yaml")
    q_errors, warns, n = check_queries(base / "queries.csv", profile)
    errors += q_errors
    for w in warns:
        print("warn:", w)
    for e in errors:
        print("ОШИБКА:", e)
    by_intent = ""
    if not q_errors and n:
        with (base / "queries.csv").open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
        c = Counter(r["intent"] for r in rows)
        l = Counter(r["lang"] for r in rows)
        by_intent = f" | интенты {dict(c)} | языки {dict(l)}"
    print(f"Вопросов: {n}; ошибок: {len(errors)}; предупреждений: {len(warns)}{by_intent}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
