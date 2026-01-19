'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const watermarkSchema = z.object({
  watermarkEnabled: z.boolean(),
  freeUserWatermarkEnabled: z.boolean(),
  watermarkText: z.string().min(1, 'Watermerk tekst is verplicht'),
  watermarkOpacity: z.number().min(0).max(1),
  watermarkRotation: z.number().min(-180).max(180),
  watermarkFontSize: z.number().min(10).max(100),
  watermarkColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Ongeldige kleur'),
  watermarkPosition: z.enum(['DIAGONAL', 'CENTER', 'BOTTOM', 'TOP', 'FOOTER']),
});

type WatermarkFormData = z.infer<typeof watermarkSchema>;

interface SerializedSystemSettings {
  id: string;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkRotation: number;
  watermarkFontSize: number;
  watermarkColor: string;
  watermarkPosition: 'DIAGONAL' | 'CENTER' | 'BOTTOM' | 'TOP' | 'FOOTER';
  freeUserWatermarkEnabled: boolean;
  updatedAt: Date;
  updatedBy: string | null;
}

interface WatermarkSettingsFormProps {
  initialSettings: SerializedSystemSettings;
}

export function WatermarkSettingsForm({ initialSettings }: WatermarkSettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<WatermarkFormData>({
    resolver: zodResolver(watermarkSchema),
    defaultValues: {
      watermarkEnabled: initialSettings.watermarkEnabled,
      freeUserWatermarkEnabled: initialSettings.freeUserWatermarkEnabled,
      watermarkText: initialSettings.watermarkText,
      watermarkOpacity: initialSettings.watermarkOpacity,
      watermarkRotation: initialSettings.watermarkRotation,
      watermarkFontSize: initialSettings.watermarkFontSize,
      watermarkColor: initialSettings.watermarkColor,
      watermarkPosition: initialSettings.watermarkPosition,
    },
  });

  const onSubmit = async (data: WatermarkFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/watermark', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      router.refresh();
      toast.success('Instellingen opgeslagen!');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="watermarkEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Watermerk Enabled</FormLabel>
                  <FormDescription>
                    Schakel watermerk functionaliteit in/uit
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

          <FormField
            control={form.control}
            name="freeUserWatermarkEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Watermerk voor Free Users</FormLabel>
                  <FormDescription>
                    Toon watermerk op facturen van gratis gebruikers
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

          <FormField
            control={form.control}
            name="watermarkText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Watermerk Tekst</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="GRATIS VERSIE - Upgrade naar Pro"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  De tekst die als watermerk wordt getoond
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="watermarkPosition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Positie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DIAGONAL">Diagonaal</SelectItem>
                    <SelectItem value="CENTER">Gecentreerd</SelectItem>
                    <SelectItem value="BOTTOM">Onderaan</SelectItem>
                    <SelectItem value="TOP">Bovenaan</SelectItem>
                    <SelectItem value="FOOTER">Footer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="watermarkOpacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transparantie: {field.value.toFixed(2)}</FormLabel>
                <FormControl>
                  <Input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  0 = volledig transparant, 1 = volledig ondoorzichtig
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="watermarkRotation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rotatie: {field.value}°</FormLabel>
                <FormControl>
                  <Input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  Hoek van het watermerk in graden
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="watermarkFontSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lettergrootte: {field.value}px</FormLabel>
                <FormControl>
                  <Input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="watermarkColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kleur</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <input
                    type="color"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                </div>
                <FormDescription>
                  Kleur in HEX formaat (bijv. #999999)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Instellingen Opslaan
          </Button>
        </form>
      </Form>
    </Card>
  );
}
