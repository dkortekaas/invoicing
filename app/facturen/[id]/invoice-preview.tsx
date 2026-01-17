"use client"

import { FileText, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

interface InvoicePreviewProps {
  invoiceId: string
  invoiceNumber: string
  children: React.ReactNode
}

export function InvoicePreview({ invoiceId, invoiceNumber, children }: InvoicePreviewProps) {
  const previewUrl = `/api/invoices/${invoiceId}/pdf`

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList>
        <TabsTrigger value="details">
          <Eye className="mr-2 h-4 w-4" />
          Details
        </TabsTrigger>
        <TabsTrigger value="preview">
          <FileText className="mr-2 h-4 w-4" />
          Preview
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-6">
        {children}
      </TabsContent>

      <TabsContent value="preview" className="mt-6">
        <Card>
          <CardContent className="p-0">
            <iframe
              src={previewUrl}
              className="w-full h-[800px] border-0"
              title={`Preview factuur ${invoiceNumber}`}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
