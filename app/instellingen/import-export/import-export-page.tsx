'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Upload,
  Users,
  FileText,
  Receipt,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ExportModal } from '@/components/import-export/export-modal';
import { ImportWizard } from '@/components/import-export/import-wizard';
import type { EntityType } from '@/lib/import-export/fields';

interface ImportExportPageProps {
  counts: {
    customers: number;
    invoices: number;
    expenses: number;
    products: number;
    timeEntries: number;
  };
  recentJobs: Array<{
    id: string;
    type: string;
    entityType: string;
    status: string;
    fileName: string | null;
    totalRows: number | null;
    successRows: number | null;
    errorRows: number | null;
    createdAt: string;
    completedAt: string | null;
  }>;
}

const ENTITY_ICONS: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  CUSTOMERS: Users,
  INVOICES: FileText,
  EXPENSES: Receipt,
  PRODUCTS: Package,
  TIME_ENTRIES: Clock,
};

const ENTITY_LABELS: Record<EntityType, string> = {
  CUSTOMERS: 'Klanten',
  INVOICES: 'Facturen',
  EXPENSES: 'Onkosten',
  PRODUCTS: 'Producten',
  TIME_ENTRIES: 'Urenregistratie',
};

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Wachtend', variant: 'secondary' },
  VALIDATING: { label: 'Valideren', variant: 'secondary' },
  PROCESSING: { label: 'Bezig', variant: 'default' },
  COMPLETED: { label: 'Voltooid', variant: 'default' },
  FAILED: { label: 'Mislukt', variant: 'destructive' },
  CANCELLED: { label: 'Geannuleerd', variant: 'outline' },
};

export function ImportExportPage({ counts, recentJobs }: ImportExportPageProps) {
  const router = useRouter();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportEntityType, setExportEntityType] = useState<EntityType>('CUSTOMERS');
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [importEntityType, setImportEntityType] = useState<EntityType>('CUSTOMERS');

  const handleExport = (entityType: EntityType) => {
    setExportEntityType(entityType);
    setExportModalOpen(true);
  };

  const handleImport = (entityType: EntityType) => {
    setImportEntityType(entityType);
    setImportWizardOpen(true);
  };

  const handleDownloadTemplate = (entityType: EntityType, format: 'xlsx' | 'csv') => {
    window.open(`/api/export/template/${entityType.toLowerCase()}?format=${format}`, '_blank');
  };

  const entityData: Array<{ type: EntityType; count: number }> = [
    { type: 'CUSTOMERS', count: counts.customers },
    { type: 'INVOICES', count: counts.invoices },
    { type: 'EXPENSES', count: counts.expenses },
    { type: 'PRODUCTS', count: counts.products },
    { type: 'TIME_ENTRIES', count: counts.timeEntries },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/instellingen">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import & Export</h2>
          <p className="text-muted-foreground">
            Importeer en exporteer je gegevens als Excel of CSV
          </p>
        </div>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Exporteren</CardTitle>
          <CardDescription>Download je gegevens als Excel of CSV bestand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {entityData.map(({ type, count }) => {
              const Icon = ENTITY_ICONS[type];
              return (
                <Card key={type} className="relative">
                  <CardContent className="pt-6 text-center">
                    <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-2 font-medium">{ENTITY_LABELS[type]}</div>
                    <div className="text-sm text-muted-foreground">{count} records</div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleExport(type)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exporteren
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Importeren</CardTitle>
          <CardDescription>Importeer gegevens vanuit Excel of CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {entityData.map(({ type }) => {
              const Icon = ENTITY_ICONS[type];
              return (
                <Card key={type} className="relative">
                  <CardContent className="pt-6 text-center">
                    <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-2 font-medium">{ENTITY_LABELS[type]}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleImport(type)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Importeren
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Download lege templates met de juiste kolomnamen</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead className="w-32">Excel</TableHead>
                <TableHead className="w-32">CSV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entityData.map(({ type }) => (
                <TableRow key={type}>
                  <TableCell className="font-medium">{ENTITY_LABELS[type]}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadTemplate(type, 'xlsx')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadTemplate(type, 'csv')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Jobs Section */}
      {recentJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recente imports</CardTitle>
            <CardDescription>Overzicht van je laatste import taken</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bestand</TableHead>
                  <TableHead>Resultaat</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobs.map((job) => {
                  const statusBadge = STATUS_BADGES[job.status] || STATUS_BADGES.PENDING;
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        {format(new Date(job.createdAt), 'dd-MM-yyyy HH:mm', { locale: nl })}
                      </TableCell>
                      <TableCell>
                        {ENTITY_LABELS[job.entityType as EntityType] || job.entityType}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {job.fileName || '-'}
                      </TableCell>
                      <TableCell>
                        {job.status === 'COMPLETED' ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {job.successRows} ok
                            {job.errorRows ? (
                              <span className="text-red-500">, {job.errorRows} fout</span>
                            ) : null}
                          </span>
                        ) : job.status === 'FAILED' ? (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertCircle className="h-4 w-4" />
                            Mislukt
                          </span>
                        ) : job.status === 'PROCESSING' ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Bezig...
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge?.variant || 'secondary'}>{statusBadge?.label || job.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        entityType={exportEntityType}
      />

      <ImportWizard
        open={importWizardOpen}
        onOpenChange={setImportWizardOpen}
        defaultEntityType={importEntityType}
        onImportComplete={() => router.refresh()}
      />
    </div>
  );
}
