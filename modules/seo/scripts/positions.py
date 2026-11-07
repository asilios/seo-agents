"""История позиций сайта в выдаче: срезы `serp-*-weekly.md` → один файл `positions.csv`.

Срезы выдачи делает агент (поиск Firecrawl, Google, Узбекистан, топ-30) и пишет таблицей в
`clients/<client>/seo/data/serp-YYYY-MM-DD-weekly.md`. Этот скрипт собирает все срезы в таблицу
`clients/<client>/seo/data/positions.csv`, которую читает интерфейс (графики и светофоры).

Колонки: date, query, position, url, is_brand
- position — лучшая позиция сайта по запросу (1–30); пусто — сайта нет в топ-30;
- url — адрес страницы, занявшей лучшую позицию (как написано в срезе);
- is_brand — 1 для запроса с названием сайта.

Пример:
    python modules/seo/scripts/positions.py import --client forma-3d
    python modules/seo/scripts/positions.py summary --client forma-3d
"""
import argparse
import csv
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # русский вывод в консоли Windows
from pathlib import Path

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())

FILE_DATE = re.compile(r"serp-(\d{4}-\d{2}-\d{2})-weekly\.md$")
POS = re.compile(r"#(\d{1,2})\b\s*([^\s,;*()]*)")
FIELDS = ["date", "query", "position", "url", "is_brand"]


def clean(cell: str) -> str:
    return cell.replace("**", "").strip()


def parse_table(text: str):
    """Строки таблицы среза: (запрос, позиция|None, url). Ищет колонку «forma-3d.uz … сейчас»."""
    rows, header = [], None
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = [clean(c) for c in line.strip().strip("|").split("|")]
        if header is None:
            if any("запрос" in c.lower() for c in cells):
                header = cells
            continue
        if set("".join(cells)) <= set("-: "):
            continue  # строка-разделитель
        try:
            q_idx = next(i for i, c in enumerate(header) if "запрос" in c.lower())
            p_idx = next(i for i, c in enumerate(header) if "сейчас" in c.lower() or c.lower().startswith("forma-3d"))
        except StopIteration:
            return []
        if len(cells) <= max(q_idx, p_idx):
            continue
        query = re.sub(r"\s*\((новый|бренд)\)\s*", " ", cells[q_idx]).strip()
        is_brand = "(бренд)" in cells[q_idx] or query.lower().replace(" ", "") in ("forma-3d.uz", "forma3d.uz")
        found = [(int(n), u) for n, u in POS.findall(cells[p_idx])]
        best = min(found, key=lambda x: x[0]) if found else None
        rows.append({
            "query": query,
            "position": best[0] if best else "",
            "url": best[1] if best else "",
            "is_brand": 1 if is_brand else 0,
        })
    return rows


def import_client(client: str) -> int:
    data = ROOT / "clients" / client / "seo" / "data"
    out_rows = []
    for f in sorted(data.glob("serp-*-weekly.md")):
        m = FILE_DATE.search(f.name)
        if not m:
            continue
        for r in parse_table(f.read_text(encoding="utf-8")):
            out_rows.append({"date": m.group(1), **r})
    if not out_rows:
        print("Срезов не найдено", file=sys.stderr)
        return 1
    out = data / "positions.csv"
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(out_rows)
    dates = sorted({r["date"] for r in out_rows})
    print(f"{out.relative_to(ROOT)}: {len(out_rows)} строк, срезов {len(dates)} ({dates[0]} … {dates[-1]})")
    return 0


def summary(client: str) -> int:
    path = ROOT / "clients" / client / "seo" / "data" / "positions.csv"
    if not path.exists():
        print("нет positions.csv — сначала `import`", file=sys.stderr)
        return 1
    rows = list(csv.DictReader(open(path, encoding="utf-8")))
    for d in sorted({r["date"] for r in rows}):
        day = [r for r in rows if r["date"] == d and r["is_brand"] == "0"]
        pos = [int(r["position"]) for r in day if r["position"]]
        print(f"{d}: запросов {len(day)}, в топ-30 {len(pos)}, в топ-10 {sum(1 for p in pos if p <= 10)}")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["import", "summary"])
    ap.add_argument("--client", default="forma-3d")
    a = ap.parse_args()
    sys.exit(import_client(a.client) if a.command == "import" else summary(a.client))


if __name__ == "__main__":
    main()
