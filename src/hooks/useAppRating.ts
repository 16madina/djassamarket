import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

const RATED_KEY = 'ayoka_app_rated';

export const useAppRating = () => {
  const [hasRated, setHasRated] = useState(() => {
    return localStorage.getItem(RATED_KEY) === 'true';
  });

  const openAppStore = () => {
    const platform = Capacitor.getPlatform();
    
    // App IDs
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471';
    const appStoreUrl = 'https://apps.apple.com/app/ayoka/id6756237345';
    
    let url: string;
    
    if (platform === 'android') {
      url = playStoreUrl;
    } else if (platform === 'ios') {
      url = appStoreUrl;
    } else {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/android/i.test(userAgent)) {
        url = playStoreUrl;
      } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        url = appStoreUrl;
      } else {
        url = playStoreUrl;
      }
    }
    
    // Marquer comme noté
    localStorage.setItem(RATED_KEY, 'true');
    setHasRated(true);
    
    window.open(url, '_blank');
  };

  return { openAppStore, hasRated };
};
