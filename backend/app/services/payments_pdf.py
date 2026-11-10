"""
Payment requests as a plain A4 PDF list - the same columns as the admin Payments screen:
Packhouse Name | Account name | A/c no. | IFSC | Amount

The grower's name is printed in capitals at the top of the "Account name" cell, with the grower's
payment account name (e.g. "Ram Singh - SBI") underneath.
"""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.timeutils import IST

_base = dict(fontName="Helvetica", fontSize=9, leading=11, textColor=colors.black)
S_TITLE = ParagraphStyle("t", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 14, "leading": 17, "alignment": TA_CENTER})
S_SUB = ParagraphStyle("s", **{**_base, "fontSize": 9.5, "leading": 12, "alignment": TA_CENTER})
S_TH = ParagraphStyle("th", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 8.5})
S_TH_R = ParagraphStyle("thr", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 8.5, "alignment": TA_RIGHT})
S_TD = ParagraphStyle("td", **_base)
S_AMT = ParagraphStyle("amt", **{**_base, "fontName": "Helvetica-Bold", "alignment": TA_RIGHT})
S_TOTAL = ParagraphStyle("tot", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 9.5, "alignment": TA_RIGHT})


def inr(value) -> str:
    """12,50,000.00 - Indian digit grouping (Helvetica has no rupee sign, so amounts are plain numbers)."""
    whole, _, frac = f"{float(value or 0):.2f}".partition(".")
    sign = "-" if whole.startswith("-") else ""
    whole = whole.lstrip("-")
    if len(whole) > 3:
        head, tail = whole[:-3], whole[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        whole = ",".join(groups) + "," + tail
    return f"{sign}{whole}.{frac}"


def _p(text, style) -> Paragraph:
    return Paragraph(escape(str(text)) if text not in (None, "") else "&nbsp;", style)


def _account_cell(payment) -> Paragraph:
    grower = escape((payment.grower.name if payment.grower else "").upper())
    account = escape((payment.account or "").strip())
    html = f"<b>{grower}</b>"
    if account:
        html += f'<br/><font size="8" color="#4b5563">{account}</font>'
    return Paragraph(html, S_TD)


def build_payments_pdf(payments, *, date_text: str, status_text: str, packhouse_text: str) -> bytes:
    """`payments` need .grower and .packhouse loaded. Rows are grouped by packhouse, then grower."""
    rows = sorted(
        payments,
        key=lambda p: ((p.packhouse.name if p.packhouse else "").lower(), (p.grower.name if p.grower else "").lower(), p.id),
    )
    total = sum(float(p.amount or 0) for p in rows)

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, leftMargin=12 * mm, rightMargin=12 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
        title="Payment Requests", author="Shiv Bhola Group",
    )
    story = [
        _p("Payment Requests", S_TITLE),
        _p(f"Date: {date_text}   |   Status: {status_text}   |   Packhouse: {packhouse_text}", S_SUB),
        _p(f"Generated {datetime.now(IST).strftime('%d-%m-%Y %H:%M')}", ParagraphStyle("g", **{**_base, "fontSize": 8, "alignment": TA_CENTER, "textColor": colors.HexColor("#6b7280")})),
        Spacer(1, 5 * mm),
    ]

    if not rows:
        story.append(_p("No payment requests for these filters.", S_TD))
    else:
        data = [[_p("Packhouse Name", S_TH), _p("Account name", S_TH), _p("A/c no.", S_TH), _p("IFSC", S_TH), _p("Amount (Rs.)", S_TH_R)]]
        for p in rows:
            data.append([
                _p(p.packhouse.name if p.packhouse else "", S_TD),
                _account_cell(p),
                _p(p.grower.account_number if p.grower and p.grower.account_number else "-", S_TD),
                _p(p.grower.ifsc_code if p.grower and p.grower.ifsc_code else "-", S_TD),
                _p(inr(p.amount), S_AMT),
            ])
        data.append(["", "", "", _p(f"Total ({len(rows)})", S_TOTAL), _p(inr(total), S_AMT)])
        last = len(data) - 1
        table = Table(data, colWidths=[34 * mm, 58 * mm, 38 * mm, 26 * mm, 30 * mm], repeatRows=1)
        table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, last - 1), 0.6, colors.black),
            ("BOX", (0, last), (-1, last), 0.6, colors.black),
            ("LINEABOVE", (0, last), (-1, last), 0.6, colors.black),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EFEFEF")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(table)

    doc.build(story)
    return buf.getvalue()
