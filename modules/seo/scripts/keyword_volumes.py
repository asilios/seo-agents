"""Частотность запросов: выгрузка списка, импорт CSV из любого сервиса, пересчёт приоритетов кластеров.

Скрипт ничего не придумывает: цифры берутся только из импортированных файлов. Нет цифры — «нет данных».

1) Список запросов для загрузки в Keyword Planner / Wordstat / Key Collector:
    python modules/seo/scripts/keyword_volumes.py export --client forma-3d
    -> clients/forma-3d/seo/data/queries-to-check.txt (по одному запросу в строке) + queries-by-cluster.csv

2) Импорт выгрузки сервиса (CSV/TSV, UTF-8/UTF-16/cp1251, колонки находятся по названиям):
    python modules/seo/scripts/keyword_volumes.py import --client forma-3d --source planner --file выгрузка.csv
    -> дописывает clients/forma-3d/seo/data/volumes.csv (query, volume_min, volume_max, volume, source, geo, date)
    source: planner | wordstat | keycollector | gsc | other

3) Пересчёт приоритетов кластеров:
    python modules/seo/scripts/keyword_volumes.py score --client forma-3d
    -> clients/forma-3d/seo/keywords/priorities.md
"""
import argparse
import csv
import datetime as dt
import io
import re
import sys
from pathlib import Path

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())

VOL_FIELDS = ["query", "volume_min", "volume_max", "volume", "source", "geo", "date"]

# Названия колонок в выгрузках разных сервисов (в нижнем регистре).
QUERY_COLS = ["keyword", "search term", "search terms", "query", "запрос", "фраза", "ключевое слово", "keyword phrase", "so'rov"]
VOLUME_COLS = ["avg. monthly searches", "average monthly searches", "volume", "search volume", "частота", "частотность",
               "показов в месяц", "средн. число запросов в месяц", "среднее число запросов в месяц", "impressions", "показы",
               "кол-во запросов", "частота «!слово»", "частота \"!слово\"", "частота [!слово]", "freq", "frequency"]


def norm(q):
    """Единая форма запроса для сопоставления: нижний регистр, ё→е, без лишних пробелов и кавычек."""
    q = q.lower().replace("ё", "е").strip().strip('"[]!+')
    return re.sub(r"\s+", " ", q)


# ---------- чтение кластеров ----------

def read_clusters(client):
    path = ROOT / "clients" / client / "seo" / "keywords" / "clusters.md"
    if not path.exists():
        sys.exit(f"Нет файла {path}")
    clusters, cur = [], None
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            cur = {"title": line[3:].strip(), "queries": [], "priority": None, "intent": "", "target": ""}
            clusters.append(cur)
        elif cur is not None:
            m = re.match(r"-\s*Запросы\s+([\w\-]+)\s*:\s*(.+)", line)
            if m:
                lang = m.group(1)
                for q in m.group(2).split(","):
                    q = q.strip()
                    if q:
                        cur["queries"].append((q, lang))
                continue
            m = re.match(r"-\s*Приоритет\s*:\s*(\d)", line)
            if m:
                cur["priority"] = int(m.group(1))
                continue
            m = re.match(r"-\s*Интент\s*:\s*(.+)", line)
            if m:
                cur["intent"] = m.group(1).strip()
                continue
            m = re.match(r"-\s*Целевая страница\s*:\s*(.+)", line)
            if m:
                cur["target"] = m.group(1).strip()
    return [c for c in clusters if c["queries"]]


