import { SystemSettings } from '@prisma/client';

export function getWatermarkStyles(settings: SystemSettings): any {
  const opacity = Number(settings.watermarkOpacity);
  
  const baseStyle = {
    position: 'absolute' as const,
    color: settings.watermarkColor,
    fontSize: settings.watermarkFontSize,
    opacity: opacity,
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
    userSelect: 'none' as const,
    pointerEvents: 'none' as const,
  };

  switch (settings.watermarkPosition) {
    case 'DIAGONAL':
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) rotate(${settings.watermarkRotation}deg)`,
        width: '100%',
        textAlign: 'center' as const,
      };
    
    case 'CENTER':
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center' as const,
      };
    
    case 'BOTTOM':
      return {
        ...baseStyle,
        bottom: 50,
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center' as const,
      };
    
    case 'TOP':
      return {
        ...baseStyle,
        top: 50,
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center' as const,
      };
    
    case 'FOOTER':
      return {
        ...baseStyle,
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center' as const,
        fontSize: settings.watermarkFontSize * 0.6, // Kleiner in footer
      };
    
    default:
      return baseStyle;
  }
}

export function shouldShowWatermark(
  userTier: string,
  settings: SystemSettings
): boolean {
  // Alleen tonen voor free users als feature enabled is
  return (
    settings.freeUserWatermarkEnabled &&
    settings.watermarkEnabled &&
    userTier === 'FREE'
  );
}
