#!/usr/bin/env python3
"""
ProjectB59 Vault Scraper: Extropy-Chat Archive
===============================================
Downloads, filters, and archives the extropy-chat mailing list,
preserving messages by Hal Finney and other cypherpunks and early
digital-cash pioneers for permanent offline storage.

Usage:
    pip install requests beautifulsoup4 lxml
    python vault_scraper.py

Output:
    vault_data/
        index.json          full message index
        authors.json        author profiles and message counts
        messages/           one .json per message
        html/               mirrored original HTML pages
"""

import json
import time
import re
import argparse
from collections import Counter
from datetime import datetime
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup, Comment
except ImportError:
    print("Install deps first:  pip install requests beautifulsoup4 lxml")
    raise

# ──────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────

BASE_URL = "https://lists.extropy.org/pipermail/extropy-chat/"

# People we definitely want to capture. Match is case-insensitive substring.
PRIORITY_AUTHORS = [
    # Core cypherpunks
    "hal finney", "finney",
    "nick szabo", "szabo",
    "wei dai",
    "adam back",
    "tim may", "tcmay",
    "eric hughes",
    "john gilmore",
    "whitfield diffie",
    "ralph merkle",
    "phil zimmermann", "zimmerman",
    "cypherpunk",
    "zooko",
    # Extropy / transhumanist orbit (overlap with cypherpunks)
    "max more", "maxmore",
    "phil salin", "salin",
    "robin hanson",
    "eliezer yudkowsky", "yudkowsky",
    "anders sandberg",
    "david friedman",
    "eugene leitl",
    "spike jones",
    # Digital cash / bitcoin adjacency
    "satoshi",
    "len sassaman",
    "ian grigg",
    "b-money",
    "e-gold",
    "digicash",
    "chaum",
    "cryptography",
]

OUTPUT_DIR = Path("vault_data")
MESSAGES_DIR = OUTPUT_DIR / "messages"
HTML_DIR = OUTPUT_DIR / "html"
DELAY = 0.5          # seconds between requests, be polite
MAX_RETRIES = 3

_MONTH_NUM = {
    name: i
    for i, name in enumerate(
        [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ],
        1,
    )
}
_MONTH_LINK = re.compile(
    r"^(?:(?:\./|\.\./)*)?(\d{4}-[A-Za-z]+)(?:/(?:author|thread|subject|date|index)\.html|/?)?$",
    re.I,
)
_ARTICLE_HREF = re.compile(r"^(?:(?:\./|\.\./)*)?(\d+)\.html$")
_DATE_HINT = re.compile(
    r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b|\b\d{4}\b",
    re.I,
)


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

session = requests.Session()
session.headers.update({
    "User-Agent": "ProjectB59-Vault-Archiver/1.0 (preservation project; contact via github.com/ProjectB59)"
})


def fetch(url: str, retries=MAX_RETRIES) -> str | None:
    for attempt in range(retries):
        try:
            r = session.get(url, timeout=30)
            r.raise_for_status()
            time.sleep(DELAY)
            return r.text
        except Exception as e:
            if attempt == retries - 1:
                print(f"  x Failed to fetch {url}: {e}")
                return None
            time.sleep(DELAY * (attempt + 1))
    return None


def is_priority(author_name: str, subject: str = "") -> bool:
    text = (author_name + " " + subject).lower()
    return any(kw in text for kw in PRIORITY_AUTHORS)


def month_sort_key(label: str) -> tuple:
    year, _, name = label.partition("-")
    try:
        year_n = int(year)
    except ValueError:
        year_n = 0
    return (year_n, _MONTH_NUM.get(name, 0), label)


def clean_text(value: str) -> str:
    return " ".join((value or "").split())


def date_sort_key(value: str) -> tuple:
    """Sort pipermail dates like 'Fri Nov 13 07:07:23 UTC 2026' in time order."""
    text = value or ""
    try:
        return (0, parsedate_to_datetime(text))
    except (TypeError, ValueError, IndexError, OverflowError):
        return (1, text)


