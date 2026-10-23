import { create } from 'zustand';
import { linkedAccountService } from '../services/account/linkedAccountService';

export interface LinkedAccount {
  id: string;
  user_id: string;
  provider: string;
  email: string;
  provider_account_id: string;
  created_at: string;
}

interface LinkedAccountState {
  accounts: LinkedAccount[];
  isLoading: boolean;
  activeAccountId: string | null;
  fetchAccounts: () => Promise<void>;
  setActiveAccountId: (accountId: string | null) => void;
}

export const useLinkedAccountStore = create<LinkedAccountState>((set) => ({
  accounts: [],
  isLoading: false,
  activeAccountId: null,
  fetchAccounts: async () => {
    set({ isLoading: true });
    try {
      const accounts = await linkedAccountService.getLinkedAccounts();
      set({ accounts: accounts || [], isLoading: false });
      // Set the first account as active by default
      if (accounts && accounts.length > 0) {
        set({ activeAccountId: accounts[0].id });
      }
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error);
      set({ isLoading: false });
    }
  },
  setActiveAccountId: (accountId) => set({ activeAccountId: accountId }),
})); 