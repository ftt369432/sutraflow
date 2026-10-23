import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: User | null;
  subscription: Subscription | null;
  setUser: (user: User | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  clearUser: () => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
}

interface Subscription {
  id: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      subscription: null,
      setUser: (user) => set({ user }),
      setSubscription: (subscription) => set({ subscription }),
      clearUser: () => set({ user: null, subscription: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);