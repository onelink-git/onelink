# Architectural Manifesto: OneLink Sovereign Vault

## 1. The Core Philosophy: "Trust No One" (TNO)
OneLink is built on the principle that the service provider should never have access to user data. Privacy is not a promise; it is a mathematical certainty enforced by client-side encryption.

### Key Tenets
- **Client-Side Sovereignty:** All encryption and decryption occur in the user's browser using the Web Crypto API.
- **Zero-Knowledge Backend:** Firebase serves only as a storage engine for encrypted blobs and metadata.
- **Data Portability:** Users own their private keys and are responsible for their backup (via the Sovereign Vault).

---

## 2. Cryptographic Architecture

### 2.1 Identity & Handshaking (RSA-OAEP 2048)
- **Identity:** Each user generates a unique RSA-OAEP 2048-bit key pair upon registration.
- **Public Key:** Stored in the `users` collection, allowing others to initiate secure handshakes.
- **Private Key:** Stored in `localStorage` (`onelink_private_key_{uid}`). It never touches the network in plaintext.
- **Recovery (Sovereign Vault):** The private key can be backed up to Firestore, but only after being encrypted with a user passphrase using **PBKDF2** derivation and **AES-GCM 256**.

### 2.2 Content Encryption (AES-GCM 256)
- **Ephemeral Keys:** Every chat conversation and private asset uses a unique, random AES-GCM 256-bit key.
- **Key Distribution:** These AES keys are encrypted with the recipient's RSA Public Key before being stored.
- **Lazy Decryption:** Content is only decrypted at the moment of consumption in the UI.

---

## 3. Data Schemas (Firestore)

### `users/{uid}`
- `nickname`: string (unique)
- `public_key`: string (Base64 SPKI)
- `avatar_url`: string
- `vault/`: Sub-collection for encrypted private key backups.

### `conversations/{id}`
- `participantIds`: array<string>
- `encryptedKeys`: map<uid, base64_encrypted_aes_key>
- `updatedAt`: serverTimestamp
- `lastMessage`: string (usually "[Encrypted]")

### `conversations/{id}/messages/{id}`
- `senderId`: string
- `content`: string (JSON string of {encryptedContent, iv})
- `type`: "text" | "image" | "file"
- `timestamp`: serverTimestamp
- `expiresAt`: timestamp (for Soft-Delete/TTL)

---

## 4. Sovereignty Flows

### 4.1 The Chat Handshake
1. **Initiation:** User A creates a conversation with User B.
2. **Key Generation:** User A's browser generates a random AES key.
3. **Encryption:** User A encrypts the AES key for themselves (using their public key) and for User B (using User B's public key).
4. **Storage:** The encrypted keys are stored in the conversation document.

### 4.2 Soft-Delete (Ephemerality)
- **Burn After Reading:** Messages can include an `expiresAt` timestamp.
- **Client Enforcement:** `useChat` hook filters expired messages from the UI and triggers local cleanup.
- **Server Enforcement:** Firestore TTL policy (when enabled) physically deletes documents to ensure permanent privacy.

---

## 5. Security Guardrails (Firestore Rules)
- **Participant-Only Access:** All chat data requires the requester's UID to be in the `participantIds` array.
- **Write-Once Messages:** Messages cannot be updated once sent, preventing history tampering.
- **Sender Cleanup:** Only the sender or the TTL service can delete a message document.
