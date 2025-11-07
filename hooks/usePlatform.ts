// hooks/usePlatform.ts
import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';
import Constants from 'expo-constants';

export interface PlatformInfo {
  isWeb: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isTV: boolean;
  isMobile: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function usePlatform(): PlatformInfo {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';
  
  // Detectar Android TV
  const isTV = Platform.isTV || 
    (isAndroid && Constants.deviceName?.toLowerCase().includes('tv')) ||
    (isAndroid && dimensions.width >= 1280 && dimensions.height >= 720);

  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;

  // Detectar tablet vs mobile
  const isTablet = !isTV && (
    (screenWidth >= 768 && !isWeb) ||
    (isIOS && (Platform as any).isPad)
  );

  const isMobile = !isTV && !isTablet;

  return {
    isWeb,
    isAndroid,
    isIOS,
    isTV,
    isMobile,
    isTablet,
    screenWidth,
    screenHeight,
  };
}

// Função helper para obter estilos responsivos
export function getResponsiveValue<T>(
  platform: PlatformInfo,
  values: {
    mobile?: T;
    tablet?: T;
    tv?: T;
    web?: T;
    default: T;
  }
): T {
  if (platform.isTV && values.tv !== undefined) return values.tv;
  if (platform.isTablet && values.tablet !== undefined) return values.tablet;
  if (platform.isMobile && values.mobile !== undefined) return values.mobile;
  if (platform.isWeb && values.web !== undefined) return values.web;
  return values.default;
}