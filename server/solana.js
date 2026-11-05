// Solana anchor: every ANCHOR_EVERY blocks the node writes "umbra-1:<height>:<block hash>" to Solana with the Memo
// program, signed by SOLANA_KEY. Anyone can open the signature on Solscan and compare it with the UMBRA explorer,
// so UMBRA's history is pinned to Solana and can't be quietly rewritten.
import { Connection, Keypair, Transaction, TransactionInstruction, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

const MEMO = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
export function anchorer(S, save) {
  const raw = (process.env.SOLANA_KEY || '').trim(), rpc = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
  let kp = null; try { if (raw) kp = Keypair.fromSecretKey(raw.startsWith('[') ? Uint8Array.from(JSON.parse(raw)) : bs58.decode(raw)); } catch (e) { console.error('SOLANA_KEY unreadable: ' + e.message); }
  const conn = kp ? new Connection(rpc, 'confirmed') : null, queue = []; let busy = false, err = null;
  S.anchors ||= {};
  async function drain() { if (busy || !kp) return; busy = true;
    while (queue.length) { const [h, hash] = queue[0];
      try { const tx = new Transaction().add(new TransactionInstruction({ programId: MEMO, keys: [{ pubkey: kp.publicKey, isSigner: true, isWritable: false }], data: Buffer.from(`umbra-1:${h}:${hash}`) }));
        tx.feePayer = kp.publicKey; tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash; tx.sign(kp);
        const sig = await conn.sendRawTransaction(tx.serialize()); await conn.confirmTransaction(sig, 'confirmed');
        S.anchors[h] = { hash, sig, ts: Date.now() }; queue.shift(); err = null; save(); console.log('anchored block ' + h + ' to Solana ' + sig);
      } catch (e) { err = String(e.message || e).slice(0, 200); console.error('anchor failed: ' + err); await new Promise((r) => setTimeout(r, 30_000)); } }
    busy = false; }
  return {
    push(h, hash) { if (!kp) return; queue.push([h, hash]); drain(); },
    info() { const hs = Object.keys(S.anchors).map(Number), last = hs.length ? Math.max(...hs) : null;
      return { enabled: !!kp, chain: 'solana', program: MEMO.toBase58(), signer: kp ? kp.publicKey.toBase58() : null, every: +process.env.ANCHOR_EVERY || 100, count: hs.length, last: last == null ? null : { height: last, ...S.anchors[last] }, pending: queue.length, error: err }; },
  };
}
