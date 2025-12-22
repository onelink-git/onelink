"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase/client"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { generateKeyPair, storePrivateKey, getPrivateKey } from "@/lib/crypto"

export function useRSAKeyCheck() {
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsChecking(false)
        return
      }

      try {
        const localKey = getPrivateKey(user.uid)
        
        // Fetch user profile to see if they have a public key on the server
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (!userDoc.exists()) {
          setIsChecking(false)
          return
        }

        const userData = userDoc.data()
        const serverPublicKey = userData.public_key

        // Case 1: No keys anywhere - Generate new ones automatically
        if (!localKey && !serverPublicKey) {
          console.log("No RSA keys found. Generating new pair...")
          const keys = await generateKeyPair()
          await storePrivateKey(user.uid, keys.privateKey)
          await updateDoc(doc(db, "users", user.uid), {
            public_key: keys.publicKey,
            updated_at: new Date().toISOString()
          })
          console.log("New RSA keys generated and stored.")
        }
        // Case 2: Local key missing but server has public key
        // We can't do much automatically here without the vault passphrase,
        // so we let the existing UI alerts handle prompting the user to recover.
        
      } catch (error) {
        console.error("Error during RSA key check:", error)
      } finally {
        setIsChecking(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return { isChecking }
}
