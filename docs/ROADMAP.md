# OneLink Chat Implementation Roadmap

## 1. Phase 1: MVP (Core Security & 1:1)
*Goal: Send a secure message between two users.*

| Task | Complexity | Acceptance Criteria |
| :--- | :--- | :--- |
| **RSA Key Check** | Low | User is prompted to generate keys if missing; Public key is saved to Firestore. |
| **P2P Handshake** | Med | Initiating a chat generates a unique AES key encrypted for both participants. |
| **E2EE Messaging** | Med | Messages are encrypted locally, sent to Firestore, and decrypted by the peer. |
| **Dashboard Integration** | Low | Chat sidebar and window appear in the main `/dashboard/chat` route. |

## 2. Phase 2: Privacy & Polish
*Goal: Ephemerality and real-time feel.*

| Task | Complexity | Acceptance Criteria |
| :--- | :--- | :--- |
| **Burn-after-reading** | Med | Messages with `expiresAt` disappear from UI and are deleted by TTL. |
| **Typing Indicators** | Low | Real-time "Partner is typing..." appears via presence collection. |
| **Vault Recovery** | High | User can restore Private Key from Vault using their Recovery Phrase. |
| **Optimistic UI** | Low | Message appears in bubble immediately before server confirmation. |

## 3. Phase 3: Advanced Sovereignty
*Goal: Groups and rich media.*

| Task | Complexity | Acceptance Criteria |
| :--- | :--- | :--- |
| **Group Chat** | High | Multi-user AES key distribution works (RSA-encrypt for all). |
| **Encrypted Assets** | High | Files are AES-encrypted before upload to Storage; Keys shared via handshake. |
| **Local AI Tools** | Med | On-device message summarization or search (Zero-Knowledge). |

## Shipping Checklist (MVP)
- [ ] Firestore rules permit ONLY participants to read/write messages.
- [ ] Private keys never touch the network in plaintext.
- [ ] User can successfully message a verified friend.
- [ ] App is fully functional as a static export (`npm run build`).
