"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase/client"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { FriendsTabs } from "@/components/friends/friends-tabs"
import { Loader2 } from "lucide-react"
import type { User } from "@/lib/types/database"

export default function FriendsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const [connections, setConnections] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/auth/login")
        return
      }

      setUser(firebaseUser)

      try {
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (!profileDoc.exists()) {
          router.push("/auth/login")
          return
        }

        setProfile({ id: profileDoc.id, ...profileDoc.data() } as User)

        // Fetch connections (internal database name remains 'connections')
        const qReq = query(collection(db, "connections"), where("requester_id", "==", firebaseUser.uid))
        const qRec = query(collection(db, "connections"), where("receiver_id", "==", firebaseUser.uid))
        
        const [sReq, sRec] = await Promise.all([getDocs(qReq), getDocs(qRec)])
        const connectionsData = [...sReq.docs, ...sRec.docs].map(d => ({ id: d.id, ...d.data() }))

        // Enhance with user details
        const enhancedConnections = await Promise.all(connectionsData.map(async (conn: any) => {
          const [reqDoc, recDoc] = await Promise.all([
            getDoc(doc(db, "users", conn.requester_id)),
            getDoc(doc(db, "users", conn.receiver_id))
          ])
          
          return {
            ...conn,
            requester: { id: reqDoc.id, ...reqDoc.data() },
            receiver: { id: recDoc.id, ...recDoc.data() }
          }
        }))

        setConnections(enhancedConnections)
      } catch (error) {
        console.error("Error fetching friends:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <DashboardShell user={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-muted-foreground">Connect with others and chat in real-time</p>
        </div>

        <FriendsTabs connections={connections} currentUserId={user.uid} />
      </div>
    </DashboardShell>
  )
}
