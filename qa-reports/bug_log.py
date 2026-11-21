#!/usr/bin/env python3
"""Incremental QA issue log in Excel.

Commands: init | account | add | attach | update | coverage | note | status | finalize
Every command saves immediately (atomic write), so the file is always current.
"""
import argparse, datetime as dt, difflib, glob, json, os, re, shutil, sys, tempfile, zipfile
from openpyxl import Workbook, load_workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation

COLS = ["ID", "Related test case ID", "Section", "Title", "Accounts & Apps", "Description", "Screenshot",
        "Recording", "Severity", "Reproducibility", "Environment", "Notes", "Status"]
WIDTH = [10, 14, 22, 34, 26, 72, 18, 16, 10, 13, 20, 34, 12]
C = {n: i + 1 for i, n in enumerate(COLS)}
SEV = ["Critical", "High", "Medium", "Low"]
SEV_FILL = {"Critical": "FFC7CE", "High": "FCE4D6", "Medium": "FFEB9C", "Low": "E7E6E6"}
SEV_PRI = {"Critical": "Urgent", "High": "High", "Medium": "Medium", "Low": "Low"}
STATUS = ["Open", "Fixed - retest", "Retest passed", "Reopened", "Won't fix"]
COV_ST = ["Not started", "In progress", "Done", "Partial", "Blocked"]
TASK_COLS = ["Task ID", "Subject", "Grand Project", "Sub Project", "Bucket", "Created By", "Assigned Users",
             "Status", "Priority", "Visibility", "Created At", "Updated At", "Due Date", "Completed At",
             "Start Date", "Overdue Days", "Status Timeline"]
ACC_COLS = ["Label", "App / Dashboard", "URL", "Role", "Login (no passwords)", "Notes"]
HEAD = 3  # header row of Issues; data starts at row 4
NAVY = "1F3864"
F, FB = Font(name="Arial", size=10), Font(name="Arial", size=10, bold=True)
FH = Font(name="Arial", size=10, bold=True, color="FFFFFF")
FT = Font(name="Arial", size=14, bold=True, color=NAVY)
FLINK = Font(name="Arial", size=10, color="0563C1", underline="single")
FILL_H, FILL_EV = PatternFill("solid", fgColor=NAVY), PatternFill("solid", fgColor="FFF2CC")
S = Side(style="thin", color="BFBFBF"); BD = Border(left=S, right=S, top=S, bottom=S)
TOP = Alignment(wrap_text=True, vertical="top"); TOPC = Alignment(wrap_text=True, vertical="top", horizontal="center")
IN_FOLDER = "Added in the attachment folder"
IMG = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")
VID = (".mp4", ".mov", ".webm", ".mkv", ".avi")
DF = "yyyy-mm-dd hh:mm"
now = lambda: dt.datetime.now().replace(microsecond=0)


def save(wb, path):  # atomic: an interruption never corrupts the log
    fd, tmp = tempfile.mkstemp(suffix=".xlsx", dir=os.path.dirname(os.path.abspath(path)))
    os.close(fd)
    try:
        wb.save(tmp); os.replace(tmp, path)
    finally:
        if os.path.exists(tmp): os.remove(tmp)


def load(path):
    if not os.path.exists(path): sys.exit(f"No workbook at {path}. Run init first.")
    return load_workbook(path)


def meta(wb):
    m = wb["_meta"]
    return {m.cell(row=r, column=1).value: m.cell(row=r, column=2).value for r in range(1, m.max_row + 1)}


def set_meta(wb, key, value):
    m = wb["_meta"]
    for r in range(1, m.max_row + 1):
        if m.cell(row=r, column=1).value == key:
            m.cell(row=r, column=2, value=value); return
    m.append([key, value])


def att_dir(path, wb):
    return os.path.join(os.path.dirname(os.path.abspath(path)), meta(wb)["Attachments"])


def issue_rows(ws):
    return [r for r in range(HEAD + 1, ws.max_row + 1) if ws.cell(row=r, column=1).value]


