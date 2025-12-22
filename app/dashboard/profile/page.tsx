"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase/client"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { SecuritySettings } from "@/components/dashboard/security-settings"
import { Loader2 } from "lucide-react"
import type { User } from "@/lib/types/database"

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const [hasVault, setHasVault] = useState(false)
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

        // Fetch vault status
        const vaultDoc = await getDoc(doc(db, "users", firebaseUser.uid, "vault", "keys"))
        setHasVault(!!vaultDoc.data()?.key_vault)
      } catch (error) {
        console.error("Error fetching profile:", error)
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
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Update your profile information and appearance</p>
        </div>

        <ProfileForm profile={profile} />

        <div className="border-t pt-10">
          <SecuritySettings 
            userId={user.uid} 
            publicKey={profile.public_key} 
            hasVault={hasVault}
          />
        </div>
      </div>
    </DashboardShell>
  )
}