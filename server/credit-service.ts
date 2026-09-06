import { CreditAccount, CreditTransaction, CreditRates, CreditTokensInfo } from '../src/types';
import { saveAuditLog } from './audit-store.js';

export const AGENT_CREDIT_RATES: CreditRates = {
  general_nlq: 1,
  onboarding: 5,
  notice_triage: 8,
  gst_bank_recon: 12
};

// In-Memory Durable Ledger for Tenant AI Agent Credits
const creditAccounts: Record<string, CreditAccount> = {
  'firm_abc': {
    tenantId: 'firm_abc',
    balance: 475,
    lifetimeUsed: 25,
    lifetimeGranted: 500,
    planType: 'Professional',
    monthlyAllowance: 500,
    autoRecharge: true,
    autoRechargeThreshold: 50,
    autoRechargePackAmount: 200,
    bypassMetering: false,
    isTestMode: false,
    lastRefreshedAt: '2026-09-01T00:00:00.000Z'
  }
};

const creditLedger: CreditTransaction[] = [
  {
    id: 'TXN-CR-001',
    tenantId: 'firm_abc',
    userId: 'usr_admin_01',
    userName: 'Practice Master (Admin)',
    type: 'GRANT',
    category: 'SUBSCRIPTION_ALLOWANCE',
    amount: 500,
    balanceAfter: 500,
    description: 'Monthly Autonomous Agent Allowance (Professional CA Plan)',
    timestamp: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'TXN-CR-002',
    tenantId: 'firm_abc',
    userId: 'usr_part_02',
    userName: 'Hari Krishna (Partner)',
    type: 'DEDUCT',
    category: 'AGENT_EXECUTION',
    amount: -8,
    balanceAfter: 492,
    agentType: 'notice_triage',
    description: 'Autonomous Notice Triage & Section 148A Defence Generation for Acme Corp',
    tokensUsed: { promptTokens: 3840, completionTokens: 1420, totalTokens: 5260 },
    timestamp: '2026-09-02T10:15:22.000Z'
  },
  {
    id: 'TXN-CR-003',
    tenantId: 'firm_abc',
    userId: 'usr_art_882',
    userName: 'T. Varsha (Article Staff)',
    type: 'DEDUCT',
    category: 'AGENT_EXECUTION',
    amount: -12,
    balanceAfter: 480,
    agentType: 'gst_bank_recon',
    description: '3-Way GSTR-2B vs Books vs Bank Statement Audit Recon for NexGen Cloud',
    tokensUsed: { promptTokens: 6120, completionTokens: 2150, totalTokens: 8270 },
    timestamp: '2026-09-03T14:40:00.000Z'
  },
  {
    id: 'TXN-CR-004',
    tenantId: 'firm_abc',
    userId: 'usr_part_02',
    userName: 'Hari Krishna (Partner)',
    type: 'DEDUCT',
    category: 'AGENT_EXECUTION',
    amount: -5,
    balanceAfter: 475,
    agentType: 'onboarding',
    description: 'Client Onboarding Engagement Letter & Statutory KYC Docket for TechSolutions LLP',
    tokensUsed: { promptTokens: 2450, completionTokens: 1100, totalTokens: 3550 },
    timestamp: '2026-09-03T17:22:15.000Z'
  }
];

export function getAccount(tenantId: string = 'firm_abc'): CreditAccount {
  if (!creditAccounts[tenantId]) {
    creditAccounts[tenantId] = {
      tenantId,
      balance: 300,
      lifetimeUsed: 0,
      lifetimeGranted: 300,
      planType: 'Starter',
      monthlyAllowance: 300,
      autoRecharge: false,
      autoRechargeThreshold: 30,
      autoRechargePackAmount: 100,
      lastRefreshedAt: new Date().toISOString()
    };
  }
  return { ...creditAccounts[tenantId] };
}

