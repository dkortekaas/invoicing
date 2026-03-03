'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/locale-provider';

const emailSettingsSchema = z.object({
  autoSendInvoice: z.boolean(),
  autoSendReminders: z.boolean(),
  autoSendPaymentConfirm: z.boolean(),
  friendlyReminderDays: z.number().int().min(-30).max(0),
  firstReminderDays: z.number().int().min(0).max(365),
  secondReminderDays: z.number().int().min(0).max(365),
  finalReminderDays: z.number().int().min(0).max(365),
  emailSignature: z.string().optional(),
  invoiceEmailCc: z.string().email().optional().or(z.literal('')),
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

interface EmailSettingsFormProps {
  initialData: {
    autoSendInvoice: boolean;
    autoSendReminders: boolean;
    autoSendPaymentConfirm: boolean;
    friendlyReminderDays: number;
    firstReminderDays: number;
    secondReminderDays: number;
    finalReminderDays: number;
    emailSignature?: string | null;
    invoiceEmailCc?: string | null;
  };
}

export function EmailSettingsForm({ initialData }: EmailSettingsFormProps) {
  const { t } = useTranslations('settingsPage');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      autoSendInvoice: initialData.autoSendInvoice,
      autoSendReminders: initialData.autoSendReminders,
      autoSendPaymentConfirm: initialData.autoSendPaymentConfirm,
      friendlyReminderDays: initialData.friendlyReminderDays,
      firstReminderDays: initialData.firstReminderDays,
      secondReminderDays: initialData.secondReminderDays,
      finalReminderDays: initialData.finalReminderDays,
      emailSignature: initialData.emailSignature || '',
      invoiceEmailCc: initialData.invoiceEmailCc || '',
    },
  });

  const onSubmit = async (data: EmailSettingsFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('emailFormSaveError'));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('emailFormGenericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {t('emailFormSaveSuccess')}
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-send settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('emailFormAutoSendTitle')}</CardTitle>
          <CardDescription>
            {t('emailFormAutoSendDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSendInvoice">{t('emailFormAutoSendInvoice')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('emailFormAutoSendInvoiceDesc')}
              </p>
            </div>
            <Controller
              name="autoSendInvoice"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="autoSendInvoice"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSendReminders">{t('emailFormAutoSendReminders')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('emailFormAutoSendRemindersDesc')}
              </p>
            </div>
            <Controller
              name="autoSendReminders"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="autoSendReminders"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSendPaymentConfirm">{t('emailFormAutoSendPayment')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('emailFormAutoSendPaymentDesc')}
              </p>
            </div>
            <Controller
              name="autoSendPaymentConfirm"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="autoSendPaymentConfirm"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reminder timing */}
      <Card>
        <CardHeader>
          <CardTitle>{t('emailFormReminderTitle')}</CardTitle>
          <CardDescription>
            {t('emailFormReminderDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="friendlyReminderDays">
              {t('emailFormFriendlyReminder')}
            </Label>
            <Input
              type="number"
              id="friendlyReminderDays"
              {...register('friendlyReminderDays', { valueAsNumber: true })}
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              {t('emailFormFriendlyReminderHelp')}
            </p>
            {errors.friendlyReminderDays && (
              <p className="text-sm text-red-600">
                {errors.friendlyReminderDays.message}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="firstReminderDays">
              {t('emailFormFirstReminder')}
            </Label>
            <Input
              type="number"
              id="firstReminderDays"
              {...register('firstReminderDays', { valueAsNumber: true })}
              className="w-32"
            />
            {errors.firstReminderDays && (
              <p className="text-sm text-red-600">
                {errors.firstReminderDays.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondReminderDays">
              {t('emailFormSecondReminder')}
            </Label>
            <Input
              type="number"
              id="secondReminderDays"
              {...register('secondReminderDays', { valueAsNumber: true })}
              className="w-32"
            />
            {errors.secondReminderDays && (
              <p className="text-sm text-red-600">
                {errors.secondReminderDays.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalReminderDays">
              {t('emailFormFinalReminder')}
            </Label>
            <Input
              type="number"
              id="finalReminderDays"
              {...register('finalReminderDays', { valueAsNumber: true })}
              className="w-32"
            />
            {errors.finalReminderDays && (
              <p className="text-sm text-red-600">
                {errors.finalReminderDays.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email customization */}
      <Card>
        <CardHeader>
          <CardTitle>{t('emailFormCustomizationTitle')}</CardTitle>
          <CardDescription>
            {t('emailFormCustomizationDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailSignature">{t('emailFormSignature')}</Label>
            <Textarea
              id="emailSignature"
              {...register('emailSignature')}
              placeholder={t('emailFormSignaturePlaceholder')}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              {t('emailFormSignatureHelp')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceEmailCc">{t('emailFormCcLabel')}</Label>
            <Input
              type="email"
              id="invoiceEmailCc"
              {...register('invoiceEmailCc')}
              placeholder={t('emailFormCcPlaceholder')}
            />
            <p className="text-sm text-muted-foreground">
              {t('emailFormCcHelp')}
            </p>
            {errors.invoiceEmailCc && (
              <p className="text-sm text-red-600">
                {errors.invoiceEmailCc.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('emailFormSaving')}
          </>
        ) : (
          t('emailFormSave')
        )}
      </Button>
    </form>
  );
}
