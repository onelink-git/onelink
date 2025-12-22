"use client"

import type React from "react"

import { auth, db } from "@/lib/firebase/client"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate nickname format
      if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
        throw new Error("Nickname can only contain letters, numbers, underscores, and hyphens")
      }

      // Check if nickname is taken (in real app, use a query or better yet, a dedicated collection for unique nicknames)
      // For now, we'll try to create the doc and let security rules or index handle it
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName,
      })

      // Initialize Firestore user document
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email: email,
        nickname: nickname.toLowerCase(),
        display_name: displayName,
        bio: "",
        avatar_url: "",
        cover_photo: "",
        public_key: null,
        theme_config: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Initialize empty vault
      await setDoc(doc(db, "users", user.uid, "vault", "keys"), {
        key_vault: null,
        updated_at: new Date().toISOString()
      })

      const token = await user.getIdToken()
      document.cookie = `session=${token}; path=/; max-age=3600; SameSite=Lax`

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Sign up error:", error)
      setError(error.message || "An error occurred during sign up")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Lock className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Create your OneLink</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join the privacy-first platform</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign up</CardTitle>
            <CardDescription>Create your account in seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Username</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="yourname"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.toLowerCase())}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Your profile: onelink.app/u/{nickname || "yourname"}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
