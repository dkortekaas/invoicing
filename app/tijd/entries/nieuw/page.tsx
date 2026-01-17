'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ProjectSelect } from '@/components/time/project-select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function NewTimeEntryPage() {
  const router = useRouter();
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
      alert('Beschrijving is verplicht');
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
        throw new Error(error.error || 'Entry aanmaken mislukt');
      }

      router.push('/tijd/entries');
    } catch (error) {
      console.error('Create entry error:', error);
      alert(error instanceof Error ? error.message : 'Entry aanmaken mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nieuwe Time Entry</h1>
        <p className="text-muted-foreground">
          Voeg handmatig een tijdregistratie toe
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving *</Label>
            <Input
              id="description"
              placeholder="Wat heb je gedaan?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Starttijd *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Eindtijd</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duur (uren, bijv. 1.5 of 1:30)</Label>
            <Input
              id="duration"
              placeholder="1.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Laat leeg om automatisch te berekenen op basis van start- en eindtijd
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <ProjectSelect
                value={projectId}
                onChange={setProjectId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityType">Activiteit</Label>
              <Input
                id="activityType"
                placeholder="Development, Meeting..."
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
              Factureerbaar
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              placeholder="Interne notities..."
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
                  Opslaan...
                </>
              ) : (
                'Opslaan'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuleren
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
