"use client"

import { useEffect, useState } from "react"
import { notFound, usePathname } from "next/navigation"
import { auth, db } from "@/lib/firebase/client"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore"
import { PublicProfile } from "@/components/public/public-profile"
import { Loader2 } from "lucide-react"
import type { User, LinkBlock } from "@/lib/types/database"

export default function ProfilePage() {
  const pathname = usePathname()
  const nickname = pathname.split("/").pop() || ""
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const [links, setLinks] = useState<LinkBlock[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [notFoundState, setNotFoundState] = useState(false)

  useEffect(() => {
    if (!nickname || nickname === "profile") return

    async function fetchData() {
      try {
        const usersRef = collection(db, "users")
        const qUser = query(usersRef, where("nickname", "==", nickname.toLowerCase()))
        const userSnapshot = await getDocs(qUser)

        if (userSnapshot.empty) {
          setNotFoundState(true)
          setLoading(false)
          return
        }

        const profileData = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() } as User
        setProfile(profileData)

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          const owner = firebaseUser?.uid === profileData.id
          setIsOwner(owner)

          const linksRef = collection(db, "link_blocks")
          let visibleLinks: LinkBlock[] = []

          try {
            if (owner) {
              // Owner can fetch all their active links
              const qAll = query(linksRef, where("user_id", "==", profileData.id), where("is_active", "==", true))
              const snapshot = await getDocs(qAll)
              visibleLinks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LinkBlock[]
            } else {
              // Non-owners: First fetch strictly public links to avoid permission errors
              const qPublic = query(
                linksRef, 
                where("user_id", "==", profileData.id), 
                where("is_active", "==", true),
                where("visibility", "==", "public")
              )
              const publicSnapshot = await getDocs(qPublic)
              visibleLinks = publicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LinkBlock[]

              // If logged in, check for friendship to fetch friends-only links
              if (firebaseUser) {
                const connRef = collection(db, "connections")
                const q1 = query(connRef, where("requester_id", "==", firebaseUser.uid), where("receiver_id", "==", profileData.id), where("status", "==", "accepted"))
                const q2 = query(connRef, where("requester_id", "==", profileData.id), where("receiver_id", "==", firebaseUser.uid), where("status", "==", "accepted"))
                
                const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)])
                const isFriend = !s1.empty || !s2.empty

                if (isFriend) {
                  const qFriends = query(
                    linksRef, 
                    where("user_id", "==", profileData.id), 
                    where("is_active", "==", true),
                    where("visibility", "==", "friends")
                  )
                  const friendsSnapshot = await getDocs(qFriends)
                  const friendLinks = friendsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LinkBlock[]
                  visibleLinks = [...visibleLinks, ...friendLinks]
                }
              }
            }
          } catch (err) {
            console.error("Error fetching links for profile:", err)
          }

          setLinks(visibleLinks.sort((a, b) => (a.position || 0) - (b.position || 0)))
          setLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching profile page data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [nickname])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFoundState || !profile || !nickname) {
    notFound()
  }

  return <PublicProfile profile={profile} links={links} isOwner={isOwner} />
}