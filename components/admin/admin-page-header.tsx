interface AdminPageHeaderProps {
  title: string
  subtitle: string
  children?: React.ReactNode
}

export function AdminPageHeader({ title, subtitle, children }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold mb-1">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      {children && (
        <div className="flex flex-wrap gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
