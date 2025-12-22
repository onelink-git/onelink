"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase/client"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { LinksList } from "@/components/links/links-list"
import { AddLinkButton } from "@/components/links/add-link-button"
import { Loader2 } from "lucide-react"
import type { User, LinkBlock } from "@/lib/types/database"

export default function LinksPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const [links, setLinks] = useState<LinkBlock[]>([])
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

        const profileData = { id: profileDoc.id, ...profileDoc.data() } as User
        setProfile(profileData)

        // Fetch links (simplified to avoid composite index)
        const linksQuery = query(
          collection(db, "link_blocks"),
          where("user_id", "==", firebaseUser.uid)
        )
        const snapshot = await getDocs(linksQuery)
        const linksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LinkBlock[]
        // Sort client-side
        setLinks(linksData.sort((a, b) => (a.position || 0) - (b.position || 0)))
      } catch (error) {
        console.error("Error fetching links:", error)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Links</h1>
            <p className="text-muted-foreground">Manage your link blocks and visibility</p>
          </div>
          <AddLinkButton />
        </div>

        <LinksList initialLinks={links} userId={user.uid} />
      </div>
    </DashboardShell>
  )
}