def norm_msgid(value: str) -> str:
    """Return a message id without surrounding brackets."""
    if not value:
        return ""
    text = unescape(unquote(value)).strip()
    match = re.search(r"<([^<>]+)>", text)
    if match:
        return match.group(1).strip()
    return text.strip("<>").strip()


def mailto_params(href: str) -> dict:
    """Parse a mailto query without turning '+' into a space."""
    query = urlparse(href).query
    params = {}
    for part in query.split("&"):
        if not part or "=" not in part:
            continue
        key, val = part.split("=", 1)
        params[unquote(key)] = unquote(val)
    return params


def article_from_href(href: str) -> str | None:
    href = (href or "").split("#", 1)[0].strip()
    name = href.rsplit("/", 1)[-1]
    match = _ARTICLE_HREF.fullmatch(name)
    if not match:
        return None
    return match.group(1)


# ──────────────────────────────────────────────
# STEP 1: Discover all monthly archive URLs
# ──────────────────────────────────────────────

def discover_months() -> list[dict]:
    """Return {label, url, author_index, thread_index} for every month."""
    print("Discovering archive months ...")
    html = fetch(BASE_URL)
    if not html:
        raise RuntimeError("Cannot reach archive index")

    soup = BeautifulSoup(html, "lxml")
    labels = []
    seen = set()
    for tag in soup.find_all("a", href=True):
        href = tag["href"].strip()
        # Live pipermail links look like "2024-January/author.html".
        # Older indexes sometimes link the month directory itself.
        match = _MONTH_LINK.match(href)
        if not match:
            continue
        label = match.group(1)
        if label in seen:
            continue
        seen.add(label)
        labels.append(label)

    labels.sort(key=month_sort_key)
    months = []
    for label in labels:
        months.append({
            "label": label,
            "url": urljoin(BASE_URL, label + "/"),
            "author_index": urljoin(BASE_URL, label + "/author.html"),
            "thread_index": urljoin(BASE_URL, label + "/thread.html"),
        })

    print(f"  Found {len(months)} months")
    return months


# ──────────────────────────────────────────────
# STEP 2: Parse author index and thread index
# ──────────────────────────────────────────────

def parse_author_index(month: dict) -> list[dict]:
    """Return message stubs from one month's author index."""
    html = fetch(month["author_index"])
    if not html:
        return []
    return parse_author_index_html(html, month)


def parse_author_index_html(html: str, month: dict) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    messages = []
    seen = set()

    for tag in soup.find_all("a", href=True):
        article = article_from_href(tag.get("href", ""))
        if not article or article in seen:
            continue
        seen.add(article)
        subject = clean_text(tag.get_text(" ", strip=True))
        author = _author_after_link(tag)
        messages.append({
            "article": article,
            "author": author,
            "subject": subject,
            "url": urljoin(month["author_index"], article + ".html"),
            "month": month["label"],
            "priority": is_priority(author, subject),
        })

    if messages:
        return messages

    # Older pipermail author indexes put the name in <b>, then subject links.
    return _parse_legacy_author_index(soup, month)


def _author_after_link(tag) -> str:
    """Author is the italic name after the subject link, before the next message."""
    for el in tag.next_elements:
        name = getattr(el, "name", None)
        if name == "a" and article_from_href(el.get("href", "")):
            return ""
        if name == "i":
            return clean_text(el.get_text(" ", strip=True))
    return ""


def _parse_legacy_author_index(soup, month: dict) -> list[dict]:
    messages = []
    seen = set()
    current_author = None
    for tag in soup.find_all(["b", "a"]):
        if tag.name == "b":
            text = clean_text(tag.get_text(" ", strip=True))
            if text and "sorted by" not in text.lower():
                current_author = text
            continue
        if not current_author:
            continue
        href = tag.get("href", "")
        article = article_from_href(href)
        if not article or article in seen:
            continue
        if href.startswith("http"):
            continue
        seen.add(article)
        subject = clean_text(tag.get_text(" ", strip=True))
        messages.append({
            "article": article,
            "author": current_author,
            "subject": subject,
            "url": urljoin(month["author_index"], article + ".html"),
            "month": month["label"],
            "priority": is_priority(current_author, subject),
        })
    return messages


