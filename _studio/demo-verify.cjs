// UMBRA light-client video: records /verify running against the LIVE network (real headers, real proofs, real Solana anchors).
// node _studio/demo-verify.cjs [https://umbrachainl1.net]  → brand/umbra-verify-demo.mp4
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process'), { open, sleep } = require('./cdp.cjs');
const BASE = (process.argv[2] || 'https://umbrachainl1.net').replace(/\/$/, ''), OUT = path.join(__dirname, '..', 'brand', 'umbra-verify-demo.mp4'), FR = path.join(os.tmpdir(), 'umbra-vdemo-frames'), W = 1280, H = 720;
const CAP = `(() => { if (document.getElementById('__cap')) return; const d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99999;padding:13px 24px;background:#07050c;border:1px solid rgba(169,112,255,.8);box-shadow:0 0 40px rgba(169,112,255,.3);border-radius:999px;font:400 15px "JetBrains Mono",monospace;color:#ece6ff;white-space:nowrap;opacity:0;transition:opacity .3s';
  const c=document.createElement('div');c.id='__cur';c.style.cssText='position:fixed;z-index:99998;width:22px;height:22px;border-radius:50%;border:2px solid #a970ff;background:rgba(169,112,255,.2);pointer-events:none;transform:translate(-50%,-50%);transition:left .55s,top .55s;left:800px;top:450px';document.body.append(d,c); })();`;
(async () => {
  fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
  const c = await open('about:blank', W, H, 9400 + Math.floor(Math.random() * 90)); const frames = []; let rec = false;
  c.on('Page.screencastFrame', (p) => { if (rec) { const f = path.join(FR, 'f' + String(frames.length).padStart(5, '0') + '.jpg'); fs.writeFileSync(f, Buffer.from(p.data, 'base64')); frames.push({ f, t: p.metadata.timestamp * 1000 }); } c.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {}); });
  const go = async (p) => { await c.send('Page.navigate', { url: BASE + p }); await sleep(3500); await c.ev('document.fonts.ready.then(()=>1)'); await c.ev(CAP); };
  const cap = (s) => c.ev(`(()=>{const d=document.getElementById('__cap');d.innerHTML=${JSON.stringify(s)};d.style.opacity=1})()`);
  const at = async (sel, blk = 'center') => { await c.ev(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'${blk}',behavior:'smooth'})`); await sleep(800); await c.ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(),k=document.getElementById('__cur');k.style.left=(r.left+r.width/2)+'px';k.style.top=(r.top+r.height/2)+'px'})()`); await sleep(600); };
  const until = async (js, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await c.ev(js)) return true; await sleep(400); } return false; };
  await go('/verify');
  await c.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1 }); rec = true;
  await cap('new: the UMBRA light client · verify the whole chain in your browser'); await sleep(4200);
  await cap('one click · against the live network, trusting nothing the node says'); await at('#go'); await sleep(500);
  await c.ev(`document.getElementById('np').value=32;document.getElementById('go').click()`); await sleep(400);
  await at('.stages', 'start');
  await cap('1 · every block hash rebuilt from genesis · every link checked');
  await until(`/done/.test(document.getElementById('s1').className)`, 120000); await sleep(1800);
  await cap('2 · proof of proof re-run on recent blocks · 32 opened steps each');
  await until(`/done/.test(document.getElementById('s2').className)`, 120000); await sleep(1600);
  await cap('3 · every anchor read straight from Solana · must match your rebuilt hash');
  await until(`/done|bad/.test(document.getElementById('s3').className)`, 240000); await sleep(1200);
  await at('#verdict'); await cap('verified on this device · open any anchor on Solscan'); await sleep(5000);
  await at('#log'); await sleep(3500);
  await go('/'); await cap('umbrachainl1.net/verify · @UmbraChainL1 · <b style="color:#a970ff">$UMBRA</b>'); await sleep(3600);
  rec = false; await c.send('Page.stopScreencast'); frames.sort((a, b) => a.t - b.t);
  const verdict = await c.ev(`1`);
  const list = frames.map((x, i) => `file '${x.f.split(path.sep).join('/')}'\nduration ${Math.min(6, Math.max(0.01, ((frames[i + 1] || x).t - x.t) / 1000 || 0.05)).toFixed(3)}`).join('\n') + `\nfile '${frames[frames.length - 1].f.split(path.sep).join('/')}'`;
  fs.writeFileSync(path.join(FR, 'list.txt'), list);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(FR, 'list.txt'), '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', OUT]);
  console.log('OK', OUT, frames.length, 'frames', verdict); c.close(); fs.rmSync(FR, { recursive: true, force: true }); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
