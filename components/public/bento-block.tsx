"use client"

import { motion } from "framer-motion"
import { ExternalLink, Lock, Loader2, Play, FileText, Smartphone, Download, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useCrypto } from "@/hooks/use-crypto"
import { LinkBlock } from "@/lib/types/database"
import { db } from "@/lib/firebase/client"
import { doc, updateDoc, increment } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { AccessRequest } from "./access-request"

interface BentoBlockProps {
  link: LinkBlock
  isOwner: boolean
}

const sizeClasses = {
  sm: "col-span-1 row-span-1 aspect-square",
  md: "col-span-2 row-span-1",
  lg: "col-span-2 row-span-2",
  xl: "col-span-full row-span-1",
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
}

export function BentoBlock({ link, isOwner }: BentoBlockProps) {
  const { decryptedData, decryptedFile, isLoading, containerRef, isEncrypted } = useCrypto({
    encryptedBlob: link.encrypted_blob,
    blockId: link.id,
    enabled: isOwner
  })

  const finalUrl = decryptedData || link.url
  const hasFile = decryptedFile !== null

  const handleAction = async () => {
    if (hasFile && decryptedFile) {
      const url = window.URL.createObjectURL(decryptedFile)
      const a = document.createElement('a')
      a.href = url
      const parsed = JSON.parse(link.encrypted_blob!)
      a.download = parsed.file_name || 'secured-asset'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      return
    }

    if (!finalUrl) return

    // Increment click count
    try {
      const linkRef = doc(db, "link_blocks", link.id)
      await updateDoc(linkRef, {
        click_count: increment(1)
      })
    } catch (e) {
      console.error("Failed to increment clicks:", e)
    }

    window.open(finalUrl, "_blank", "noopener,noreferrer")
  }

  const isLocked = isEncrypted && !isOwner && !finalUrl && !hasFile

  return (
    <motion.div
      ref={containerRef}
      layout
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover={!isLocked ? "hover" : undefined}
      whileTap={!isLocked ? "tap" : undefined}
      className={cn(
        "group relative overflow-hidden rounded-3xl border-2 bg-card p-6 shadow-sm transition-all",
        !isLocked ? "cursor-pointer hover:shadow-md" : "cursor-default",
        sizeClasses[link.size || "sm"]
      )}
      onClick={() => !isLocked && handleAction()}
    >
      <div className="flex h-full flex-col justify-between space-y-4">
        <div className="flex items-start justify-between">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
            isLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          )}>
            {link.type === "link" && <ExternalLink className="h-6 w-6" />}
            {link.type === "social" && <Smartphone className="h-6 w-6" />}
            {link.type === "file" && (hasFile ? <Download className="h-6 w-6" /> : <Lock className="h-6 w-6" />)}
            {link.type === "note" && <FileText className="h-6 w-6" />}
          </div>
          <div className="flex gap-2">
            {hasFile && <ShieldCheck className="h-4 w-4 text-green-500" />}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold leading-tight">{link.title}</h3>
          
          {isLocked ? (
            <div className="mt-4">
              <AccessRequest blockId={link.id} ownerId={link.user_id} />
            </div>
          ) : (
            <>
              {finalUrl && (
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {new URL(finalUrl).hostname}
                </p>
              )}
              {hasFile && (
                <p className="mt-1 text-sm text-green-600 font-medium">
                  Ready to download
                </p>
              )}
              {isLoading && <p className="mt-1 text-xs text-primary animate-pulse">Securing connection...</p>}
            </>
          )}
        </div>
      </div>

      {/* Decorative background element */}
      {!isLocked && (
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
      )}
    </motion.div>
  )
}
