# OneLink-hun

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/borislavmanovoffice-8731s-projects/v0-one-link-build-and-deploy)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/UJTAhXzyL2e)

## Project Status: 100% Zero-Knowledge Peer-to-Peer Sharing Platform

This project has been re-architected to be a strictly privacy-first, zero-knowledge engine for sharing encrypted blobs and assets.

### Key Architectural Pillars:
- **Zero AI**: All AI features (Chatbud, AI Theme Gen) have been decommissioned.
- **Zero-Knowledge Backend**: The backend acts as a simple storage/retrieval engine for encrypted blobs. It never sees plaintext data.
- **Client-Side Encryption**: All encryption (RSA-OAEP for keys, AES-GCM for content/files) happens entirely in the user's browser.
- **P2P Key Handshake**: File sharing is managed via a peer-to-peer handshake.
  1. Receiver requests access and provides their Public Key.
  2. Owner re-encrypts the asset's AES key using the Receiver's Public Key.
  3. Receiver decrypts the AES key using their Private Key (stored in their local vault) to access the file.
- **No Payments**: All commerce features have been removed in favor of manual secure access grants.

### Security
- Private keys never leave the device unless backed up to the **Secure Vault** (encrypted with a user passphrase).
- Assets are encrypted before upload to Firebase Storage.
- Firestore Security Rules enforce document ownership and access patterns.

## Deployment

Your project is live at:

**[https://vercel.com/borislavmanovoffice-8731s-projects/v0-one-link-build-and-deploy](https://vercel.com/borislavmanovoffice-8731s-projects/v0-one-link-build-and-deploy)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/UJTAhXzyL2e](https://v0.app/chat/UJTAhXzyL2e)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
