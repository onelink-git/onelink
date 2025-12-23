# OneLink Sovereign Chat Design Document

## 1. UX Flows & Requirements

### Primary Use-Cases
- **1:1 Private Messaging**: Secured by unique AES keys re-encrypted for each participant.
- **Ephemeral Messaging (Burn-after-reading)**: User sets a TTL (e.g., 30s, 1h, 24h) per message.
- **Contact Discovery**: Find friends via unique OneLink nicknames.
- **Safe Blocking**: Immediate severance of real-time listeners and encryption key access.

### Detailed Flows
1. **Starting a Chat**:
   - User A visits User B's OneLink profile.
   - User A sends a "Friend Request" (Handshake start).
   - Upon acceptance, a `conversation` doc is created.
   - A unique `conversationKey` (AES) is generated, encrypted with User A's RSA Public Key and User B's RSA Public Key, and stored in the doc.
2. **Sending Messages**:
   - Client encrypts plaintext with the `conversationKey`.
   - Writes to `conversations/{id}/messages`.
   - Optional `expiresAt` timestamp added.
3. **Offline Usage**:
   - Uses Firestore persistence.
   - Messages are queued locally and synced upon reconnection.
   - Optimistic UI updates ensure no perceived lag.

### Accessibility
- **ARIA Roles**: `log` for message history, `textbox` for composer.
- **Typography**: Minimum 16px body text; 18px-20px for "Simple Mode".
- **Contrast**: 7:1 ratio for text on background.

## 2. Full System Architecture

### Textual Diagram
```text
[Client Browser]
  ├── React (Next.js) ─> Hooks (useChat, useCrypto)
  ├── Web Crypto API ─> RSA/AES Operations
  └── LocalStorage ─> Private Keys
          ^
          | (Secure SDK)
          v
[Firebase Platform]
  ├── Auth ─> User Session
  ├── Firestore ─> Metadata, Encrypted Messages, Presence
  └── Storage ─> Encrypted Attachments
```

### Design Rationale
- **Firestore vs. WebSockets**: Firestore `onSnapshot` is chosen for its native real-time capabilities, offline support, and seamless integration with the existing Firebase stack. It avoids the need for maintaining custom WebSocket servers.
- **Trade-off**: Higher read/write costs than raw WebSockets, but significantly lower maintenance and faster time-to-market.

## 3. Data Model (Firestore)

### `users` (Collection)
- `uid`: string (doc ID)
- `nickname`: string (unique)
- `publicKey`: string (RSA-OAEP)
- `vault`: string (Encrypted Private Key backup)

### `conversations` (Collection)
- `id`: string (doc ID)
- `participantIds`: string[]
- `encryptedKeys`: map { `uid`: `encrypted_aes_key` }
- `lastMessage`: object (encrypted snippet, sender, timestamp)
- `type`: "direct" | "group"

### `messages` (Sub-collection of `conversations`)
- `senderId`: string
- `content`: string (AES-GCM encrypted)
- `iv`: string (Initialization Vector for AES)
- `createdAt`: serverTimestamp
- `expiresAt`: timestamp (optional)

### `presence` (Sub-collection of `conversations`)
- `uid`: string (doc ID)
- `status`: "typing" | "online"
- `updatedAt`: serverTimestamp (TTL controlled)

## 4. Security & Privacy

### Firebase Security Rules
- **Authorization**: `request.auth.uid in resource.data.participantIds`.
- **Validation**: Enforce message size limits and prevent writing `createdAt` manually.

### Anti-Abuse
- **Rate Limiting**: Implement via Security Rules (checking `lastWrite` timestamp).
- **Reporting**: Dedicated `reports` collection for moderation flags.

### E2EE Design (Recommended Path)
We recommend a **Double-Ratchet inspired lightweight implementation**:
- Static `conversationKey` for MVP.
- Future: Rotate keys every 50 messages or 24 hours to provide Perfect Forward Secrecy (PFS).
- Metadata minimization: Message content is opaque to the server. Sender/Receiver IDs are visible for routing/rules.

## 5. Risk Analysis & Mitigations
1. **Privacy**: Metadata leakage (who talks to whom). *Mitigation*: Periodic conversation archival.
2. **Abuse**: Spam from malicious nicknames. *Mitigation*: Handshake requirement.
3. **Data Leakage**: Compromised `localStorage`. *Mitigation*: Recovery phrase requirement.
4. **Scaling**: Firestore query limits. *Mitigation*: Sub-collection partitioning.
5. **Regulatory**: GDPR/Right to Erasure. *Mitigation*: TTL + Manual export tool.
6. **Key Loss**: Permanent data loss. *Mitigation*: Encrypted cloud backup.
7. **Performance**: Large message history lag. *Mitigation*: Pagination (limit(50)).
8. **Interoperability**: Different browser support for Web Crypto. *Mitigation*: Polyfills for older browsers.
# OneLink Chat Integration Guide

