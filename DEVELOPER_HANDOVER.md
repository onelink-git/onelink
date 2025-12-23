# Developer Handover: OneLink Sovereign Vault

## Project Essence (60 Seconds)
OneLink is a **Zero-Knowledge P2P platform**. 
- **The Golden Rule:** The server NEVER sees plaintext. If it's private, it's encrypted in the browser.
- **The Engine:** Next.js Static Export + Firebase SDK. 
- **The Key:** RSA-OAEP for identity/handshakes, AES-GCM for content.

## Quick Start
1. **Environment:** Setup Firebase and set your `NEXT_PUBLIC_FIREBASE_CONFIG`.
2. **Security:** Private keys live in `localStorage`. If you clear storage, you "lose" your identity unless you have a Vault backup.
3. **Chat:** Messages are E2EE using a unique AES key per conversation.

## Critical Paths
- `lib/crypto.ts`: All encryption logic. Start here if you're touching security.
- `hooks/use-chat.ts`: Real-time E2EE message listener and sender.
- `hooks/use-rsa-keycheck.ts`: Ensures the user has keys or triggers generation.
- `firestore.rules`: The "God Mode" guardrails. Strict participant checks.

## Key Terminology
- **Vault:** Passphrase-protected cloud backup of the RSA private key.
- **Handshake:** The process of RSA-encrypting an AES key for a peer.
- **Soft-Delete:** Client-side filtering of messages with an `expiresAt` tag.

## Useful Commands
```bash
npm run dev      # Local dev
npm run build    # Generate static /out
firebase deploy  # Deploy to production
```

## Status as of 2025-12-23
- Documentation consolidated in `/docs`.
- Legacy SQL scripts removed.
- Chat is functional but requires a fix for Firestore rules (schema mismatch).
- Storage CORS needs manual configuration via `gsutil`.
