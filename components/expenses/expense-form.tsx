'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const expenseSchema = z.object({
  date: z.date(),
  description: z.string().min(1, 'Beschrijving is verplicht'),
  category: z.string().min(1, 'Categorie is verplicht'),
  amount: z.number().min(0.01, 'Bedrag moet groter dan 0 zijn'),
  vatRate: z.number(),
  supplier: z.string().optional(),
  invoiceNumber: z.string().optional(),
  deductible: z.boolean(),
  deductiblePerc: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const CATEGORIES = [
  { value: 'OFFICE', label: 'Kantoorkosten' },
  { value: 'TRAVEL', label: 'Reiskosten' },
  { value: 'EQUIPMENT', label: 'Apparatuur' },
  { value: 'SOFTWARE', label: 'Software/Subscriptions' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'EDUCATION', label: 'Opleiding' },
  { value: 'INSURANCE', label: 'Verzekeringen' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'TELECOM', label: 'Telefoon/Internet' },
  { value: 'UTILITIES', label: 'Energie' },
  { value: 'RENT', label: 'Huur' },
  { value: 'MAINTENANCE', label: 'Onderhoud' },
  { value: 'PROFESSIONAL', label: 'Professionele diensten' },
  { value: 'OTHER', label: 'Overig' },
];

interface ExpenseFormProps {
  expense?: any;
  onSuccess?: () => void;
}

export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ? {
      date: new Date(expense.date),
      description: expense.description,
      category: expense.category,
      amount: Number(expense.amount),
      vatRate: Number(expense.vatRate),
      supplier: expense.supplier || '',
      invoiceNumber: expense.invoiceNumber || '',
      deductible: expense.deductible,
      deductiblePerc: Number(expense.deductiblePerc),
      notes: expense.notes || '',
    } : {
      date: new Date(),
      description: '',
      category: '',
      amount: 0,
      vatRate: 21,
      deductible: true,
      deductiblePerc: 100,
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    try {
      const url = expense ? `/api/expenses/${expense.id}` : '/api/expenses';
      const method = expense ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save expense');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/btw/kosten');
        router.refresh();
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Datum *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: nl })
                        ) : (
                          <span>Kies een datum</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={nl}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categorie *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer categorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschrijving *</FormLabel>
              <FormControl>
                <Input placeholder="Bijv. Laptop voor werk" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedrag (incl. BTW) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vatRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BTW% *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseFloat(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="9">9%</SelectItem>
                    <SelectItem value="21">21%</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deductiblePerc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aftrekbaar %</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormDescription>
                  Percentage BTW dat aftrekbaar is
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leverancier</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Naam leverancier" 
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Factuurnummer</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Factuurnummer leverancier" 
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notities</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Extra informatie" 
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deductible"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">BTW aftrekbaar</FormLabel>
                <FormDescription>
                  Is de BTW op deze uitgave aftrekbaar?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuleren
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
