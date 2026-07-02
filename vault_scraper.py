#!/usr/bin/env python3
"""
ProjectB59 Vault Scraper — Extropy-Chat Archive
================================================
Downloads, filters, and archives the extropy-chat mailing list,
preserving messages by Hal Finney and other cypherpunks / early
digital-cash pioneers for permanent offline storage.

Usage:
    pip install requests beautifulsoup4 lxml
    python vault_scraper.py

Output:
    vault_data/
        index.json          — full message index
        authors.json        — author profiles + message counts
        messages/           — one .json per message
        html/               — mirrored original HTML pages
"""

import os
import json
import time
import re
import hashlib
import argparse
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Install deps first:  pip install requests beautifulsoup4 lxml")
    raise

# ──────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────

BASE_URL = "https://lists.extropy.org/pipermail/extropy-chat/"

# People we definitely want to capture — match is case-insensitive substring
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
DELAY = 0.5          # seconds between requests — be polite
MAX_RETRIES = 3


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
            r = session.get(url, timeout=20)
            r.raise_for_status()
            time.sleep(DELAY)
            return r.text
        except Exception as e:
            if attempt == retries - 1:
                print(f"  ✗ Failed to fetch {url}: {e}")
                return None
            time.sleep(DELAY * (attempt + 1))
    return None


def is_priority(author_name: str, subject: str = "") -> bool:
    text = (author_name + " " + subject).lower()
    return any(kw in text for kw in PRIORITY_AUTHORS)


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


# ──────────────────────────────────────────────
# STEP 1 — Discover all monthly archive URLs
# ──────────────────────────────────────────────

def discover_months() -> list[dict]:
    """Return list of {label, url} for every month in the archive."""
    print("Discovering archive months …")
    html = fetch(BASE_URL)
    if not html:
        raise RuntimeError("Cannot reach archive index")

    soup = BeautifulSoup(html, "lxml")
    months = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        # Monthly archives look like "2004-January/" or end in /thread.html
        if re.match(r"\d{4}-\w+/?$", href):
            label = href.rstrip("/")
            months.append({
                "label": label,
                "url": urljoin(BASE_URL, href),
                "author_index": urljoin(BASE_URL, href.rstrip("/") + "/author.html"),
            })

    # Deduplicate preserving order
    seen = set()
    unique = []
    for m in months:
        if m["label"] not in seen:
            seen.add(m["label"])
            unique.append(m)

    print(f"  Found {len(unique)} months")
    return unique


# ──────────────────────────────────────────────
# STEP 2 — Parse author index for each month
# ──────────────────────────────────────────────

def parse_author_index(month: dict) -> list[dict]:
    """Return list of message stubs from one month's author index."""
    html = fetch(month["author_index"])
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    messages = []
    current_author = None

    for tag in soup.find_all(["b", "i", "a"]):
        # Bold = author name in pipermail author index
        if tag.name == "b":
            current_author = tag.get_text(strip=True)
        elif tag.name == "a" and current_author:
            href = tag.get("href", "")
            if href.endswith(".html") and not href.startswith("http"):
                msg_url = urljoin(month["author_index"], href)
                messages.append({
                    "author": current_author,
                    "subject": tag.get_text(strip=True),
                    "url": msg_url,
                    "month": month["label"],
                    "priority": is_priority(current_author, tag.get_text()),
                })

    return messages


# ──────────────────────────────────────────────
# STEP 3 — Fetch and parse individual message
# ──────────────────────────────────────────────

def parse_message(stub: dict) -> dict | None:
    html = fetch(stub["url"])
    if not html:
        return None

    soup = BeautifulSoup(html, "lxml")

    # Extract headers from the <ul> block pipermail uses
    headers = {}
    for li in soup.find_all("li"):
        text = li.get_text(separator=" ", strip=True)
        for key in ("From", "To", "Subject", "Date", "Message-ID", "In-Reply-To", "References"):
            if text.startswith(key + ":"):
                headers[key] = text[len(key)+1:].strip()

    # Body is in <pre> tags
    body_tag = soup.find("pre")
    body = body_tag.get_text() if body_tag else ""

    # Next/prev in thread
    thread_links = {}
    for a in soup.find_all("a", href=True):
        txt = a.get_text(strip=True).lower()
        if "next" in txt:
            thread_links["next"] = urljoin(stub["url"], a["href"])
        elif "prev" in txt:
            thread_links["prev"] = urljoin(stub["url"], a["href"])

    msg_id = headers.get("Message-ID", hashlib.md5(stub["url"].encode()).hexdigest())

    return {
        "id": msg_id,
        "url": stub["url"],
        "month": stub["month"],
        "author": headers.get("From", stub["author"]),
        "author_short": stub["author"],
        "subject": headers.get("Subject", stub["subject"]),
        "date": headers.get("Date", ""),
        "in_reply_to": headers.get("In-Reply-To", ""),
        "references": headers.get("References", ""),
        "body": body.strip(),
        "priority": stub["priority"],
        "thread_links": thread_links,
        # Save raw HTML too
        "_html": html,
    }


