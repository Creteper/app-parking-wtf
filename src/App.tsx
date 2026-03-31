import { MapComponent } from "@/components/map.container";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { api, type ParkingLot } from "@/lib/api";
import { useEffect, useState } from "react";

function App() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAllParkingLots() {
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

      if (!cancelled) setParkingLots(items);
    }

    void fetchAllParkingLots().catch((err) => {
      console.error("Failed to fetch parking lots:", err);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="w-full h-screen bg-muted overflow-auto px-8 pt-8">
      <header
        data-slot="titlebar"
        className="flex items-center gap-2 justify-between"
      >
        <div className="flex items-center gap-2">
          <img src="/images/pakingPhoto.png" alt="logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">智慧停车</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={"secondary"}
            size={"icon"}
            className="bg-background rounded-full shadow-sm"
          >
            <Search />
          </Button>
          <Button
            variant={"secondary"}
            size={"icon"}
            className="bg-background rounded-full shadow-sm"
          >
            <Bell />
          </Button>
        </div>
      </header>
      <div
        data-slot="map-container"
        className="w-full h-64 rounded-xl overflow-hidden mt-6 shadow-sm border-white border-4"
      >
        <MapComponent isTiles parkingLots={parkingLots} />
      </div>
    </main>
  );
}

export default App;
