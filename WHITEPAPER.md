# UMBRA: proof of proof, private by default

_UMBRA whitepaper, version 1.0 (umbra-1), November 2026_

Web version: https://umbrachainl1.net/whitepaper · Code: https://github.com/UmbraChain/umbra

## Abstract

UMBRA is a private chain mined by proof of proof: following Nockchain, miners win blocks by proving a Goldilocks-field computation, and the chain is anchored to Solana every 100 blocks. Every transaction is private by default. The sender hides in a ring of 16, the receiver behind a one-time stealth address, and the amount inside a Pedersen commitment with a range proof. Payments to quantum addresses (umbq1) are detected with ML-KEM-768, the NIST post-quantum key encapsulation standard. The Totality upgrade moves spends to hash-based proofs over the whole chain, so the last elliptic-curve dependency goes too. umbra-1 is live, and every rule in this paper is in the public repository and covered by its test suite.

## 1. The problem

Public chains publish who paid whom and how much, forever. Anyone can follow a wallet, cluster its addresses and read its history. Privacy coins solved part of this with elliptic-curve cryptography, but a large enough quantum computer breaks elliptic curves. Data recorded today can be unmasked later. UMBRA is built so that what is private today stays private after quantum.

## 2. Design goals

- Private by default. No transparent mode, no opt-in.
- Hide all three: sender, receiver and amount.
- Post-quantum where it matters first: payment detection, which is what links payments to a person.
- A clear path to fully post-quantum spends without a new coin.
- Anyone can verify every transaction without trusting a node.

## 3. Keys and addresses

A wallet is one 32-byte seed. From it the wallet derives a spend key and a view key (scalars on ristretto255) and an ML-KEM-768 key pair. Each wallet has two addresses:

```
umb1...   classic: spend public key + view public key
umbq1...  quantum: the same keys + an ML-KEM-768 public key
```

Both receive into the same wallet. Keys are created in the browser and never leave the device.

## 4. Stealth outputs

Nobody pays an address directly. For each payment the sender derives a fresh one-time key:

```
P = Hs(shared_secret, i)*G + A
```

On `umb1` addresses the shared secret comes from ECDH with the receiver's view key. On `umbq1` addresses it comes from ML-KEM-768 encapsulation, and the 1,088-byte ciphertext travels with the output. The receiver scans each output with the view key or the ML-KEM secret key. To everyone else, two payments to the same wallet look unrelated.

## 5. Hidden amounts

Each amount is a Pedersen commitment:

```
C = x*G + v*H
```

The blinding factor x and the amount v are encrypted to the receiver. Every output carries a 48-bit range proof: 48 bit commitments, each with a 2-member ring signature proving it opens to 0 or to 2^j. This blocks inflation through negative amounts. A transaction balances when:

```
sum(pseudo-input commitments) = sum(output commitments) + fee*H
```

## 6. Ring signatures and key images

Each input references 16 outputs from the chain: the real one and 15 decoys. A two-row MLSAG signature proves the signer owns one of the 16 one-time keys and that its commitment matches the pseudo-input, without revealing which. The signature publishes a key image:

```
I = x*Hp(P)
```

One output always gives the same key image, so a second spend is rejected, but nothing links the key image back to the output.

## 7. Consensus: proof of proof

- Following Nockchain, a block is won by proving a fixed program, not by grinding a hash.
- Seed: two Goldilocks elements (p = 2^64 − 2^32 + 1) from sha256(header | nonce).
- Program: 1,023 rounds of a' = (a+b)^7 + c_i, b' = a. x^7 is a permutation of the field, so no round can be shortcut.
- Commitment: a Merkle tree over all 1,024 states. Valid when sha256(pow | root | header | nonce) * difficulty < 2^256.
- Proof: the first and last states plus 32 Fiat–Shamir-chosen steps, each opened with its successor and Merkle paths. Nodes check it in milliseconds. Faking a fraction f of the trace survives with probability (1 − f)^32.
- Difficulty retargets every block toward a 20-second block time. Coinbase outputs mature after 3 confirmations.

## 8. Emission

- Supply: 2^32 = 4,294,967,296 UMBRA, the same power of two as Nockchain. No premine, no presale, no team allocation.
- Block reward: (2^32 − mined) / 2^19, a smooth curve that falls each block.
- Tail emission: 2 UMBRA per block, forever, so provers are always paid.

## 8b. Solana anchoring

Every 100 blocks the node writes umbra-1:<height>:<hash> to Solana with the Memo program. Solana's record can't be edited, so any rewrite of UMBRA's history is checkable against it.

## 9. Verification without trust

Every transaction in the explorer has a "verify in your browser" button. The browser fetches the transaction and its ring members from `/api/rawtx/:id` and runs the same `verifyTx` the node runs: every ring signature, every range proof and the commitment balance. The code is open source, and the test suite runs on every push via GitHub Actions. It covers private sends to `umbq1` addresses, rejection of double spends and rejection of forged signatures.

Cryptography comes from the audited noble libraries: @noble/curves (ristretto255), @noble/hashes (SHA-512, SHA3-256) and @noble/post-quantum (ML-KEM-768). The proof-of-proof program uses @noble/hashes SHA-256 and native BigInt field arithmetic.

## 10. Totality: the quantum upgrade

ML-KEM payment detection is live today. Totality finishes the job:

- Spends move from elliptic-curve ring signatures to hash-based proofs.
- The anonymity set grows from 16 outputs to the whole chain.
- Payment detection becomes ML-KEM-768 only.

It is the same chain with no new coin. Each wallet migrates its coins once, automatically.

## 11. $UMBRA

$UMBRA is the network's token on Solana, the chain UMBRA anchors to. Holders and provers meet in one place: the token on Solana, and the coins proved on umbra-1.

## 12. Roadmap

- Done: umbra-1 live with proof-of-proof blocks, explorer, browser wallet and faucet
- Done: browser prover at /mine and CLI prover in miner/
- Done: Solana anchors every 100 blocks
- Next: full STARK per block (low-degree test over the whole trace), then proof aggregation per anchor window
- Then: Totality, hash-based spends and full-chain privacy; a UMBRA ⇄ Solana bridge

## Links

- Testnet, explorer and wallet: [https://umbrachainl1.net](https://umbrachainl1.net)
- Docs: [https://umbrachainl1.net/docs](https://umbrachainl1.net/docs)
- Code: [https://github.com/UmbraChain/umbra](https://github.com/UmbraChain/umbra)
- X: [https://x.com/UMBRAChainL1](https://x.com/UMBRAChainL1)
