"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

interface LogoUploadProps {
  currentLogo?: string | null
  onUploadSuccess: (url: string) => void
}

export function LogoUpload({ currentLogo, onUploadSuccess }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentLogo || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setError("Alleen PNG, JPEG, SVG of WebP afbeeldingen zijn toegestaan")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Bestand is te groot. Maximum 2MB toegestaan")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fout bij uploaden")
      }

      const data = await response.json()
      setPreview(data.url)
      onUploadSuccess(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij uploaden logo")
      setPreview(currentLogo || null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = async () => {
    setIsUploading(true)
    setError(null)

    try {
      const response = await fetch("/api/upload/logo/delete", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fout bij verwijderen")
      }

      setPreview(null)
      onUploadSuccess("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij verwijderen logo")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Label>Bedrijfslogo</Label>
      <div className="flex items-start gap-4">
        {preview && (
          <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={preview}
              alt="Bedrijfslogo"
              fill
              className="object-contain p-2"
            />
            {preview && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="logo-upload"
            />
            <Label
              htmlFor="logo-upload"
              className="cursor-pointer"
            >
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                asChild
              >
                <span>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploaden...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {preview ? "Logo wijzigen" : "Logo uploaden"}
                    </>
                  )}
                </span>
              </Button>
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            PNG, JPEG, SVG of WebP. Maximaal 2MB. Wordt getoond op facturen.
          </p>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