# ──────────────────────────────────────────────
# STEP 4 — Build thread trees
# ──────────────────────────────────────────────

def build_threads(messages: list[dict]) -> list[dict]:
    """Group messages into conversation threads by subject + In-Reply-To."""
    by_id = {m["id"]: m for m in messages}
    threads: dict[str, list] = {}
    root_subjects: dict[str, str] = {}

    for m in messages:
        parent_id = m.get("in_reply_to", "").strip().strip("<>")
        # Clean up subject for threading
        subject_clean = re.sub(r"^(re:\s*)+", "", m["subject"], flags=re.IGNORECASE).strip()

        if parent_id and parent_id in by_id:
            thread_id = by_id[parent_id].get("_thread_id", parent_id)
        else:
            thread_id = m["id"]

        m["_thread_id"] = thread_id
        m["_subject_clean"] = subject_clean
        threads.setdefault(thread_id, []).append(m)

    result = []
    for tid, msgs in threads.items():
        root = next((m for m in msgs if m["id"] == tid), msgs[0])
        has_priority = any(m["priority"] for m in msgs)
        result.append({
            "thread_id": tid,
            "subject": root.get("_subject_clean", root["subject"]),
            "month": root["month"],
            "message_count": len(msgs),
            "has_priority": has_priority,
            "messages": sorted(msgs, key=lambda m: m.get("date", "")),
        })

    return sorted(result, key=lambda t: t["messages"][0].get("date", ""))


# ──────────────────────────────────────────────
# STEP 5 — Save everything
# ──────────────────────────────────────────────

def save_message(msg: dict):
    html = msg.pop("_html", None)
    fname = slug(msg["id"][:60]) + ".json"
    path = MESSAGES_DIR / fname
    path.write_text(json.dumps(msg, indent=2, ensure_ascii=False))

    if html:
        hpath = HTML_DIR / (slug(msg["id"][:60]) + ".html")
        hpath.write_text(html, encoding="utf-8")


def build_author_stats(messages: list[dict]) -> dict:
    authors: dict[str, dict] = {}
    for m in messages:
        name = m["author_short"]
        if name not in authors:
            authors[name] = {
                "name": name,
                "message_count": 0,
                "priority": m["priority"],
                "months": set(),
                "subjects": [],
            }
        authors[name]["message_count"] += 1
        authors[name]["months"].add(m["month"])
        if len(authors[name]["subjects"]) < 10:
            authors[name]["subjects"].append(m["subject"])

    # Convert sets for JSON
    for a in authors.values():
        a["months"] = sorted(a["months"])

    return dict(sorted(authors.items(), key=lambda x: -x[1]["message_count"]))


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="ProjectB59 Vault Scraper")
    parser.add_argument("--priority-only", action="store_true",
                        help="Only download messages from priority authors")
    parser.add_argument("--months", type=int, default=0,
                        help="Limit to N most recent months (0 = all)")
    parser.add_argument("--start-year", type=int, default=0,
                        help="Only archive months from this year onward")
    args = parser.parse_args()

    # Setup dirs
    OUTPUT_DIR.mkdir(exist_ok=True)
    MESSAGES_DIR.mkdir(exist_ok=True)
    HTML_DIR.mkdir(exist_ok=True)

    # Discover months
    months = discover_months()

    if args.start_year:
        months = [m for m in months if int(m["label"][:4]) >= args.start_year]

    if args.months:
        months = months[-args.months:]

    print(f"Processing {len(months)} months …\n")

    all_messages = []
    priority_count = 0

    for i, month in enumerate(months):
        print(f"[{i+1}/{len(months)}] {month['label']}")
        stubs = parse_author_index(month)
        print(f"  {len(stubs)} messages found", end="")

        priority_stubs = [s for s in stubs if s["priority"]]
        print(f", {len(priority_stubs)} priority")

        target = priority_stubs if args.priority_only else stubs

        for stub in target:
            msg = parse_message(stub)
            if msg:
                save_message(msg)
                all_messages.append(msg)
                if msg["priority"]:
                    priority_count += 1

    # Build index
    print(f"\nBuilding index ({len(all_messages)} messages, {priority_count} priority) …")
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
╔══════════════════════════════════════════╗
║  Vault scrape complete                   ║
╠══════════════════════════════════════════╣
║  Messages archived : {len(all_messages):<20} ║
║  Priority authors  : {priority_count:<20} ║
║  Threads           : {len(threads):<20} ║
║  Output            : {str(OUTPUT_DIR):<20} ║
╚══════════════════════════════════════════╝

Next step: open vault.html in a browser to explore the archive.
    """)


if __name__ == "__main__":
    main()
