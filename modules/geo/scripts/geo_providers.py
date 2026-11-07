"""Адаптеры провайдеров ИИ с веб-поиском. Один интерфейс: ask(question, ctx) -> dict.

Документация сверена 2026-11-06:
- Perplexity: POST https://api.perplexity.ai/v1/agent (Sonar Chat Completions закрыт 27.09.2026);
  ответ: output[] -> message.content[].text + annotations[url_citation]; usage.cost.total_cost.
- OpenAI: POST https://api.openai.com/v1/responses, tools=[{"type":"web_search"}];
  ответ: output[] -> message.content[].text + annotations[url_citation]; web_search_call — число поисков.

Цены в ESTIMATE — из страниц цен провайдеров на дату выше; проверять перед каждым пересмотром бюджета.
Ключи берутся из окружения (или .env), в логи и данные не попадают.
"""
import json
import time
import urllib.error
import urllib.request

# USD за 1M токенов и за один поисковый вызов
PRICES = {
    "openai": {"gpt-6-luna": (0.10, 0.50), "gpt-6-astra": (10.0, 50.0), "_search_call": 0.01},
    "perplexity": {"_search_call": 0.0025},
}
# Верхняя оценка одного вызова для плана (до запуска): токены и число поисков
EST_INPUT_TOKENS = 12_000
EST_OUTPUT_TOKENS = 1_500
EST_SEARCHES = 3
FALLBACK_CALL_USD = 0.15  # если модель не в таблице цен — пессимистично, с предупреждением

DEFAULTS = {"openai": "gpt-6-luna", "perplexity": "fast"}  # perplexity: effort-пресет Agent API
TIMEOUT_S = 120


class ProviderError(Exception):
    pass


class FatalProviderError(ProviderError):
    """Повторять бессмысленно: нет денег на счёте, неверный ключ, нет доступа. Прогон останавливается."""


FATAL_MARKERS = ("insufficient_quota", "credit_balance_exhausted", "billing_hard_limit_reached",
                 "invalid_api_key")


def estimate_call_usd(provider: str, api_model: str) -> tuple[float, bool]:
    """(верхняя оценка вызова, известна ли цена модели)."""
    if provider == "openai" and api_model in PRICES["openai"]:
        i, o = PRICES["openai"][api_model]
        return (EST_INPUT_TOKENS * i + EST_OUTPUT_TOKENS * o) / 1e6 + EST_SEARCHES * PRICES["openai"]["_search_call"], True
    if provider == "perplexity":
        # токены Sonar-класса ($0.25/$2.5) + поиск; стоимость сама вернётся в usage.cost
        return (EST_INPUT_TOKENS * 0.25 + EST_OUTPUT_TOKENS * 2.5) / 1e6 + EST_SEARCHES * PRICES["perplexity"]["_search_call"], True
    return FALLBACK_CALL_USD, False


def _post(url: str, key: str, body: dict, retries: int = 3) -> tuple[dict, int]:
    data = json.dumps(body).encode("utf-8")
    last = ""
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, method="POST", headers={
            "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
                return json.loads(r.read().decode("utf-8")), int((time.time() - t0) * 1000)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:300]
            last = f"HTTP {e.code}: {msg}"
            if e.code in (401, 403) or any(m in msg for m in FATAL_MARKERS):
                raise FatalProviderError(last)
            if e.code in (429, 500, 502, 503, 504) and attempt < retries:
                time.sleep(2 ** (attempt + 1))
                continue
            raise ProviderError(last)
        except (urllib.error.URLError, TimeoutError) as e:
            last = f"сеть: {e}"
            if attempt < retries:
                time.sleep(2 ** (attempt + 1))
                continue
            raise ProviderError(last)
    raise ProviderError(last)


def _extract(resp: dict) -> tuple[str, list[dict], int]:
    """Текст ответа, ссылки [{url,title}] по порядку первого упоминания, число поисков."""
    text_parts, cites, seen, searches = [], [], set(), 0
    for item in resp.get("output", []):
        t = item.get("type")
        if t == "web_search_call":
            searches += 1
        elif t == "message":
            for part in item.get("content", []):
                if part.get("type") == "output_text":
                    text_parts.append(part.get("text", ""))
                    for a in part.get("annotations", []) or []:
                        if a.get("type") == "url_citation" and a.get("url") and a["url"] not in seen:
                            seen.add(a["url"])
                            cites.append({"url": a["url"], "title": a.get("title", "")})
        elif t == "search_results":  # Perplexity: источники, даже если в тексте нет сносок
            for r in item.get("results", []) or []:
                if r.get("url") and r["url"] not in seen:
                    seen.add(r["url"])
                    cites.append({"url": r["url"], "title": r.get("title", "")})
            searches += 1
    return "\n".join(text_parts), cites, searches


def ask_perplexity(question: str, ctx: dict) -> dict:
    api_model = ctx.get("api_model") or DEFAULTS["perplexity"]
    tool = {"type": "web_search"}
    if ctx.get("country"):
        tool["user_location"] = {"country": ctx["country"]}
    body = {"input": question, "tools": [tool]}
    # пресет усилия ("fast", "low"…) или явная модель вида provider/model
    body["model" if "/" in api_model else "effort"] = api_model
    resp, ms = _post("https://api.perplexity.ai/v1/agent", ctx["key"], body)
    if resp.get("status") not in (None, "completed"):
        raise ProviderError(f"status={resp.get('status')} error={resp.get('error')}")
    text, cites, searches = _extract(resp)
    cost = ((resp.get("usage") or {}).get("cost") or {}).get("total_cost")
    return {"text": text, "citations": cites, "latency_ms": ms, "searches": searches,
            "api_model_version": resp.get("effort") or resp.get("model"),
            "cost_usd": cost if cost is not None else estimate_call_usd("perplexity", api_model)[0],
            "cost_is_actual": cost is not None, "raw": resp}


def ask_openai(question: str, ctx: dict) -> dict:
    api_model = ctx.get("api_model") or DEFAULTS["openai"]
    tool = {"type": "web_search"}
    if ctx.get("country"):
        tool["user_location"] = {"type": "approximate", "country": ctx["country"]}
        if ctx.get("city"):
            tool["user_location"]["city"] = ctx["city"]
    body = {"model": api_model, "tools": [tool], "input": question}
    resp, ms = _post("https://api.openai.com/v1/responses", ctx["key"], body)
    if resp.get("status") not in (None, "completed"):
        raise ProviderError(f"status={resp.get('status')} error={resp.get('error')}")
    text, cites, searches = _extract(resp)
    usage = resp.get("usage") or {}
    price = PRICES["openai"].get(api_model)
    if price and "input_tokens" in usage:
        cost = (usage["input_tokens"] * price[0] + usage.get("output_tokens", 0) * price[1]) / 1e6 \
               + max(searches, 1) * PRICES["openai"]["_search_call"]
        actual = True
    else:
        cost, actual = estimate_call_usd("openai", api_model)[0], False
    return {"text": text, "citations": cites, "latency_ms": ms, "searches": searches,
            "api_model_version": resp.get("model"), "cost_usd": cost, "cost_is_actual": actual, "raw": resp}


ADAPTERS = {"perplexity": ask_perplexity, "openai": ask_openai}
KEY_ENV = {"perplexity": "PERPLEXITY_API_KEY", "openai": "OPENAI_API_KEY",
           "gemini": "GEMINI_API_KEY", "claude": "ANTHROPIC_API_KEY"}