Follow these steps to wire the Sovereign Chat system into your Next.js + Firebase environment.

## 1. Firebase Setup

### Firestore Indexes
Ensure the following composite indexes are created in the Firebase Console:
- Collection: `conversations`, Fields: `participantIds` (Array), `updatedAt` (Descending).
- Collection: `messages` (Collection Group), Fields: `expiresAt` (Ascending), `createdAt` (Ascending).

### TTL Policy
1. Navigate to **Firestore -> Settings**.
2. Enable TTL.
3. Add a TTL policy for the `messages` collection group on the `expiresAt` field.

## 2. Encryption Primitives (`lib/crypto.ts`)

Ensure your crypto library implements the following:
- `generateChatKey()`: Returns a random 256-bit AES-GCM key.
- `encryptKeyForParticipants(aesKey, publicKeys)`: Encrypts the AES key using each participant's RSA public key.
- `decryptMessage(encryptedContent, iv, aesKey)`: Decrypts message content using the shared AES key.

## 3. Implementing the Hook (`hooks/use-chat.ts`)

Your `useChat` hook should handle real-time synchronization:

```typescript
export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState([]);
  const { decrypt } = useCrypto();

  useEffect(() => {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, async (snapshot) => {
      const newMessages = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        // Client-side TTL filtering for billing-disabled envs
        if (data.expiresAt && data.expiresAt.toDate() < new Date()) return null;
        
        const decryptedContent = await decrypt(data.content, data.iv);
        return { id: doc.id, ...data, content: decryptedContent };
      }));
      setMessages(newMessages.filter(m => m !== null));
    });
  }, [conversationId]);

  return { messages };
};
```

## 4. Wiring the UI

1. **Dashboard Shell**: Use `ChatShell` to wrap your chat view.
2. **State Management**: Track the `activeConversationId` in your dashboard state.
3. **Optimistic Updates**: When sending a message, add it to the local UI state immediately before the `addDoc` call to ensure zero-latency perception.

## 5. Security Checklist
- [ ] Deploy `firestore.rules` to lock down access.
- [ ] Verify that private keys NEVER leave the browser (check your network tab).
- [ ] Ensure `Recovery Phrase` onboarding is mandatory before allowing chat access.
{
  "collections": {
    "users": {
      "description": "User profiles and security keys",
      "schema": {
        "nickname": "string",
        "publicKey": "string (RSA-OAEP 2048)",
        "vault": "string (AES-GCM encrypted private key)",
        "createdAt": "timestamp"
      },
      "indexes": [
        { "fields": ["nickname"], "unique": true }
      ]
    },
    "conversations": {
      "description": "Chat metadata and encryption keys",
      "schema": {
        "participantIds": "array<string>",
        "encryptedKeys": "map<uid, string>",
        "lastMessage": {
          "senderId": "string",
          "encryptedSnippet": "string",
          "timestamp": "timestamp"
        },
        "updatedAt": "timestamp"
      },
      "indexes": [
        { "fields": ["participantIds", "updatedAt"], "direction": "descending" }
      ]
    },
    "messages": {
      "description": "Individual E2EE messages (Sub-collection of conversations)",
      "schema": {
        "senderId": "string",
        "content": "string (AES-GCM encrypted blob)",
        "iv": "string (Base64)",
        "createdAt": "timestamp",
        "expiresAt": "timestamp (optional, for TTL)"
      },
      "indexes": [
        { "fields": ["createdAt"], "direction": "ascending" },
        { "fields": ["expiresAt"], "direction": "ascending" }
      ]
    },
    "presence": {
      "description": "Ephemeral status (Sub-collection of conversations)",
      "schema": {
        "status": "string ('typing' | 'online')",
        "updatedAt": "timestamp"
      }
    }
  },
  "ttl_policies": [
    {
      "collection_group": "messages",
      "field": "expiresAt"
    }
  ],
  "example_documents": {
    "conversation": {
      "participantIds": ["user_abc", "user_xyz"],
      "encryptedKeys": {
        "user_abc": "base64_rsa_encrypted_aes_key_for_abc",
        "user_xyz": "base64_rsa_encrypted_aes_key_for_xyz"
      },
      "updatedAt": "2025-12-23T10:00:00Z"
    },
    "message": {
      "senderId": "user_abc",
      "content": "A2B3C4...encrypted_payload",
      "iv": "XyZ123...",
      "createdAt": "2025-12-23T10:00:05Z",
      "expiresAt": "2025-12-23T10:00:35Z"
    }
  }
}
