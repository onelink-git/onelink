# Operational Roadmap: OneLink Sovereign Vault

## Status: 2025-12-23 - Audit & Cleanup Complete

---

## 1. Critical Fixes (High Priority)

### 1.1 Firestore Rules vs. Code Mismatch
- [ ] **Bug:** `firestore.rules` expects `createdAt` and top-level `iv` in messages, but `use-chat.ts` sends `timestamp` and nested `iv` inside `content`.
- [ ] **Fix:** Align `use-chat.ts` to send the expected schema or relax/update `firestore.rules`.
- [ ] **Action:** Update `use-chat.ts` to include top-level `iv` and `createdAt` to match the strict security rules.

### 1.2 Storage CORS Configuration
- [ ] **Issue:** P2P file uploads currently fail due to missing bucket-level CORS.
- [ ] **Action:** Run `gsutil cors set cors.json gs://<your-bucket-name>` using the provided `cors.json` in the root.

---

## 2. Near-Term Enhancements (Q1 2026)

### 2.1 Group Chat Logic
- [ ] **Task:** Implement multi-participant AES key distribution.
- [ ] **UI:** Update `create-group-dialog.tsx` to handle RSA key fetching for all participants.
- [ ] **Logic:** Update `use-chat.ts` to support multi-key lookup in `conversations/{id}`.

### 2.2 Vault Recovery UX
- [ ] **Task:** Implement the "Recovery Phrase" flow for restoring Private Keys from the `users/{uid}/vault` sub-collection.
- [ ] **Security:** Ensure PBKDF2 iterations are consistent with `lib/crypto.ts`.

---

## 3. Maintenance & Tech Debt

### 3.1 Documentation Sync
- [ ] **Task:** Keep `docs/` updated as new features are added.
- [ ] **Task:** Periodically audit `localStorage` usage to ensure no sensitive data (other than the private key) is persisting unexpectedly.

### 3.2 Firebase Billing/TTL
- [ ] **Note:** In billing-disabled environments, Firestore TTL is not available. 
- [ ] **Action:** Verify the "Soft Delete" logic in `use-chat.ts` is robust enough to handle high message volume without server-side deletion.

---

## 4. Completed Milestones
- [x] Migration from Supabase to Firebase (Static Export).
- [x] Renamed "Connections" to "Friends".
- [x] Integrated real-time E2EE Sovereign Chat v2.0.
- [x] Automated RSA Key Generation & Sync (`useRSAKeyCheck`).
- [x] Full System Audit & Doc Consolidation (2025-12-23).