def cmd_export(args):
    clusters = read_clusters(args.client)
    data = ROOT / "clients" / args.client / "seo" / "data"
    data.mkdir(parents=True, exist_ok=True)
    seen, rows = set(), []
    for c in clusters:
        for q, lang in c["queries"]:
            rows.append((c["title"], lang, q))
            seen.add(norm(q))
    uniq = sorted({q for _, _, q in rows}, key=norm)
    uniq_unique, s = [], set()
    for q in uniq:
        if norm(q) not in s:
            s.add(norm(q))
            uniq_unique.append(q)
    (data / "queries-to-check.txt").write_text("\n".join(uniq_unique) + "\n", encoding="utf-8")
    with open(data / "queries-by-cluster.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["cluster", "lang", "query"])
        w.writerows(rows)
    print(f"Кластеров: {len(clusters)}, запросов: {len(rows)}, уникальных: {len(uniq_unique)}")
    print(f"-> {data / 'queries-to-check.txt'}")


# ---------- импорт ----------

def read_text(path):
    raw = Path(path).read_bytes()
    for enc in ("utf-16", "utf-8-sig", "cp1251"):
        try:
            text = raw.decode(enc)
            if enc == "utf-16" and not raw[:2] in (b"\xff\xfe", b"\xfe\xff"):
                continue  # utf-16 без BOM не угадываем
            return text
        except UnicodeDecodeError:
            continue
    sys.exit("Не удалось определить кодировку файла")


def parse_number(s):
    """'1 200' -> 1200, '1K' -> 1000, '1,2K' -> 1200, '1.5M' -> 1500000. Возвращает None, если не число."""
    s = s.strip().replace("\xa0", " ").replace(" ", "")
    if not s or s in ("-", "—"):
        return None
    m = re.fullmatch(r"([\d.,]+)([KkMmКк]?)", s)
    if not m:
        return None
    num, suf = m.groups()
    if suf:
        num = num.replace(",", ".")
    else:
        num = num.replace(",", "").replace(".", "") if re.fullmatch(r"\d{1,3}([.,]\d{3})+", num) else num.replace(",", ".")
    try:
        val = float(num)
    except ValueError:
        return None
    mult = {"k": 1e3, "к": 1e3, "m": 1e6}.get(suf.lower(), 1)
    return int(round(val * mult))


def parse_volume(s):
    """Возвращает (min, max). Диапазон Keyword Planner '1K – 10K' -> (1000, 10000); одно число -> (n, n)."""
    parts = re.split(r"\s*[–—-]\s*(?=\d)", s.strip(), maxsplit=1)
    if len(parts) == 2:
        a, b = parse_number(parts[0]), parse_number(parts[1])
        if a is not None and b is not None:
            return a, b
    n = parse_number(s)
    return (n, n) if n is not None else (None, None)


def cmd_import(args):
    text = read_text(args.file)
    sample = text[:4000]
    delim = "\t" if sample.count("\t") > sample.count(";") and sample.count("\t") > sample.count(",") else (";" if sample.count(";") > sample.count(",") else ",")
    rows = list(csv.reader(io.StringIO(text), delimiter=delim))
    hdr_i, qi, vi = None, None, None
    for i, r in enumerate(rows[:15]):  # Keyword Planner кладёт 2 служебные строки перед заголовком
        low = [c.strip().lower() for c in r]
        q = next((j for j, c in enumerate(low) if c in QUERY_COLS), None)
        v = next((j for j, c in enumerate(low) if c in VOLUME_COLS), None)
        if q is not None and v is not None:
            hdr_i, qi, vi = i, q, v
            break
    if hdr_i is None:
        sys.exit("Не нашёл колонки запроса и частотности. Ожидаются заголовки вроде Keyword/Avg. monthly searches, "
                 "Фраза/Частота, query/volume. Первые строки файла:\n" + "\n".join(delim.join(r) for r in rows[:4]))
    out, skipped = [], 0
    today = args.date or dt.date.today().isoformat()
    for r in rows[hdr_i + 1:]:
        if len(r) <= max(qi, vi) or not r[qi].strip():
            continue
        lo, hi = parse_volume(r[vi])
        if lo is None:
            skipped += 1  # пустое значение: у Keyword Planner так отображается «нет данных»
            continue
        out.append({"query": norm(r[qi]), "volume_min": lo, "volume_max": hi, "volume": round((lo + hi) / 2),
                    "source": args.source, "geo": args.geo, "date": today})
    path = ROOT / "clients" / args.client / "seo" / "data" / "volumes.csv"
    new = not path.exists()
    with open(path, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=VOL_FIELDS)
        if new:
            w.writeheader()
        w.writerows(out)
    ranges = sum(1 for o in out if o["volume_min"] != o["volume_max"])
    print(f"Импортировано: {len(out)} (диапазонов: {ranges}), без значения: {skipped}, источник: {args.source}, гео: {args.geo}")
    print(f"-> {path}")


# ---------- приоритеты ----------

def load_volumes(client):
    """Последнее значение по каждому запросу и источнику; по запросу берём источник с максимальной датой."""
    path = ROOT / "clients" / client / "seo" / "data" / "volumes.csv"
    best = {}
    if not path.exists():
        return best
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            k = norm(r["query"])
            if k not in best or r["date"] >= best[k]["date"]:
                best[k] = r
    return best


def cmd_score(args):
    clusters = read_clusters(args.client)
    vols = load_volumes(args.client)
    if not vols:
        sys.exit("Нет volumes.csv. Сначала: export -> загрузить в сервис -> import.")
    table = []
    for c in clusters:
        seen, lo_sum, hi_sum, found, total = set(), 0, 0, 0, 0
        for q, _ in c["queries"]:
            k = norm(q)
            if k in seen:
                continue
            seen.add(k)
            total += 1
            v = vols.get(k)
            if v and v["volume"] != "":
                found += 1
                lo_sum += int(v["volume_min"])
                hi_sum += int(v["volume_max"])
        table.append({"title": c["title"], "old": c["priority"], "found": found, "total": total, "lo": lo_sum, "hi": hi_sum,
                      "mid": (lo_sum + hi_sum) // 2, "intent": c["intent"], "target": c["target"]})
    with_data = sorted([t for t in table if t["found"]], key=lambda t: -t["mid"])
    n = len(with_data)
    for i, t in enumerate(with_data):  # терцили по сумме частотности
        t["new"] = 1 if i < max(1, n // 3) else (2 if i < max(2, 2 * n // 3) else 3)
    no_data = [t for t in table if not t["found"]]
    out = ROOT / "clients" / args.client / "seo" / "keywords" / "priorities.md"
    srcs = sorted({v["source"] for v in vols.values()})
    lines = [f"# Приоритеты кластеров по частотности ({dt.date.today().isoformat()})", "",
             f"Источники цифр: {', '.join(srcs)}. Сумма — по уникальным запросам кластера, у которых есть значение; "
             "диапазоны Keyword Planner показаны как «от–до». Это месячные показы запросов, а не трафик сайта.",
             "Приоритет 1–3 — по терцилям суммы частотности среди кластеров с данными; он НЕ учитывает сложность и "
             "текущую позицию — их сверять с последним срезом выдачи (`seo/data/serp-*.md`).", "",
             "| Новый приоритет | Был (экспертный) | Кластер | Сумма в месяц | Запросов с данными | Целевая страница |",
             "|---|---|---|---|---|---|"]
    for t in with_data:
        s = f"{t['lo']}–{t['hi']}" if t["lo"] != t["hi"] else str(t["lo"])
        tgt = (t["target"] or "—").split(" | ")[0].split(". Карточки")[0]
        tgt = (tgt[:60] + "…") if len(tgt) > 60 else tgt
        lines.append(f"| {t['new']} | {t['old'] or '—'} | {t['title']} | {s} | {t['found']}/{t['total']} | {tgt} |")
    if no_data:
        lines += ["", "## Нет данных о частотности", "", "Приоритет остаётся экспертным; цифры не придумываются.", ""]
        lines += [f"- {t['title']} (был {t['old'] or '—'}), запросов: {t['total']}" for t in no_data]
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Кластеров с данными: {n}, без данных: {len(no_data)}\n-> {out}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("export"); e.add_argument("--client", required=True); e.set_defaults(fn=cmd_export)
    i = sub.add_parser("import"); i.add_argument("--client", required=True); i.add_argument("--file", required=True)
    i.add_argument("--source", default="other", choices=["planner", "wordstat", "keycollector", "gsc", "other"])
    i.add_argument("--geo", default="UZ"); i.add_argument("--date"); i.set_defaults(fn=cmd_import)
    s = sub.add_parser("score"); s.add_argument("--client", required=True); s.set_defaults(fn=cmd_score)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
