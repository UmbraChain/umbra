// shared pill nav, footer, CA bar, toasts, formatting
export const CA = 'Cz2YM1CaVm8FDbET2fZ33hLkhSrUyJJMtCgQxmbhpump';
export const X_URL = 'https://x.com/UmbraChainL1', GH_URL = 'https://github.com/UmbraChain/umbra';
export const $ = (id) => document.getElementById(id), api = (p, d) => fetch(p, d ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) } : undefined).then((r) => r.json());
export const umb = (v) => (Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 6 });
export const short = (h, n = 8) => (h ? h.slice(0, n) + '…' + h.slice(-6) : '');
export const ago = (ts) => { const s = Math.max(0, (Date.now() - ts) / 1000); return s < 60 ? Math.floor(s) + 's ago' : s < 3600 ? Math.floor(s / 60) + 'm ago' : Math.floor(s / 3600) + 'h ago'; };
export function toast(m, err) { const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3600); }
export const copy = (v, what) => navigator.clipboard.writeText(v).then(() => toast((what || 'copied') + ' copied'));
// the UMBRA mark: a trace lattice (4x4 grid) with the umbra eclipsing its upper right
export const MARK = (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => { const x = 3.5 + c * 5.7, y = 3.5 + r * 5.7, d = Math.hypot(x - 17, y - 7); return d < 7.5 ? '' : `<circle cx="${x}" cy="${y}" r="1.55" fill="#a970ff"/>`; })).join('')}<circle cx="17" cy="7" r="5.4" fill="none" stroke="#d4b8ff" stroke-width="1.3"/></svg>`;
export const LANDING = [['/#top', 'home'], ['/#proof', 'proof'], ['/#notes', 'notes'], ['/#launch', 'launch'], ['/#solana', 'solana'], ['/#faq', 'faq']];
export const APP = [['/', 'home'], ['/explorer', 'explorer'], ['/wallet', 'wallet'], ['/docs', 'docs'], ['/whitepaper', 'whitepaper'], ['/mine', 'mine'], ['/verify', 'verify']];
export function chrome(links = APP, cta = ['/wallet', 'open wallet ↗']) {
  const h = document.createElement('header'); h.className = 'nav';
  h.innerHTML = `<a class="logo" href="/">${MARK()}<span>UMBRA</span><small>NETWORK</small></a><nav>${links.map(([u, t]) => `<a href="${u}" data-k="${t}" class="${location.pathname === u ? 'on' : ''}">${t}</a>`).join('')}</nav><a class="pbtn xbtn" href="${GH_URL}" target="_blank" rel="noopener" aria-label="UMBRA on GitHub"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg></a><a class="pbtn xbtn" href="${X_URL}" target="_blank" rel="noopener" aria-label="UMBRA on X"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 1.2h3.7l-8 9.2 9.4 12.4h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L.1 1.2h7.6l5.2 6.9 6-6.9Zm-1.3 19.4h2L6.5 3.3H4.3l13.3 17.3Z"/></svg></a><a class="pbtn" href="${cta[0]}">${cta[1]}</a><button class="pbtn burger" aria-label="menu">menu</button>`;
  document.body.prepend(h); h.querySelector('.burger').onclick = () => h.classList.toggle('open'); h.querySelectorAll('nav a').forEach((a) => (a.onclick = () => h.classList.remove('open')));
  const f = document.createElement('footer'); f.className = 'foot';
  f.innerHTML = `<div class="wrap"><a class="logo" href="/">${MARK()}<span>UMBRA</span><small>NETWORK</small></a><p>UMBRA is a private chain mined by proof of proof, with its history anchored to Solana. $UMBRA trades on Solana · CA <code style="cursor:pointer" onclick="navigator.clipboard.writeText('${CA}')">${CA}</code> · <a href="${GH_URL}" target="_blank" rel="noopener">GitHub</a> · <a href="${X_URL}" target="_blank" rel="noopener">X</a></p></div>`;
  document.body.appendChild(f); return h;
}
export function caBar(el, mint) { if (!el) return; el.innerHTML = `<span class="cap">$UMBRA</span><code>${mint || CA}</code>`; el.onclick = () => copy(mint || CA, '$UMBRA address'); }
