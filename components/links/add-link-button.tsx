"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { AddLinkDialog } from "@/components/links/add-link-dialog"

export function AddLinkButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Link
      </Button>
      <AddLinkDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
