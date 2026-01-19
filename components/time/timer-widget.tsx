'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Square, 
  Loader2 
} from 'lucide-react';
import { ProjectSelect } from './project-select';
import { formatDuration } from '@/lib/time/calculations';
import { useRouter } from 'next/navigation';

interface RunningTimer {
  id: string;
  description: string;
  startTime: string;
  project?: {
    name: string;
    color?: string;
  };
  customer?: {
    name: string;
  };
}

export function TimerWidget() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [activityType, setActivityType] = useState('');
  const [loading, setLoading] = useState(false);
  const [runningTimer, setRunningTimer] = useState<RunningTimer | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Poll voor running timer
  useEffect(() => {
    loadRunningTimer();
    const interval = setInterval(loadRunningTimer, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update elapsed tijd
  useEffect(() => {
    if (!runningTimer) {
      setElapsed(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(runningTimer.startTime).getTime();
      const now = Date.now();
      const hours = (now - start) / (1000 * 60 * 60);
      setElapsed(hours);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  const loadRunningTimer = async () => {
    try {
      const response = await fetch('/api/time/running');
      if (response.ok) {
        const timers = await response.json();
        setRunningTimer(timers[0] || null);
      }
    } catch (error) {
      console.error('Load running timer error:', error);
    }
  };

  const handleStart = async () => {
    if (!description.trim()) {
      toast.error('Voer een beschrijving in');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/time/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          projectId: projectId || null,
          activityType: activityType || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Start timer failed');
      }

      const timer = await response.json();
      setRunningTimer(timer);
      setDescription('');
      setProjectId('');
      setActivityType('');
      router.refresh();
      toast.success('Timer gestart');
    } catch (error) {
      console.error('Start timer error:', error);
      toast.error(error instanceof Error ? error.message : 'Timer starten mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!runningTimer) return;

    setLoading(true);
    try {
      const response = await fetch('/api/time/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: runningTimer.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Stop timer failed');
      }

      setRunningTimer(null);
      setElapsed(0);
      router.refresh();
      toast.success('Timer gestopt');
    } catch (error) {
      console.error('Stop timer error:', error);
      toast.error(error instanceof Error ? error.message : 'Timer stoppen mislukt');
    } finally {
      setLoading(false);
    }
  };

  if (runningTimer) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">
                Timer loopt...
              </span>
            </div>
            <div className="text-3xl font-bold tabular-nums">
              {formatDuration(elapsed)}
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium">{runningTimer.description}</p>
            {runningTimer.project && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {runningTimer.project.color && (
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: runningTimer.project.color }}
                  />
                )}
                <span>{runningTimer.project.name}</span>
                {runningTimer.customer && (
                  <span>• {runningTimer.customer.name}</span>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleStop}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Square className="mr-2 h-4 w-4" />
            )}
            Stop Timer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Wat ben je aan het doen?</Label>
          <Input
            id="description"
            placeholder="Bijv. Development feature X..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleStart();
              }
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Project (optioneel)</Label>
            <ProjectSelect
              value={projectId}
              onChange={setProjectId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity">Activiteit</Label>
            <Input
              id="activity"
              placeholder="Development, Meeting..."
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleStart}
          disabled={loading || !description.trim()}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Start Timer
        </Button>
      </div>
    </Card>
  );
}