def parse_thread_index(month: dict) -> dict[str, str]:
    """Map pipermail article number to its parent article number."""
    html = fetch(month["thread_index"])
    if not html:
        return {}
    return parse_thread_parents(html)


def parse_thread_parents(html: str) -> dict[str, str]:
    """Read pipermail thread comments such as <!--1 ts.10-ts.11- -->."""
    soup = BeautifulSoup(html, "lxml")
    parents = {}
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        parts = _thread_comment_articles(str(comment))
        if len(parts) >= 2 and parts[-1] and parts[-2]:
            parents[parts[-1]] = parts[-2]
    return parents


def _thread_comment_articles(text: str) -> list[str]:
    text = text.strip()
    match = re.match(r"\d+\s+(.+)$", text)
    if not match:
        return []
    articles = []
    for piece in match.group(1).split("-"):
        piece = piece.strip()
        if "." not in piece:
            continue
        article = piece.rsplit(".", 1)[1].strip()
        if article.isdigit():
            articles.append(article)
    return articles


# ──────────────────────────────────────────────
# STEP 3: Fetch and parse individual message
# ──────────────────────────────────────────────

def parse_message(stub: dict) -> dict | None:
    html = fetch(stub["url"])
    if not html:
        return None
    msg = parse_message_html(html, stub)
    msg["_html"] = html
    return msg


def parse_message_html(html: str, stub: dict) -> dict:
    soup = BeautifulSoup(html, "lxml")
    headers = _header_fields(soup)
    author = headers.get("From") or _page_author(soup) or stub.get("author", "")
    subject = headers.get("Subject") or _page_subject(soup) or stub.get("subject", "")
    date = headers.get("Date") or _page_date(soup)
    in_reply_to = norm_msgid(headers.get("In-Reply-To") or _mailto_header(soup, "In-Reply-To"))
    references = norm_msgid(headers.get("References") or "")
    body_tag = soup.find("pre")
    body = body_tag.get_text() if body_tag else ""
    article = stub.get("article") or article_from_href(urlparse(stub["url"]).path) or ""
    own_id = norm_msgid(headers.get("Message-ID") or "")

    return {
        "id": own_id,
        "article": article,
        "url": stub["url"],
        "month": stub["month"],
        "author": clean_text(author),
        "author_short": clean_text(stub.get("author") or author),
        "subject": clean_text(subject),
        "date": clean_text(date),
        "in_reply_to": in_reply_to,
        "references": references,
        "body": body.strip(),
        "priority": stub.get("priority", False),
        "thread_links": _thread_links(soup, stub["url"]),
    }


def _header_fields(soup) -> dict:
    """Read From/Date/Message-ID lines when a page still has them."""
    headers = {}
    keys = ("From", "To", "Subject", "Date", "Message-ID", "In-Reply-To", "References")
    for li in soup.find_all("li"):
        text = clean_text(li.get_text(" ", strip=True))
        # get_text can insert a space before the colon ("From :").
        compact = re.sub(r"\s+:", ":", text, count=1)
        for key in keys:
            prefix = key + ":"
            if compact.startswith(prefix):
                headers[key] = compact[len(prefix):].strip()
    return headers


def _page_author(soup) -> str:
    h1 = soup.find("h1")
    nodes = h1.find_all_next("b") if h1 else soup.find_all("b")
    for tag in nodes:
        text = clean_text(tag.get_text(" ", strip=True))
        lower = text.lower()
        if not text or "sorted by" in lower or lower.startswith("more info"):
            continue
        return text
    return ""


def _page_subject(soup) -> str:
    h1 = soup.find("h1")
    if not h1:
        return ""
    return clean_text(h1.get_text(" ", strip=True))


def _page_date(soup) -> str:
    for tag in soup.find_all("i"):
        text = clean_text(tag.get_text(" ", strip=True))
        if text and _DATE_HINT.search(text):
            return text
    return ""


