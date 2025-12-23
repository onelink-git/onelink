"use client"

import { useState, useEffect } from "react"
import { Shield, Key, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateKeyPair, storePrivateKey, getPrivateKey, encryptPrivateKeyForVault, decryptPrivateKeyFromVault } from "@/lib/crypto"
import { db } from "@/lib/firebase/client"
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"

interface SecuritySettingsProps {
  userId: string
  publicKey: string | null
  hasVault: boolean
}

export function SecuritySettings({ userId, publicKey: initialPublicKey, hasVault: initialHasVault }: SecuritySettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(initialPublicKey)
  const [hasVault, setHasVault] = useState(initialHasVault)
  const [hasLocalPrivateKey, setHasLocalPrivateKey] = useState(false)
  const [passphrase, setPassphrase] = useState("")
  const [showVaultSetup, setShowVaultSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const privateKey = getPrivateKey(userId)
    setHasLocalPrivateKey(!!privateKey)
  }, [userId])

  const handleGenerateKeys = async () => {
    if (!passphrase && !hasLocalPrivateKey) {
      setShowVaultSetup(true)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const keys = await generateKeyPair()
      
      // Store private key locally
      await storePrivateKey(userId, keys.privateKey)
      
      // Encrypt for vault if passphrase provided
      let keyVault = null
      if (passphrase) {
        keyVault = await encryptPrivateKeyForVault(keys.privateKey, passphrase)
      }
      
      // Update Firestore
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, { 
        public_key: keys.publicKey,
        updatedAt: serverTimestamp()
      })

      const vaultRef = doc(db, "users", userId, "vault", "keys")
      await setDoc(vaultRef, {
        key_vault: keyVault,
        updatedAt: serverTimestamp()
      }, { merge: true })

      setPublicKey(keys.publicKey)
      setHasLocalPrivateKey(true)
      setHasVault(!!keyVault)
      setShowVaultSetup(false)
      setPassphrase("")
      router.refresh()
    } catch (err) {
      console.error("Failed to generate keys:", err)
      setError(err instanceof Error ? err.message : "Failed to generate security keys")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecoverFromVault = async () => {
    if (!passphrase) {
      setError("Passphrase required for recovery")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const vaultRef = doc(db, "users", userId, "vault", "keys")
      const vaultDoc = await getDoc(vaultRef)
      const vaultBlob = vaultDoc.data()?.key_vault

      if (!vaultBlob) throw new Error("No vault found on server")

      const privateKey = await decryptPrivateKeyFromVault(vaultBlob, passphrase)
      await storePrivateKey(userId, privateKey)
      
      setHasLocalPrivateKey(true)
      setPassphrase("")
      router.refresh()
    } catch (err) {
      console.error("Recovery failed:", err)
      setError("Failed to recover key. Check your passphrase.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Privacy & Security</CardTitle>
        </div>
        <CardDescription>
          Manage your end-to-end encryption keys. These keys are used to secure your private links and messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {publicKey && hasLocalPrivateKey ? (
          <Alert className="bg-primary/5 border-primary/20">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-semibold">Security Active</AlertTitle>
            <AlertDescription>
              Your end-to-end encryption is active. Your private key is stored securely on this device.
            </AlertDescription>
          </Alert>
        ) : !publicKey ? (
          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Security Not Configured</AlertTitle>
            <AlertDescription>
              You haven't generated your encryption keys yet. You won't be able to use friends-only or private features.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="warning" className="bg-yellow-500/5 border-yellow-500/20 text-yellow-600 dark:text-yellow-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Private Key Missing</AlertTitle>
            <AlertDescription>
              A public key is registered, but your private key was not found on this device. If you're on a new device, you'll need to re-generate keys (this will make previously encrypted content unreadable).
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">RSA-OAEP 2048-bit Key Pair</p>
              <p className="text-xs text-muted-foreground mt-1">
                Industry-standard asymmetric encryption. Your private key can be backed up to our secure vault, encrypted with a passphrase only you know.
              </p>
            </div>
          </div>

          {(showVaultSetup || !publicKey) && (
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="passphrase">Security Passphrase (for Cloud Vault)</Label>
                <Input
                  id="passphrase"
                  type="password"
                  placeholder="Strong passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  This passphrase is used to encrypt your private key before it's sent to our server. We never see this passphrase.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateKeys} 
                  disabled={isLoading || (!passphrase && !publicKey)}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {publicKey ? "Reset & Back up" : "Generate & Back up"}
                </Button>
                {showVaultSetup && (
                  <Button variant="ghost" onClick={() => setShowVaultSetup(false)}>Cancel</Button>
                )}
              </div>
            </div>
          )}

          {!showVaultSetup && publicKey && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                variant="outline"
                onClick={() => setShowVaultSetup(true)} 
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-generate Keys
              </Button>
              
              {!hasLocalPrivateKey && hasVault && (
                <div className="w-full space-y-3 mt-4 border-t pt-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Recover from Cloud Vault
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Your passphrase"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="max-w-[200px]"
                    />
                    <Button onClick={handleRecoverFromVault} disabled={isLoading || !passphrase}>
                      Recover
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {publicKey && (
            <p className="text-[10px] text-muted-foreground">
              Note: Re-generating keys will make any existing encrypted content unreadable.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
