import { requireSuperuser } from '@/lib/auth/admin-guard';
import { db } from '@/lib/db';
import { WatermarkSettingsForm } from '@/components/admin/watermark-settings-form';
import { WatermarkPreview } from '@/components/admin/watermark-preview';

export default async function WatermarkPage() {
  await requireSuperuser();

  const settings = await db.systemSettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    return <div>Settings not found</div>;
  }

  // Convert Decimal to number for client components
  const serializedSettings = {
    ...settings,
    watermarkOpacity: Number(settings.watermarkOpacity),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Watermerk Instellingen</h2>
        <p className="text-muted-foreground">
          Configureer het watermerk dat wordt getoond op facturen van gratis gebruikers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WatermarkSettingsForm initialSettings={serializedSettings} />
        <WatermarkPreview settings={serializedSettings} />
      </div>
    </div>
  );
}
