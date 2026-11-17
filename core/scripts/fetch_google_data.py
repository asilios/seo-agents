"""Выгрузка данных Google по всем клиентам: Search Console (28 дней) и PageSpeed (key_urls).

Нужен там, где у облачной задачи Claude нет ключей: запускается в GitHub Actions с секретами
репозитория (.github/workflows/seo-google-data.yml), результат коммитится в clients/<client>/seo/data/.
Локально работает так же, ключи берутся из .env.

    python core/scripts/fetch_google_data.py            # все клиенты (папки на «_» пропускаются)
    python core/scripts/fetch_google_data.py --client forma-3d

Без ключа шаг пропускается с сообщением, остальные шаги идут дальше. Код выхода 1 — если хоть один
шаг с ключом упал (чтобы в Actions было видно ошибку).
"""
import argparse
import datetime as dt
import os
import subprocess
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "CLAUDE.md").exists() and (p / "clients").is_dir())
load_dotenv(ROOT / ".env")
PY = sys.executable


def run(cmd):
    print("$", " ".join(str(c) for c in cmd), flush=True)
    return subprocess.run(cmd, cwd=ROOT).returncode == 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--client")
    ap.add_argument("--days", type=int, default=28)
    a = ap.parse_args()
    today = dt.date.today().isoformat()
    clients = [a.client] if a.client else sorted(
        p.name for p in (ROOT / "clients").iterdir() if p.is_dir() and not p.name.startswith("_"))
    gsc_key = os.getenv("GSC_CREDENTIALS")
    gsc_ok = bool(gsc_key) and (ROOT / gsc_key).exists()
    psi_ok = bool(os.getenv("PSI_API_KEY"))
    failed = []
    for c in clients:
        cfg = yaml.safe_load((ROOT / "clients" / c / "client.yaml").read_text(encoding="utf-8")) or {}
        data = ROOT / "clients" / c / "seo" / "data"
        data.mkdir(parents=True, exist_ok=True)
        print(f"\n=== {c} ===")
        site = cfg.get("gsc_site")
        if not site:
            print("GSC: в client.yaml нет gsc_site — пропуск")
        elif not gsc_ok:
            print("GSC: нет ключа (GSC_CREDENTIALS) — пропуск")
        else:
            out = data / f"gsc-{today}.csv"
            if run([PY, "core/scripts/gsc.py", "--site", site, "--days", str(a.days), "--out", out]):
                run([PY, "modules/seo/scripts/keyword_volumes.py", "gsc", "--client", c, "--file", out])
            else:
                failed.append(f"{c}: gsc")
        urls = cfg.get("key_urls") or []
        if not urls:
            print("PageSpeed: в client.yaml нет key_urls — пропуск")
        elif not psi_ok:
            print("PageSpeed: нет ключа (PSI_API_KEY) — пропуск")
        elif not run([PY, "modules/seo/scripts/pagespeed.py", *urls, "--out", data / f"psi-{today}.json"]):
            failed.append(f"{c}: pagespeed")
    if failed:
        print("\nОшибки:", ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