def _mailto_header(soup, name: str) -> str:
    wanted = name.lower()
    for tag in soup.find_all("a", href=True):
        href = tag["href"]
        if not href.lower().startswith("mailto:"):
            continue
        for key, val in mailto_params(href).items():
            if key.lower() == wanted and val.strip():
                return val.strip()
    return ""


def _thread_links(soup, page_url: str) -> dict:
    links = {}
    for tag in soup.find_all("link", href=True):
        rels = [r.lower() for r in (tag.get("rel") or [])]
        target = urljoin(page_url, tag["href"])
        if "next" in rels:
            links["next"] = target
        elif "prev" in rels or "previous" in rels:
            links["prev"] = target
    for tag in soup.find_all("a", href=True):
        text = tag.get_text(" ", strip=True).lower()
        target = urljoin(page_url, tag["href"])
        if "next" in text and "next" not in links:
            links["next"] = target
        elif "prev" in text and "prev" not in links:
            links["prev"] = target
    return links


def assign_message_ids(messages: list[dict], parent_of: dict[str, str]) -> None:
    """Fill id from children citing this article, else a stable pipermail id.

    Message pages do not include their own Message-ID. A reply's mailto
    In-Reply-To is the parent id. The thread index says which article is
    the parent, so the parent's id can be recovered from its children.
    """
    votes: dict[str, Counter] = {}
    for msg in messages:
        parent = parent_of.get(msg.get("article", ""))
        cited = msg.get("in_reply_to") or ""
        if parent and cited:
            votes.setdefault(parent, Counter())[cited] += 1

    learned = {article: counts.most_common(1)[0][0] for article, counts in votes.items()}
    for msg in messages:
        if msg.get("id"):
            continue
        article = msg.get("article") or "unknown"
        msg["id"] = learned.get(article) or f"pipermail-{msg.get('month', 'month')}-{article}"


# ──────────────────────────────────────────────
# STEP 4: Build thread trees
# ──────────────────────────────────────────────

def build_threads(messages: list[dict]) -> list[dict]:
    """Group messages into conversation threads by In-Reply-To."""
    by_id = {}
    for msg in messages:
        by_id.setdefault(msg["id"], msg)

    groups: dict[str, list] = {}
    for msg in messages:
        subject_clean = re.sub(r"^(re:\s*)+", "", msg.get("subject", ""), flags=re.IGNORECASE).strip()
        msg["_subject_clean"] = subject_clean
        root_id = _thread_root_id(msg, by_id)
        msg["_thread_id"] = root_id
        groups.setdefault(root_id, []).append(msg)

    result = []
    for tid, msgs in groups.items():
        root = next((m for m in msgs if m["id"] == tid), msgs[0])
        has_priority = any(m["priority"] for m in msgs)
        result.append({
            "thread_id": tid,
            "subject": root.get("_subject_clean", root.get("subject", "")),
            "month": root.get("month", ""),
            "message_count": len(msgs),
            "has_priority": has_priority,
            "messages": sorted(msgs, key=lambda m: date_sort_key(m.get("date", ""))),
        })

    return sorted(result, key=lambda t: date_sort_key(t["messages"][0].get("date", "")))


def _thread_root_id(msg: dict, by_id: dict) -> str:
    seen = set()
    current = msg
    while current["id"] not in seen:
        seen.add(current["id"])
        parent_id = current.get("in_reply_to") or ""
        parent = by_id.get(parent_id)
        if not parent or parent["id"] == current["id"]:
            return current["id"]
        current = parent
    return current["id"]


# ──────────────────────────────────────────────
# STEP 5: Save everything
# ──────────────────────────────────────────────

def save_html(msg: dict) -> None:
    html = msg.pop("_html", None)
    if not html:
        return
    name = f"{msg.get('month', 'month')}-{msg.get('article', 'msg')}.html"
    (HTML_DIR / name).write_text(html, encoding="utf-8")


