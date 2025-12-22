"use client"

import { useState, useEffect, useRef } from "react"
import { decryptFromFriend, getPrivateKey, decryptFile, importAESKey, base64ToArrayBuffer } from "@/lib/crypto"
import { auth, db } from "@/lib/firebase/client"
import { collection, query, where, getDocs } from "firebase/firestore"

interface UseCryptoOptions {
  encryptedBlob: string | null
  blockId: string
  enabled: boolean
}

export function useCrypto({ encryptedBlob, blockId, enabled }: UseCryptoOptions) {
  const [decryptedData, setDecryptedData] = useState<string | null>(null)
  const [decryptedFile, setDecryptedFile] = useState<Blob | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inView, setInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !encryptedBlob || decryptedData || decryptedFile) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [enabled, encryptedBlob, decryptedData, decryptedFile])

  useEffect(() => {
    async function decrypt() {
      if (!inView || !encryptedBlob || decryptedData || decryptedFile || isLoading) return

      setIsLoading(true)
      setError(null)

      try {
        const user = auth.currentUser
        if (!user) throw new Error("Not authenticated")

        const privateKey = getPrivateKey(user.uid)
        if (!privateKey) throw new Error("Private key not found")

        const parsed = JSON.parse(encryptedBlob)
        let aesKeyBase64 = null

        // 1. Check if owner (can decrypt the key stored in the block)
        if (enabled) {
          try {
            aesKeyBase64 = await decryptFromFriend(parsed, privateKey)
          } catch (e) {
            // Not owner or key format different, check for grant
          }
        }

        // 2. If not owner, check for access grant
        if (!aesKeyBase64) {
          const q = query(
            collection(db, "access_grants"),
            where("block_id", "==", blockId),
            where("user_id", "==", user.uid)
          )
          const snapshot = await getDocs(q)
          if (!snapshot.empty) {
            const grant = snapshot.docs[0].data()
            // The grant has the AES key encrypted with the requester's public key
            aesKeyBase64 = await decryptFromFriend(grant.encrypted_aes_key, privateKey)
          }
        }

        if (!aesKeyBase64) {
          setIsLoading(false)
          return // No access yet
        }

        const aesKey = await importAESKey(aesKeyBase64)

        // Handle File vs Text
        if (parsed.file_url) {
          const response = await fetch(parsed.file_url)
          const encryptedBuffer = await response.arrayBuffer()
          const iv = base64ToArrayBuffer(parsed.iv)
          const decryptedBlob = await decryptFile(encryptedBuffer, aesKey, new Uint8Array(iv))
          setDecryptedFile(decryptedBlob)
        } else {
          // Standard text decryption (already handled by aesKeyBase64 logic for simplicity here)
          // Wait, aesKeyBase64 is the decrypted AES key. We still need to decrypt the content.
          const decrypted = await decryptFromFriend(parsed, privateKey)
          setDecryptedData(decrypted)
        }
      } catch (err) {
        console.error("Lazy decryption failed:", err)
        setError(err instanceof Error ? err.message : "Decryption failed")
      } finally {
        setIsLoading(false)
      }
    }

    decrypt()
  }, [inView, encryptedBlob, decryptedData, decryptedFile, isLoading, blockId, enabled])

  return {
    decryptedData,
    decryptedFile,
    isLoading,
    error,
    containerRef,
    isEncrypted: !!encryptedBlob
  }
}