export function getTransactions(tenantId: string = 'firm_abc'): CreditTransaction[] {
  return creditLedger
    .filter(t => t.tenantId === tenantId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function checkSufficientCredits(tenantId: string = 'firm_abc', requiredCredits: number): {
  sufficient: boolean;
  balance: number;
  required: number;
  bypassed?: boolean;
} {
  const account = getAccount(tenantId);
  // If AI credit metering is stopped / testing mode is enabled, bypass all balance checks
  if (account.bypassMetering) {
    return {
      sufficient: true,
      balance: account.balance,
      required: 0,
      bypassed: true
    };
  }

  return {
    sufficient: account.balance >= requiredCredits,
    balance: account.balance,
    required: requiredCredits,
    bypassed: false
  };
}

export function deductCredits(params: {
  tenantId?: string;
  userId?: string;
  userName?: string;
  agentType: keyof CreditRates | string;
  customCredits?: number;
  description: string;
  taskId?: string;
  tokensUsed?: CreditTokensInfo;
}): { success: boolean; deducted: number; newBalance: number; error?: string; bypassed?: boolean } {
  const tenantId = params.tenantId || 'firm_abc';
  const account = getAccount(tenantId);

  // If metering is stopped / test mode is active, do not deduct credits
  if (account.bypassMetering) {
    const txn: CreditTransaction = {
      id: `TXN-CR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      tenantId,
      userId: params.userId || 'usr_test_mode',
      userName: params.userName || 'Test Mode Operator',
      type: 'DEDUCT',
      category: 'TEST_CREDIT',
      amount: 0,
      balanceAfter: account.balance,
      description: `[TEST MODE - METERING STOPPED] ${params.description}`,
      agentType: params.agentType,
      taskId: params.taskId,
      tokensUsed: params.tokensUsed,
      timestamp: new Date().toISOString()
    };

    creditLedger.unshift(txn);

    saveAuditLog({
      action: 'AGENT_CREDIT_DEDUCTION',
      category: 'FINANCIAL',
      severity: 'INFO',
      user: params.userId || 'test_operator',
      details: `[TEST MODE - METERING BYPASSED] Execution for agent '${params.agentType}' completed with 0 credits deducted. Balance remaining: ${account.balance}`,
      metadata: {
        agentType: params.agentType,
        deducted: 0,
        meteringStopped: true,
        balanceAfter: account.balance
      }
    });

    return {
      success: true,
      deducted: 0,
      newBalance: account.balance,
      bypassed: true
    };
  }
  
  const requiredCredits = params.customCredits !== undefined 
    ? params.customCredits 
    : (AGENT_CREDIT_RATES[params.agentType as keyof CreditRates] || 1);

  if (account.balance < requiredCredits) {
    // If auto-recharge is enabled, attempt auto-recharge
    if (account.autoRecharge && account.autoRechargePackAmount > 0) {
      grantCredits({
        tenantId,
        userId: 'system_auto_recharge',
        userName: 'CAOMS Auto-Recharge Engine',
        amount: account.autoRechargePackAmount,
        category: 'PURCHASE',
        description: `Auto-Recharge Triggered (Threshold ≤ ${account.autoRechargeThreshold} credits)`
      });
    } else {
      return {
        success: false,
        deducted: 0,
        newBalance: account.balance,
        error: `Insufficient credits. Required: ${requiredCredits}, Available: ${account.balance}. Please top up your balance.`
      };
    }
  }

  // Deduct
  const updatedBalance = creditAccounts[tenantId].balance - requiredCredits;
  creditAccounts[tenantId].balance = updatedBalance;
  creditAccounts[tenantId].lifetimeUsed += requiredCredits;

  const txn: CreditTransaction = {
    id: `TXN-CR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    tenantId,
    userId: params.userId || 'usr_active_session',
    userName: params.userName || 'Engagement Team',
    type: 'DEDUCT',
    category: 'AGENT_EXECUTION',
    amount: -requiredCredits,
    balanceAfter: updatedBalance,
    description: params.description,
    agentType: params.agentType,
    taskId: params.taskId,
    tokensUsed: params.tokensUsed,
    timestamp: new Date().toISOString()
  };

  creditLedger.unshift(txn);

  // Check if balance has dipped below auto-recharge threshold after deduction
  if (
    creditAccounts[tenantId].autoRecharge && 
    creditAccounts[tenantId].balance < creditAccounts[tenantId].autoRechargeThreshold
  ) {
    grantCredits({
      tenantId,
      userId: 'system_auto_recharge',
      userName: 'CAOMS Auto-Recharge Engine',
      amount: creditAccounts[tenantId].autoRechargePackAmount,
      category: 'PURCHASE',
      description: `Auto-Recharge Triggered: Balance dipped to ${creditAccounts[tenantId].balance} (Threshold: ${creditAccounts[tenantId].autoRechargeThreshold})`
    });
  }

  saveAuditLog({
    action: 'AGENT_CREDIT_DEDUCTION',
    category: 'FINANCIAL',
    severity: 'INFO',
    user: params.userId || 'agent_operator',
    details: `Deducted ${requiredCredits} credits for agent '${params.agentType}'. Balance remaining: ${creditAccounts[tenantId].balance}`,
    metadata: {
      agentType: params.agentType,
      deducted: requiredCredits,
      balanceAfter: creditAccounts[tenantId].balance,
      tokensUsed: params.tokensUsed
    }
  });

  return {
    success: true,
    deducted: requiredCredits,
    newBalance: creditAccounts[tenantId].balance
  };
}

export function grantCredits(params: {
  tenantId?: string;
  userId?: string;
  userName?: string;
  amount: number;
  category?: 'PURCHASE' | 'SUBSCRIPTION_ALLOWANCE' | 'PROMO_CREDIT' | 'SYSTEM_REFUND' | 'TEST_CREDIT';
  description?: string;
  packName?: string;
  paymentRef?: string;
}): { success: boolean; granted: number; newBalance: number } {
  const tenantId = params.tenantId || 'firm_abc';
  const account = getAccount(tenantId);
  const amount = Math.max(1, Math.round(params.amount));

  const updatedBalance = account.balance + amount;
  creditAccounts[tenantId].balance = updatedBalance;
  creditAccounts[tenantId].lifetimeGranted += amount;

  const txn: CreditTransaction = {
    id: `TXN-CR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    tenantId,
    userId: params.userId || 'usr_admin',
    userName: params.userName || 'Practice Administrator',
    type: 'GRANT',
    category: params.category || 'PURCHASE',
    amount: amount,
    balanceAfter: updatedBalance,
    description: params.description || (params.packName ? `Purchased ${params.packName}` : (params.category === 'TEST_CREDIT' ? `Granted +${amount} Free Test Credits for QA Testing` : `Granted ${amount} Autonomous Agent Credits`)),
    timestamp: new Date().toISOString()
  };

  creditLedger.unshift(txn);

  saveAuditLog({
    action: 'AGENT_CREDIT_GRANT',
    category: 'FINANCIAL',
    severity: 'INFO',
    user: params.userId || 'billing_service',
    details: `Granted ${amount} credits to tenant '${tenantId}'. Category: ${params.category || 'PURCHASE'}. New balance: ${updatedBalance}`,
    metadata: {
      amount,
      balanceAfter: updatedBalance,
      packName: params.packName,
      category: params.category,
      paymentRef: params.paymentRef
    }
  });

  return {
    success: true,
    granted: amount,
    newBalance: updatedBalance
  };
}

export function setBypassMetering(tenantId: string = 'firm_abc', bypass: boolean): CreditAccount {
  const account = getAccount(tenantId);
  creditAccounts[tenantId] = {
    ...account,
    bypassMetering: bypass,
    isTestMode: bypass,
    tenantId
  };

  saveAuditLog({
    action: 'AGENT_CREDIT_SETTINGS_UPDATE',
    category: 'SETTINGS',
    severity: 'INFO',
    user: 'admin',
    details: bypass 
      ? 'AI Credit Metering STOPPED - Unlimited Test Mode Enabled' 
      : 'AI Credit Metering RESUMED - Standard Rate Metering Active',
    metadata: { bypassMetering: bypass }
  });

  return { ...creditAccounts[tenantId] };
}

export function updateCreditSettings(
  tenantId: string = 'firm_abc',
  settings: Partial<CreditAccount>
): CreditAccount {
  const current = getAccount(tenantId);
  creditAccounts[tenantId] = {
    ...current,
    ...settings,
    tenantId // prevent overwrite
  };

  saveAuditLog({
    action: 'AGENT_CREDIT_SETTINGS_UPDATE',
    category: 'SETTINGS',
    severity: 'INFO',
    user: 'admin',
    details: `Updated AI Agent credit settings: autoRecharge=${creditAccounts[tenantId].autoRecharge}, threshold=${creditAccounts[tenantId].autoRechargeThreshold}`,
    metadata: settings
  });

  return { ...creditAccounts[tenantId] };
}
