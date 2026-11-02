"""Простой SEO-краулер: обходит сайт в пределах домена и собирает on-page данные.

Пример:
    python core/scripts/crawl.py https://example.uz --max-pages 500 --out clients/x/seo/data/crawl-2026-10-28.json
"""
import argparse
import json
import sys
import time
from collections import Counter, deque
from urllib.parse import urldefrag, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

UA = "Mozilla/5.0 (compatible; SEOAgentsCrawler/1.0)"
SKIP_EXT = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf", ".zip",
            ".mp4", ".mp3", ".css", ".js", ".ico", ".xml", ".doc", ".docx", ".xls", ".xlsx")


def norm(url):
    url, _ = urldefrag(url)
    return url.rstrip("/") or url


def same_site(url, host):
    h = urlparse(url).netloc.lower()
    return h == host or h == "www." + host or "www." + h == host


def parse_page(url, resp):
    soup = BeautifulSoup(resp.text, "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else ""
    desc_tag = soup.find("meta", attrs={"name": "description"})
    robots_tag = soup.find("meta", attrs={"name": "robots"})
    canon = soup.find("link", rel="canonical")
    h1 = [h.get_text(" ", strip=True) for h in soup.find_all("h1")]
    imgs = soup.find_all("img")
    hreflang = [l.get("hreflang") for l in soup.find_all("link", rel="alternate") if l.get("hreflang")]
    schema_types = []
    for s in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(s.string or "")
            items = data if isinstance(data, list) else data.get("@graph", [data])
            schema_types += [i.get("@type") for i in items if isinstance(i, dict) and i.get("@type")]
        except Exception:
            pass
    for t in soup(["script", "style", "noscript"]):
        t.decompose()
    words = len(soup.get_text(" ", strip=True).split())
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        links.append(norm(urljoin(url, href)))
    return {
        "title": title,
        "title_len": len(title),
        "meta_description": desc_tag.get("content", "").strip() if desc_tag else "",
        "meta_robots": robots_tag.get("content", "") if robots_tag else "",
        "canonical": canon.get("href", "") if canon else "",
        "h1": h1,
        "word_count": words,
        "images": len(imgs),
        "images_no_alt": [i.get("src", "") for i in imgs if not (i.get("alt") or "").strip()],
        "hreflang": hreflang,
        "schema_types": schema_types,
        "internal_links_out": 0,
    }, links


def crawl(start, max_pages, delay):
    host = urlparse(start).netloc.lower().removeprefix("www.")
    session = requests.Session()
    session.headers["User-Agent"] = UA
    queue, seen, pages = deque([norm(start)]), {norm(start)}, []
    inlinks = Counter()

    while queue and len(pages) < max_pages:
        url = queue.popleft()
        rec = {"url": url}
        try:
            resp = session.get(url, timeout=20, allow_redirects=True)
            rec["status"] = resp.status_code
            rec["redirects"] = [r.url for r in resp.history]
            rec["final_url"] = resp.url
            rec["response_ms"] = int(resp.elapsed.total_seconds() * 1000)
            if resp.ok and "text/html" in resp.headers.get("Content-Type", ""):
                data, links = parse_page(resp.url, resp)
                internal = [l for l in links if same_site(l, host)]
                data["internal_links_out"] = len(set(internal))
                rec.update(data)
                for l in set(internal):
                    inlinks[l] += 1
                    if l not in seen and not l.lower().endswith(SKIP_EXT):
                        seen.add(l)
                        queue.append(l)
        except requests.RequestException as e:
            rec["status"] = None
            rec["error"] = str(e)[:200]
        pages.append(rec)
        print(f"[{len(pages)}] {rec.get('status')} {url}", file=sys.stderr)
        time.sleep(delay)

    for p in pages:
        p["internal_links_in"] = inlinks.get(p["url"], 0)

    ok = [p for p in pages if p.get("status") == 200 and "title" in p]
    titles = Counter(p["title"] for p in ok if p["title"])
    descs = Counter(p["meta_description"] for p in ok if p["meta_description"])
    summary = {
        "pages_crawled": len(pages),
        "status_4xx_5xx": [p["url"] for p in pages if (p.get("status") or 0) >= 400],
        "errors": [p["url"] for p in pages if p.get("status") is None],
        "redirected": [p["url"] for p in pages if p.get("redirects")],
        "missing_title": [p["url"] for p in ok if not p["title"]],
        "long_title": [p["url"] for p in ok if p["title_len"] > 60],
        "duplicate_titles": {t: [p["url"] for p in ok if p["title"] == t] for t, c in titles.items() if c > 1},
        "missing_description": [p["url"] for p in ok if not p["meta_description"]],
        "long_description": [p["url"] for p in ok if len(p["meta_description"]) > 160],
        "duplicate_descriptions": {d: [p["url"] for p in ok if p["meta_description"] == d] for d, c in descs.items() if c > 1},
        "no_h1": [p["url"] for p in ok if not p["h1"]],
        "multiple_h1": [p["url"] for p in ok if len(p["h1"]) > 1],
        "thin_pages_lt250": [p["url"] for p in ok if p["word_count"] < 250],
        "noindex": [p["url"] for p in ok if "noindex" in p["meta_robots"].lower()],
        "images_without_alt_total": sum(len(p["images_no_alt"]) for p in ok),
        "orphan_like_pages": [p["url"] for p in ok if p["internal_links_in"] == 0 and p["url"] != norm(start)],
        "pages_with_schema": sum(1 for p in ok if p["schema_types"]),
        "pages_with_hreflang": sum(1 for p in ok if p["hreflang"]),
        "queue_left_unvisited": len(queue),
    }
    return {"start": start, "crawled_at": time.strftime("%Y-%m-%d %H:%M"), "summary": summary, "pages": pages}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("start")
    ap.add_argument("--max-pages", type=int, default=500)
    ap.add_argument("--delay", type=float, default=0.3, help="пауза между запросами, сек")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    result = crawl(a.start, a.max_pages, a.delay)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    s = result["summary"]
    print(json.dumps({k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in s.items()}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
