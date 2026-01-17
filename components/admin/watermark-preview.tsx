'use client';

import { Card } from '@/components/ui/card';

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

interface WatermarkPreviewProps {
  settings: SerializedSystemSettings;
}

export function WatermarkPreview({ settings }: WatermarkPreviewProps) {
  const getTransform = () => {
    switch (settings.watermarkPosition) {
      case 'DIAGONAL':
        return `translate(-50%, -50%) rotate(${settings.watermarkRotation}deg)`;
      case 'CENTER':
        return 'translate(-50%, -50%)';
      case 'BOTTOM':
      case 'TOP':
        return 'translateX(-50%)';
      default:
        return 'none';
    }
  };

  const getPosition = () => {
    switch (settings.watermarkPosition) {
      case 'DIAGONAL':
      case 'CENTER':
        return { top: '50%', left: '50%' };
      case 'BOTTOM':
        return { bottom: '50px', left: '50%' };
      case 'TOP':
        return { top: '50px', left: '50%' };
      case 'FOOTER':
        return { bottom: '20px', left: 0, right: 0 };
      default:
        return {};
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Live Preview</h3>
      
      <div className="relative border-2 border-dashed rounded-lg bg-white" style={{ height: '500px', aspectRatio: '210/297' }}>
        {/* Mock invoice content */}
        <div className="p-8 space-y-4">
          <div className="flex justify-between">
            <div>
              <h4 className="font-bold text-lg">Jouw Bedrijf BV</h4>
              <p className="text-sm text-gray-600">Straatnaam 123</p>
              <p className="text-sm text-gray-600">1234 AB Amsterdam</p>
            </div>
            <div className="text-right">
              <p className="font-bold">FACTUUR</p>
              <p className="text-sm">2025-0001</p>
              <p className="text-sm">17 januari 2025</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h5 className="font-semibold mb-2">Factureren aan:</h5>
            <p className="text-sm">Klant Naam</p>
            <p className="text-sm text-gray-600">Klantstraat 456</p>
            <p className="text-sm text-gray-600">5678 CD Rotterdam</p>
          </div>

          <div className="border-t pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Omschrijving</th>
                  <th className="text-right py-2">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">Dienstverlening</td>
                  <td className="text-right">€ 100,00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border-t pt-4 text-right">
            <p className="font-bold">Totaal: € 100,00</p>
          </div>
        </div>

        {/* Watermark overlay */}
        {settings.watermarkEnabled && settings.freeUserWatermarkEnabled && (
          <div
            style={{
              position: 'absolute',
              color: settings.watermarkColor,
              fontSize: `${settings.watermarkFontSize * 0.4}px`, // Scaled down for preview
              opacity: settings.watermarkOpacity,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              userSelect: 'none',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              transform: getTransform(),
              textAlign: 'center',
              ...getPosition(),
            }}
          >
            {settings.watermarkText}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Preview wordt proportioneel verkleind. Echte factuur gebruikt volledige instellingen.
      </p>
    </Card>
  );
}
