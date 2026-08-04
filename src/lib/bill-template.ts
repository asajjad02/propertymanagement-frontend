/**
 * Hash Residency bill template — browser-rendered.
 *
 * The template is authored for Chrome (grid, aspect-ratio, web fonts, and a JS
 * fit-to-page pass), so we render it in the browser instead of a server engine.
 * The backend sends display-ready tokens (see billing/bill_tokens.py); this
 * module fills them in and exposes the CSS + markup for the print route and the
 * Configuration preview.
 *
 * Two adaptations from the standalone template:
 *  - the Google Fonts <link> is gone; the print route imports the fonts from
 *    @fontsource so rendering never depends on a CDN;
 *  - the hardcoded Hash Residency logo SVG is replaced by {{logo_cell}}, filled
 *    from the account's uploaded logo (or a monogram fallback), so it stays
 *    multi-tenant.
 */

/** Escape a value for safe interpolation into HTML (attributes decode entities). */
function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

/**
 * Fill one bill's markup from its tokens. The `{{logo_cell}}` slot is built
 * first (raw HTML), then every remaining {{token}} is replaced with an escaped
 * string — a token you forgot to supply renders empty instead of leaking
 * `{{late_fee}}` onto a resident's bill.
 */
export function fillBill(tokens: Record<string, string>): string {
  const logoCell = tokens.logo
    ? `<img class="logo-img" src="${esc(tokens.logo)}" alt="">`
    : `<div class="logo-monogram">${esc((tokens.title || '?').trim().charAt(0) || '?')}</div>`;
  return BILL_BODY.replace(/\{\{logo_cell\}\}/g, logoCell).replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => esc(tokens[key] ?? ''),
  );
}

/** Sample tokens for the Configuration live preview (merged with the editor's config). */
export const SAMPLE_TOKENS: Record<string, string> = {
  apt: 'A-101',
  reading_date: '01 Aug 2026',
  billing_month: 'August 2026',
  due_date: '10 Aug 2026',
  previous_reading: '704',
  current_reading: '953',
  units: '249',
  rate: '100',
  electricity: '24,900',
  maintenance: '6,000',
  previous_balance: '',
  other_charges: '',
  subtotal: '30,900',
  total: '30,900',
  after_due: '31,400',
  meter_photo: '',
};