def save_message(msg: dict) -> None:
    name = f"{msg.get('month', 'month')}-{msg.get('article', 'msg')}.json"
    (MESSAGES_DIR / name).write_text(json.dumps(msg, indent=2, ensure_ascii=False))


def build_author_stats(messages: list[dict]) -> dict:
    authors: dict[str, dict] = {}
    for msg in messages:
        name = msg["author_short"]
        if name not in authors:
            authors[name] = {
                "name": name,
                "message_count": 0,
                "priority": msg["priority"],
                "months": set(),
                "subjects": [],
            }
        authors[name]["message_count"] += 1
        authors[name]["months"].add(msg["month"])
        if len(authors[name]["subjects"]) < 10:
            authors[name]["subjects"].append(msg["subject"])

    for author in authors.values():
        author["months"] = sorted(author["months"])

    return dict(sorted(authors.items(), key=lambda item: -item[1]["message_count"]))


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

def main():
    global DELAY
    parser = argparse.ArgumentParser(description="ProjectB59 Vault Scraper")
    parser.add_argument("--priority-only", action="store_true",
                        help="Only download messages from priority authors")
    parser.add_argument("--months", type=int, default=0,
                        help="Limit to N most recent months (0 = all)")
    parser.add_argument("--start-year", type=int, default=0,
                        help="Only archive months from this year onward")
    parser.add_argument("--delay", type=float, default=DELAY,
                        help="Seconds to wait between requests (default: 0.5)")
    args = parser.parse_args()
    if args.delay < 0:
        parser.error("--delay must be zero or greater")
    DELAY = args.delay

    OUTPUT_DIR.mkdir(exist_ok=True)
    MESSAGES_DIR.mkdir(exist_ok=True)
    HTML_DIR.mkdir(exist_ok=True)

    months = discover_months()

    if args.start_year:
        months = [m for m in months if int(m["label"][:4]) >= args.start_year]

    if args.months:
        months = months[-args.months:]

    print(f"Processing {len(months)} months ...\n")

    all_messages = []
    parent_of: dict[str, str] = {}

    for i, month in enumerate(months):
        print(f"[{i+1}/{len(months)}] {month['label']}")
        stubs = parse_author_index(month)
        parent_of.update(parse_thread_index(month))
        print(f"  {len(stubs)} messages found", end="")

        priority_stubs = [s for s in stubs if s["priority"]]
        print(f", {len(priority_stubs)} priority")

        target = priority_stubs if args.priority_only else stubs
        saved = 0
        for n, stub in enumerate(target, 1):
            msg = parse_message(stub)
            if not msg:
                continue
            save_html(msg)
            all_messages.append(msg)
            saved += 1
            if n % 25 == 0 or n == len(target):
                print(f"  fetched {n}/{len(target)}")
        print(f"  kept {saved}")

    assign_message_ids(all_messages, parent_of)
    for msg in all_messages:
        save_message(msg)

    priority_count = sum(1 for msg in all_messages if msg["priority"])
    print(f"\nBuilding index ({len(all_messages)} messages, {priority_count} priority) ...")
    threads = build_threads(all_messages)
    author_stats = build_author_stats(all_messages)

    (OUTPUT_DIR / "index.json").write_text(
        json.dumps({
            "generated": datetime.utcnow().isoformat() + "Z",
            "source": BASE_URL,
            "total_messages": len(all_messages),
            "priority_messages": priority_count,
            "threads": threads,
        }, indent=2, ensure_ascii=False)
    )

    (OUTPUT_DIR / "authors.json").write_text(
        json.dumps(author_stats, indent=2, ensure_ascii=False)
    )

    print(f"""
+------------------------------------------+
|  Vault scrape complete                   |
+------------------------------------------+
|  Messages archived : {len(all_messages):<20} |
|  Priority authors  : {priority_count:<20} |
|  Threads           : {len(threads):<20} |
|  Output            : {str(OUTPUT_DIR):<20} |
+------------------------------------------+

Next step: from this folder run `python -m http.server` and open index.html.
    """)


if __name__ == "__main__":
    main()
