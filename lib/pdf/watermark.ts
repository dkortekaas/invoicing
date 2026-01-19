import { SystemSettings } from '@prisma/client';

export function getWatermarkContainerStyles(settings: SystemSettings): any {
  const opacity = Number(settings.watermarkOpacity);

  switch (settings.watermarkPosition) {
    case 'DIAGONAL':
    case 'CENTER':
      return {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex' as const,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        opacity: opacity,
      };
    
    case 'BOTTOM':
      return {
        position: 'absolute' as const,
        bottom: 70,
        left: 0,
        right: 0,
        display: 'flex' as const,
        justifyContent: 'center' as const,
        opacity: opacity,
      };
    
    case 'TOP':
      return {
        position: 'absolute' as const,
        top: 50,
        left: 0,
        right: 0,
        display: 'flex' as const,
        justifyContent: 'center' as const,
        opacity: opacity,
      };
    
    case 'FOOTER':
      return {
        position: 'absolute' as const,
        bottom: 20,
        left: 0,
        right: 0,
        display: 'flex' as const,
        justifyContent: 'center' as const,
        opacity: opacity,
      };
    
    default:
      return {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex' as const,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        opacity: opacity,
      };
  }
}

export function getWatermarkTextStyles(settings: SystemSettings): any {
  const baseStyle: any = {
    color: settings.watermarkColor,
    fontSize: settings.watermarkPosition === 'FOOTER' 
      ? settings.watermarkFontSize * 0.6 
      : settings.watermarkFontSize,
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
    textAlign: 'center' as const,
  };

  // For diagonal, we need to apply rotation
  // react-pdf supports transform as an array: [['rotate', '45deg']]
  if (settings.watermarkPosition === 'DIAGONAL') {
    baseStyle.transform = [[`rotate`, `${settings.watermarkRotation}deg`]];
  }

  return baseStyle;
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