export const BILL_CSS = String.raw`
  :root{
    --ink:        #4A3428;
    --ink-hover:  #5C4234;
    --ink-2:      #8C7263;
    --cream:      #F6F1EA;
    --cream-2:    #EFE5DA;
    --line:       #D8CCC0;
    --rule:       #A79284;
    --paper:      #FFFFFF;
    --logo-ink:   #412814;
    --body-fg:    #3B2C22;
    --auto-tint:  #FBF7F2;
    --focus:      #A8452E;

    --font-body:  "Poppins", "Segoe UI", system-ui, sans-serif;
    --font-mono:  "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    --font-script:"Parisienne", "Segoe Script", cursive;

    --page-w:     210mm;
    --page-h:     297mm;
    --pad-x:      12mm;
    --radius:     12px;
    --fit:        1;
  }

  .billroot *{ box-sizing:border-box; margin:0; padding:0; }

  .sheet{
    width:var(--page-w);
    height:var(--page-h);
    margin:0 auto;
    background:var(--paper);
    box-shadow:0 12px 32px rgba(74,52,40,.18);
    overflow:hidden;
    print-color-adjust:exact;
    -webkit-print-color-adjust:exact;
    font-family:var(--font-body);
    color:var(--body-fg);
  }
  .page{
    position:relative;
    width:calc(var(--page-w) / var(--fit));
    min-height:calc(var(--page-h) / var(--fit));
    padding:9mm var(--pad-x) 0;
    display:flex; flex-direction:column;
    transform:scale(var(--fit));
    transform-origin:top left;
  }

  .fld{
    font-family:inherit; font-size:inherit; font-weight:inherit;
    color:inherit; letter-spacing:inherit;
    display:inline-block; width:100%; min-width:0;
  }

  .masthead{ display:grid; grid-template-columns:104px 1fr; gap:18px; align-items:start; }
  .logo{ width:104px; color:var(--logo-ink); }
  .logo svg{ display:block; width:100%; height:auto; }
  .logo-img{ display:block; width:100%; height:auto; }
  .logo-monogram{
    width:104px; height:104px; border-radius:16px;
    display:grid; place-items:center;
    background:var(--ink); color:#fff;
    font-family:var(--font-body); font-weight:700; font-size:52px;
  }

  .title{ font-size:35px; font-weight:700; color:var(--ink); text-align:center; line-height:1.05; }
  .subtitle{ text-align:center; font-size:13.5px; letter-spacing:.03em; color:var(--ink); margin-top:3px; }

  .paycard{
    margin-top:12px;
    background:var(--cream);
    border:1px solid var(--line);
    border-left:5px solid var(--ink);
    border-radius:4px 12px 12px 4px;
    padding:9px 13px 10px;
  }
  .paycard-top{
    display:flex; align-items:baseline; justify-content:space-between; gap:10px;
    margin-bottom:7px;
  }
  .paycard-eyebrow{
    font-size:9.5px; font-weight:600; letter-spacing:.19em;
    color:var(--ink-2); white-space:nowrap;
  }
  .paycard-title{ font-size:15px; font-weight:600; color:var(--ink); text-align:right; flex:1; }
  .paycard-title .fld{ text-align:right; }

  .iban{
    background:var(--paper);
    border:1px solid var(--line);
    border-radius:8px;
    padding:5px 11px;
    display:flex; align-items:center; gap:10px;
  }
  .iban .tag{ font-size:9.5px; font-weight:600; letter-spacing:.14em; color:var(--ink-2); }
  .iban .fld{
    font-family:var(--font-mono);
    font-size:15px; font-weight:500; letter-spacing:.055em;
    color:var(--ink);
  }
  .paycard-meta{
    margin-top:6px;
    display:grid; grid-template-columns:auto minmax(0,1fr); gap:6px 14px;
    font-size:11.5px; color:var(--ink);
  }
  .paycard-meta div{ display:flex; align-items:baseline; gap:6px; min-width:0; }
  .paycard-meta .lbl{ font-size:9.5px; font-weight:600; letter-spacing:.13em; color:var(--ink-2); white-space:nowrap; }
  .paycard-meta .fld{ font-size:11.5px; font-weight:500; }
  .paycard-meta .mono .fld{ font-family:var(--font-mono); letter-spacing:.04em; }

  .panels{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:11px; }
  .panel{ border-radius:var(--radius); overflow:hidden; }
  .panel-left{ background:var(--cream); border:1px solid var(--line); }
  .panel-row{ display:grid; grid-template-columns:52px 1fr; align-items:center; min-height:50px; }
  .panel-row + .panel-row{ border-top:1px solid var(--line); }
  .icon-cell{ align-self:stretch; display:grid; place-items:center; background:var(--ink); }
  .icon-cell svg{ width:22px; height:22px; stroke:#fff; fill:none; stroke-width:1.7; }
  .panel-text{ padding:5px 13px; }
  .panel-text .lbl{ font-size:12.5px; color:var(--ink); line-height:1.3; }
  .panel-text .val{ font-size:19.5px; font-weight:600; color:var(--ink); letter-spacing:.04em;
    line-height:1.25; min-height:26px; }

  .panel-right{
    background:var(--ink); color:#fff;
    display:grid; grid-template-columns:64px 1fr;
    align-items:center; padding:8px 14px 8px 0; gap:4px;
  }
  .cal-tile{ width:42px; height:42px; margin-left:14px; border-radius:8px; background:#fff; display:grid; place-items:center; }
  .cal-tile svg{ width:23px; height:23px; stroke:var(--ink); fill:none; stroke-width:1.7; }
  .panel-right .stack{ display:flex; flex-direction:column; gap:10px; }
  .panel-right .month, .panel-right .due{ display:flex; align-items:baseline; gap:6px; }
  .panel-right label{ flex:none; white-space:nowrap; }
  .panel-right .month .fld, .panel-right .due .fld{ flex:1; width:auto; min-width:50px; }
  .panel-right .month{ font-size:15.5px; font-weight:600; letter-spacing:.04em; }
  .panel-right .due{ font-size:14.5px; }
  .panel-right .due .fld{ font-weight:600; }

  .summary{ margin-top:11px; border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; }
  .summary-head{ display:grid; grid-template-columns:1fr 1fr; }
  .summary-head div:first-child{
    background:var(--ink-2); color:#fff;
    font-size:15px; font-weight:600; letter-spacing:.12em; padding:8px 18px;
  }
  .summary-head div:last-child{ background:var(--ink); }

  .grid{ display:grid; grid-template-columns:1.12fr 1fr 1.12fr 1fr; }
  .grid > div{
    border-top:1px solid var(--line);
    padding:7px 15px; min-height:39px;
    display:flex; align-items:center;
    background:var(--paper);
  }
  .grid > div:nth-child(1), .grid > div:nth-child(2),
  .grid > div:nth-child(3), .grid > div:nth-child(4){ border-top:none; }
  .grid .k{ font-size:13px; background:var(--cream); }
  .grid .v .fld{
    display:block; width:100%;
    text-align:center; font-size:14.5px; font-weight:400;
    padding:0 2px 4px;
    border-bottom:1px solid var(--rule);
    min-height:22px;
  }
  .grid .v .num{ font-family:var(--font-mono); font-size:13.5px; }
  .grid .k.total{ background:var(--cream-2); font-weight:600; font-size:14px; }
  .grid .v.total .fld{ font-weight:700; border-bottom-color:transparent; }

  .total-bar{
    margin-top:10px; background:var(--ink); color:#fff;
    border-radius:var(--radius);
    display:grid; grid-template-columns:auto 1fr auto;
    align-items:center; gap:16px; padding:9px 18px;
  }
  .total-bar .cap{ font-size:16px; font-weight:600; letter-spacing:.06em; }
  .amount-pill{
    background:var(--cream); color:var(--ink);
    border-radius:10px; padding:8px 16px;
    display:flex; align-items:baseline; gap:12px; max-width:270px;
  }
  .amount-pill .cur{ font-size:14px; font-weight:600; }
  .amount-pill .fld{
    flex:1; text-align:center;
    font-family:var(--font-mono); font-size:18px; font-weight:700;
    border-bottom:1px solid var(--rule); padding-bottom:2px;
  }
  .after{
    display:grid; grid-template-columns:auto 92px; align-items:center; gap:12px;
    border-left:1px solid rgba(255,255,255,.35); padding-left:16px;
  }
  .after .lbl{ font-size:13px; font-weight:600; line-height:1.35; }
  .after .fld{
    display:block; text-align:center;
    font-family:var(--font-mono); font-size:15px; font-weight:500;
    border-bottom:1px solid rgba(255,255,255,.6); padding-bottom:3px;
  }

  .lower{ margin-top:11px; display:grid; grid-template-columns:.88fr 1.12fr; gap:13px; align-items:start; }
  .meter-card{ background:var(--ink); border-radius:var(--radius); padding:8px 8px 2px; }
  .meter-frame{
    border-radius:8px; overflow:hidden; aspect-ratio:16/9;
    background-color:#EDE7E0;
    background-size:cover; background-position:center;
    background-repeat:no-repeat;
  }
  .meter-card .cap{ text-align:center; color:#fff; font-size:13px; font-weight:600; letter-spacing:.14em; padding:6px 0 5px; }

  .instr-head{
    display:inline-block; background:var(--ink); color:#fff;
    border-radius:10px; font-size:13px; font-weight:600; letter-spacing:.09em;
    padding:7px 17px;
  }
  .instr{ margin:8px 2px 0; padding-left:17px; }
  .instr li{ font-size:11.8px; line-height:1.45; margin-bottom:6px; }
  .instr li::marker{ color:var(--ink); }
  .instr b{ font-weight:600; white-space:nowrap; }
  .instr .wa{
    list-style:none; margin-left:-17px;
    display:flex; align-items:center; gap:10px;
    background:#FDFBF8; border:1px solid var(--line);
    border-radius:12px; padding:7px 12px; margin-top:8px;
  }
  .instr .wa svg{ width:19px; height:19px; stroke:var(--ink); fill:none; stroke-width:1.7; flex:none; }
  .instr .wa .wa-txt{ flex:1; min-width:0; }
  .instr .wa span{ display:block; font-size:11.5px; color:var(--ink); line-height:1.35; }
  .instr .wa .fld{ display:block; font-size:15px; font-weight:600; letter-spacing:.02em; }

  .cutline{
    display:flex; align-items:center; gap:9px;
    margin:11px 0 0;
    color:var(--rule);
  }
  .cutline i{ flex:1; height:0; border-top:1.5px dashed var(--line); }
  .cutline svg{ width:15px; height:15px; stroke:var(--rule); fill:none; stroke-width:1.6; flex:none; }

  .stub{
    margin-top:8px;
    border:1px solid var(--line);
    border-radius:var(--radius);
    overflow:hidden;
  }
  .stub-head{
    background:var(--cream-2);
    display:flex; align-items:center; gap:12px; flex-wrap:nowrap;
    padding:6px 13px;
  }
  .stub-head .ttl{ font-size:11.5px; font-weight:600; letter-spacing:.15em; color:var(--ink); }
  .stub-head .sub{ font-size:10.5px; color:#7A6455; flex:1; min-width:0;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .stub-head .chip{ font-size:10.5px; color:var(--ink); display:flex; align-items:baseline;
    gap:5px; white-space:nowrap; }
  .stub-head .chip b{ font-family:var(--font-mono); font-size:12px; font-weight:700; }

  .stub-grid{ display:grid; grid-template-columns:1fr .78fr 1.55fr 1.2fr; }
  .stub-grid > div{ padding:7px 12px 8px; border-left:1px solid var(--line); }
  .stub-grid > div:first-child{ border-left:0; }
  .stub-lbl{ font-size:9.5px; font-weight:600; letter-spacing:.12em; color:var(--ink-2); }
  .stub-line{ height:17px; border-bottom:1px solid var(--rule); margin-top:5px; }
  .ticks{ display:flex; gap:9px; margin-top:7px; flex-wrap:nowrap; }
  .ticks label{ display:flex; align-items:center; gap:5px; font-size:10.5px;
    white-space:nowrap; color:var(--body-fg); }
  .ticks b{ width:11px; height:11px; border:1px solid var(--rule); border-radius:2px; display:block; flex:none; }

  .footer{ margin:auto calc(var(--pad-x) * -1) 0; padding-top:9px; }
  .footer svg.wave{ display:block; width:100%; height:auto; }
  .footer .band{ background:var(--ink); margin-top:-1px; padding:0 0 10px; text-align:center; }
  .footer .thanks{
    font-family:var(--font-script); color:#fff; font-size:24px;
    line-height:1; margin-top:-34px; position:relative;
  }
  .footer .tagline{ color:#EBDFD4; font-size:10.5px; font-weight:500; letter-spacing:.16em; margin-top:7px; }

  @media print{
    .sheet{ margin:0; box-shadow:none; break-inside:avoid; break-after:page; }
    .sheet:last-child{ break-after:auto; }
  }
`;

