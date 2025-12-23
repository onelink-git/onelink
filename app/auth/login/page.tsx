"use client"

import type React from "react"

import { auth } from "@/lib/firebase/client"
import { signInWithEmailAndPassword } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const normalizedNickname = nickname.toLowerCase().trim()
      const internalEmail = `${normalizedNickname}@onelink.internal`
      
      const userCredential = await signInWithEmailAndPassword(auth, internalEmail, password)
      const token = await userCredential.user.getIdToken()
      
      // Set session cookie (simple client-side cookie for demo, 
      // in production use a secure API route to set HTTP-only cookie)
      document.cookie = `session=${token}; path=/; max-age=3600; SameSite=Lax`
      
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      let message = "Invalid nickname or password"
      if (error.code === "auth/user-not-found") {
        message = "No account found with this nickname."
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password."
      }
      setError(message)
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
          <h1 className="mt-4 text-2xl font-bold">Welcome to OneLink</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your profile</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your nickname and password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="bobsby23"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
                Create one now
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