def find_row(ws, iss_id):
    for r in issue_rows(ws):
        if str(ws.cell(row=r, column=1).value).split(" - ")[0] == iss_id: return r
    return None


def num(text, prefix):
    m = re.search(prefix + r"-?_?(\d+)", str(text or ""))
    return int(m.group(1)) if m else 0


def highest_in(path, prefix):
    """Highest ISS/DEC number found in a previous report (.xlsx) or a folder of them."""
    files = [path] if path.endswith(".xlsx") else glob.glob(os.path.join(path, "**", "*.xlsx"), recursive=True)
    best = 0
    for f in files:
        try:
            wb = load_workbook(f, read_only=True)
        except Exception:
            continue
        for ws in wb.worksheets:
            for row in ws.iter_rows(max_col=1, values_only=True):
                for part in str(row[0] or "").split(" - "):
                    if part.strip().startswith(prefix): best = max(best, num(part, prefix))
    return best


def row_height(values):
    lines = 1
    for text, width in values:
        n = sum(max(1, -(-len(seg) // max(int(width * 1.15), 1))) for seg in str(text or "").split("\n"))
        lines = max(lines, n)
    return max(30, min(409, lines * 13 + 6))


def style_row(ws, r):
    for c in range(1, len(COLS) + 1):
        x = ws.cell(row=r, column=c)
        if not (c in (C["Screenshot"], C["Recording"]) and x.hyperlink):
            x.font = FB if c in (C["ID"], C["Title"]) else F
        x.alignment = TOPC if c in (C["Severity"], C["Status"]) else TOP
        x.border = BD
        if c in (C["Screenshot"], C["Recording"]): x.fill = FILL_EV
    ws.row_dimensions[r].height = row_height([(ws.cell(row=r, column=c).value, WIDTH[c - 1]) for c in
                                              (C["Title"], C["Description"], C["Notes"], C["Accounts & Apps"])])


def refresh_evidence(ws, r, folder, att_name):
    """Rebuild Screenshot/Recording cells from the files in the attachments folder (links kept)."""
    iss = str(ws.cell(row=r, column=1).value).split(" - ")[0]
    files = sorted(f for f in (os.listdir(folder) if os.path.isdir(folder) else [])
                   if f.startswith(iss + ".") or f.startswith(iss + " ~"))
    for col, exts in ((C["Screenshot"], IMG), (C["Recording"], VID)):
        x = ws.cell(row=r, column=col)
        urls = [u for u in str(x.value or "").split("\n") if u.startswith("http")]
        mine = [f for f in files if f.lower().endswith(exts)]
        lines = urls + ([f"{IN_FOLDER}: " + ", ".join(mine)] if mine else [])
        x.value = "\n".join(lines) or None
        target = urls[0] if urls else (f"{att_name}/{mine[0]}" if mine else None)
        x.hyperlink = target
        x.font = FLINK if target else F
    return files


# ---------------------------------------------------------------------------------------------
def header(ws, row, names, widths):
    for i, (n, w) in enumerate(zip(names, widths), 1):
        x = ws.cell(row=row, column=i, value=n)
        x.font, x.fill, x.border = FH, FILL_H, BD
        x.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[L(i)].width = w
    ws.row_dimensions[row].height = 30


def dropdown(ws, col, opts, r1, r2):
    dv = DataValidation(type="list", formula1='"' + ",".join(opts) + '"', allow_blank=True)
    dv.showErrorMessage = False
    ws.add_data_validation(dv); dv.add(f"{L(col)}{r1}:{L(col)}{r2}")


def cmd_init(a):
    os.makedirs(a.dir, exist_ok=True)
    safe = re.sub(r"[^\w\-]+", "_", a.project).strip("_")
    batch = a.batch or 1 + max([int(m.group(1)) for f in os.listdir(a.dir)
                                for m in [re.search(r" - (\d{3})\.xlsx$", f)] if m and f.startswith(safe)] or [0])
    t = now()
    path = a.file or os.path.join(a.dir, f"{safe}_Issues_{t:%d_%b_%Y} - {batch:03d}.xlsx")
    if os.path.exists(path) and not a.force:
        sys.exit(f"{path} exists - resuming? run status instead (or --force to recreate).")
    prev = a.continue_from or (a.dir if any(f.endswith(".xlsx") for f in os.listdir(a.dir)) else None)
    start_iss = (a.start_id - 1) if a.start_id else (highest_in(prev, "ISS") if prev else 0)
    start_dec = highest_in(prev, "DEC") if prev else 0
    wb = Workbook(); ws = wb.active; ws.title = "Issues"
    ws["A1"] = f"{a.project} — issues found in testing"; ws["A1"].font = FT; ws.row_dimensions[1].height = 22
    ws["A2"] = f"Batch {batch:03d} · started {t:%d %b %Y} · {a.url or ''}"; ws["A2"].font = Font(name="Arial", size=9, color="7F7F7F")
    header(ws, HEAD, COLS, WIDTH)
    ws.freeze_panes = f"E{HEAD + 1}"
    ws.auto_filter.ref = f"A{HEAD}:{L(len(COLS))}{HEAD}"
    ws.page_setup.orientation = "landscape"; ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 0
    sv = L(C["Severity"])
    dropdown(ws, C["Severity"], SEV, HEAD + 1, HEAD + 500)
    dropdown(ws, C["Status"], STATUS, HEAD + 1, HEAD + 500)
    for k, color in SEV_FILL.items():
        ws.conditional_formatting.add(f"{sv}{HEAD + 1}:{sv}{HEAD + 500}", CellIsRule(
            operator="equal", formula=[f'"{k}"'], fill=PatternFill("solid", fgColor=color)))
    acc = wb.create_sheet("Test Accounts"); header(acc, 1, ACC_COLS, [16, 22, 34, 18, 28, 40]); acc.freeze_panes = "A2"
    cov = wb.create_sheet("Coverage")
    header(cov, 1, ["Module / Flow", "Area / Page", "Status", "Passes Done", "Issues", "Notes", "Updated At"],
           [24, 30, 13, 40, 8, 50, 17])
    cov.freeze_panes = "A2"; dropdown(cov, 3, COV_ST, 2, 500)
    lg = wb.create_sheet("Session Log"); header(lg, 1, ["Timestamp", "Note"], [17, 120])
    m = wb.create_sheet("_meta"); m.sheet_state = "hidden"
    att = f"Attachments - {batch:03d}"
    for k, v in [("Project", a.project), ("Batch", batch), ("Attachments", att), ("App URL", a.url),
                 ("Brief", a.brief), ("Environment", a.environment), ("Default Env", a.default_env),
                 ("Next ISS", start_iss + 1), ("Next DEC", start_dec + 1), ("Started At", t),
                 ("Grand Project", a.grand_project), ("Bucket", a.bucket or f"QA - {t:%m.%Y}"),
                 ("Created By", a.created_by)]:
        m.append([k, v])
    lg.append([t, f"Batch {batch:03d} started. Target: {a.url or '-'}. First ID: ISS-{start_iss + 1:03d}"])
    lg.cell(row=2, column=1).number_format = DF
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(path)), att), exist_ok=True)
    save(wb, path)
    print(f"Created {path}\nAttachments folder: {att}\nFirst ID: ISS-{start_iss + 1:03d}\n"
          "Next: register every app/dashboard account with `account`.")


