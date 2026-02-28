'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Settings, Unlink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { toast } from 'sonner'
import type { AccountingProvider } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ============================================================
// Types (exported so page.tsx can use them)
// ============================================================

export interface ProviderConfig {
  provider: AccountingProvider
  name: string
  doelgroep: string
  accent: string
  initials: string
}

export interface ConnectionSnapshot {
  id: string
  provider: AccountingProvider
  providerName: string
  isActive: boolean
  lastSyncAt: Date | null
}

// ============================================================
// Component
// ============================================================

interface ProviderCardProps {
  config: ProviderConfig
  connection: ConnectionSnapshot | null
}

export function ProviderCard({ config, connection }: ProviderCardProps) {
  const router = useRouter()
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Enum value lowercased is the URL segment recognised by the API routes
  const providerSlug = config.provider.toLowerCase()
  const isConnected = connection !== null && connection.isActive

  async function handleDisconnect() {
    setIsDisconnecting(true)
    try {
      const res = await fetch(`/api/accounting/disconnect/${providerSlug}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('disconnect failed')
      toast.success(`${config.name} koppeling verbroken`)
      setConfirmOpen(false)
      router.refresh()
    } catch {
      toast.error('Er is iets misgegaan bij het verbreken van de koppeling')
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: config.accent }}
              >
                {config.initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold leading-none">{config.name}</p>
                <p className="text-muted-foreground text-xs mt-1">{config.doelgroep}</p>
              </div>
            </div>

            {/* Status badge */}
            <Badge
              variant="secondary"
              className={
                isConnected
                  ? 'shrink-0 bg-green-100 text-green-800 border-green-200'
                  : 'shrink-0'
              }
            >
              {isConnected ? 'Verbonden' : 'Niet verbonden'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          {isConnected ? (
            <div className="space-y-3">
              {/* Connection details */}
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{connection.providerName}</p>
                {connection.lastSyncAt ? (
                  <p className="text-muted-foreground text-xs">
                    Laatste sync:{' '}
                    {formatDistanceToNow(new Date(connection.lastSyncAt), {
                      addSuffix: true,
                      locale: nl,
                    })}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">Nog niet gesynchroniseerd</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button asChild size="sm">
                  <Link href={`/dashboard/settings/accounting/${providerSlug}`}>
                    Beheren
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Meer opties</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/settings/accounting/${providerSlug}`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Instellingen
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault()
                        setConfirmOpen(true)
                      }}
                    >
                      <Unlink className="mr-2 h-4 w-4" />
                      Koppeling verbreken
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            // Use a plain <a> so the OAuth redirect is a full navigation,
            // not a client-side route transition
            <a href={`/api/accounting/connect/${providerSlug}`} className="block">
              <Button size="sm" variant="outline" className="w-full">
                Verbinden
              </Button>
            </a>
          )}
        </CardContent>
      </Card>

      {/* Disconnect confirmation dialog — lives outside DropdownMenu to avoid
          Radix focus-management conflicts between nested portals */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Koppeling verbreken?</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de koppeling met{' '}
              <span className="font-medium text-foreground">{config.name}</span> wilt
              verbreken? Alle synchronisatiedata en mappings worden verwijderd. Deze actie
              kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDisconnecting}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? 'Verbreken…' : 'Verbreken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
