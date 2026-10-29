/* resume_pdf.js: builds a one-page resume and a one-page cover letter as PDFs from one application JSON,
   using pdf-lib. The same file runs in the browser (the job board previews and downloads) and in node
   (the tailoring agent runs it to check that both documents fit on one page before saving).

   Layout: grey sidebar resume (Helvetica, blue headings with a rule) and a centred-header cover letter.
   Text in [[double brackets]] is an unfilled placeholder and is drawn highlighted yellow; **text** is bold.
   See templates/ for the JSON shape.

   ResumePdf.build(PDFLib, data) -> Promise<{ resume: Uint8Array, cover: Uint8Array|null, resumePages, coverPages }> */
(function (root) {
  "use strict";
  const W = 612, H = 792;
  const hex = (h, rgb) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
  // Characters Helvetica (WinAnsi) can draw beyond Latin-1, by code point.
  const WINANSI_EXTRA = [8364, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 381, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 382, 376];
  // Replacements for common characters it can't draw (by code point), everything else unknown is dropped.
  const SWAP = { 8219: 8217, 8242: 8217, 8243: 8221, 8208: 45, 8209: 45, 8210: 45, 160: 32, 8201: 32, 8202: 32, 8239: 32, 8194: 32, 8195: 32 };
  const DROP = [8203, 8204, 8205, 65279];
  function clean(s) {
    let out = "";
    for (const ch of String(s == null ? "" : s)) {
      let c = ch.codePointAt(0);
      if (c === 8594) { out += "->"; continue; }
      if (c === 8592) { out += "<-"; continue; }
      if (SWAP[c] != null) c = SWAP[c];
      if (DROP.includes(c)) continue;
      if ((c >= 32 && c < 256 && c !== 127) || c === 10 || WINANSI_EXTRA.includes(c)) out += String.fromCodePoint(c);
    }
    return out;
  }
  // "Some **bold** and [[placeholder]] text" -> runs [{t, b, hl}]
  function runs(text, bold) {
    // Scan for **bold** and [[placeholder]] markers without regular expressions.
    const out = [], s = clean(text); let i = 0, buf = "";
    const flush = () => { if (buf) out.push({ t: buf, b: !!bold }); buf = ""; };
    while (i < s.length) {
      if (s.startsWith("**", i)) { const e = s.indexOf("**", i + 2); if (e > i + 2) { flush(); out.push({ t: s.slice(i + 2, e), b: true }); i = e + 2; continue; } }
      if (s.startsWith("[[", i)) { const e = s.indexOf("]]", i + 2); if (e > i + 2) { flush(); out.push({ t: "[" + s.slice(i + 2, e) + "]", b: !!bold, hl: true }); i = e + 2; continue; } }
      buf += s[i]; i++;
    }
    flush();
    return out;
  }


  async function build(PDFLib, data) {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const C = { blue: hex("#2B5A93", rgb), ink: hex("#222222", rgb), grey: hex("#555555", rgb), side: hex("#EEF2F6", rgb), rule: hex("#BBBBBB", rgb), hl: hex("#FFF1A8", rgb) };

    async function newDoc(title) {
      const doc = await PDFDocument.create();
      doc.setTitle(title); doc.setAuthor(clean(data.name || "Your Name")); doc.setCreator("job-search-agent"); doc.setProducer("pdf-lib");
      const F = { r: await doc.embedFont(StandardFonts.Helvetica), b: await doc.embedFont(StandardFonts.HelveticaBold), i: await doc.embedFont(StandardFonts.HelveticaOblique) };
      return { doc, F };
    }

    // Greedy word wrap over styled runs (same rule as ReportLab: break at spaces, measure with each font).
    function wrap(F, rs, size, width, italic) {
      const words = []; // {t, b, hl, space}
      rs.forEach(r => {
        const parts = r.t.split(/( +)/);
        parts.forEach(p => { if (p === "") return; if (/^ +$/.test(p)) { if (words.length) words[words.length - 1].sp = p.length; return; } words.push({ t: p, b: r.b, hl: r.hl, sp: 0 }); });
      });
      const font = (w) => italic ? F.i : w.b ? F.b : F.r;
      // Measure glyph by glyph: pdf-lib's widthOfTextAtSize applies kerning, but drawText doesn't, so whole-string widths come out short.
      const wid = (w) => { const f = font(w); let t = 0; for (const ch of w.t) t += f.widthOfTextAtSize(ch, size); return t; };
      const spw = (w) => font(w).widthOfTextAtSize(" ", size) * (w.sp || 0); // sp = spaces after this word (0 = glued to the next)
      const lines = []; let cur = [], cw = 0;
      words.forEach(w => {
        const ww = wid(w);
        const add = cur.length ? spw(cur[cur.length - 1]) + ww : ww;
        if (cur.length && cur[cur.length - 1].sp && cw + add > width + 0.01) { lines.push(cur); cur = [w]; cw = ww; }
        else { cur.push(w); cw += add; }
      });
      if (cur.length) lines.push(cur);
      return { lines, font, wid, spw };
    }

    // A vertical flow inside one column. y is the current top edge (PDF coordinates).
    function Flow(ctx, x, top, width, bottom) {
      return { ctx, x, top, width, bottom, y: top, first: true, overflow: false, lastAfter: 0 };
    }
    // Like ReportLab frames: the gap between blocks is the larger of the previous spaceAfter and the next spaceBefore.
    function space(fl, sb) { if (!fl.first) fl.y -= Math.max((sb || 0) - (fl.lastAfter || 0), 0); fl.lastAfter = 0; }

    // Draw a paragraph. opts: size, leading, color, bold, italic, align ("left"|"center"|"right"),
    // spaceBefore, spaceAfter, indent (left), bullet {text, indent, size}
    function para(fl, text, o) {
      const { F, page } = fl.ctx;
      const indent = o.indent || 0;
      const w = wrap(F, Array.isArray(text) ? text : runs(text, o.bold), o.size, fl.width - indent, o.italic);
      space(fl, o.spaceBefore || 0);
      const h = Math.max(1, w.lines.length) * o.leading;
      if (fl.y - h < fl.bottom) fl.overflow = true;
      let base = fl.y - o.size; // first baseline: one font size below the top (ReportLab's rule)
      if (o.bullet) page.drawText(o.bullet.text, { x: fl.x + o.bullet.indent, y: base, size: o.bullet.size, font: F.r, color: o.color });
      w.lines.forEach((line, li) => {
        const lineW = line.reduce((s, wd, k) => s + w.wid(wd) + (k < line.length - 1 ? w.spw(wd) : 0), 0);
        let cx = fl.x + indent + (o.align === "center" ? (fl.width - indent - lineW) / 2 : o.align === "right" ? (fl.width - indent - lineW) : 0);
        // Draw runs of same-styled words as one string, spaces included, so copy/paste and ATS parsers read real words.
        let k = 0;
        while (k < line.length) {
          const f = w.font(line[k]), hl = !!line[k].hl; let txt = "", segW = 0, j = k;
          while (j < line.length && w.font(line[j]) === f && !!line[j].hl === hl) {
            const last = j === line.length - 1;
            txt += line[j].t + (last ? "" : " ".repeat(line[j].sp || 0));
            segW += w.wid(line[j]) + (last ? 0 : w.spw(line[j]));
            j++;
          }
          if (hl) page.drawRectangle({ x: cx - 0.5, y: base - o.size * 0.22, width: segW + 1, height: o.size * 1.18, color: C.hl });
          page.drawText(txt, { x: cx, y: base, size: o.size, font: f, color: o.color });
          cx += segW; k = j;
        }
        base -= o.leading;
      });
      fl.y -= h; fl.y -= (o.spaceAfter || 0); fl.lastAfter = o.spaceAfter || 0; fl.first = false;
      return h;
    }

    // ---------------- resume ----------------
    async function resume() {
      const { doc, F } = await newDoc(`${clean(data.name || "Your Name")} Resume`);
      const page = doc.addPage([W, H]);
      page.drawRectangle({ x: 0, y: 0, width: 212, height: H, color: C.side });
      const ctx = { F, page };
      // sidebar: x 34, width 146, top H-36
      const sb = Flow(ctx, 34, H - 36, 146, 20);
      const sHead = (t) => { para(sb, t, { size: 9.5, leading: 11.4, color: C.blue, bold: true, spaceBefore: 13.2, spaceAfter: 5.6 }); };
      const sItem = (t, extra) => para(sb, t, Object.assign({ size: 8.6, leading: 11.2, color: C.ink }, extra || {}));
      sHead("CONTACT");
      (data.contact || []).forEach(t => sItem(t));
      sHead("EDUCATION");
      (data.education || []).forEach((e, i) => {
        sItem(e.school, { bold: true, spaceBefore: i ? 5 : 0 });
        (e.lines || []).forEach(t => sItem(t));
        if (e.date) para(sb, e.date, { size: 8, leading: 11.1, color: C.grey });
      });
      if ((data.skills || []).length) {
        sHead("SKILLS");
        data.skills.forEach((g, i) => { sItem(g.label, { bold: true, spaceBefore: i ? 5 : 0 }); (g.items || []).forEach(t => sItem(t)); });
      }
      if ((data.coursework || []).length) {
        sHead(clean(data.coursework_title || "RELEVANT COURSEWORK"));
        data.coursework.forEach(t => sItem(t));
      }
      // main column: x 234..574, top H-32
      const mw = 340, mn = Flow(ctx, 234, H - 32, mw, 24);
      const heading = (t, firstHead) => {
        space(mn, firstHead ? 14.3 : 13.3);
        if (mn.y - 16.7 < mn.bottom) mn.overflow = true;
        page.drawText(t, { x: mn.x, y: mn.y - 8.2, size: 9.5, font: F.b, color: C.blue });
        page.drawLine({ start: { x: mn.x, y: mn.y - 13.4 }, end: { x: mn.x + mw, y: mn.y - 13.4 }, thickness: 0.8, color: C.blue });
        mn.y -= 16.7; mn.first = false;
      };
      const body = { size: 8.9, leading: 12, color: C.ink };
      const bullet = (t, sb0) => para(mn, t, Object.assign({}, body, { indent: 12, spaceBefore: sb0 == null ? 1.5 : sb0, bullet: { text: "•", indent: 2, size: 10 } }));
      para(mn, data.name || "Your Name", { size: 22, leading: 24, color: C.blue, bold: true });
      para(mn, data.headline || "", { size: 11, leading: 13, color: C.grey, spaceBefore: 0.7 });
      heading("SUMMARY", true);
      para(mn, data.summary || "", body);
      (data.sections || ["experience", "projects"]).forEach(sec => {
        if (sec === "experience" && (data.experience || []).length) {
          heading("EXPERIENCE");
          data.experience.forEach((e, i) => {
            space(mn, i ? 5.9 : 6.0);
            const top = mn.y;
            const title = e.org ? `${clean(e.title)} | ${clean(e.org)}` : clean(e.title);
            const lw = wrap(F, runs(title, true), 8.9, mw - 92);
            const tmp = { ctx, x: mn.x, top, width: mw - 92, bottom: mn.bottom, y: top, first: true };
            para(tmp, runs(title, true), { size: 8.9, leading: 12, color: C.ink });
            const tmp2 = { ctx, x: mn.x + mw - 92, top, width: 92, bottom: mn.bottom, y: top, first: true };
            para(tmp2, e.dates || "", { size: 8.4, leading: 12, color: C.grey, align: "right" });
            mn.y = Math.min(tmp.y, tmp2.y); mn.first = false; void lw;
            (e.bullets || []).forEach(b => bullet(b));
          });
        }
        if (sec === "projects" && (data.projects || []).length) {
          heading(clean(data.projects_title || "PROJECTS").toUpperCase());
          data.projects.forEach((p, i) => {
            space(mn, 7.0);
            const title = p.kind ? `${clean(p.name)} | ${clean(p.kind)}` : clean(p.name);
            para(mn, runs(title, true), { size: 8.9, leading: 12, color: C.ink });
            if (p.tech) para(mn, p.tech, { size: 8.2, leading: 11.9, color: C.grey, italic: true });
            (p.bullets || []).forEach((b, k) => bullet(b, k === 0 && p.tech ? 0.1 : 1.5));
          });
        }
        if (sec === "extra" && data.extra) {
          heading(clean(data.extra.title || "").toUpperCase());
          (data.extra.bullets || []).forEach(b => bullet(b));
        }
      });
      const bytes = await doc.save();
      return { bytes, pages: sb.overflow || mn.overflow ? 2 : 1 };
    }

    // ---------------- cover letter ----------------
    async function cover() {
      const c = data.cover; if (!c) return null;
      const { doc, F } = await newDoc(`${clean(data.name || "Your Name")} Cover Letter`);
      const page = doc.addPage([W, H]);
      const fl = Flow({ F, page }, 54, H - 36, 504, 40);
      const body = { size: 9.4, leading: 13.4, color: C.ink };
      const P = (t, sb) => para(fl, t, Object.assign({}, body, { spaceBefore: sb || 0 }));
      para(fl, data.name || "Your Name", { size: 22, leading: 26, color: C.blue, bold: true, align: "center" });
      para(fl, (c.contact || (data.contact || []).slice(0, 4)).map(clean).join("  ·  "), { size: 8.2, leading: 10, color: C.grey, align: "center", spaceBefore: 5.8 });
      // grey rule: 22.2pt tall block, line 10.2pt below its top
      page.drawLine({ start: { x: 54, y: fl.y - 10.2 }, end: { x: 558, y: fl.y - 10.2 }, thickness: 0.6, color: C.rule });
      fl.y -= 22.2;
      [c.date].concat(c.recipient || []).filter(Boolean).forEach(t => P(t));
      P(c.greeting || "", 8);
      (c.before || []).forEach(t => P(t, 8));
      (c.sections || []).forEach(sec => {
        para(fl, sec.title || "", Object.assign({}, body, { bold: true, color: C.blue, spaceBefore: 8, spaceAfter: 2.6 }));
        (sec.paragraphs || []).forEach((t, j) => P(t, j ? 8 : 0));
        (sec.bullets || []).forEach((b, j) => {
          const rs = (b.lead ? [{ t: clean(b.lead), b: true }, { t: " " + clean(b.text), b: false }] : runs(b.text));
          para(fl, rs, Object.assign({}, body, { indent: 12, spaceBefore: j ? 5 : ((sec.paragraphs || []).length ? 5 : 2.6), bullet: { text: "•", indent: 2, size: 10 } }));
        });
      });
      const secs = c.sections || [], lastHasBullets = secs.length && (secs[secs.length - 1].bullets || []).length;
      (c.after || []).forEach((t, i) => P(t, i === 0 && lastHasBullets ? 5 : 8));
      P(c.signoff || "Sincerely,", 8);
      para(fl, data.name || "Your Name", Object.assign({}, body, { bold: true }));
      const bytes = await doc.save();
      return { bytes, pages: fl.overflow ? 2 : 1 };
    }

    const r = await resume(), cv = await cover();
    return { resume: r.bytes, resumePages: r.pages, cover: cv ? cv.bytes : null, coverPages: cv ? cv.pages : 0 };
  }

  const api = { build, clean };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ResumePdf = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

/* ---------------- command line (node) ----------------
   node pdf/resume_pdf.js application.json OUT_DIR
   Writes <Name>_Resume_<Employer>.pdf and <Name>_Cover_Letter_<Employer>.pdf, prints "pages=N" for each,
   and exits with code 2 if either runs past one page. Needs pdf-lib (npm install pdf-lib). */
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  const fs = require("fs"), path = require("path");
  const req = (name) => { for (const p of [name, "/opt/npm-tools/node_modules/" + name, "/usr/lib/node_modules/" + name, "/usr/local/lib/node_modules/" + name]) { try { return require(p); } catch (e) {} } throw new Error("pdf-lib not found (try: npm install pdf-lib)"); };
  (async () => {
    const [inp, out] = process.argv.slice(2);
    if (!inp || !out) { console.log("usage: node pdf/resume_pdf.js application.json OUT_DIR"); process.exit(1); }
    const data = JSON.parse(fs.readFileSync(inp, "utf8")); fs.mkdirSync(out, { recursive: true });
    const safe = (s) => String(s).replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_|_$/g, "");
    const emp = safe(data.employer || "Template"), who = safe(data.name || "Applicant");
    const r = await module.exports.build(req("pdf-lib"), data);
    const rp = path.join(out, `${who}_Resume_${emp}.pdf`); fs.writeFileSync(rp, r.resume); console.log(`${rp} pages=${r.resumePages}`);
    if (r.cover) { const cp = path.join(out, `${who}_Cover_Letter_${emp}.pdf`); fs.writeFileSync(cp, r.cover); console.log(`${cp} pages=${r.coverPages}`); }
    process.exit(r.resumePages > 1 || r.coverPages > 1 ? 2 : 0);
  })().catch(e => { console.error(e); process.exit(1); });
}