def cmd_account(a):
    if a.password: sys.exit("Don't store passwords in the report. Keep them out of the file.")
    wb = load(a.file); acc = wb["Test Accounts"]
    r = next((x for x in range(2, acc.max_row + 1)
              if str(acc.cell(row=x, column=1).value or "").lower() == a.label.lower()), acc.max_row + 1)
    for c, v in enumerate([a.label, a.app, a.url, a.role, a.login, a.notes], 1):
        if v is not None or acc.cell(row=r, column=c).value is None:
            x = acc.cell(row=r, column=c, value=v); x.font, x.alignment, x.border = F, TOP, BD
    save(wb, a.file); print(f"Account: {a.label} — {a.app} ({a.role or '-'})")


def accounts(wb):
    acc = wb["Test Accounts"]
    return {str(acc.cell(row=r, column=1).value): [acc.cell(row=r, column=c).value for c in range(1, 7)]
            for r in range(2, acc.max_row + 1) if acc.cell(row=r, column=1).value}


def render_steps(steps, accs):
    """Steps may be strings or {"as": label, "in": app, "do": action}. The actor tag is shown
    whenever the acting account or app changes, so cross-app flows read unambiguously."""
    out, used, last = [], [], None
    for i, s in enumerate(steps, 1):
        if isinstance(s, dict):
            who, where, do = s.get("as"), s.get("in"), s.get("do") or s.get("step") or ""
            if who and not where and who in accs: where = accs[who][1]
            actor = " · ".join(x for x in (where, who) if x)
            if actor and (who, where) not in used: used.append((who, where))
            out.append(f"{i}. [{actor}] {do}" if actor and actor != last else f"{i}. {do}")
            last = actor or last
        else:
            s = str(s).strip()
            out.append(s if re.match(r"^\d+[.)]", s) else f"{i}. {s}")
            m = re.match(r"^(?:\d+[.)]\s*)?\[([^\]]+)\]", s)
            if m:
                parts = [p.strip() for p in m.group(1).split("·")]
                pair = (parts[-1], parts[0]) if len(parts) > 1 else (parts[0], None)
                if pair not in used: used.append(pair)
    return "\n".join(out), used


