"""
Detect in-app navigation (and light URL hints) from natural language for the assistant.

Kept separate from assistant_service to avoid circular imports and to allow extending
with more action types later.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Final

NAV_CUE_PATTERN: Final[re.Pattern[str]] = re.compile(
    r"\b("
    r"open|show|view|see|go\s+to|take\s+me\s+to|take\s+me|navigate\s+to|navigate|"
    r"bring\s+me\s+to|jump\s+to|head\s+to|switch\s+to|move\s+to|"
    r"i\s+want\s+to\s+see|i\s+want\s+to\s+open|i\s+need\s+to\s+see|let\s+me\s+see|"
    r"where\s+(is|are)\s+the|"
    r"pull\s+up|load|display"
    r")\b",
    re.IGNORECASE,
)

IMEI_LIKE: Final[re.Pattern[str]] = re.compile(r"\b\d{14,17}\b")

# URL query keys / values — keep in sync with apps/web list pages + copilotPageContext.ts
RETURN_STATUSES: Final[tuple[str, ...]] = (
    "requested",
    "approved",
    "rejected",
    "repaired",
    "replaced",
    "refunded",
)


def _return_status_query_from_text(text: str) -> str | None:
    """Map natural language to a return request status for `?status=` (pending → requested)."""
    if re.search(r"\b(pending|awaiting|waiting|not\s+yet\s+processed)\b", text):
        return "requested"
    for st in RETURN_STATUSES:
        if re.search(rf"\b{re.escape(st)}\b", text):
            return st
    return None


@dataclass(frozen=True)
class NavigationIntentResult:
    """Structured navigation the client should perform."""

    target: str
    message: str
    query: dict[str, str]
    intent: str = "navigation"
    context: str | None = None


def _has_nav_cue(text: str) -> bool:
    return bool(NAV_CUE_PATTERN.search(text))


def _strip_trailing_punct(text: str) -> str:
    return re.sub(r"[\s.!?,:;]+$", "", text).strip()


def _allow_nav(text_lower: str, raw: str, *, max_len_short: int = 48) -> bool:
    return _has_nav_cue(raw) or len(text_lower) <= max_len_short


def parse_navigation_intent(message: str) -> NavigationIntentResult | None:
    """
    Return a navigation intent when the user is clearly asking to move inside the app.

    Pure navigation: short phrases or nav cue + entity.
    """
    raw = message.strip()
    if not raw:
        return None

    text = _strip_trailing_punct(raw).lower()
    if IMEI_LIKE.search(text):
        return None

    if not _allow_nav(text, raw):
        return None

    # Avoid treating long prose that merely mentions a page as a navigation command.
    if len(text) > 72 and not _has_nav_cue(raw):
        return None

    # Low stock → inventory with hint
    if re.search(r"\b(low\s+stock|lowstock|understocked|reorder)\b", text):
        if _has_nav_cue(raw) or re.search(r"\b(products?|devices?|items?|units?|inventory|stock)\b", text):
            return NavigationIntentResult(
                target="/inventory",
                message="Opening Inventory for low-stock follow-up.",
                query={"copilot": "low-stock"},
                intent="navigation",
                context="low_stock",
            )

    # Purchase orders (exclude "new" and data-only phrases handled elsewhere)
    if re.search(r"\b(purchase\s+orders?|purchase\s+order|procurement)\b", text) or re.search(
        r"\bpos\b|\bp\.o\.s\b|\bp\.o\b",
        text,
    ):
        if "new" not in text and not re.search(r"\b(summarize|summary|how\s+many|list\s+all)\b", text):
            query_po: dict[str, str] = {}
            if re.search(r"\b(recent|latest|newest)\b", text):
                query_po["sort"] = "recent"
            msg_po = (
                "Opening Purchase Orders (most recent first)."
                if query_po
                else "Opening Purchase Orders."
            )
            return NavigationIntentResult(
                target="/purchase-orders",
                message=msg_po,
                query=query_po,
                intent="navigation",
                context="recent_purchase" if query_po else None,
            )

    # Sales orders
    if re.search(r"\b(sales\s+orders?|sales\s+order)\b", text):
        if "new" not in text and not re.search(r"\b(summarize|summary|how\s+many|list\s+all)\b", text):
            query_so: dict[str, str] = {}
            if re.search(r"\b(recent|latest|newest)\b", text):
                query_so["sort"] = "recent"
            msg_so = "Opening Sales Orders (most recent first)." if query_so else "Opening Sales Orders."
            return NavigationIntentResult(
                target="/sales-orders",
                message=msg_so,
                query=query_so,
                intent="navigation",
                context="recent_sales" if query_so else None,
            )

    # Returns
    if re.search(r"\b(returns?|rma|return\s+requests?)\b", text):
        rq = _return_status_query_from_text(text)
        query_ret: dict[str, str] = {}
        if rq:
            query_ret["status"] = rq
        msg = "Opening Returns / RMA."
        if rq == "requested" and re.search(r"\b(pending|awaiting|waiting)\b", text):
            msg = "Opening Returns / RMA (pending queue)."
        elif rq:
            msg = f"Opening Returns / RMA (status: {rq})."
        return NavigationIntentResult(
            target="/returns",
            message=msg,
            query=query_ret,
            intent="navigation",
            context="returns_filtered" if query_ret else None,
        )

    # Suppliers
    if re.search(r"\b(suppliers?|vendors?)\b", text):
        return NavigationIntentResult(target="/suppliers", message="Opening Suppliers.", query={})

    # Customers
    if re.search(r"\b(customers?|clients?)\b", text):
        return NavigationIntentResult(target="/customers", message="Opening Customers.", query={})

    # Inventory / devices (avoid matching purchase "order")
    if re.search(r"\b(inventory|devices?|stock|warehouse)\b", text) and "purchase" not in text:
        if not re.search(r"\b(low\s+stock|summarize|summary|how\s+many)\b", text):
            return NavigationIntentResult(target="/inventory", message="Opening Inventory.", query={})

    # Dashboard / home
    if re.search(r"\b(dashboard|home|overview|main\s+screen)\b", text):
        return NavigationIntentResult(target="/", message="Opening the dashboard.", query={})

    return None
