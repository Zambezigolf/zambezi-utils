"""
session_features.py — turn a raw event stream into per-session feature rows.

Stdlib-only. Reads newline-delimited JSON events (one per line), groups them
into sessions by user + inactivity gap, and emits one feature dict per
session — ready for pandas, a warehouse load, or model training.

Expected event shape (extra fields pass through untouched):

    {"user": "u123", "ts": 1730000000.0, "type": "click", ...}

Usage:

    python session_features.py events.ndjson > sessions.ndjson
    python session_features.py events.ndjson --gap 900 --min-events 3
"""

import argparse
import json
import sys
from collections import Counter
from typing import Iterable


def sessionize(events: Iterable[dict], gap: float = 1800.0) -> Iterable[list[dict]]:
    """Group events into sessions: same user, consecutive events within `gap`
    seconds. Events must be sorted by (user, ts) — sort first if unsure."""
    current: list[dict] = []
    for e in events:
        if (
            current
            and e["user"] == current[-1]["user"]
            and e["ts"] - current[-1]["ts"] <= gap
        ):
            current.append(e)
        else:
            if current:
                yield current
            current = [e]
    if current:
        yield current


def features(session: list[dict]) -> dict:
    """One flat feature row per session. Extend with domain fields as needed —
    keep it a flat dict so it loads cleanly into a dataframe or table."""
    types = Counter(e["type"] for e in session)
    start, end = session[0]["ts"], session[-1]["ts"]
    return {
        "user": session[0]["user"],
        "start_ts": start,
        "end_ts": end,
        "duration_s": round(end - start, 3),
        "n_events": len(session),
        "n_event_types": len(types),
        "events_per_min": round(len(session) / max(end - start, 1) * 60, 3),
        **{f"n_{t}": c for t, c in sorted(types.items())},
    }


def read_ndjson(path: str) -> Iterable[dict]:
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def main() -> None:
    ap = argparse.ArgumentParser(description="Events → per-session feature rows (NDJSON in/out).")
    ap.add_argument("input", help="NDJSON events file (use - for stdin)")
    ap.add_argument("--gap", type=float, default=1800.0,
                    help="inactivity gap in seconds that ends a session (default 1800)")
    ap.add_argument("--min-events", type=int, default=1,
                    help="drop sessions with fewer events than this")
    args = ap.parse_args()

    events = read_ndjson("/dev/stdin" if args.input == "-" else args.input)
    events = sorted(events, key=lambda e: (e["user"], e["ts"]))

    for s in sessionize(events, gap=args.gap):
        if len(s) >= args.min_events:
            print(json.dumps(features(s), separators=(",", ":")))


if __name__ == "__main__":
    main()