def cmd_add(a):
    d = {}
    if a.json:
        d = json.loads(open(a.json, encoding="utf-8").read() if os.path.exists(a.json) else a.json)
    for k in ["title", "section", "steps", "actual", "expected", "severity", "notes", "test_case", "recording",
              "screenshot", "decision", "preconditions", "repro", "env", "accounts"]:
        v = getattr(a, k, None)
        if v not in (None, False): d[k] = v
    d = {k: v.replace("\\n", "\n") if isinstance(v, str) else v for k, v in d.items()}
    miss = [k for k in ["title", "section", "preconditions", "steps", "actual", "expected", "severity"] if not d.get(k)]
    if miss: sys.exit("Missing: " + ", ".join(miss) + "  (preconditions = accounts, data and starting state "
                      "a developer needs before step 1)")
    d["severity"] = str(d["severity"]).capitalize()
    if d["severity"] not in SEV: sys.exit(f"Severity must be one of {SEV}")
    steps = d["steps"] if isinstance(d["steps"], list) else [s for s in str(d["steps"]).split("\n") if s.strip()]
    if len(steps) < 2 and not a.force:
        sys.exit("Steps look too thin: give every action from the starting screen to the moment the issue shows "
                 "(at least 2 steps), or use --force for a genuine one-step issue.")
    wb = load(a.file); ws, m = wb["Issues"], meta(wb); accs = accounts(wb)
    steps_txt, used = render_steps(steps, accs)
    pre = d["preconditions"]
    pre = pre if isinstance(pre, list) else [x for x in re.split(r"\n|;\s*", str(pre)) if x.strip()]
    pre_txt = "\n".join(p if p.lstrip().startswith("-") else f"- {p.strip()}" for p in pre)
    desc = f"Before you start:\n{pre_txt}\nSteps:\n{steps_txt}\nActual: {d['actual']}\nExpected: {d['expected']}"
    if not a.force:
        for r in issue_rows(ws):
            other = str(ws.cell(row=r, column=C["Title"]).value or "")
            if difflib.SequenceMatcher(None, d["title"].lower(), other.lower()).ratio() > 0.85:
                print(f"POSSIBLE DUPLICATE of {ws.cell(row=r, column=1).value}: {other!r}. Not added. Add the new "
                      "place to that row's Notes (update --note), or make the title more specific / use --force.")
                return
    names = []
    for who, where in used:
        role = accs.get(who, [None] * 4)[3] if who else None
        label = f"{who} ({role})" if who and role else (who or "")
        names.append(f"{label} — {where}" if where and label else (label or where))
    for extra in (d.get("accounts") or []) if isinstance(d.get("accounts"), list) else [d.get("accounts")] if d.get("accounts") else []:
        if extra not in names: names.append(extra)
    iss = int(m["Next ISS"]); bid = f"ISS-{iss:03d}"; set_meta(wb, "Next ISS", iss + 1)
    notes = d.get("notes") or None
    if d.get("decision"):
        dec = int(m["Next DEC"]); set_meta(wb, "Next DEC", dec + 1)
        bid = f"{bid} - DEC-{dec:03d}"
        q = d["decision"] if isinstance(d["decision"], str) else "Needs a product decision."
        notes = f"Decision needed: {q}" + (f"\n{notes}" if notes else "")
    r = max(ws.max_row, HEAD) + 1
    vals = {"ID": bid, "Related test case ID": d.get("test_case") or "—", "Section": d["section"],
            "Title": d["title"], "Accounts & Apps": "\n".join(names) or None, "Description": desc,
            "Severity": d["severity"], "Reproducibility": d.get("repro") or "Always",
            "Environment": d.get("env") or m.get("Default Env"), "Notes": notes, "Status": "Open"}
    for k, v in vals.items(): ws.cell(row=r, column=C[k], value=v)
    rec = d.get("recording")
    if rec and str(rec).startswith("http"): ws.cell(row=r, column=C["Recording"], value=rec)
    refresh_evidence(ws, r, att_dir(a.file, wb), m["Attachments"]); style_row(ws, r)
    cov = wb["Coverage"]; secs = [x.strip().lower() for x in re.split(r"[→,;]", d["section"])]
    for cr in range(2, cov.max_row + 1):  # bump the issue count of the matching coverage row
        if str(cov.cell(row=cr, column=1).value or "").strip().lower() in secs:
            cov.cell(row=cr, column=5).value = (cov.cell(row=cr, column=5).value or 0) + 1; break
    ws.auto_filter.ref = f"A{HEAD}:{L(len(COLS))}{r}"
    save(wb, a.file)
    print(f"Logged {bid} [{d['severity']}] {d['title']}")
    shots = d.get("screenshot") or []
    for p in [shots] if isinstance(shots, str) else shots:
        attach(a.file, bid.split(" - ")[0], p, None)
    if rec and not str(rec).startswith("http") and os.path.exists(rec):
        attach(a.file, bid.split(" - ")[0], rec, None)