export const BILL_BODY = String.raw`
<div class="sheet">
<section class="page">

  <header class="masthead">
    <div class="logo">{{logo_cell}}</div>

    <div>
      <h1 class="title">{{title}}</h1>
      <p class="subtitle">{{subtitle}}</p>

      <div class="paycard">
        <div class="paycard-top">
          <div class="paycard-eyebrow">PAY TO / BANK TRANSFER</div>
          <div class="paycard-title"><span class="fld">{{payee_name}}</span></div>
        </div>
        <div class="iban">
          <span class="tag">IBAN</span>
          <span class="fld">{{iban}}</span>
        </div>
        <div class="paycard-meta">
          <div class="mono"><span class="lbl">ACCOUNT</span><span class="fld">{{account_no}}</span></div>
          <div><span class="lbl">BANK</span><span class="fld">{{bank}}</span></div>
        </div>
      </div>
    </div>
  </header>

  <div class="panels">
    <div class="panel panel-left">
      <div class="panel-row">
        <div class="icon-cell"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></div>
        <div class="panel-text">
          <div class="lbl">Apt No.</div>
          <span class="val fld">{{apt}}</span>
        </div>
      </div>
      <div class="panel-row">
        <div class="icon-cell"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="17" cy="16" r="2.5"/></svg></div>
        <div class="panel-text">
          <div class="lbl">Reading Date</div>
          <span class="val fld">{{reading_date}}</span>
        </div>
      </div>
    </div>

    <div class="panel panel-right">
      <div class="cal-tile"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7 14h2M11 14h2M15 14h2M7 17.5h2M11 17.5h2"/></svg></div>
      <div class="stack">
        <div class="month"><label>Billing Month :</label><span class="fld">{{billing_month}}</span></div>
        <div class="due"><label>Due Date</label><span class="fld">{{due_date}}</span></div>
      </div>
    </div>
  </div>

  <div class="summary">
    <div class="summary-head"><div>BILLING SUMMARY</div><div></div></div>
    <div class="grid">
      <div class="k">Previous Reading :</div>
      <div class="v"><span class="fld">{{previous_reading}}</span></div>
      <div class="k">Current Reading :</div>
      <div class="v"><span class="fld">{{current_reading}}</span></div>

      <div class="k">Units Consumed :</div>
      <div class="v"><span class="fld num">{{units}}</span></div>
      <div class="k">Rate/Unit :</div>
      <div class="v"><span class="fld">{{rate}}</span></div>

      <div class="k">Electricity Charges :</div>
      <div class="v"><span class="fld num">{{electricity}}</span></div>
      <div class="k">Maintenance :</div>
      <div class="v"><span class="fld">{{maintenance}}</span></div>

      <div class="k">Previous Balance :</div>
      <div class="v"><span class="fld">{{previous_balance}}</span></div>
      <div class="k">Other Charges :</div>
      <div class="v"><span class="fld">{{other_charges}}</span></div>

      <div class="k total">Subtotal</div>
      <div class="v total"><span class="fld num">{{subtotal}}</span></div>
      <div class="k">Late Fee :</div>
      <div class="v"><span class="fld">{{late_fee}}</span></div>
    </div>
  </div>

  <div class="total-bar">
    <div class="cap">TOTAL PAYABLE</div>
    <div class="amount-pill"><span class="cur">Rs.</span><span class="fld">{{total}}</span></div>
    <div class="after">
      <div class="lbl">Payment After<br>Due Date</div>
      <span class="fld">{{after_due}}</span>
    </div>
  </div>

  <div class="lower">
    <div class="meter-card">
      <div class="meter-frame" style="background-image:url('{{meter_photo}}')"></div>
      <div class="cap">METER</div>
    </div>

    <div>
      <div class="instr-head">PAYMENT INSTRUCTIONS</div>
      <ul class="instr">
        <li>Pay before the due date to avoid a late payment charge of <b>Rs.&nbsp;{{late_policy}}</b>.</li>
        <li>Keep this bill as proof of payment. Electricity supply may be
            suspended for overdue accounts according to building policy.</li>
        <li class="wa">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4 5.2 2 2 0 0 1 6 3z"/></svg>
          <div class="wa-txt">
            <span>Send the payment screenshot to</span>
            <span class="fld">{{whatsapp}}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>

  <div class="cutline" aria-hidden="true">
    <i></i>
    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M20 4 8.6 16.4M20 20 8.6 7.6"/></svg>
    <i></i>
  </div>

  <div class="stub">
    <div class="stub-head">
      <div class="ttl">RECEIVING RECORD</div>
      <div class="sub">Completed by the office on collection.</div>
      <div class="chip">Apt <b>{{apt}}</b></div>
      <div class="chip">Month <b>{{billing_month}}</b></div>
      <div class="chip">Due Rs. <b>{{total}}</b></div>
    </div>
    <div class="stub-grid">
      <div><div class="stub-lbl">AMOUNT RECEIVED</div><div class="stub-line"></div></div>
      <div><div class="stub-lbl">DATE RECEIVED</div><div class="stub-line"></div></div>
      <div>
        <div class="stub-lbl">MODE</div>
        <div class="ticks">
          <label><b></b>Cash</label>
          <label><b></b>Bank transfer</label>
        </div>
      </div>
      <div><div class="stub-lbl">RECEIVED BY / SIGNATURE</div><div class="stub-line"></div></div>
    </div>
  </div>

  <footer class="footer">
    <svg class="wave" viewBox="0 0 800 56" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 56 C 150 6, 400 3, 800 27 L800 56 Z" fill="{{brand_color}}"/>
    </svg>
    <div class="band">
      <div class="thanks">Thank You!</div>
      <div class="tagline">WE APPRECIATE YOUR TIMELY PAYMENT</div>
    </div>
  </footer>

</section>
</div>
`;
