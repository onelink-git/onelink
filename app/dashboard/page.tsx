"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase/client"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { QuickStats } from "@/components/dashboard/quick-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link2, Users, ArrowRight, ShieldAlert, Loader2 } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { User } from "@/lib/types/database"
import { AccessRequestsManager } from "@/components/dashboard/access-requests-manager"
import { getPrivateKey } from "@/lib/crypto"

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profile, setProfile] = useState<User | null>(null)
  const [recentLinks, setRecentLinks] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [hasLocalKey, setHasLocalKey] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Only redirect if we've checked and definitely have no user
        router.push("/auth/login")
        return
      }

      setUser(firebaseUser)
      setProfileLoading(true)
      
      // Check local key
      const localKey = getPrivateKey(firebaseUser.uid)
      setHasLocalKey(!!localKey)

      try {
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (!profileDoc.exists()) {
          console.warn("Profile document not found for user:", firebaseUser.uid)
          // Don't redirect immediately, maybe it's a slow write
          setProfileLoading(false)
          setLoading(false)
          return
        }

        const profileData = { id: profileDoc.id, ...profileDoc.data() } as User
        setProfile(profileData)

        // Fetch recent links (simplified query to avoid index requirements during build/MVP)
        const linksQuery = query(
          collection(db, "link_blocks"),
          where("user_id", "==", firebaseUser.uid),
          limit(3)
        )
        const linksSnapshot = await getDocs(linksQuery)
        setRecentLinks(linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setProfileLoading(false)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || (!profile && !profileLoading)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Finalizing your session...</p>
        <Button onClick={() => router.push("/auth/login")}>Return to Login</Button>
      </div>
    )
  }

  return (
    <DashboardShell user={profile!}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Welcome back, {profile.display_name.split(" ")[0]}!</h1>
            <p className="mt-2 text-muted-foreground">Here's an overview of your OneLink profile</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/u/${profile.nickname}`} target="_blank">
              View Public Profile
            </Link>
          </Button>
        </div>

        {/* Security Alert - Key Missing in Firestore */}
        {!profile.public_key && (
          <Alert variant="destructive" className="border-2 shadow-sm">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Security Keys Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Generate your privacy keys to enable end-to-end encryption for private links and messages.</span>
              <Button variant="destructive" size="sm" asChild className="shrink-0 rounded-full">
                <Link href="/dashboard/profile">Setup Security</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Security Alert - Key Missing in LocalStorage but exists in Firestore */}
        {profile.public_key && !hasLocalKey && (
          <Alert variant="warning" className="border-2 shadow-sm bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
            <ShieldAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-400">Identity Recovery Needed</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-yellow-700 dark:text-yellow-500/80">
              <span>Your security keys are missing on this device. Recover them from your cloud vault to access encrypted content.</span>
              <Button variant="outline" size="sm" asChild className="shrink-0 rounded-full border-yellow-300 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/40">
                <Link href="/dashboard/profile">Recover Keys</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <QuickStats userId={user.uid} />

        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Access Requests</h2>
          <AccessRequestsManager />
        </div>

        <ProfileCard profile={profile} />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2 transition-all hover:border-primary">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Manage Links</CardTitle>
              <CardDescription>Add, edit, or reorder your link blocks</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link href="/dashboard/links">
                  Go to Links
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 transition-all hover:border-primary">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Friends</CardTitle>
              <CardDescription>Connect with friends and share exclusive content</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between" asChild>
                <Link href="/dashboard/friends">
                  View Friends
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {recentLinks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Links</CardTitle>
                  <CardDescription>Your most recently added links</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/links">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground">{link.click_count || 0} clicks</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/links">Edit</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}