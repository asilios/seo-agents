"""Проверка, что пути, на которые ссылаются правила, агенты, команды и циклы, существуют.

Берёт пути в `обратных кавычках` из CLAUDE.md, core/, modules/*/ и .claude/{agents,commands}/,
подставляет клиента (по умолчанию forma-3d) и проверяет, что файл или папка есть.
Пути с шаблонами (<date>, YYYY-MM-DD, *, ...) проверяются до первой шаблонной части.

Пример:
    python core/scripts/check_paths.py --client forma-3d
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())
SOURCES = ["CLAUDE.md", "core/**/*.md", "modules/**/*.md", ".claude/agents/*.md", ".claude/commands/*.md"]
# Пути, которые проверяем: начинаются с известных корней репозитория или с подпапок клиента.
REPO_ROOTS = ("core/", "modules/", "clients/", ".claude/", "docs/")
CLIENT_RELATIVE = ("seo/", "geo/", "data/", "audits/", "keywords/", "changes/", "content/", "reports/")
TEMPLATE_PART = re.compile(r"<[^>]+>|YYYY|\*|\.\.\.|…|\{")


def check(client: str) -> list[str]:
    problems = []
    files = sorted({f for pat in SOURCES for f in ROOT.glob(pat)})
    for f in files:
        for raw in re.findall(r"`([^`\s]+)`", f.read_text(encoding="utf-8")):
            path = raw.replace("$ARGUMENTS", client).replace("<client>", client)
            if path.startswith(REPO_ROOTS):
                base = ROOT
            elif path.startswith(CLIENT_RELATIVE):
                base = ROOT / "clients" / client / ("" if path.startswith(("seo/", "geo/", "reports/")) else "seo")
            else:
                continue
            parts = []
            for part in path.split("/"):
                if TEMPLATE_PART.search(part):
                    break
                parts.append(part)
            target = base.joinpath(*[p for p in parts if p])
            if parts and not target.exists():
                problems.append(f"{f.relative_to(ROOT)}: `{raw}` → нет {target.relative_to(ROOT)}")
    return problems


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--client", default="forma-3d")
    args = ap.parse_args()
    found = check(args.client)
    print("\n".join(found) if found else "Все пути на месте.")
    sys.exit(1 if found else 0)
