import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  email: string | null;
  setEmail: (email: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: null,
      setEmail: (email) => set({ email }),
      clearAuth: () => set({ email: null }), // Clears email from state
    }),
    {
      name: "auth-storage", // Key for localStorage
      storage: createJSONStorage(() => localStorage), // Persist using localStorage
      partialize: (state) => ({ email: state.email }), // Persist only email
    }
  )
);
