"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase/client"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Loader2, Check, X, FileText } from "lucide-react"
import { decryptFromFriend, encryptForFriend, getPrivateKey } from "@/lib/crypto"

import { onAuthStateChanged } from "firebase/auth"

export function AccessRequestsManager() {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const q = query(
          collection(db, "access_requests"),
          where("owner_id", "==", user.uid),
          where("status", "==", "pending")
        )
        const snapshot = await getDocs(q)
        
        const reqs = await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data()
          // Fetch block and requester details
          const blockDoc = await getDoc(doc(db, "link_blocks", data.block_id))
          const requesterDoc = await getDoc(doc(db, "users", data.requester_id))
          
          return {
            id: d.id,
            ...data,
            blockTitle: blockDoc.data()?.title,
            requesterName: requesterDoc.data()?.displayName,
            blockData: blockDoc.data()
          }
        }))
        
        setRequests(reqs)
      } catch (e) {
        console.error("Error fetching requests:", e)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleApprove = async (request: any) => {
    const user = auth.currentUser
    if (!user) return

    setIsProcessing(request.id)
    try {
      const privateKey = getPrivateKey(user.uid)
      if (!privateKey) throw new Error("Private key not found locally. Please ensure security keys are configured.")

      // 1. Decrypt the block's AES key using our private key
      const blockEncryptedBlob = JSON.parse(request.blockData.encrypted_blob)
      // For files, encrypted_blob contains {content, iv, file_url, etc.} where 'content' is the AES key
      const aesKeyBase64 = await decryptFromFriend(blockEncryptedBlob, privateKey)

      // 2. Re-encrypt the AES key using the requester's public key
      const encryptedForRequester = await encryptForFriend(aesKeyBase64, request.requester_public_key)

      // 3. Create access grant
      await addDoc(collection(db, "access_grants"), {
        block_id: request.block_id,
        user_id: request.requester_id,
        encrypted_aes_key: encryptedForRequester, // This is the encrypted object {content, iv, encryptedKey}
        granted_at: new Date().toISOString()
      })

      // 4. Update request status
      await updateDoc(doc(db, "access_requests", request.id), {
        status: "granted"
      })

      setRequests(prev => prev.filter(r => r.id !== request.id))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleDeny = async (requestId: string) => {
    setIsProcessing(requestId)
    try {
      await updateDoc(doc(db, "access_requests", requestId), {
        status: "denied"
      })
      setRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (e) {
      console.error("Deny error:", e)
    } finally {
      setIsProcessing(null)
    }
  }

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

  if (requests.length === 0) return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center text-muted-foreground">
        No pending access requests.
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <Card key={req.id}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{req.requesterName} requested access to</p>
                <p className="text-sm text-muted-foreground font-medium">"{req.blockTitle}"</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleDeny(req.id)}
                disabled={isProcessing === req.id}
              >
                <X className="h-4 w-4 mr-1" /> Deny
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleApprove(req)}
                disabled={isProcessing === req.id}
              >
                {isProcessing === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Approve & Grant
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
