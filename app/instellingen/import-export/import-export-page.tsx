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
import { nl, enUS } from 'date-fns/locale';
import { useTranslations } from '@/components/providers/locale-provider';
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

const ENTITY_KEYS: Record<EntityType, string> = {
  CUSTOMERS: 'importExportEntityCustomers',
  INVOICES: 'importExportEntityInvoices',
  EXPENSES: 'importExportEntityExpenses',
  PRODUCTS: 'importExportEntityProducts',
  TIME_ENTRIES: 'importExportEntityTimeEntries',
};

const STATUS_KEYS: Record<string, string> = {
  PENDING: 'importExportStatusPending',
  VALIDATING: 'importExportStatusValidating',
  PROCESSING: 'importExportStatusProcessing',
  COMPLETED: 'importExportStatusCompleted',
  FAILED: 'importExportStatusFailed',
  CANCELLED: 'importExportStatusCancelled',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  VALIDATING: 'secondary',
  PROCESSING: 'default',
  COMPLETED: 'default',
  FAILED: 'destructive',
  CANCELLED: 'outline',
};

export function ImportExportPage({ counts, recentJobs }: ImportExportPageProps) {
  const { t, locale } = useTranslations('settingsPage');
  const dateLocale = locale === 'en' ? enUS : nl;

  const getEntityLabel = (type: EntityType) => {
    const key = ENTITY_KEYS[type];
    return key ? t(key) : type;
  };
  const getStatusLabel = (status: string) => {
    const key = STATUS_KEYS[status];
    return key ? t(key) : status;
  };
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
          <h2 className="text-2xl font-bold tracking-tight">{t('importExportPageTitle')}</h2>
          <p className="text-muted-foreground">
            {t('importExportPageDescription')}
          </p>
        </div>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('importExportExportTitle')}</CardTitle>
          <CardDescription>{t('importExportExportDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {entityData.map(({ type, count }) => {
              const Icon = ENTITY_ICONS[type];
              return (
                <Card key={type} className="relative">
                  <CardContent className="pt-6 text-center">
                    <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-2 font-medium">{getEntityLabel(type)}</div>
                    <div className="text-sm text-muted-foreground">{count} {t('importExportRecords')}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleExport(type)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('importExportExport')}
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
          <CardTitle>{t('importExportImportTitle')}</CardTitle>
          <CardDescription>{t('importExportImportDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {entityData.map(({ type }) => {
              const Icon = ENTITY_ICONS[type];
              return (
                <Card key={type} className="relative">
                  <CardContent className="pt-6 text-center">
                    <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-2 font-medium">{getEntityLabel(type)}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleImport(type)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t('importExportImport')}
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
          <CardTitle>{t('importExportTemplatesTitle')}</CardTitle>
          <CardDescription>{t('importExportTemplatesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('importExportTemplate')}</TableHead>
                <TableHead className="w-32">Excel</TableHead>
                <TableHead className="w-32">CSV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entityData.map(({ type }) => (
                <TableRow key={type}>
                  <TableCell className="font-medium">{getEntityLabel(type)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadTemplate(type, 'xlsx')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('importExportDownload')}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadTemplate(type, 'csv')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('importExportDownload')}
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
            <CardTitle>{t('importExportRecentTitle')}</CardTitle>
            <CardDescription>{t('importExportRecentDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('importExportColDate')}</TableHead>
                  <TableHead>{t('importExportColType')}</TableHead>
                  <TableHead>{t('importExportColFile')}</TableHead>
                  <TableHead>{t('importExportColResult')}</TableHead>
                  <TableHead>{t('importExportColStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobs.map((job) => {
                  const statusVariant = STATUS_VARIANTS[job.status] ?? STATUS_VARIANTS.PENDING;
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        {format(new Date(job.createdAt), 'dd-MM-yyyy HH:mm', { locale: dateLocale })}
                      </TableCell>
                      <TableCell>
                        {ENTITY_KEYS[job.entityType as EntityType]
                          ? getEntityLabel(job.entityType as EntityType)
                          : job.entityType}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {job.fileName || '-'}
                      </TableCell>
                      <TableCell>
                        {job.status === 'COMPLETED' ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {job.successRows} {t('importExportResultOk')}
                            {job.errorRows ? (
                              <span className="text-red-500">, {job.errorRows} {t('importExportResultError')}</span>
                            ) : null}
                          </span>
                        ) : job.status === 'FAILED' ? (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertCircle className="h-4 w-4" />
                            {t('importExportFailed')}
                          </span>
                        ) : job.status === 'PROCESSING' ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('importExportProcessing')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant}>{getStatusLabel(job.status)}</Badge>
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
