import { create } from "zustand";
import { api, getToken, clearToken } from "@/lib/api";

interface AuthState {
  isCheckingAuth: boolean;
  isAuthenticated: boolean;
  isVehicleBound: boolean;
  error: Error | null;
  checkAuthAndVehicle: () => Promise<{
    isAuthenticated: boolean;
    isVehicleBound: boolean;
  }>;
  logout: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isCheckingAuth: true,
  isAuthenticated: false,
  isVehicleBound: false,
  error: null,

  checkAuthAndVehicle: async () => {
    set({ isCheckingAuth: true, error: null });

    try {
      // 1. 检查是否登录
      const token = getToken();
      if (!token) {
        set({
          isAuthenticated: false,
          isVehicleBound: false,
          isCheckingAuth: false,
        });
        return { isAuthenticated: false, isVehicleBound: false };
      }

      // 2. 检查车牌号绑定状态
      const plateStatus = await api.usersVehiclePlate.status();
      const isVehicleBound = plateStatus.data.bound;

      set({
        isAuthenticated: true,
        isVehicleBound,
        isCheckingAuth: false,
      });

      return { isAuthenticated: true, isVehicleBound };
    } catch (err) {
      // 如果API调用失败（如token无效），清除token
      clearToken();
      set({
        error: err instanceof Error ? err : new Error("Auth check failed"),
        isAuthenticated: false,
        isVehicleBound: false,
        isCheckingAuth: false,
      });
      throw err;
    }
  },

  logout: () => {
    clearToken();
    set({
      isAuthenticated: false,
      isVehicleBound: false,
      isCheckingAuth: false,
    });
  },

  reset: () =>
    set({
      isCheckingAuth: true,
      isAuthenticated: false,
      isVehicleBound: false,
      error: null,
    }),
}));
