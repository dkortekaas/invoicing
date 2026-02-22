"use client"

import { useState } from "react"
import { FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import SigningActivationModal from "./SigningActivationModal"

interface SigningPanelActivateProps {
  quoteId: string
}

export default function SigningPanelActivate({ quoteId }: SigningPanelActivateProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        <FileCheck className="h-4 w-4 mr-2" />
        Verstuur ondertekeningsverzoek
      </Button>
      <SigningActivationModal quoteId={quoteId} open={open} onOpenChange={setOpen} />
    </>
  )
}
