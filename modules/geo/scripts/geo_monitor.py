"""Visibility Monitor: задаёт утверждённые вопросы моделям с веб-поиском и пишет разбор в observations.jsonl.

По умолчанию ничего не отправляет в сеть: печатает план (число вызовов, верхнюю оценку, бюджет).
Реальные вызовы — только с --execute. Бюджет (budget_usd_per_week из профиля) — жёсткий предел:
план не помещается в бюджет — скрипт не стартует; во время прогона стоп при достижении предела.

Примеры:
    python modules/geo/scripts/geo_monitor.py --client forma-3d --limit-queries 5            # план
    python modules/geo/scripts/geo_monitor.py --client forma-3d --limit-queries 5 --execute  # прогон
Ключи: PERPLEXITY_API_KEY, OPENAI_API_KEY в окружении или в .env в корне репозитория.
Код возврата: 0 — прогон/план ок, 1 — ошибки данных, 2 — не помещается в бюджет или нет ключей.
"""
import argparse
import csv
import datetime as dt
import json
import os
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geo_parse  # noqa: E402
import geo_providers as gp  # noqa: E402

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())


def load_env() -> None:
    f = ROOT / ".env"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def pick_queries(rows: list[dict], limit: int | None, priorities: set[str] | None) -> list[dict]:
    rows = [r for r in rows if r["status"] == "approved" and (not priorities or r["priority"] in priorities)]
    rows.sort(key=lambda r: (r["priority"], r["id"]))
    if not limit or limit >= len(rows):
        return rows
    # чередуем языки и интенты, чтобы маленький пробный прогон был показательным
    buckets: dict[tuple, list[dict]] = {}
    for r in rows:
        buckets.setdefault((r["lang"], r["intent"]), []).append(r)
    out: list[dict] = []
    while len(out) < limit and any(buckets.values()):
        for k in sorted(buckets):
            if buckets[k] and len(out) < limit:
                out.append(buckets[k].pop(0))
    return out


