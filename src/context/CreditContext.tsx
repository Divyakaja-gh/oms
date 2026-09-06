import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CreditAccount, CreditTransaction, CreditRates } from '../types';

interface CreditContextType {
  balance: number;
  account: CreditAccount | null;
  rates: CreditRates;
  transactions: CreditTransaction[];
  isLoading: boolean;
  isTopUpModalOpen: boolean;
  bypassMetering: boolean;
  openTopUpModal: () => void;
  closeTopUpModal: () => void;
  refreshCredits: () => Promise<void>;
  grantCredits: (amount: number, packName?: string, paymentRef?: string, category?: string) => Promise<{ success: boolean; newBalance?: number; error?: string }>;
  grantTestCredits: (amount?: number) => Promise<{ success: boolean; newBalance?: number; error?: string }>;
  toggleBypassMetering: (bypass: boolean) => Promise<boolean>;
  updateSettings: (settings: Partial<CreditAccount>) => Promise<boolean>;
}

const DEFAULT_RATES: CreditRates = {
  general_nlq: 1,
  onboarding: 5,
  notice_triage: 8,
  gst_bank_recon: 12
};

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<CreditAccount | null>(() => {
    try {
      const saved = localStorage.getItem('caoms_test_credit_account');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [rates, setRates] = useState<CreditRates>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const bypassMetering = Boolean(account?.bypassMetering || account?.isTestMode);

  // Sync to localStorage as client fallback
  useEffect(() => {
    if (account) {
      try {
        localStorage.setItem('caoms_test_credit_account', JSON.stringify(account));
      } catch (_) {}
    }
  }, [account]);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/credits/summary', {
        headers: { 'Authorization': 'Bearer mocked-soc2-jwt-token' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.account) {
          setAccount(data.account);
          if (data.rates) setRates(data.rates);
          if (data.transactions) setTransactions(data.transactions);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch credit summary, using client state:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();

    // Listen for agent completion events or manual updates
    const handleCreditsUpdated = (e: any) => {
      const detail = e.detail;
      if (detail && typeof detail.creditBalance === 'number') {
        setAccount(prev => prev ? { ...prev, balance: detail.creditBalance, lifetimeUsed: prev.lifetimeUsed + (detail.creditsDeducted || 0) } : null);
      }
      fetchCredits();
    };

    window.addEventListener('credits_updated', handleCreditsUpdated);
    return () => window.removeEventListener('credits_updated', handleCreditsUpdated);
  }, [fetchCredits]);

  const grantCredits = async (amount: number, packName?: string, paymentRef?: string, category = 'PURCHASE') => {
    try {
      const res = await fetch('/api/credits/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-soc2-jwt-token'
        },
        body: JSON.stringify({ amount, packName, paymentRef, category })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccount(data.account);
        if (data.transactions) setTransactions(data.transactions);
        return { success: true, newBalance: data.newBalance };
      }
      // Fallback for static environment
      const currentBal = account?.balance ?? 475;
      const newBal = currentBal + amount;
      const newAcc: CreditAccount = {
        tenantId: account?.tenantId || 'firm_abc',
        balance: newBal,
        lifetimeUsed: account?.lifetimeUsed || 0,
        lifetimeGranted: (account?.lifetimeGranted || 500) + amount,
        planType: account?.planType || 'Professional',
        monthlyAllowance: account?.monthlyAllowance || 500,
        autoRecharge: account?.autoRecharge ?? true,
        autoRechargeThreshold: account?.autoRechargeThreshold ?? 50,
        autoRechargePackAmount: account?.autoRechargePackAmount ?? 200,
        bypassMetering: account?.bypassMetering ?? false,
        isTestMode: account?.isTestMode ?? false,
        lastRefreshedAt: new Date().toISOString()
      };
      setAccount(newAcc);
      return { success: true, newBalance: newBal };
    } catch (err: any) {
      // Fallback for offline/static deployment (e.g., Vercel without express)
      const currentBal = account?.balance ?? 475;
      const newBal = currentBal + amount;
      const newAcc: CreditAccount = {
        tenantId: account?.tenantId || 'firm_abc',
        balance: newBal,
        lifetimeUsed: account?.lifetimeUsed || 0,
        lifetimeGranted: (account?.lifetimeGranted || 500) + amount,
        planType: account?.planType || 'Professional',
        monthlyAllowance: account?.monthlyAllowance || 500,
        autoRecharge: account?.autoRecharge ?? true,
        autoRechargeThreshold: account?.autoRechargeThreshold ?? 50,
        autoRechargePackAmount: account?.autoRechargePackAmount ?? 200,
        bypassMetering: account?.bypassMetering ?? false,
        isTestMode: account?.isTestMode ?? false,
        lastRefreshedAt: new Date().toISOString()
      };
      setAccount(newAcc);
      return { success: true, newBalance: newBal };
    }
  };

  const grantTestCredits = async (amount = 10000) => {
    try {
      const res = await fetch('/api/credits/grant-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-soc2-jwt-token'
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccount(data.account);
        if (data.transactions) setTransactions(data.transactions);
        return { success: true, newBalance: data.newBalance };
      }
      return grantCredits(amount, `+${amount.toLocaleString()} Free Test Credits`, 'TEST-CREDIT-GRANT', 'TEST_CREDIT');
    } catch (err: any) {
      return grantCredits(amount, `+${amount.toLocaleString()} Free Test Credits`, 'TEST-CREDIT-GRANT', 'TEST_CREDIT');
    }
  };

  const toggleBypassMetering = async (bypass: boolean): Promise<boolean> => {
    // Optimistic update
    setAccount(prev => prev ? { ...prev, bypassMetering: bypass, isTestMode: bypass } : {
      tenantId: 'firm_abc',
      balance: 10000,
      lifetimeUsed: 0,
      lifetimeGranted: 10000,
      planType: 'Professional',
      monthlyAllowance: 1000,
      autoRecharge: false,
      autoRechargeThreshold: 50,
      autoRechargePackAmount: 200,
      bypassMetering: bypass,
      isTestMode: bypass,
      lastRefreshedAt: new Date().toISOString()
    });

    try {
      const res = await fetch('/api/credits/test-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-soc2-jwt-token'
        },
        body: JSON.stringify({ bypassMetering: bypass })
      });
      const data = await res.json();
      if (res.ok && data.success && data.account) {
        setAccount(data.account);
        return true;
      }
      return true;
    } catch (err) {
      console.warn('Network error setting test mode on server, client bypass active:', err);
      return true;
    }
  };

  const updateSettings = async (settings: Partial<CreditAccount>) => {
    try {
      const res = await fetch('/api/credits/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-soc2-jwt-token'
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccount(data.account);
        return true;
      }
      setAccount(prev => prev ? { ...prev, ...settings } : null);
      return true;
    } catch (err) {
      console.error('Failed to update credit settings:', err);
      setAccount(prev => prev ? { ...prev, ...settings } : null);
      return true;
    }
  };

  const balance = account?.balance ?? 450;

  return (
    <CreditContext.Provider
      value={{
        balance,
        account,
        rates,
        transactions,
        isLoading,
        isTopUpModalOpen,
        bypassMetering,
        openTopUpModal: () => setIsTopUpModalOpen(true),
        closeTopUpModal: () => setIsTopUpModalOpen(false),
        refreshCredits: fetchCredits,
        grantCredits,
        grantTestCredits,
        toggleBypassMetering,
        updateSettings
      }}
    >
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
}
