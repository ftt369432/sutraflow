import { supabase } from '../../lib/supabase';

export const linkedAccountService = {
  getLinkedAccounts: async () => {
    const { data, error } = await supabase
      .from('linked_accounts')
      .select('*');

    if (error) {
      console.error('Error fetching linked accounts:', error);
      throw error;
    }

    return data;
  },

  removeLinkedAccount: async (accountId: string) => {
    const { error } = await supabase
      .from('linked_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      console.error('Error removing linked account:', error);
      throw error;
    }

    return true;
  },
}; 