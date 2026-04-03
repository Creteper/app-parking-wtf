import { create } from "zustand";
import { api, type ParkingRecord } from "@/lib/api";

interface ParkingRecordsState {
  parkingRecords: ParkingRecord[];
  isLoading: boolean;
  error: Error | null;
  fetchParkingRecords: () => Promise<void>;
  reset: () => void;
}

export const useParkingRecordsStore = create<ParkingRecordsState>((set) => ({
  parkingRecords: [],
  isLoading: false,
  error: null,

  fetchParkingRecords: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await api.parkingRecords.list();
      set({ parkingRecords: res.data?.data ?? [], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err : new Error("Failed to fetch parking records"),
        isLoading: false,
      });
      throw err;
    }
  },

  reset: () => set({ parkingRecords: [], isLoading: false, error: null }),
}));
