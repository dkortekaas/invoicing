'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/time/calculations';
import Link from 'next/link';

export function RunningTimerIndicator() {
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const loadTimer = async () => {
      try {
        const response = await fetch('/api/time/running');
        if (response.ok) {
          const timers = await response.json();
          if (timers[0]) {
            setStartTime(new Date(timers[0].startTime));
            setDescription(timers[0].description);
          } else {
            setStartTime(null);
            setDescription('');
          }
        }
      } catch (error) {
        console.error('Load timer error:', error);
      }
    };

    loadTimer();
    const interval = setInterval(loadTimer, 10000); // Poll elke 10 sec
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const updateElapsed = () => {
      const now = Date.now();
      const hours = (now - startTime.getTime()) / (1000 * 60 * 60);
      setElapsed(hours);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  return (
    <Link
      href="/tijd"
      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
    >
      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      <Clock className="h-4 w-4 text-red-600" />
      <span className="text-sm font-medium text-red-900 tabular-nums">
        {formatDuration(elapsed)}
      </span>
      <span className="text-xs text-red-600 max-w-[150px] truncate hidden sm:inline">
        {description}
      </span>
    </Link>
  );
}
