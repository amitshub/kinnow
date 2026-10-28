"""
Dispatch challan PDF (A4), laid out like the company's printed challan.

Two modes, same body layout:
  * letterhead=True  -> the letterhead artwork (header + footer) is drawn on
                        every page. This is the version that gets downloaded;
                        with include_attachments=True the uploaded Bilty and
                        Kaanta Parchi (photos or PDFs) follow as extra pages.
  * letterhead=False -> no artwork at all. Meant for printing on paper that
                        already carries the pre-printed letterhead.

The body sits between a 7.5 cm top margin and a 6.5 cm bottom margin so it
lands in the blank area of the pre-printed paper. Adjust TOP_MARGIN /
BOTTOM_MARGIN below if a test print shows it needs a nudge.
"""

from __future__ import annotations

import base64
import re
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageOps

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as rl_canvas
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
    pcode = (getattr(order.packhouse, "code", None) or "").strip().upper() if getattr(order, "packhouse", None) else ""
    left = [
        ("CH NO.", f"{order.code} / {pcode}" if pcode else order.code),
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
            _p(n, S_TD), _p(_up(getattr(it, "item", None) or "Kinnow"), S_TD), _p(_up(it.variety), S_TD), _p(_up(it.brand), S_TD),
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


def _build_challan_only(order, *, letterhead: bool) -> bytes:
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


def build_challan_pdf(order, *, letterhead: bool, include_attachments: bool = False) -> bytes:
    """Render the dispatch challan for `order` (needs .customer, .items and .packhouse loaded).

    With include_attachments=True, the uploaded Bilty and then the Kaanta Parchi are appended
    after the challan page(s) - images become one page each, PDFs are merged page by page."""
    challan = _build_challan_only(order, letterhead=letterhead)
    if not include_attachments:
        return challan

    extras: list[bytes] = []
    for label, data_uri in (("Bilty", order.bilty), ("Kaanta Parchi", order.kaanta)):
        if data_uri:
            extras.append(_attachment_pdf(label, order.code, data_uri))
    if not extras:
        return challan

    from pypdf import PdfReader, PdfWriter  # imported here so the rest works even if pypdf is missing

    writer = PdfWriter()
    writer.append(PdfReader(BytesIO(challan)))
    for extra in extras:
        writer.append(PdfReader(BytesIO(extra)))
    out = BytesIO()
    writer.write(out)
    return out.getvalue()


# ---- uploaded Bilty / Kaanta Parchi pages -----------------------------------
def _decode_data_uri(data_uri: str):
    """'data:<mime>;base64,<payload>' -> (mime, bytes), or None if it isn't one."""
    try:
        header, payload = data_uri.split(",", 1)
        mime = header[5:].split(";")[0].strip().lower()
        return mime, base64.b64decode(payload)
    except Exception:
        return None


def _attachment_pdf(label: str, order_code: str, data_uri: str) -> bytes:
    """One uploaded document as PDF bytes. Never raises: a file that can't be read becomes a short note page."""
    decoded = _decode_data_uri(data_uri)
    try:
        if decoded is None:
            raise ValueError("not a data URI")
        mime, raw = decoded
        if mime == "application/pdf":
            return _checked_pdf(raw)
        return _image_page(f"{label.upper()} - {order_code}", raw)
    except Exception:
        return _note_page(f"{label} - {order_code}", f"The uploaded {label} file could not be added to this PDF.")


def _checked_pdf(raw: bytes) -> bytes:
    from pypdf import PdfReader

    reader = PdfReader(BytesIO(raw))
    if reader.is_encrypted and not reader.decrypt(""):
        raise ValueError("password-protected PDF")
    if len(reader.pages) == 0:
        raise ValueError("empty PDF")
    return raw


def _image_page(title: str, raw: bytes) -> bytes:
    """A page with the photo scaled to fit (landscape page for a landscape photo)."""
    img = ImageOps.exif_transpose(Image.open(BytesIO(raw)))
    if img.mode in ("RGBA", "LA", "P"):
        rgba = img.convert("RGBA")
        flat = Image.new("RGB", rgba.size, (255, 255, 255))
        flat.paste(rgba, mask=rgba.split()[-1])
        img = flat
    else:
        img = img.convert("RGB")
    img.thumbnail((2600, 2600))
    jpeg = BytesIO()
    img.save(jpeg, "JPEG", quality=88)
    jpeg.seek(0)

    w, h = img.size
    size = landscape(A4) if w > h * 1.15 else A4
    pw, ph = size
    margin = 12 * mm
    out = BytesIO()
    c = rl_canvas.Canvas(out, pagesize=size)
    c.setTitle(title)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin, ph - margin - 3 * mm, title)
    c.drawImage(
        ImageReader(jpeg), margin, margin, width=pw - 2 * margin, height=ph - 2 * margin - 10 * mm,
        preserveAspectRatio=True, anchor="c",
    )
    c.showPage()
    c.save()
    return out.getvalue()


def _note_page(title: str, message: str) -> bytes:
    out = BytesIO()
    c = rl_canvas.Canvas(out, pagesize=A4)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(12 * mm, PAGE_H - 15 * mm, title.upper())
    c.setFont("Helvetica", 10)
    c.drawString(12 * mm, PAGE_H - 25 * mm, message)
    c.showPage()
    c.save()
    return out.getvalue()


# ---- file names --------------------------------------------------------------
def challan_filename(order, *, print_mode: bool) -> str:
    """Station name + dispatch date, e.g. Agartala_13-01-2026.pdf  (the print copy gets '-print')."""
    station = (order.customer.city or order.customer.name or "Challan").strip()
    when = order.dispatch_date or order.order_date
    stem = re.sub(r"[^A-Za-z0-9_-]+", "_", f"{station}_{when.strftime('%d-%m-%Y')}").strip("_")
    return f"{stem}{'-print' if print_mode else ''}.pdf"


# ---- Orders-screen summary ---------------------------------------------------
def build_summary_pdf(day, orders) -> bytes:
    """Plain PDF of the dispatch summary: Customer Name | Location | Packhouse for the orders dispatched on `day`."""
    from reportlab.platypus import SimpleDocTemplate

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=15 * mm, bottomMargin=15 * mm,
        title=f"Dispatch Summary {day.strftime('%d-%m-%Y')}", author="Shiv Bhola Group",
    )
    story = [
        _p("Dispatch Summary", S_TITLE),
        _p(f"Date: {day.strftime('%d-%m-%Y')} ({day.strftime('%A')})", S_SUB),
        Spacer(1, 6 * mm),
    ]
    if orders:
        rows = [[_p("Customer Name", S_TH), _p("Location", S_TH), _p("Packhouse", S_TH)]]
        for o in orders:
            rows.append([
                _p(o.customer.name, ParagraphStyle("c1", **{**_base, "fontSize": 9})),
                _p(o.customer.city or "-", ParagraphStyle("c2", **{**_base, "fontSize": 9})),
                _p(o.packhouse.name, ParagraphStyle("c3", **{**_base, "fontSize": 9})),
            ])
        tbl = Table(rows, colWidths=[75 * mm, 45 * mm, 60 * mm], repeatRows=1)
        tbl.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.6, colors.black),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EFEFEF")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story += [tbl, Spacer(1, 4 * mm), _p(f"Total dispatched: {len(orders)}", S_LABEL)]
    else:
        story.append(_p("No orders dispatched on this date.", S_VALUE))
    doc.build(story)
    return buf.getvalue()
