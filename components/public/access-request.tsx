"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase/client"
import { collection, addDoc, query, where, getDocs, doc, getDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Shield, Loader2, CheckCircle2 } from "lucide-react"
import { useCrypto } from "@/hooks/use-crypto"

interface AccessRequestProps {
  blockId: string
  ownerId: string
  onSuccess?: () => void
}

export function AccessRequest({ blockId, ownerId, onSuccess }: AccessRequestProps) {
  const [status, setStatus] = useState<'none' | 'pending' | 'granted' | 'denied'>('none')
  const [isLoading, setIsLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    async function checkStatus() {
      const user = auth.currentUser
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const q = query(
          collection(db, "access_requests"),
          where("block_id", "==", blockId),
          where("requester_id", "==", user.uid)
        )
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          setStatus(snapshot.docs[0].data().status)
        }
      } catch (e) {
        console.error("Error checking access status:", e)
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()
  }, [blockId])

  const handleRequest = async () => {
    const user = auth.currentUser
    if (!user) return

    setIsRequesting(true)
    try {
      // Get user's public key
      const profileDoc = await getDoc(doc(db, "users", user.uid))
      const publicKey = profileDoc.data()?.public_key

      if (!publicKey) {
        throw new Error("You must set up your security keys in your profile first.")
      }

      await addDoc(collection(db, "access_requests"), {
        block_id: blockId,
        owner_id: ownerId,
        requester_id: user.uid,
        requester_public_key: publicKey,
        status: 'pending',
        createdAt: serverTimestamp()
      })

      setStatus('pending')
      onSuccess?.()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsRequesting(false)
    }
  }

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin mx-auto" />

  if (status === 'granted') {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Access Granted</span>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <Button disabled variant="outline" className="w-full rounded-full">
        Request Pending...
      </Button>
    )
  }

  return (
    <Button 
      onClick={(e) => {
        e.stopPropagation()
        handleRequest()
      }} 
      disabled={isRequesting}
      className="w-full rounded-full gap-2"
    >
      {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
      Request Secure Access
    </Button>
  )
}
