"""Офлайн-тест разбора ответов: python modules/geo/scripts/test_geo_parse.py"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo_parse import parse_answer, domain_of

P = {"brand": {"name": "Acme Shop", "domain": "acme.example", "aliases": ["Акме", "AcmeShop"]},
     "competitors": [{"name": "Rival", "domain": "rival.example", "aliases": ["Ривал"]}]}

def t(name, cond):
    print(("ok   " if cond else "FAIL ") + name)
    return cond

r1 = parse_answer("Лучше всего Ривал, а также Acme Shop предлагает доставку.", [], P)
r2 = parse_answer("Смотрите каталог.", [{"url": "https://www.rival.example/x"}, {"url": "https://shop.acme.example/p"}], P)
r3 = parse_answer("Ничего не найдено про Acmeshops и rivalry.", [], P)
r4 = parse_answer("Сайт acme.example работает.", [], P)
ok = all([
    t("порядок: конкурент раньше клиента", [m["brand"] for m in r1["mentions"]] == ["Rival", "Acme Shop"]),
    t("клиент назван текстом", r1["client_mentioned"] and r1["client_match"] == "text"),
    t("только домены в ссылках", r2["client_match"] == "domain_cited" and r2["needs_review"]),
    t("поддомен засчитан, www снят", domain_of("https://www.rival.example/x") == "rival.example"
      and r2["mentions"][0]["brand"] == "Rival"),
    t("ложные совпадения по подстроке не считаются", not r3["mentions"]),
    t("домен клиента в тексте", r4["client_mentioned"]),
])
sys.exit(0 if ok else 1)
