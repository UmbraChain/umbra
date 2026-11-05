// UMBRA light client: checks the chain without trusting the node that serves it.
//  1. headers: rebuild every block hash from its raw fields and check each block points at the one before it
//  2. proofs: re-run the proof-of-proof check (pop.js) on recent blocks
//  3. anchors: read each "umbra-1:<height>:<hash>" memo straight from Solana and match it to the locally rebuilt hash
// Default Solana RPC for browsers: solana-rpc.publicnode.com (api.mainnet-beta refuses browser origins).
// Used by /verify in the browser and by test/light.test.js in Node.
import { txhash } from './rct.js';
import * as PoP from './pop.js';

export const GENESIS_PREV = '0'.repeat(64);
export const headerString = (h) => JSON.stringify({ h: h.height, prev: h.prev, ts: h.ts, diff: h.diff, root: h.root, miner: h.miner });
export const blockHash = (h) => txhash(headerString(h) + '|' + h.traceRoot + '|' + h.nonce);
export const unpack = (a) => ({ height: a[0], prev: a[1], ts: a[2], diff: a[3], root: a[4], miner: a[5], traceRoot: a[6], nonce: a[7], hash: a[8], hasProof: a[9] });

// checks a run of headers that continues from `prevHash` at `height`. Returns { ok, tip, hashes } or { ok:false, at, why }.
export function checkHeaders(list, prevHash = GENESIS_PREV, height = 0, hashes = new Map()) {
  for (const h of list) {
    if (h.height !== height) return { ok: false, at: h.height, why: 'height out of order' };
    if (h.prev !== prevHash) return { ok: false, at: h.height, why: 'does not point at the previous block' };
    const mine = blockHash(h); if (mine !== h.hash) return { ok: false, at: h.height, why: 'hash does not match its own fields' };
    hashes.set(h.height, mine); prevHash = mine; height++;
  }
  return { ok: true, tip: prevHash, next: height, hashes };
}
// a block's proof, checked against the header rebuilt locally (not the node's copy of it)
export function checkProof(h, proof) {
  if (!proof) return 'no proof kept for this block';
  if (proof.root !== h.traceRoot || proof.nonce !== h.nonce) return 'proof is for a different trace';
  return PoP.verify(headerString(h), h.diff, proof);
}
// Solana: pull the memo text out of a getTransaction result
export function memoOf(tx) {
  const logs = (tx && tx.meta && tx.meta.logMessages) || [];
  for (const l of logs) { const m = /Memo \(len \d+\): "(.*)"$/.exec(l); if (m) return m[1].replace(/\\"/g, '"'); }
  return null;
}
export function checkAnchor(memo, hashes) {
  const m = /^umbra-1:(\d+):([0-9a-f]{64})$/.exec(memo || ''); if (!m) return { ok: false, why: 'memo is not an UMBRA anchor' };
  const h = +m[1], local = hashes.get(h); if (!local) return { ok: false, height: h, why: 'block not synced yet' };
  return local === m[2] ? { ok: true, height: h, hash: m[2] } : { ok: false, height: h, why: 'Solana has a different hash for this block' };
}
export async function solanaTx(rpc, sig) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
  const r = await fetch(rpc, { signal: ctl.signal, method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [sig, { encoding: 'json', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }] }) });
  clearTimeout(to); const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result;
}

// ---------- watchtower attestations ----------
// After a full check, a verifier signs "I verified umbra-1 up to <height>, whose hash is <hash>" with its own ed25519 key.
// The node only stores an attestation whose hash matches its own block at that height, so the board counts real agreement.
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
export const attestMsg = (a) => `umbra-1/attest|${a.height}|${a.hash}|${a.proofs}|${a.anchors}|${a.kind}|${a.ts}`;
export const newKey = () => bytesToHex(ed25519.utils.randomPrivateKey());
export const pubOf = (sk) => bytesToHex(ed25519.getPublicKey(hexToBytes(sk)));
export function attest(sk, a) { const b = { ...a, ts: a.ts || Date.now(), pub: pubOf(sk) }; return { ...b, sig: bytesToHex(ed25519.sign(utf8ToBytes(attestMsg(b)), hexToBytes(sk))) }; }
export function checkAttest(a) { try { return ed25519.verify(hexToBytes(a.sig), utf8ToBytes(attestMsg(a)), hexToBytes(a.pub)); } catch { return false; } }
