import { useState, useEffect, useCallback } from "react"
import { db, auth } from "@/lib/firebase/client"
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc,
  Timestamp,
  deleteDoc,
  where
} from "firebase/firestore"
import { decryptFromFriend, getPrivateKey, encryptForFriend, importAESKey, decryptContent, encryptContent, exportAESKey, decryptKeyWithPrivateKey } from "@/lib/crypto"

interface Message {
  id: string
  senderId: string
  content: string // Encrypted
  decryptedContent?: string
  type: "text" | "image" | "file"
  timestamp: Timestamp
  expiresAt?: Timestamp
}

interface ChatOptions {
  conversationId: string
  currentUserId: string
}

export function useChat({ conversationId, currentUserId }: ChatOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null)
  const [keyError, setKeyError] = useState<string | null>(null)

  // 1. Initialize / Fetch Shared Key
  useEffect(() => {
    async function getSharedKey() {
      if (!conversationId || !currentUserId || !auth.currentUser) return

      setKeyError(null)
      try {
        const convDoc = await getDoc(doc(db, "conversations", conversationId))
        const data = convDoc.data()
        if (!data) return

        let encryptedKeyBase64 = data.keys?.[currentUserId]
        if (!encryptedKeyBase64) {
          setKeyError("Encryption key not yet established for this chat.")
          return
        }

        // Robustness: check if the key is double-serialized (starts with a quote)
        if (encryptedKeyBase64.startsWith('"')) {
          try {
            encryptedKeyBase64 = JSON.parse(encryptedKeyBase64)
          } catch (e) {
            // Not JSON, continue with raw
          }
        }

        const privateKey = getPrivateKey(currentUserId)
        if (!privateKey) {
          setKeyError("Private key missing on this device. Please recover it in Settings.")
          return
        }

        try {
          // Correctly decrypt the AES key using the RSA private key
          const key = await decryptKeyWithPrivateKey(encryptedKeyBase64, privateKey)
          setSharedKey(key)
        } catch (decryptErr) {
          console.error("RSA Decryption of AES key failed:", decryptErr)
          setKeyError("Failed to decrypt conversation key. Your local RSA key may not match the one on the server.")
        }
      } catch (e) {
        console.error("Error getting shared key:", e)
        setKeyError("Failed to decrypt conversation key.")
      }
    }

    getSharedKey()
  }, [conversationId, currentUserId])

  // 2. Listen for Messages
  useEffect(() => {
    if (!conversationId || !sharedKey || !auth.currentUser) return

    // Soft delete logic: only fetch messages that haven't expired
    // Note: We fetch all messages and filter client-side because of E2EE constraints
    // and to handle the billing-disabled Firestore TTL scenario.
    const qAll = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("timestamp", "asc")
    )

    const unsubscribe = onSnapshot(qAll, async (snapshot) => {
      const now = Date.now()
      const msgsData = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data()
        
        // Skip and cleanup expired messages
        if (data.expiresAt && data.expiresAt.toMillis() < now) {
          if (data.senderId === currentUserId) {
            deleteDoc(d.ref).catch(() => {}) // Silent cleanup
          }
          return null
        }

        let decryptedContent = "🔒 [Encrypted Message]"
        try {
          if (data.content && data.iv) {
            // New schema: content and iv are top-level
            decryptedContent = await decryptContent({
              encryptedContent: data.content,
              iv: data.iv
            }, sharedKey)
          } else if (data.content && data.content.startsWith("{")) {
            // Legacy schema: nested in JSON
            const encrypted = JSON.parse(data.content)
            decryptedContent = await decryptContent(encrypted, sharedKey)
          }
        } catch (e) {
          console.warn("Decryption failed for message:", d.id, e)
        }

        return {
          id: d.id,
          senderId: data.senderId,
          content: data.content,
          type: data.type,
          timestamp: data.createdAt || data.timestamp, // Support both for transition
          expiresAt: data.expiresAt,
          decryptedContent
        }
      }))

      setMessages(msgsData.filter((m): m is any => m !== null))
      setIsLoading(false)
    }, (error) => {
      console.error("Messages listener error:", error)
      setIsLoading(false)
    })

    // Immediate interval to clear expired messages from UI state between snapshots
    const expirationCheckInterval = setInterval(() => {
      const now = Date.now()
      setMessages(prev => prev.filter(m => !m.expiresAt || m.expiresAt.toMillis() > now))
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(expirationCheckInterval)
    }
  }, [conversationId, sharedKey, currentUserId])

  // 3. Listen for Presence (Typing Indicators)
  useEffect(() => {
    if (!conversationId || !sharedKey) return

    const q = query(collection(db, "conversations", conversationId, "presence"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: string[] = []
      const now = Date.now()
      snapshot.docs.forEach(d => {
        const data = d.data()
        if (d.id !== currentUserId && data.isTyping && (now - data.lastUpdated.toMillis() < 5000)) {
          users.push(data.displayName || d.id)
        }
      })
      setTypingUsers(users)
    }, (error) => {
      console.error("Presence listener error:", error)
    })

    return () => unsubscribe()
  }, [conversationId, currentUserId, sharedKey])

  const sendMessage = useCallback(async (text: string, type: "text" | "image" | "file" = "text", burnAfter?: number) => {
    if (!sharedKey || !conversationId) return

    try {
      const encrypted = await encryptContent(text, sharedKey)
      const expiresAt = burnAfter ? Timestamp.fromMillis(Date.now() + burnAfter * 1000) : null

      // Matches firestore.rules: content, iv, senderId, createdAt
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        senderId: currentUserId,
        content: encrypted.encryptedContent,
        iv: encrypted.iv,
        type,
        createdAt: serverTimestamp(),
        expiresAt
      })

      // Update conversation metadata
      await setDoc(doc(db, "conversations", conversationId), {
        lastMessage: "[Encrypted Content]",
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (e) {
      console.error("Failed to send message:", e)
    }
  }, [sharedKey, conversationId, currentUserId])

  const setTyping = useCallback(async (isTyping: boolean, displayName: string) => {
    if (!conversationId || !currentUserId) return
    try {
      await setDoc(doc(db, "conversations", conversationId, "presence", currentUserId), {
        isTyping,
        displayName,
        lastUpdated: serverTimestamp()
      })
    } catch (e) {}
  }, [conversationId, currentUserId])

  return {
    messages,
    isLoading,
    typingUsers,
    sendMessage,
    setTyping,
    hasKey: !!sharedKey,
    keyError
  }
}
