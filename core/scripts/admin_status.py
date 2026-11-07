"""Что нужно ввести перед началом работы и какие действия ждут админа / владельца.

Читает:
  core/setup/requirements.yaml            — требования (схема core/schemas/requirements.schema.json)
  core/setup/status.yaml                  — отметки админа по системным требованиям
  clients/<client>/admin/setup.yaml       — отметки по требованиям клиента
  clients/<client>/admin/tasks.yaml       — очередь действий (схема core/schemas/admin-tasks.schema.json)

Примеры:
    python core/scripts/admin_status.py                      # система + все клиенты
    python core/scripts/admin_status.py --client forma-3d
    python core/scripts/admin_status.py --json               # то же для интерфейса
    python core/scripts/admin_status.py task forma-3d 2026-11-07-openai-balance --status done --answer "пополнил $20"

Ключи проверяются только на наличие (переменная окружения или .env); значения не печатаются никогда.
Код возврата: 0 — ок, 1 — ошибки в данных (схема), 2 — не найден клиент или задача.
"""
import argparse
import csv
import datetime as dt
import json
import os
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())
SCHEMAS = ROOT / "core" / "schemas"
ICON = {"done": "✅", "partial": "⚠️ ", "missing": "❌", "not_needed": "➖"}
LABEL = {"done": "готово", "partial": "частично", "missing": "нет", "not_needed": "не нужно"}


def load_yaml(path: Path, default):
    if not path.exists():
        return default
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    # YAML читает 2026-11-07 как дату — приводим к строкам, как в схемах и в интерфейсе
    return default if data is None else json.loads(json.dumps(data, default=str, ensure_ascii=False))


def validate(data, schema_name: str, where: str) -> list[str]:
    schema = json.loads((SCHEMAS / schema_name).read_text(encoding="utf-8"))
    return [f"{where}: {'/'.join(map(str, e.path)) or '(корень)'}: {e.message}"
            for e in Draft202012Validator(schema).iter_errors(data)]


def env_values() -> dict:
    vals = {}
    f = ROOT / ".env"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                vals[k.strip()] = v.strip().strip('"').strip("'")
    vals.update({k: v for k, v in os.environ.items() if v})
    return vals


def clients() -> list[str]:
    return sorted(p.name for p in (ROOT / "clients").iterdir() if p.is_dir() and not p.name.startswith("_"))


def auto_check(check: str, client: str | None, env: dict) -> bool | None:
    """True/False — результат автопроверки; None — автопроверки нет (manual)."""
    kind, _, arg = check.partition(":")
    if kind == "manual":
        return None
    if kind == "secret":
        val = env.get(arg, "")
        if val.endswith(".json"):  # путь к файлу ключа — проверяем, что файл есть
            return (ROOT / val).exists() or Path(val).exists()
        return bool(val)
    base = ROOT / "clients" / client
    if kind == "field":
        node = load_yaml(base / "client.yaml", {})
        for part in arg.split("."):
            node = node.get(part) if isinstance(node, dict) else None
        return bool(node)
    if kind == "file":
        return (base / arg).exists()
    if kind == "count":
        path, cond = arg.split(":")
        (col, val), need = cond.split(">=")[0].split("="), int(cond.split(">=")[1])
        f = base / path
        if not f.exists():
            return False
        with f.open(encoding="utf-8", newline="") as fh:
            return sum(1 for r in csv.DictReader(fh) if r.get(col) == val) >= need
    raise ValueError(f"неизвестная проверка: {check}")


def resolve(req: dict, marks: dict, client: str | None, env: dict) -> dict:
    auto = auto_check(req["check"], client, env)
    mark = marks.get(req["id"])
    if auto:
        status, source = "done", "auto"
    elif mark:
        status, source = mark["status"], "admin"
    else:
        status, source = "missing", "auto" if auto is False else "admin"
    return {**req, "status": status, "status_source": source,
            "note": (mark or {}).get("note"), "updated": str((mark or {}).get("updated") or "") or None}


