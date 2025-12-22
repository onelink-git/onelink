"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"
import QRCode from "qrcode"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileUrl: string
  displayName: string
}

export function QRCodeDialog({ open, onOpenChange, profileUrl, displayName }: QRCodeDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateQRCode = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!canvas || !profileUrl) return

    setIsGenerating(true)
    try {
      // Small delay to ensure container is fully rendered
      await new Promise(resolve => setTimeout(resolve, 50))
      
      await QRCode.toCanvas(canvas, profileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
    } catch (error) {
      console.error("Failed to generate QR code:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [profileUrl])

  useEffect(() => {
    if (open && canvasRef.current) {
      generateQRCode(canvasRef.current)
    }
  }, [open, generateQRCode])

  const handleDownload = () => {
    if (!canvasRef.current) return

    const url = canvasRef.current.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `${displayName}-qr-code.png`
    link.href = url
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Profile QR Code</DialogTitle>
          <DialogDescription>Share your OneLink profile with a QR code</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="rounded-2xl border-2 bg-white p-6 shadow-sm">
            <canvas 
              ref={canvasRef} 
              className="max-w-full h-auto"
              style={{ width: '250px', height: '250px' }}
            />
            {isGenerating && (
              <div className="flex items-center justify-center absolute inset-0 bg-white/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="text-center space-y-2 px-4">
            <p className="text-base font-bold">{displayName}</p>
            <p className="text-xs text-muted-foreground break-all font-mono bg-muted p-2 rounded-lg">
              {profileUrl}
            </p>
          </div>

          <Button onClick={handleDownload} className="w-full rounded-full" disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}