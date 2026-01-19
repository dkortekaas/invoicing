"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-background text-foreground border-border shadow-lg",
          description: "text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground",
          cancelButton:
            "bg-muted text-muted-foreground",
          success:
            "!bg-green-50 !text-green-900 !border-green-200 [&>svg]:!text-green-600",
          error:
            "!bg-red-50 !text-red-900 !border-red-200 [&>svg]:!text-red-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
