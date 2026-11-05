// UMBRA watchtower: an independent verifier you run on your own machine or server.
// Every minute it syncs new headers and rebuilds their hashes, re-runs recent proofs of proof, reads new anchors
// straight from Solana, and, if everything matches, posts a signed attestation for the tip it checked.
//   node verifier/watch.js [--node https://umbrachainl1.net] [--rpc https://solana-rpc.publicnode.com] [--proofs 16]
// Your watchtower key is kept in verifier/.key (created on first run).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import * as L from '../client/light.js';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const NODE = opt('--node', 'https://umbrachainl1.net').replace(/\/$/, ''), RPC = opt('--rpc', 'https://solana-rpc.publicnode.com'), PROOFS = +opt('--proofs', 16), ONCE = args.includes('--once');
const KEY = path.join(path.dirname(fileURLToPath(import.meta.url)), '.key'); let SK; try { SK = fs.readFileSync(KEY, 'utf8').trim(); } catch { SK = L.newKey(); fs.writeFileSync(KEY, SK); }
const get = (p) => fetch(NODE + p).then((r) => r.json()), post = (p, d) => fetch(NODE + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) }).then((r) => r.json());
let prev = L.GENESIS_PREV, next = 0; const hashes = new Map(), H = new Map(), seen = new Set(); let anchorsOk = 0;
console.log(`UMBRA watchtower ${L.pubOf(SK).slice(0, 12)}… · node ${NODE} · solana ${RPC}`);
async function round() {
  let tip = 0;
  for (;;) { const r = await get('/api/headers?from=' + next + '&limit=1000'); tip = r.height; const list = r.headers.map(L.unpack); if (!list.length) break;
    const c = L.checkHeaders(list, prev, next, hashes); if (!c.ok) throw new Error(`block ${c.at}: ${c.why}`); list.forEach((h) => H.set(h.height, h)); prev = c.tip; next = c.next; if (next > tip) break; }
  let n = 0; for (let h = next - 1; h >= 0 && n < PROOFS; h--) { const hd = H.get(h); if (!hd.hasProof) continue; const p = await get('/api/proof/' + h), err = L.checkProof(hd, p.proof); if (err) throw new Error(`proof ${h}: ${err}`); n++; }
  for (const a of (await get('/api/anchors?all')).list.reverse()) { if (seen.has(a.sig)) continue; const c = L.checkAnchor(L.memoOf(await L.solanaTx(RPC, a.sig)), hashes); if (!c.ok) throw new Error(`anchor ${a.height}: ${c.why}`); seen.add(a.sig); anchorsOk++; }
  const top = next - 1, r = await post('/api/attest', L.attest(SK, { height: top, hash: hashes.get(top), proofs: n, anchors: anchorsOk, kind: 'node' }));
  console.log(`${new Date().toISOString().slice(11, 19)} ✓ ${next} headers · ${n} proofs · ${anchorsOk} anchors · attested block ${top}${r.ok ? '' : ' (' + r.error + ')'}`);
}
for (;;) { try { await round(); } catch (e) { console.log('✕ VERIFICATION FAILED: ' + e.message); } if (ONCE) process.exit(0); await new Promise((r) => setTimeout(r, 60_000)); }
