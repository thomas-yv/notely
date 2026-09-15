import { create } from "zustand";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem("notely_token");
  const savedUser = localStorage.getItem("notely_user");

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    setAuth: (user: User, token: string) => {
      localStorage.setItem("notely_token", token);
      localStorage.setItem("notely_user", JSON.stringify(user));
      set({ user, token });
    },
    logout: () => {
      localStorage.removeItem("notely_token");
      localStorage.removeItem("notely_user");
      set({ user: null, token: null });
    },
  };
});
