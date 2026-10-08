"""
Dispatch challan PDF (A4), laid out like the company's printed challan.

Two modes, same body layout:
  * letterhead=True  -> the letterhead artwork (header + footer) is drawn on
                        every page. This is the version admins download.
  * letterhead=False -> no artwork at all. Meant for printing on paper that
                        already carries the pre-printed letterhead.

The body sits between a 7.5 cm top margin and a 6.5 cm bottom margin so it
lands in the blank area of the pre-printed paper. Adjust TOP_MARGIN /
BOTTOM_MARGIN below if a test print shows it needs a nudge.
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ASSETS = Path(__file__).resolve().parent.parent / "assets"
HEADER_IMG = ASSETS / "letterhead_header.jpg"  # top 72 mm of the letterhead
FOOTER_IMG = ASSETS / "letterhead_footer.jpg"  # bottom 80 mm of the letterhead
HEADER_H = 72 * mm
FOOTER_H = 80 * mm

PAGE_W, PAGE_H = A4
TOP_MARGIN = 75 * mm  # 7.5 cm clear for the printed header
BOTTOM_MARGIN = 65 * mm  # 6.5 cm clear for the printed footer
SIDE_MARGIN = 12 * mm
FRAME_W = PAGE_W - 2 * SIDE_MARGIN

REMARKS_LINES = [
    "ALL DISPUTES WILL BE SUBJECT TO DELHI JURISDICTION.",
    "ALL THE GOODS HAVE BEEN SENT BY US PROPERLY.",
    "WE WILL NOT BE RESPONSIBLE FOR ANY DAMAGE DONE BY TRUCK OR RAILWAY.",
    "PAYMENT MAY BE MADE URGENTLY.",
]

# ---- text styles -----------------------------------------------------------
_base = dict(fontName="Helvetica", fontSize=8.5, leading=10.5, textColor=colors.black)
S_TITLE = ParagraphStyle("title", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 14, "leading": 16, "alignment": TA_CENTER})
S_SUB = ParagraphStyle("sub", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 10, "leading": 12, "alignment": TA_CENTER})
S_LABEL = ParagraphStyle("label", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 8})
S_VALUE = ParagraphStyle("value", **{**_base, "fontSize": 9})
S_TH = ParagraphStyle("th", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 8, "alignment": TA_CENTER})
S_TD = ParagraphStyle("td", **{**_base, "fontSize": 8.5, "alignment": TA_CENTER})
S_TD_B = ParagraphStyle("tdb", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 9, "alignment": TA_CENTER})
S_TOTAL_LABEL = ParagraphStyle("tl", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 9, "alignment": TA_RIGHT})
S_SMALL = ParagraphStyle("small", **{**_base, "fontSize": 7, "leading": 8.6, "alignment": TA_LEFT})
S_SMALL_B = ParagraphStyle("smallb", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 7.5, "leading": 9.5})
S_SIGN = ParagraphStyle("sign", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 8.5, "alignment": TA_RIGHT})
S_SIGN_SMALL = ParagraphStyle("signs", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 7.5, "alignment": TA_RIGHT})


# ---- small helpers ---------------------------------------------------------
def _p(text, style) -> Paragraph:
    return Paragraph(escape(str(text)) if text not in (None, "") else "&nbsp;", style)


def _up(value) -> str:
    return (value or "").strip().upper()


def _num(value) -> str:
    """Money / weight like the printed challan: 248000.00 (no thousands separators)."""
    return "-" if value is None else f"{float(value):.2f}"


def _date(value, sep: str) -> str:
    return value.strftime(f"%d{sep}%m{sep}%Y") if value else "-"


def _insurance(value) -> str:
    return "-" if value is None else ("YES" if value else "NO")


# ---- page decoration -------------------------------------------------------
def _letterhead_page(canvas, doc):
    canvas.saveState()
    canvas.drawImage(str(HEADER_IMG), 0, PAGE_H - HEADER_H, width=PAGE_W, height=HEADER_H)
    canvas.drawImage(str(FOOTER_IMG), 0, 0, width=PAGE_W, height=FOOTER_H)
    canvas.restoreState()


def _plain_page(canvas, doc):
    pass  # print mode: the paper already carries the letterhead


# ---- document body ---------------------------------------------------------
def _build_story(order) -> list:
    cust = order.customer
    items = sorted(order.items, key=lambda i: i.id)
    total_qty = sum(i.qty for i in items)
    challan_date = order.dispatch_date or order.order_date  # old orders may predate dispatch_date
    to_pay = order.to_pay
    if to_pay is None and order.freight is not None:
        to_pay = (order.freight or 0) - (order.advance or 0)

    story = [_p("Challan", S_TITLE)]
    if _up(cust.city):
        story.append(_p(f"TO {_up(cust.city)}", S_SUB))
    story.append(Spacer(1, 3 * mm))

    # -- who / what / where ---------------------------------------------------
    left = [
        ("CH NO.", order.code),
        ("Customer", _up(cust.name)),
        ("Mob", cust.mobile or ""),
        ("Address", _up(cust.address)),
        ("Station", _up(cust.city)),
        ("Remarks", _up(order.remarks)),
    ]
    right = [
        ("Date", _date(challan_date, "-")),
        ("Truck No.", _up(order.truck)),
        ("Driver Mobile", order.driver_mobile or ""),
        ("Driver Name", _up(order.driver)),
        ("Transporter", _up(order.transporter)),
        ("Insurance", _insurance(order.insurance)),
    ]
    info = Table(
        [[_p(l[0], S_LABEL), _p(l[1], S_VALUE), _p(r[0], S_LABEL), _p(r[1], S_VALUE)] for l, r in zip(left, right)],
        colWidths=[19 * mm, 74 * mm, 26 * mm, 67 * mm],
    )
    info.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story += [info, Spacer(1, 3 * mm)]

    # -- items ----------------------------------------------------------------
    head = ["S.No", "Item", "Variety", "Brand", "Crate Quality", "Packing", "Qty"]
    rows = [[_p(h, S_TH) for h in head]]
    for n, it in enumerate(items, start=1):
        rows.append([
            _p(n, S_TD), _p("KINNOW", S_TD), _p(_up(it.variety), S_TD), _p(_up(it.brand), S_TD),
            _p(_up(it.quality), S_TD), _p("CRATE", S_TD), _p(it.qty, S_TD),
        ])
    rows.append([_p("Total", S_TOTAL_LABEL), "", "", "", "", "", _p(total_qty, S_TD_B)])
    last = len(rows) - 1
    tbl = Table(rows, colWidths=[11 * mm, 22 * mm, 26 * mm, 30 * mm, 40 * mm, 26 * mm, 31 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.6, colors.black),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EFEFEF")),
        ("SPAN", (0, last), (5, last)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.6),
    ]))
    story += [tbl, Spacer(1, 3.5 * mm)]

    # -- weights & money ------------------------------------------------------
    S_NUM_B = ParagraphStyle("numb", **{**_base, "fontName": "Helvetica-Bold", "fontSize": 9})
    dt = _date(order.del_date, "/")
    tm = order.del_time.strftime("%H:%M") if order.del_time else "-"
    money = Table(
        [
            [_p("Weight", S_LABEL), _p(_num(order.weight), S_VALUE), _p("Del Dt", S_LABEL), _p(dt, S_VALUE),
             _p("Del Time", S_LABEL), _p(tm, S_VALUE), _p("INAM", S_LABEL), _p(_num(order.inam), S_VALUE)],
            [_p("Freight", S_LABEL), _p(_num(order.freight), S_VALUE), _p("Adv Frt", S_LABEL), _p(_num(order.advance), S_VALUE),
             "", "", _p("To Pay", S_LABEL), _p(_num(to_pay), S_NUM_B)],
        ],
        colWidths=[17 * mm, 30 * mm, 15 * mm, 28 * mm, 17 * mm, 17 * mm, 14 * mm, 48 * mm],
    )
    money.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("LINEABOVE", (0, 0), (-1, 0), 0.6, colors.black),
    ]))

    # -- static remarks (left) + signature (right) ------------------------------
    remarks = [_p("REMARKS:", S_SMALL_B)] + [_p(line, S_SMALL) for line in REMARKS_LINES]
    signature = [_p("For SHIV BHOLA FRUIT CO", S_SIGN), Spacer(1, 11 * mm), _p("(Authorised Signatory)", S_SIGN_SMALL)]
    footer_tbl = Table([[remarks, signature]], colWidths=[120 * mm, 66 * mm])
    footer_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))

    story.append(KeepTogether([money, Spacer(1, 3 * mm), footer_tbl]))
    return story


def build_challan_pdf(order, *, letterhead: bool) -> bytes:
    """Render the dispatch challan for `order` (needs .customer and .items loaded)."""
    buf = BytesIO()
    doc = BaseDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=SIDE_MARGIN,
        rightMargin=SIDE_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        title=f"Challan {order.code}",
        author="Shiv Bhola Group",
    )
    frame = Frame(
        SIDE_MARGIN, BOTTOM_MARGIN, FRAME_W, PAGE_H - TOP_MARGIN - BOTTOM_MARGIN,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="body",
    )
    doc.addPageTemplates([PageTemplate(id="challan", frames=[frame], onPage=_letterhead_page if letterhead else _plain_page)])
    doc.build(_build_story(order))
    return buf.getvalue()
