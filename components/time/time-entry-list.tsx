'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Clock, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDuration, groupEntriesByDay, type TimeEntry } from '@/lib/time/calculations';
import { formatCurrency } from '@/lib/time/formatters';

// Extended TimeEntry interface for the component
interface TimeEntryWithDetails extends TimeEntry {
  description: string;
  endTime?: string | Date | null;
  hourlyRate: number;
  invoiced: boolean;
  activityType?: string | null;
  notes?: string | null;
  project?: {
    name: string;
    color?: string;
  } | null;
  customer?: {
    name: string;
  } | null;
}

interface TimeEntryListProps {
  entries: TimeEntryWithDetails[];
  onEdit?: (entry: TimeEntryWithDetails) => void;
  onDelete?: (id: string) => void;
  grouped?: boolean;
}

export function TimeEntryList({
  entries,
  onEdit,
  onDelete,
  grouped = true,
}: TimeEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Geen time entries gevonden</p>
      </div>
    );
  }

  if (!grouped) {
    return (
      <div className="space-y-2">
        {entries.map((entry) => (
          <TimeEntryCard
            key={entry.id}
            entry={entry}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  const groupedEntries = groupEntriesByDay(entries);

  return (
    <div className="space-y-6">
      {Array.from(groupedEntries.entries()).map(([date, dayEntries]) => {
        const dayTotal = dayEntries.reduce(
          (sum, e) => sum + Number(e.duration),
          0
        );
        const dayAmount = dayEntries.reduce(
          (sum, e) => sum + Number(e.amount),
          0
        );

        return (
          <div key={date} className="space-y-2">
            <div className="flex items-center justify-between px-1 pb-2 border-b">
              <h3 className="font-semibold">
                {format(new Date(date), 'EEEE d MMMM yyyy', { locale: nl })}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDuration(dayTotal)}</span>
                <span>{formatCurrency(dayAmount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {dayEntries.map((entry) => (
                <TimeEntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimeEntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: TimeEntryWithDetails;
  onEdit?: (entry: TimeEntryWithDetails) => void;
  onDelete?: (id: string) => void;
}) {
  const startTime = typeof entry.startTime === 'string' ? new Date(entry.startTime) : entry.startTime;
  const endTime = entry.endTime ? (typeof entry.endTime === 'string' ? new Date(entry.endTime) : entry.endTime) : null;

  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      {entry.project?.color && (
        <div
          className="w-1 h-full rounded-full flex-shrink-0"
          style={{ backgroundColor: entry.project.color }}
        />
      )}

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium">{entry.description}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {entry.project && <span>{entry.project.name}</span>}
              {entry.customer && (
                <>
                  <span>•</span>
                  <span>{entry.customer.name}</span>
                </>
              )}
              {entry.activityType && (
                <>
                  <span>•</span>
                  <span>{entry.activityType}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!entry.billable && (
              <Badge variant="secondary">Niet facturabel</Badge>
            )}
            {entry.invoiced && (
              <Badge variant="outline">Gefactureerd</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>
              {format(startTime, 'HH:mm', { locale: nl })}
              {endTime && (
                <> - {format(endTime, 'HH:mm', { locale: nl })}</>
              )}
            </span>
            <span className="font-medium text-foreground">
              {formatDuration(entry.duration)}
            </span>
            {entry.billable && (
              <span className="font-semibold text-foreground">
                {formatCurrency(entry.amount)}
              </span>
            )}
          </div>

          {!entry.invoiced && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(entry)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(entry.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {entry.notes && (
          <p className="text-sm text-muted-foreground italic">{entry.notes}</p>
        )}
      </div>
    </div>
  );
}