def attach(path, iss_id, src, box):
    """Copy evidence into the attachments folder as ISS-xxx.ext (ISS-xxx ~1/~2... when several), optionally boxed."""
    if not os.path.exists(src): print(f"  (evidence not found: {src})"); return
    wb = load(path); ws, m = wb["Issues"], meta(wb); folder = att_dir(path, wb); os.makedirs(folder, exist_ok=True)
    ext = os.path.splitext(src)[1].lower() or ".png"
    have = [f for f in os.listdir(folder) if f.startswith(iss_id + ".") or f.startswith(iss_id + " ~")]
    if len(have) == 1 and have[0].startswith(iss_id + "."):
        os.rename(os.path.join(folder, have[0]), os.path.join(folder, f"{iss_id} ~1{os.path.splitext(have[0])[1]}"))
    dest = os.path.join(folder, f"{iss_id}{ext}" if not have else f"{iss_id} ~{len(have) + 1}{ext}")
    if box and ext in IMG:
        try:
            from PIL import Image, ImageDraw
            im = Image.open(src).convert("RGB"); x1, y1, x2, y2 = [int(v) for v in box.split(",")]
            ImageDraw.Draw(im).rectangle([x1, y1, x2, y2], outline=(230, 0, 0), width=max(3, im.width // 300))
            im.save(dest)
        except Exception as e:
            print(f"  (could not draw box: {e}; copied as is)"); shutil.copy2(src, dest)
    else:
        shutil.copy2(src, dest)
    r = find_row(ws, iss_id)
    if r: refresh_evidence(ws, r, folder, m["Attachments"]); style_row(ws, r)
    save(wb, path); print(f"  attached {os.path.basename(dest)}")


def cmd_attach(a):
    attach(a.file, a.id, a.path, a.box)


def cmd_update(a):
    """Retest results or extra findings on an existing issue (works on earlier batch files too)."""
    wb = load(a.file); ws = wb["Issues"]; r = find_row(ws, a.id)
    if not r: sys.exit(f"{a.id} not found in {a.file}")
    if a.status:
        if a.status not in STATUS: sys.exit(f"Status must be one of {STATUS}")
        ws.cell(row=r, column=C["Status"], value=a.status)
    if a.severity: ws.cell(row=r, column=C["Severity"], value=a.severity.capitalize())
    if a.repro: ws.cell(row=r, column=C["Reproducibility"], value=a.repro)
    if a.note:
        x = ws.cell(row=r, column=C["Notes"]); stamp = f"[{now():%d/%m/%Y}] {a.note}"
        x.value = f"{x.value}\n{stamp}" if x.value else stamp
    style_row(ws, r); save(wb, a.file); print(f"Updated {a.id}")


def cmd_coverage(a):
    wb = load(a.file); cov = wb["Coverage"]
    r = next((x for x in range(2, cov.max_row + 1)
              if str(cov.cell(row=x, column=1).value or "").lower() == a.module.lower()
              and str(cov.cell(row=x, column=2).value or "").lower() == a.area.lower()), None)
    if r is None:
        r = cov.max_row + 1
        cov.cell(row=r, column=1, value=a.module); cov.cell(row=r, column=2, value=a.area); cov.cell(row=r, column=5, value=0)
    if a.status: cov.cell(row=r, column=3, value=a.status)
    if a.passes:
        have = [p.strip() for p in str(cov.cell(row=r, column=4).value or "").split(",") if p.strip()]
        have += [p.strip() for p in a.passes.split(",") if p.strip() and p.strip() not in have]
        cov.cell(row=r, column=4, value=", ".join(have))
    if a.notes:
        old = cov.cell(row=r, column=6).value
        cov.cell(row=r, column=6, value=f"{old} | {a.notes}" if old else a.notes)
    cov.cell(row=r, column=7, value=now()).number_format = DF
    for c in range(1, 8):
        x = cov.cell(row=r, column=c); x.font, x.alignment, x.border = F, TOP, BD
    save(wb, a.file); print(f"Coverage: {a.module} / {a.area or '-'} -> {a.status or '(unchanged)'}")


def cmd_note(a):
    wb = load(a.file); lg = wb["Session Log"]; r = lg.max_row + 1
    lg.cell(row=r, column=1, value=now()).number_format = DF; lg.cell(row=r, column=2, value=a.text)
    for c in (1, 2): lg.cell(row=r, column=c).font, lg.cell(row=r, column=c).alignment = F, TOP
    save(wb, a.file); print("Noted.")


def cmd_status(a):
    wb = load(a.file); ws, m = wb["Issues"], meta(wb); rs = issue_rows(ws)
    sev = [ws.cell(row=r, column=C["Severity"]).value for r in rs]
    print(f"{m['Project']} | batch {int(m['Batch']):03d} | {m.get('App URL') or '-'} | next ID ISS-{int(m['Next ISS']):03d}")
    print("Accounts:")
    for v in accounts(wb).values(): print(f"  {v[0]} — {v[1]} ({v[3] or '-'}) {v[4] or ''}")
    print(f"Issues logged: {len(rs)} (" + ", ".join(f"{s}={sev.count(s)}" for s in SEV if sev.count(s)) + ")")
    print("Logged so far (don't re-log these):")
    for r in rs:
        print(f"  {ws.cell(row=r, column=1).value} | {ws.cell(row=r, column=C['Section']).value} | "
              f"{ws.cell(row=r, column=C['Title']).value}")
    cov = wb["Coverage"]; print("Coverage:")
    for r in range(2, cov.max_row + 1):
        v = [cov.cell(row=r, column=c).value for c in range(1, 7)]
        if v[0]: print(f"  [{v[2] or '?'}] {v[0]} / {v[1] or '-'} | passes: {v[3] or '-'} | issues: {v[4] or 0}"
                       + (f" | {v[5]}" if v[5] else ""))
    lg = wb["Session Log"]; print("Last notes:")
    for r in range(max(2, lg.max_row - 4), lg.max_row + 1):
        print(f"  {lg.cell(row=r, column=1).value} {lg.cell(row=r, column=2).value}")


def cmd_finalize(a):
    wb = load(a.file); ws, m = wb["Issues"], meta(wb); folder = att_dir(a.file, wb)
    files = sorted(os.listdir(folder)) if os.path.isdir(folder) else []
    ids = set()
    for r in issue_rows(ws):
        ids.add(str(ws.cell(row=r, column=1).value).split(" - ")[0])
        refresh_evidence(ws, r, folder, m["Attachments"]); style_row(ws, r)
    orphans = [f for f in files if re.split(r"[ .]", f)[0] not in ids]
    ws.auto_filter.ref = f"A{HEAD}:{L(len(COLS))}{max(HEAD, ws.max_row)}"
    rg = lambda name: f"Issues!${L(C[name])}${HEAD + 1}:${L(C[name])}${HEAD + 500}"  # noqa: E731
    if "Summary" in wb.sheetnames: del wb["Summary"]
    s = wb.create_sheet("Summary", 1)
    s["A1"] = f"{m['Project']} — batch {int(m['Batch']):03d} summary"; s["A1"].font = FT
    s.column_dimensions["A"].width, s.column_dimensions["B"].width = 34, 10
    s.column_dimensions["D"].width, s.column_dimensions["E"].width = 40, 10
    rows = [("Total issues", f"=COUNTA({rg('ID')})"), ("Open", f'=COUNTIF({rg("Status")},"Open")'),
            ("Decisions needed", f'=COUNTIF({rg("ID")},"*DEC-*")')] + \
           [(sv_, f'=COUNTIF({rg("Severity")},"{sv_}")') for sv_ in SEV]
    for i, (k, v) in enumerate(rows, 3):
        s.cell(row=i, column=1, value=k).font = FB if i < 6 else F
        s.cell(row=i, column=2, value=v).font = FB if i < 6 else F
    s["D3"], s["E3"] = "Section", "Issues"
    for c in ("D3", "E3"): s[c].font, s[c].fill = FH, FILL_H
    secs = sorted({str(ws.cell(row=r, column=C["Section"]).value) for r in issue_rows(ws)})
    for i, sec in enumerate(secs, 4):
        s.cell(row=i, column=4, value=sec).font = F
        s.cell(row=i, column=5, value=f"=COUNTIF({rg('Section')},D{i})").font = F
    if a.task_import:
        if "Task Import" in wb.sheetnames: del wb["Task Import"]
        ti = wb.create_sheet("Task Import", 2); header(ti, 1, TASK_COLS, [60 if n == "Subject" else 15 for n in TASK_COLS])
        for r in issue_rows(ws):
            g = lambda k: ws.cell(row=r, column=C[k]).value  # noqa: E731
            area = re.split(r"[,;]", str(g("Section")))[0].split("→")[-1].strip()
            ti.append([g("ID"), f"{area}: {g('Title')}", m.get("Grand Project"), m.get("Project"), m.get("Bucket"),
                       m.get("Created By"), None, "Not Started", SEV_PRI.get(g("Severity"), "Low"), "Public",
                       now(), now()] + [None] * 5)
        for row in ti.iter_rows(min_row=2):
            for x in row:
                x.font = F
                if isinstance(x.value, dt.datetime): x.number_format = DF
    lg = wb["Session Log"]; r = lg.max_row + 1
    lg.cell(row=r, column=1, value=now()).number_format = DF; lg.cell(row=r, column=2, value="Report finalized.")
    save(wb, a.file)
    rs = issue_rows(ws); sev = [ws.cell(row=r, column=C["Severity"]).value for r in rs]
    print(f"Finalized {a.file}: {len(rs)} issues (" + ", ".join(f"{s_}={sev.count(s_)}" for s_ in SEV if sev.count(s_)) + ")")
    for f in orphans: print(f"  WARNING attachment not linked to any issue: {f}")
    if a.zip:
        base = os.path.dirname(os.path.abspath(a.file))
        zpath = os.path.join(base, f"{re.sub(r'[^A-Za-z0-9]+', '_', m['Project']).strip('_')}_Issues_Batch_{int(m['Batch']):03d}.zip")
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
            z.write(a.file, os.path.basename(a.file))
            for f in files: z.write(os.path.join(folder, f), os.path.join(m["Attachments"], f))
        print(f"Zipped: {zpath}")


p = argparse.ArgumentParser(description=__doc__); sp = p.add_subparsers(dest="cmd", required=True)
i = sp.add_parser("init")
i.add_argument("--project", required=True); i.add_argument("--dir", default=".")
i.add_argument("--file", help="override the generated file name")
i.add_argument("--batch", type=int, help="batch number (default: next after existing reports in --dir)")
i.add_argument("--start-id", type=int, help="first ISS number (default: continue after previous reports)")
i.add_argument("--continue-from", help="previous report .xlsx or folder to continue ISS/DEC numbering from")
for f in ["url", "brief", "environment", "bucket"]: i.add_argument(f"--{f}")
i.add_argument("--default-env", default="Chrome · Desktop 1440x900 · English",
               help="Environment column value when an issue doesn't give one")
i.add_argument("--grand-project", default="Development"); i.add_argument("--created-by", default="Claude.QA")
i.add_argument("--force", action="store_true")
ac = sp.add_parser("account"); ac.add_argument("--file", required=True); ac.add_argument("--label", required=True)
ac.add_argument("--app", required=True)
for f in ["url", "role", "login", "notes", "password"]: ac.add_argument(f"--{f}")
ad = sp.add_parser("add"); ad.add_argument("--file", required=True); ad.add_argument("--json")
for f in ["title", "section", "steps", "actual", "expected", "severity", "notes", "recording", "preconditions",
          "repro", "env", "accounts"]:
    ad.add_argument(f"--{f}")
ad.add_argument("--test-case", dest="test_case"); ad.add_argument("--screenshot", action="append")
ad.add_argument("--decision", nargs="?", const=True, help="needs a product decision (optional question text)")
ad.add_argument("--force", action="store_true")
at = sp.add_parser("attach"); at.add_argument("--file", required=True); at.add_argument("--id", required=True)
at.add_argument("--path", required=True); at.add_argument("--box", help="x1,y1,x2,y2 to outline in red")
up = sp.add_parser("update"); up.add_argument("--file", required=True); up.add_argument("--id", required=True)
for f in ["status", "severity", "repro", "note"]: up.add_argument(f"--{f}")
cv = sp.add_parser("coverage"); cv.add_argument("--file", required=True); cv.add_argument("--module", required=True)
cv.add_argument("--area", default=""); cv.add_argument("--status", choices=COV_ST)
cv.add_argument("--passes"); cv.add_argument("--notes")
nt = sp.add_parser("note"); nt.add_argument("--file", required=True); nt.add_argument("--text", required=True)
sp.add_parser("status").add_argument("--file", required=True)
fz = sp.add_parser("finalize"); fz.add_argument("--file", required=True)
fz.add_argument("--task-import", action="store_true", help="add a sheet in the task-report export columns")
fz.add_argument("--zip", action="store_true", help="zip the report + attachments folder for sending")
args = p.parse_args()
{"init": cmd_init, "account": cmd_account, "add": cmd_add, "attach": cmd_attach, "update": cmd_update,
 "coverage": cmd_coverage, "note": cmd_note, "status": cmd_status, "finalize": cmd_finalize}[args.cmd](args)
