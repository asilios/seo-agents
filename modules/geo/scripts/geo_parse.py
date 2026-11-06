"""Разбор ответа ИИ: кто назван (клиент, конкуренты) и на какие домены сослались.

Без сети и без LLM — только строки. Названных компаний вне профиля этот разбор не находит
(это задача Фазы 3: дешёвая модель по схеме JSON). Версия разбора пишется в каждую строку данных.
"""
import re
from urllib.parse import urlparse

PARSER_VERSION = 1
SNIPPET_LEN = 300


def domain_of(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.casefold().replace("ё", "е")).strip()


def _name_pattern(name: str) -> re.Pattern:
    # граница слова: перед и после имени не должно быть буквы или цифры
    return re.compile(r"(?<![\w])" + re.escape(_norm(name)) + r"(?![\w])")


def _brands(profile: dict) -> list[dict]:
    b = profile["brand"]
    out = [{"name": b["name"], "kind": "client", "domain": b["domain"],
            "names": [b["name"], *b.get("aliases", [])]}]
    for c in profile.get("competitors", []):
        out.append({"name": c["name"], "kind": "competitor", "domain": c["domain"],
                    "names": [c["name"], *c.get("aliases", [])]})
    return out


def domain_matches(cited: str, brand_domain: str) -> bool:
    return cited == brand_domain or cited.endswith("." + brand_domain)


def parse_answer(text: str, citations: list[dict], profile: dict) -> dict:
    """citations: [{url, title}] в порядке ранга. Возвращает поля для строки observations.jsonl."""
    norm = _norm(text or "")
    cites = []
    for i, c in enumerate(citations, start=1):
        if c.get("url"):
            cites.append({"url": c["url"], "domain": domain_of(c["url"]), "rank": i, "title": c.get("title") or ""})

    found = []  # (first_text_index | None, citation_rank | None, brand, match_type)
    for b in _brands(profile):
        idx = None
        for n in b["names"]:
            if not n:
                continue
            m = _name_pattern(n).search(norm)
            if m and (idx is None or m.start() < idx):
                idx = m.start()
        # домен в тексте тоже считается упоминанием текстом
        d = _norm(b["domain"])
        if d in norm:
            j = norm.index(d)
            idx = j if idx is None else min(idx, j)
        rank = next((c["rank"] for c in cites if domain_matches(c["domain"], b["domain"])), None)
        if idx is not None or rank is not None:
            mt = "both" if idx is not None and rank is not None else ("text" if idx is not None else "domain_cited")
            found.append((idx, rank, b, mt))

    # порядок: сначала названные в тексте (по месту), затем только процитированные (по рангу ссылки)
    found.sort(key=lambda f: (f[0] is None, f[0] if f[0] is not None else 0, f[1] or 0))
    mentions = [{"brand": f[2]["name"], "kind": f[2]["kind"], "position": i, "match_type": f[3]}
                for i, f in enumerate(found, start=1)]
    client = next((m for m in mentions if m["kind"] == "client"), None)
    return {
        "client_mentioned": bool(client),
        "client_match": client["match_type"] if client else None,
        "mentions": mentions,
        "citations": cites,
        # домен клиента только в ссылках, а в тексте не назван — стоит посмотреть глазами
        "needs_review": bool(client and client["match_type"] == "domain_cited"),
        "snippet": (text or "").strip().replace("\n", " ")[:SNIPPET_LEN],
        "parser_version": PARSER_VERSION,
    }