def collect(only_client: str | None) -> tuple[dict, list[str]]:
    errors = []
    reqs = load_yaml(ROOT / "core/setup/requirements.yaml", [])
    errors += validate(reqs, "requirements.schema.json", "core/setup/requirements.yaml")
    sys_marks = load_yaml(ROOT / "core/setup/status.yaml", {})
    errors += validate(sys_marks, "setup-status.schema.json", "core/setup/status.yaml")
    env = env_values()
    out = {"generated": dt.datetime.now().isoformat(timespec="seconds"),
           "system": [resolve(r, sys_marks, None, env) for r in reqs if r["scope"] == "system"],
           "clients": {}}
    for c in ([only_client] if only_client else clients()):
        base = ROOT / "clients" / c
        if not base.is_dir():
            raise SystemExit(f"ОШИБКА: нет клиента {c}")
        marks = load_yaml(base / "admin/setup.yaml", {})
        tasks = load_yaml(base / "admin/tasks.yaml", [])
        errors += validate(marks, "setup-status.schema.json", f"clients/{c}/admin/setup.yaml")
        errors += validate(tasks, "admin-tasks.schema.json", f"clients/{c}/admin/tasks.yaml")
        ids = [t["id"] for t in tasks if isinstance(t, dict) and "id" in t]
        errors += [f"clients/{c}/admin/tasks.yaml: повтор id {i}" for i in {i for i in ids if ids.count(i) > 1}]
        out["clients"][c] = {
            "requirements": [resolve(r, marks, c, env) for r in reqs if r["scope"] == "client"],
            "tasks": sorted(tasks, key=lambda t: (t.get("status") != "open", t.get("priority", 9), t.get("created", ""))),
        }
    # yaml даёт date-объекты — для JSON в строки
    return json.loads(json.dumps(out, default=str, ensure_ascii=False)), errors


def print_reqs(title: str, reqs: list[dict]) -> None:
    ready = sum(r["status"] in ("done", "not_needed") for r in reqs)
    print(f"\n{title} — готово {ready} из {len(reqs)}")
    for r in sorted(reqs, key=lambda r: (r["status"] in ("done", "not_needed"), not r["required"])):
        must = " · обязательно" if r["required"] and r["status"] not in ("done", "not_needed") else ""
        who = " · владелец" if r.get("who") == "owner" else ""
        print(f"  {ICON[r['status']]} {r['title']}{must}{who}")
        if r["status"] not in ("done", "not_needed"):
            print(f"       даст: {r['unlocks']}")
        if r.get("note"):
            print(f"       {r['note']}")


def print_tasks(tasks: list[dict]) -> None:
    open_ = [t for t in tasks if t["status"] == "open"]
    print(f"\n  Действия — открыто {len(open_)}, сделано {sum(t['status'] == 'done' for t in tasks)}")
    for who, name in (("admin", "админ"), ("owner", "владелец сайта")):
        part = [t for t in open_ if t["who"] == who]
        if part:
            print(f"   {name}:")
            for t in part:
                print(f"    [{t['priority']}] {t['title']}  ({t['id']})")
                if t.get("blocks"):
                    print(f"        блокирует: {', '.join(t['blocks'])}")


def set_task(client: str, task_id: str, status: str, answer: str | None) -> int:
    f = ROOT / "clients" / client / "admin" / "tasks.yaml"
    tasks = load_yaml(f, [])
    for t in tasks:
        if t["id"] == task_id:
            t["status"] = status
            t["done_at"] = dt.date.today().isoformat() if status != "open" else None
            if answer is not None:
                t["answer"] = answer
            break
    else:
        print(f"ОШИБКА: задачи {task_id} у клиента {client} нет")
        return 2
    tasks = json.loads(json.dumps(tasks, default=str))  # даты → строки, чтобы yaml не писал !!date
    errors = validate(tasks, "admin-tasks.schema.json", str(f.relative_to(ROOT)))
    if errors:
        print("\n".join(errors))
        return 1
    f.write_text(yaml.safe_dump(tasks, allow_unicode=True, sort_keys=False, width=120), encoding="utf-8")
    log = ROOT / "clients" / client / "admin" / "log.md"
    with log.open("a", encoding="utf-8") as fh:
        fh.write(f"{dt.date.today()} | admin_status | задача {task_id} → {status}"
                 f"{' — ' + answer if answer else ''} | admin/tasks.yaml\n")
    print(f"{task_id} → {status}")
    return 0


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    argv = sys.argv[1:]
    if argv and argv[0] == "task":
        ap = argparse.ArgumentParser(prog="admin_status.py task")
        ap.add_argument("client")
        ap.add_argument("task_id")
        ap.add_argument("--status", required=True, choices=["open", "done", "skipped"])
        ap.add_argument("--answer")
        a = ap.parse_args(argv[1:])
        return set_task(a.client, a.task_id, a.status, a.answer)

    ap = argparse.ArgumentParser()
    ap.add_argument("--client")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    data, errors = collect(a.client)
    if a.json:
        print(json.dumps({**data, "errors": errors}, ensure_ascii=False, indent=1))
        return 1 if errors else 0
    if errors:
        print("ОШИБКИ В ДАННЫХ:\n  " + "\n  ".join(errors))
    print_reqs("Система", data["system"])
    for c, d in data["clients"].items():
        print_reqs(f"Клиент {c}", d["requirements"])
        print_tasks(d["tasks"])
    print("\nКлючи проверяются по окружению и .env этого компьютера; ⚠️/➖ — отметки админа.")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