def done_keys(obs: Path, week: str) -> set[tuple]:
    keys = set()
    if obs.exists():
        for line in obs.read_text(encoding="utf-8").splitlines():
            if line.strip():
                o = json.loads(line)
                if o["week"] == week and o["status"] == "ok":
                    keys.add((o["query_id"], o["model"], o["attempt"]))
    return keys


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--client", required=True)
    ap.add_argument("--limit-queries", type=int, help="взять N вопросов (поровну по языкам и интентам)")
    ap.add_argument("--priority", help="только приоритеты, например 1,2")
    ap.add_argument("--models", help="только эти модели, например perplexity")
    ap.add_argument("--runs", type=int, help="прогонов на вопрос (по умолчанию из профиля; не больше профиля)")
    ap.add_argument("--week", help="ISO-неделя 2026-W46 (по умолчанию текущая)")
    ap.add_argument("--execute", action="store_true", help="выполнить вызовы API (без флага — только план)")
    args = ap.parse_args()

    base = ROOT / "clients" / args.client / "geo"
    profile = yaml.safe_load((base / "profile.yaml").read_text(encoding="utf-8"))
    with (base / "queries.csv").open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    prios = set(args.priority.split(",")) if args.priority else None
    queries = pick_queries(rows, args.limit_queries, prios)
    if not queries:
        print("ОШИБКА: нет утверждённых (status=approved) вопросов по заданным условиям")
        return 1

    models = [m for m in profile["models"] if m["enabled"] and m["id"] in gp.ADAPTERS
              and (not args.models or m["id"] in args.models.split(","))]
    skipped = [m["id"] for m in profile["models"] if m["enabled"] and m["id"] not in gp.ADAPTERS]
    if skipped:
        print(f"предупреждение: адаптеров пока нет для {skipped} — пропущены")
    if not models:
        print("ОШИБКА: нет включённых моделей с адаптером")
        return 1
    runs = min(args.runs or profile["runs_per_query"], profile["runs_per_query"])
    week = args.week or "{}-W{:02d}".format(*dt.date.today().isocalendar()[:2])
    budget = float(profile["budget_usd_per_week"])

    # ── план и верхняя оценка ──
    plan_total, unknown = 0.0, []
    calls = len(queries) * runs
    print(f"Клиент {args.client}, неделя {week}")
    print(f"Вопросов: {len(queries)}, прогонов на вопрос: {runs}, вызовов на модель: {calls}")
    for m in models:
        api_model = m.get("api_model") or gp.DEFAULTS[m["id"]]
        per, known = gp.estimate_call_usd(m["id"], api_model)
        if not known:
            unknown.append(f"{m['id']}/{api_model}")
        sub = per * calls
        plan_total += sub
        print(f"  {m['id']:<11} {api_model:<12} ≤ ${per:.4f}/вызов × {calls} = ≤ ${sub:.2f}")
    print(f"Верхняя оценка: ${plan_total:.2f}; бюджет недели: ${budget:.2f}")
    if unknown:
        print(f"предупреждение: цена модели не в таблице ({unknown}) — взята пессимистичная оценка")
    if plan_total > budget:
        print("ОШИБКА: план не помещается в бюджет. Сузьте: --limit-queries, --priority 1, --runs, --models")
        return 2
    if not args.execute:
        print("Это план. Для реальных вызовов добавьте --execute.")
        return 0

    load_env()
    keys = {m["id"]: os.environ.get(gp.KEY_ENV[m["id"]], "") for m in models}
    missing = [gp.KEY_ENV[k] for k, v in keys.items() if not v]
    if missing:
        print(f"предупреждение: нет ключей в окружении или .env: {missing} — эти модели пропущены")
        models = [m for m in models if keys[m["id"]]]
        if not models:
            print("ОШИБКА: ни для одной модели нет ключа")
            return 2

    # ── прогон ──
    obs = base / "observations.jsonl"
    raw_dir = base / "runs" / week
    raw_dir.mkdir(parents=True, exist_ok=True)
    skip = done_keys(obs, week)
    spent, n_ok, n_err, n_mention, stopped = 0.0, 0, 0, 0, False
    dead: dict[str, str] = {}  # модель -> причина остановки (нет денег, неверный ключ)
    for q in queries:
        for m in models:
            if m["id"] in dead:
                continue
            ctx = {"key": keys[m["id"]], "api_model": m.get("api_model"), "country": profile.get("country"),
                   "city": None}
            for attempt in range(1, runs + 1):
                if (q["id"], m["id"], attempt) in skip:
                    continue
                if spent >= budget:
                    stopped = True
                    break
                row = {"week": week, "query_id": q["id"], "model": m["id"], "attempt": attempt,
                       "lang": q["lang"], "intent": q["intent"],
                       "ts": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")}
                try:
                    r = gp.ADAPTERS[m["id"]](q["text"], ctx)
                    spent += r["cost_usd"]
                    if not r["text"].strip():
                        row.update(status="empty", error="пустой ответ")
                    else:
                        row.update(status="ok", **geo_parse.parse_answer(r["text"], r["citations"], profile))
                    row.update(api_model_version=r["api_model_version"], latency_ms=r["latency_ms"],
                               searches=r["searches"], cost_usd=round(r["cost_usd"], 5),
                               cost_is_actual=r["cost_is_actual"])
                    (raw_dir / f"{m['id']}__{q['id']}__{attempt}.json").write_text(
                        json.dumps({"question": q["text"], "text": r["text"], "response": r["raw"]},
                                   ensure_ascii=False), encoding="utf-8")
                except gp.FatalProviderError as e:  # нет денег / неверный ключ: не ответ модели, в данные не пишем
                    dead[m["id"]] = str(e)[:300]
                    break
                except gp.ProviderError as e:
                    row.update(status="error", error=str(e)[:300])
                except Exception as e:  # не молча: ошибка уходит в данные
                    row.update(status="error", error=f"{type(e).__name__}: {e}"[:300])
                with obs.open("a", encoding="utf-8") as f:
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")
                if row["status"] == "ok":
                    n_ok += 1
                    n_mention += 1 if row["client_mentioned"] else 0
                else:
                    n_err += 1
                    print(f"  {m['id']} {q['id']}#{attempt}: {row['status']} — {row.get('error')}")
            if stopped:
                break
        if stopped:
            break
    print(f"Готово: ok {n_ok}, ошибок/пустых {n_err}, клиент назван в {n_mention} ответах; потрачено ≈ ${spent:.3f}")
    for mid, why in dead.items():
        print(f"Модель {mid} отключена до конца прогона: {why}")
    if dead and not n_ok:
        return 2
    if stopped:
        print(f"Остановлено: достигнут бюджет ${budget:.2f}. Недосчитанное — повторный запуск продолжит с места остановки.")
    return 0 if n_ok or not n_err else 1


if __name__ == "__main__":
    sys.exit(main())
