import { create } from "zustand";
import { api, type UnfinishedParkingRecord } from "@/lib/api";

interface UnfinishedParkingRecordsState {
  parkingRecords: UnfinishedParkingRecord[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  fetchUnfinishedParkingRecords: (parking_lot_id?: number) => Promise<void>;
  reset: () => void;
}

export const useUnfinishedParkingRecordsStore = create<UnfinishedParkingRecordsState>((set) => ({
  parkingRecords: [],
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  },

  fetchUnfinishedParkingRecords: async (parking_lot_id?: number) => {
    set({ isLoading: true, error: null });

    try {
      const res = await api.parkingRecords.unfinished({
        parking_lot_id,
        page: 1,
        pageSize: 100,
      });
      
      const records = res.data?.data ?? [];
      const unfinishedRecords = records
        .filter((record) => record.status === "未完成")
        .sort((a, b) => {
          const dateA = new Date(a.arrival_time).getTime();
          const dateB = new Date(b.arrival_time).getTime();
          return dateB - dateA;
        });

      set({
        parkingRecords: unfinishedRecords,
        isLoading: false,
        pagination: res.data?.pagination ?? {
          total: unfinishedRecords.length,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err : new Error("Failed to fetch unfinished parking records"),
        isLoading: false,
      });
      throw err;
    }
  },

  reset: () => set({
    parkingRecords: [],
    isLoading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    }
  }),
}));
