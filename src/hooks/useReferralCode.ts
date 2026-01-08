import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const REFERRAL_STORAGE_KEY = "pendingReferralCode";
const REFERRAL_EXPIRY_KEY = "pendingReferralCodeExpiry";
const EXPIRY_DAYS = 7; // Referral code expires after 7 days

export const useReferralCode = () => {
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Check URL first
    const urlRefCode = searchParams.get("ref");
    
    if (urlRefCode) {
      // Store the referral code with expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);
      
      localStorage.setItem(REFERRAL_STORAGE_KEY, urlRefCode);
      localStorage.setItem(REFERRAL_EXPIRY_KEY, expiryDate.toISOString());
      setReferralCode(urlRefCode);
      console.log("📍 Referral code captured from URL:", urlRefCode);
    } else {
      // Check localStorage for stored code
      const storedCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
      const expiryStr = localStorage.getItem(REFERRAL_EXPIRY_KEY);
      
      if (storedCode && expiryStr) {
        const expiry = new Date(expiryStr);
        
        if (expiry > new Date()) {
          // Code is still valid
          setReferralCode(storedCode);
        } else {
          // Code has expired, clean up
          clearReferralCode();
        }
      }
    }
  }, [searchParams]);

  const clearReferralCode = () => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    localStorage.removeItem(REFERRAL_EXPIRY_KEY);
    setReferralCode(null);
  };

  const getPendingReferralCode = (): string | null => {
    const storedCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
    const expiryStr = localStorage.getItem(REFERRAL_EXPIRY_KEY);
    
    if (storedCode && expiryStr) {
      const expiry = new Date(expiryStr);
      if (expiry > new Date()) {
        return storedCode;
      }
      // Clean up expired code
      clearReferralCode();
    }
    return null;
  };

  return {
    referralCode,
    clearReferralCode,
    getPendingReferralCode,
  };
};

// Standalone function to get pending referral code (for use outside React components)
export const getPendingReferralCode = (): string | null => {
  const storedCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
  const expiryStr = localStorage.getItem(REFERRAL_EXPIRY_KEY);
  
  if (storedCode && expiryStr) {
    const expiry = new Date(expiryStr);
    if (expiry > new Date()) {
      return storedCode;
    }
    // Clean up expired code
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    localStorage.removeItem(REFERRAL_EXPIRY_KEY);
  }
  return null;
};

export const clearPendingReferralCode = () => {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  localStorage.removeItem(REFERRAL_EXPIRY_KEY);
};
