'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { InvoiceActions } from '@/app/facturen/invoice-actions'
import { BulkSyncModal, type InvoiceInput } from '@/components/accounting/BulkSyncModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { BulkSyncResult } from '@/types/accounting'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Serializable invoice row — Dates become ISO strings, Decimal becomes number. */
export interface InvoiceRow {
  id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  total: number
  status: string
  deletedAt: string | null
  customer: { name: string; companyName: string | null }
}

interface InvoiceTableProps {
  invoices: InvoiceRow[]
  /** Whether the user has at least one active accounting connection. */
  hasAccountingConnections: boolean
  /** True when rendering the trash view — hides checkboxes and bulk bar. */
  showDeleted?: boolean
  /** Empty-state message */
  emptyMessage?: string
}

// ─── InvoiceTable ─────────────────────────────────────────────────────────────

export function InvoiceTable({
  invoices,
  hasAccountingConnections,
  showDeleted = false,
  emptyMessage = 'Geen facturen gevonden.',
}: InvoiceTableProps) {
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set())
  const [bulkSyncOpen, setBulkSyncOpen]   = useState(false)

  // ── Selection helpers ──────────────────────────────────────────────────────
  const selectableIds = invoices.map((i) => i.id)
  const allSelected   = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds))
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  // ── Derive selected invoice objects for the modal ──────────────────────────
  const selectedInvoices: InvoiceInput[] = invoices
    .filter((i) => selectedIds.has(i.id))
    .map((i) => ({ id: i.id, invoiceNumber: i.invoiceNumber, status: i.status }))

  function handleSyncComplete(_result: BulkSyncResult) {
    setBulkSyncOpen(false)
    clearSelection()
  }

  const colSpan = showDeleted ? 7 : 8

  return (
    <>
      {/* ── Bulk actions bar (visible when items are selected) ──────────── */}
      {selectedIds.size > 0 && !showDeleted && (
        <div className="mb-3 flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size}{' '}
            {selectedIds.size === 1 ? 'factuur geselecteerd' : 'facturen geselecteerd'}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {hasAccountingConnections && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkSyncOpen(true)}
              >
                <Cloud className="mr-2 h-4 w-4" />
                Sync naar boekhouding
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Selectie wissen
            </Button>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Table>
        <TableHeader>
          <TableRow>
            {!showDeleted && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Alles selecteren"
                />
              </TableHead>
            )}
            <TableHead>Factuur</TableHead>
            <TableHead>Klant</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Vervaldatum</TableHead>
            <TableHead className="text-right">Bedrag</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className={selectedIds.has(invoice.id) ? 'bg-muted/30' : undefined}
              >
                {!showDeleted && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(invoice.id)}
                      onCheckedChange={() => toggleOne(invoice.id)}
                      aria-label={`${invoice.invoiceNumber} selecteren`}
                    />
                  </TableCell>
                )}

                <TableCell>
                  <Link
                    href={`/facturen/${invoice.id}`}
                    className="font-medium hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>

                <TableCell>
                  <div>
                    <div className="font-medium">
                      {invoice.customer.companyName || invoice.customer.name}
                    </div>
                    {invoice.customer.companyName && (
                      <div className="text-sm text-muted-foreground">
                        {invoice.customer.name}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                <TableCell>{formatDate(invoice.dueDate)}</TableCell>

                <TableCell className="text-right font-medium">
                  {formatCurrency(invoice.total)}
                </TableCell>

                <TableCell className="text-center">
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>

                <TableCell>
                  <InvoiceActions
                    invoice={{
                      id: invoice.id,
                      status: invoice.status,
                      deletedAt: invoice.deletedAt ? new Date(invoice.deletedAt) : null,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* ── Bulk sync modal ────────────────────────────────────────────────── */}
      {bulkSyncOpen && (
        <BulkSyncModal
          invoices={selectedInvoices}
          onClose={() => setBulkSyncOpen(false)}
          onComplete={handleSyncComplete}
        />
      )}
    </>
  )
}
