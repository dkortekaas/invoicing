'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ProjectSelect } from '@/components/time/project-select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from '@/components/providers/locale-provider';

export default function NewTimeEntryPage() {
  const router = useRouter();
  const { t } = useTranslations('timePage');
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [endTime, setEndTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState('');
  const [projectId, setProjectId] = useState('');
  const [activityType, setActivityType] = useState('');
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error(t('newEntryDescRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/time/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          startTime,
          endTime,
          duration: duration ? parseFloat(duration) : undefined,
          projectId: projectId || null,
          activityType: activityType || null,
          billable,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('newEntryCreateFailed'));
      }

      router.push('/tijd/entries');
      toast.success(t('newEntrySuccess'));
    } catch (error) {
      console.error('Create entry error:', error);
      toast.error(error instanceof Error ? error.message : t('newEntryCreateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('newEntryTitle')}</h1>
        <p className="text-muted-foreground">
          {t('newEntryDescription')}
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">{t('newEntryDescLabel')}</Label>
            <Input
              id="description"
              placeholder={t('newEntryDescPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">{t('newEntryStartLabel')}</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">{t('newEntryEndLabel')}</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">{t('newEntryDurationLabel')}</Label>
            <Input
              id="duration"
              placeholder="1.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('newEntryDurationHint')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('newEntryProjectLabel')}</Label>
              <ProjectSelect
                value={projectId}
                onChange={setProjectId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityType">{t('newEntryActivityLabel')}</Label>
              <Input
                id="activityType"
                placeholder={t('newEntryActivityPlaceholder')}
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="billable"
              checked={billable}
              onCheckedChange={(checked) => setBillable(checked === true)}
            />
            <Label htmlFor="billable" className="cursor-pointer">
              {t('newEntryBillableLabel')}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('newEntryNotesLabel')}</Label>
            <Textarea
              id="notes"
              placeholder={t('newEntryNotesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('newEntrySaving')}
                </>
              ) : (
                t('newEntrySave')
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              {t('cancelButton')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
