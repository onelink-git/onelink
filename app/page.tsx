import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Sparkles, Users, Zap, Eye } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold">OneLink</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mx-auto w-full max-w-7xl px-6 py-24 text-center">
        <Badge variant="secondary" className="mb-6">
          Privacy-First Link Platform
        </Badge>
        <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          Your links, your privacy, your control
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
          Build your digital presence with end-to-end encryption, selective sharing, and secure P2P asset distribution. The only
          link-in-bio platform that puts privacy first.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">Start Building Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">Explore Features</Link>
          </Button>
        </div>

        {/* Visual Demo */}
        <div className="mt-16">
          <Card className="overflow-hidden border-2 bg-card p-8">
            <div className="mx-auto max-w-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-primary/10" />
                <div className="flex-1 text-left">
                  <div className="h-4 w-32 rounded bg-primary/20" />
                  <div className="mt-2 h-3 w-24 rounded bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                    <div className="h-8 w-8 rounded bg-primary/10" />
                    <div className="h-3 flex-1 rounded bg-muted" />
                    {i === 2 && <Lock className="h-4 w-4 text-primary" />}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          <div className="text-center">
            <div className="text-4xl font-bold">100%</div>
            <div className="mt-1 text-sm text-muted-foreground">Encrypted</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">Zero</div>
            <div className="mt-1 text-sm text-muted-foreground">Tracking</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">∞</div>
            <div className="mt-1 text-sm text-muted-foreground">Links</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">P2P</div>
            <div className="mt-1 text-sm text-muted-foreground">Sharing</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto w-full max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold md:text-4xl">Built for privacy. Designed for creators.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Everything you need to share your content and assets without compromising your data or your audience&apos;s privacy.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-xl font-bold">End-to-End Encryption</h3>
            <p className="mt-2 text-muted-foreground">
              Your private links are encrypted with RSA keys. Only you and your chosen friends can decrypt them.
            </p>
          </Card>

          <Card className="border-2 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Friend Connections</h3>
            <p className="mt-2 text-muted-foreground">
              Share exclusive content with friends. Control who sees what with granular privacy settings.
            </p>
          </Card>

          <Card className="border-2 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Secure Asset Blocks</h3>
            <p className="mt-2 text-muted-foreground">
              Share files securely using peer-to-peer key exchange. No unencrypted storage, no surveillance.
            </p>
          </Card>

          <Card className="border-2 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Granular Visibility</h3>
            <p className="mt-2 text-muted-foreground">
              Public, friends-only, or private. Choose exactly who can see each link on your profile.
            </p>
          </Card>

          <Card className="border-2 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Lightning Fast</h3>
            <p className="mt-2 text-muted-foreground">
              Built on modern tech for instant loading. Your audience gets the best experience, always.
            </p>
          </Card>

          <Card className="border-2 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Data Ownership</h3>
            <p className="mt-2 text-muted-foreground">
              Your data belongs to you. No selling, no tracking, no surveillance. Complete data ownership.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-balance text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
              Get started in minutes. No complex setup, no learning curve.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mt-4 text-xl font-bold">Create Your Profile</h3>
              <p className="mt-2 text-muted-foreground">
                Sign up and claim your unique username. Generate your secure encryption keys on your device.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mt-4 text-xl font-bold">Add Your Links</h3>
              <p className="mt-2 text-muted-foreground">
                Add links to your content. Set each link as public, friends-only, or private with encryption.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mt-4 text-xl font-bold">Share & Connect</h3>
              <p className="mt-2 text-muted-foreground">
                Share your OneLink profile. Connect with friends to unlock exclusive content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-6 py-24">
        <Card className="border-2 bg-primary p-12 text-center text-primary-foreground">
          <h2 className="text-balance text-3xl font-bold md:text-4xl">Ready to take control of your links?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-primary-foreground/90">
            Join the privacy-first movement. Build your digital presence without surveillance.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/sign-up">Get Started Free</Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold">OneLink</span>
            </div>
            <p className="text-sm text-muted-foreground">Privacy-first link platform. Your data, your rules.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
