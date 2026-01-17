'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale/nl';
import { DateRange } from 'react-day-picker';

interface PeriodSelectorProps {
  period: 'custom' | 'month' | 'quarter' | 'year';
  onPeriodChange: (period: 'custom' | 'month' | 'quarter' | 'year') => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export function PeriodSelector({
  period,
  onPeriodChange,
  dateRange,
  onDateRangeChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <Select value={period} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecteer periode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Deze maand</SelectItem>
          <SelectItem value="quarter">Dit kwartaal</SelectItem>
          <SelectItem value="year">Dit jaar</SelectItem>
          <SelectItem value="custom">Aangepaste periode</SelectItem>
        </SelectContent>
      </Select>

      {period === 'custom' && onDateRangeChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd MMM', { locale: nl })} -{' '}
                    {format(dateRange.to, 'dd MMM yyyy', { locale: nl })}
                  </>
                ) : (
                  format(dateRange.from, 'dd MMM yyyy', { locale: nl })
                )
              ) : (
                <span>Kies een periode</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              locale={nl}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
