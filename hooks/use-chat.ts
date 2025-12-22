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
    // Note: This query requires a composite index in Firestore
    // If it fails, we fall back to client-side filtering
    const now = Timestamp.now()
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      where("expiresAt", "==", null), // Non-expiring messages
      orderBy("timestamp", "asc")
    )

    const qExpiring = query(
      collection(db, "conversations", conversationId, "messages"),
      where("expiresAt", ">", now), // Not yet expired
      orderBy("expiresAt", "asc")
    )

    // Combined listener or just fetch all and filter client-side to be safe with indexes
    const qAll = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("timestamp", "asc")
    )

    const unsubscribe = onSnapshot(qAll, async (snapshot) => {
      const currentNow = Date.now()
      const msgsData = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data() as Message
        
        // Filter out expired messages
        if (data.expiresAt && data.expiresAt.toMillis() < currentNow) {
          // Cleanup: delete expired messages from the sender's side
          if (data.senderId === currentUserId) {
            deleteDoc(d.ref).catch(console.error)
          }
          return null
        }

        let decryptedContent = "🔒 [Encrypted Message]"
        try {
          const encrypted = JSON.parse(data.content)
          decryptedContent = await decryptContent(encrypted, sharedKey)
        } catch (e) {
          // Decryption failed
        }

        return {
          id: d.id,
          ...data,
          decryptedContent
        }
      }))

      setMessages(msgsData.filter(m => m !== null) as Message[])
      setIsLoading(false)
    })

    // Setup a timer to re-check expiration every 10 seconds if there are expiring messages
    const expirationCheckInterval = setInterval(() => {
      setMessages(prev => prev.filter(m => !m.expiresAt || m.expiresAt.toMillis() > Date.now()))
    }, 10000)

    return () => {
      unsubscribe()
      clearInterval(expirationCheckInterval)
    }
  }, [conversationId, sharedKey])

  // 3. Listen for Presence (Typing Indicators)
  useEffect(() => {
    if (!conversationId) return

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
    })

    return () => unsubscribe()
  }, [conversationId, currentUserId])

  const sendMessage = useCallback(async (text: string, type: "text" | "image" | "file" = "text", burnAfter?: number) => {
    if (!sharedKey || !conversationId) return

    try {
      const encrypted = await encryptContent(text, sharedKey)
      const expiresAt = burnAfter ? Timestamp.fromMillis(Date.now() + burnAfter * 1000) : null

      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        senderId: currentUserId,
        content: JSON.stringify(encrypted),
        type,
        timestamp: serverTimestamp(),
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
