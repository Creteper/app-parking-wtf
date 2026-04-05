import { create } from "zustand";
import { api, type ParkingLot } from "@/lib/api";

interface ParkingLotsState {
  parkingLots: ParkingLot[];
  isLoading: boolean;
  error: Error | null;
  fetchParkingLots: () => Promise<void>;
  reset: () => void;
}

export const useParkingLotsStore = create<ParkingLotsState>((set) => ({
  parkingLots: [],
  isLoading: false,
  error: null,

  fetchParkingLots: async () => {
    set({ isLoading: true, error: null });

    try {
      const pageSize = 100;
      let page = 1;
      const items: ParkingLot[] = [];

      while (true) {
        const res = await api.parkingLots.list({ page, pageSize });
        const chunk = res.data?.data ?? [];
        items.push(...chunk);

        const totalPages = res.data?.pagination?.totalPages;
        if (typeof totalPages === "number") {
          if (page >= totalPages) break;
          page += 1;
          continue;
        }

        // 没有分页信息时，若本页数据不足 pageSize 认为已到末尾
        if (chunk.length < pageSize) break;
        page += 1;
      }

      set({ parkingLots: items, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err : new Error("Failed to fetch parking lots"),
        isLoading: false,
      });
      throw err;
    }
  },

  reset: () => set({ parkingLots: [], isLoading: false, error: null }),
}));
