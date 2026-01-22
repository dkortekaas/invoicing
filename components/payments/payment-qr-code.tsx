"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface PaymentQRCodeProps {
  url: string
  invoiceNumber: string
  size?: number
}

export function PaymentQRCode({ url, invoiceNumber, size = 200 }: PaymentQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
    }
  }, [url, size])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-lg border bg-white p-3">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-xs text-muted-foreground">
        Scan om factuur {invoiceNumber} te betalen
      </p>
    </div>
  )
}

/**
 * Generate QR code as data URL (for PDF generation)
 */
export async function generateQRCodeDataUrl(url: string, size: number = 150): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  })
}
