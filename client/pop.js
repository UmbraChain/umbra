// UMBRA proof of proof: Nockchain-style proof-of-work. Miners don't grind a hash; they run a fixed program over
// the Goldilocks field (p = 2^64 - 2^32 + 1, the field Nockchain proves in), commit the whole execution trace in a
// Merkle tree, and the trace commitment is what has to meet the difficulty. Every block carries a proof:
// Fiat-Shamir picks Q trace steps from the commitment, the miner opens each step and the one after it, and any
// node re-checks those transitions in milliseconds without re-running the program.
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes, concatBytes } from '@noble/hashes/utils';

export const P = 2n ** 64n - 2n ** 32n + 1n, STEPS = 1024, Q = 32, DEPTH = 10;   // 1024 states, 1023 transitions
const RC = Array.from({ length: STEPS }, (_, i) => BigInt('0x' + bytesToHex(sha256(utf8ToBytes('umbra/rc/' + i))).slice(0, 16)) % P);
const pow7 = (x) => { const x2 = (x * x) % P, x4 = (x2 * x2) % P; return (((x4 * x2) % P) * x) % P; };
// one step of the program: a 2-register permutation round (x^7 is a permutation of Goldilocks since gcd(7, p-1) = 1)
export const step = (a, b, i) => [(pow7((a + b) % P) + RC[i]) % P, a];
const u64 = (x) => { const o = new Uint8Array(8); for (let k = 7; k >= 0; k--) { o[k] = Number(x & 255n); x >>= 8n; } return o; };
const leaf = (i, a, b) => sha256(concatBytes(utf8ToBytes('umbra/leaf'), u64(BigInt(i)), u64(a), u64(b)));
const node = (l, r) => sha256(concatBytes(l, r));
const h2n = (h) => BigInt('0x' + bytesToHex(h));
export function seed(hdr, nonce) { const d = sha256(utf8ToBytes('umbra/seed|' + hdr + '|' + nonce)); return [h2n(d.slice(0, 8)) % P, h2n(d.slice(8, 16)) % P]; }
// Fiat-Shamir: the steps to open come from the trace commitment, so they can't be chosen before the work is done
export function queries(root, hdr, nonce) { const out = []; for (let j = 0; out.length < Q; j++) { const q = Number(h2n(sha256(utf8ToBytes(`umbra/q|${root}|${hdr}|${nonce}|${j}`)).slice(0, 4)) % BigInt(STEPS - 1)); if (!out.includes(q)) out.push(q); } return out.sort((a, b) => a - b); }
export const powHash = (root, hdr, nonce) => bytesToHex(sha256(utf8ToBytes(`umbra/pow|${root}|${hdr}|${nonce}`)));
export const meets = (hex, diff) => BigInt('0x' + hex) * BigInt(diff) < 2n ** 256n;

// run the program and commit the trace. Returns the root and the tree so a winning attempt can be opened.
export function trace(hdr, nonce) {
  let [a, b] = seed(hdr, nonce); const A = [a], B = [b];
  for (let i = 0; i < STEPS - 1; i++) { [a, b] = step(a, b, i); A.push(a); B.push(b); }
  const L = [A.map((x, i) => leaf(i, x, B[i]))]; while (L[L.length - 1].length > 1) { const p = L[L.length - 1], n = []; for (let i = 0; i < p.length; i += 2) n.push(node(p[i], p[i + 1])); L.push(n); }
  return { root: bytesToHex(L[L.length - 1][0]), A, B, L };
}
const path = (L, i) => { const out = []; for (let d = 0; d < DEPTH; d++) { out.push(bytesToHex(L[d][i ^ 1])); i >>= 1; } return out; };
// one mining attempt: returns the proof when the commitment meets the difficulty, else null
export function attempt(hdr, nonce, diff) {
  const t = trace(hdr, nonce), pw = powHash(t.root, hdr, nonce); if (!meets(pw, diff)) return null;
  const open = (i) => ({ i, a: String(t.A[i]), b: String(t.B[i]), path: path(t.L, i) });
  const qs = queries(t.root, hdr, nonce);
  return { nonce, root: t.root, pow: pw, out: [String(t.A[STEPS - 1]), String(t.B[STEPS - 1])], first: open(0), last: open(STEPS - 1), open: qs.map((q) => [open(q), open(q + 1)]) };
}
const checkPath = (root, i, a, b, p) => { if (!Array.isArray(p) || p.length !== DEPTH) return false; let h = leaf(i, a, b), k = i; for (const s of p) { const x = hexToBytes(s); h = k & 1 ? node(x, h) : node(h, x); k >>= 1; } return bytesToHex(h) === root; };
// verify a block's proof. Returns null when valid, or the reason it fails.
export function verify(hdr, diff, pf) {
  try {
    if (!pf || typeof pf.root !== 'string' || !/^[0-9a-f]{64}$/.test(pf.root)) return 'malformed proof';
    const nonce = pf.nonce, pw = powHash(pf.root, hdr, nonce); if (pw !== pf.pow || !meets(pw, diff)) return 'commitment does not meet difficulty';
    const [a0, b0] = seed(hdr, nonce), f = pf.first, l = pf.last;
    if (f.i !== 0 || BigInt(f.a) !== a0 || BigInt(f.b) !== b0 || !checkPath(pf.root, 0, a0, b0, f.path)) return 'trace does not start from this header';
    if (l.i !== STEPS - 1 || l.a !== pf.out[0] || l.b !== pf.out[1] || !checkPath(pf.root, l.i, BigInt(l.a), BigInt(l.b), l.path)) return 'final state not in the trace';
    const qs = queries(pf.root, hdr, nonce); if (!Array.isArray(pf.open) || pf.open.length !== Q) return 'wrong number of openings';
    for (let j = 0; j < Q; j++) { const [x, y] = pf.open[j]; if (x.i !== qs[j] || y.i !== qs[j] + 1) return 'openings are not the challenged steps';
      const xa = BigInt(x.a), xb = BigInt(x.b), ya = BigInt(y.a), yb = BigInt(y.b); if ([xa, xb, ya, yb].some((v) => v < 0n || v >= P)) return 'value outside the field';
      if (!checkPath(pf.root, x.i, xa, xb, x.path) || !checkPath(pf.root, y.i, ya, yb, y.path)) return 'opening not in the committed trace';
      const [na, nb] = step(xa, xb, x.i); if (na !== ya || nb !== yb) return 'trace step ' + x.i + ' is wrong'; }
    return null;
  } catch (e) { return 'malformed proof'; }
}
