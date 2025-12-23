# OneLink Digital Passport: The Future of Verified Identity

## 1. Vision & Overview
The OneLink Digital Passport is the evolution of social linking into a **Self-Sovereign Identity (SSI)** layer. It transforms standard URLs into cryptographically-verified claims, establishing a "Trust No One" (TNO) identity protocol that ensures authenticity without centralizing private data.

### Core Philosophy
- **Identity as Stamps:** Online accounts (GitHub, X, LinkedIn) are treated as "stamps" in a digital passport.
- **Ownership vs. Assertion:** OneLink doesn't just store a link; it attests to the user's ownership of that account.
- **Zero-Knowledge Proofs (ZKP):** Users can prove attributes (e.g., "I am verified on GitHub") without exposing the underlying platform tokens or metadata.

---

## 2. Technical Architecture

### 2.1 The Identity Root
The Digital Passport is anchored by the user's **RSA-2048 Key Pair** generated locally on their device.
- **DID (Decentralized Identifier):** Each OneLink user is represented by a `did:onlink:{uid}` derived from their public key.
- **Sovereign Vault:** All Verifiable Credentials (VCs) are stored in the user's encrypted vault in Firestore, accessible only with their local private key.

### 2.2 Verification Mechanisms
OneLink employs three primary protocols for verification:

| Method | Application | Logic |
| :--- | :--- | :--- |
| **OAuth 2.0 / OIDC** | GitHub, LinkedIn, X | API-based handshake confirms the `user_id` without storing passwords. |
| **rel="me" (IndieWeb)** | Mastodon, Threads, Blogs | Bi-directional HTML linking between OneLink and the target site. |
| **Cryptographic Proofs** | Instagram, Legacy Sites | User publishes a signed OneLink token on their profile bio for automated verification. |

### 2.3 Data Model (Firestore)
```json
{
  "users": {
    "public_key": "RSA_PUBLIC_KEY",
    "did": "did:onlink:abc-123",
    "verifications": {
      "github": {
        "username": "user_name",
        "verified_at": "timestamp",
        "proof_type": "oauth",
        "credential_blob": "ENCRYPTED_VC"
      }
    }
  }
}
```

---

## 3. Integration & UX

### 3.1 The Bento Grid Integration
Verified links appear in the Bento Grid with a **OneLink Violet Badge**.
- **Dynamic Previews:** Verified cards can pull live metadata (follower counts, latest posts) via API bridges, turning static buttons into rich widgets.
- **Audit Logs:** Visitors can tap a badge to view the "Identity Attestation" (e.g., "Verified via GitHub on Dec 2025").

### 3.2 Selective Disclosure
Using the "Sovereign Vault," users can choose which verifications are public:
- **Public:** Visible to everyone on the `/u/profile`.
- **Friends Only:** Visible only to accepted connections via RSA-encrypted handshakes.
- **Private:** Visible only to the owner.

---

## 4. Implementation Roadmap

### Phase 1: Verification Hub (MVP)
- Implement `did:onlink` generation.
- Build the "Connect" dashboard for GitHub and LinkedIn using Firebase Functions as a secure proxy (no data storage).
- Add the "Verified" visual indicator to Bento cards.

### Phase 2: Verifiable Credentials
- Standardize the VC format (JSON-LD).
- Implement local signing of credentials using Web Crypto API.
- Support `rel="me"` scanning for Mastodon and personal sites.

### Phase 3: Zero-Knowledge Presentations
- Integrate `snarkjs` for browser-based ZK-Proofs.
- Allow users to prove "Identity Bundles" (e.g., proving multiple verified platforms without revealing which ones).

---

## 5. Security & Privacy
- **No Persistence of Secrets:** OAuth tokens are used once to issue a OneLink Attestation and then discarded or stored only in the user's local vault.
- **Phishing Protection:** The Digital Passport acts as a canonical source of truth, making it impossible for impersonators to "verify" the same external accounts on fake OneLink profiles.
- **Self-Hosting Compatibility:** The entire verification logic remains compatible with static-first exports and individual deployments.
