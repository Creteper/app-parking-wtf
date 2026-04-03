import { MapComponent, type MapHandle } from "@/components/map.container";
import {
  useAuthStore,
  useParkingLotsStore,
  useFinishedParkingRecordsStore,
  useUnfinishedParkingRecordsStore,
} from "@/stores";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CircleParking } from "lucide-react";
import dayjs from "dayjs";
import BottomSheet, { type BottomSheetRef } from "@wldyslw/react-bottom-sheet";
import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export default function ParkingsPage() {
  const navigate = useNavigate();

  // 使用 Zustand stores
  const { checkAuthAndVehicle } = useAuthStore();
  const { parkingLots, fetchParkingLots } = useParkingLotsStore();
  const { parkingRecords: unfinishedRecords, fetchUnfinishedParkingRecords } =
    useUnfinishedParkingRecordsStore();
  const { parkingRecords: finishedRecords, fetchFinishedParkingRecords } =
    useFinishedParkingRecordsStore();
  const mapRef = useRef<MapHandle>(null);
  const sheetRef = useRef<BottomSheetRef>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const unfinishedRecord =
    unfinishedRecords.length > 0 ? unfinishedRecords[0] : undefined;
  const allRecords = [...unfinishedRecords, ...finishedRecords].sort((a, b) => {
    const dateA = new Date(a.arrival_time).getTime();
    const dateB = new Date(b.arrival_time).getTime();
    return dateB - dateA;
  });
  const bookedParkingLotIds = new Set(
    allRecords.map((r) => r.parking_lot_id).filter(Boolean),
  );

  const displayParkingLots = searchQuery
    ? parkingLots.filter((lot) =>
        lot.parking_lot_name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : parkingLots.filter((lot) => bookedParkingLotIds.has(lot.id));

  const handleParkingLotSelect = (parkingLot: (typeof parkingLots)[0]) => {
    console.log("选中的停车场:", parkingLot);
    sheetRef.current?.close();
  };

  const handleUnfinishedRecord = () => {
    parkingLots.map((items, index) => {
      unfinishedRecord?.parking_lot_name == items.parking_lot_name &&
        handleParkingLotSelect(items);
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function checkAuthAndFetchData() {
      try {
        // 1. 检查认证和车辆绑定状态
        const { isAuthenticated, isVehicleBound } = await checkAuthAndVehicle();

        if (cancelled) return;

        if (!isAuthenticated) {
          navigate("/auth");
          return;
        }

        if (!isVehicleBound) {
          navigate("/bind-vehicle");
          return;
        }
        if (!mapRef.current) return;
        mapRef.current.setCenter([45.872075, 126.504867]);

        // 2. 获取停车场数据和停车记录
        await Promise.all([
          fetchParkingLots(),
          fetchUnfinishedParkingRecords(),
          fetchFinishedParkingRecords(),
        ]);
      } catch (err) {
        console.error("Auth check or data fetch failed:", err);
        if (!cancelled) {
          navigate("/auth");
        }
      }
    }

    void checkAuthAndFetchData();

    return () => {
      cancelled = true;
    };
  }, [
    navigate,
    checkAuthAndVehicle,
    fetchParkingLots,
    fetchUnfinishedParkingRecords,
    fetchFinishedParkingRecords,
  ]);

  return (
    <main className="w-full min-h-screen bg-muted">
      {/* 顶部导航栏 */}
      <header
        className={
          "flex items-center mb-6 absolute z-999 left-0 top-0 p-4 w-full justify-between"
        }
      >
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full bg-white shadow-sm hover:bg-white/80"
          >
            <ArrowLeft className="w-5 h-5 text-black" />
          </Button>
          <h1 className="text-md font-bold bg-white rounded-full py-1.5 px-4 shadow-sm">
            选择停车场
          </h1>
        </div>
        {allRecords.length > 0 && (
          <div className="bg-primary py-1.5 text-white font-bold px-4 rounded-full shadow-sm">
            最近预约时间
            {dayjs(allRecords[0].arrival_time).format("HH:MM")}
          </div>
        )}
      </header>

      <div className="w-full h-120">
        {/*    default 126.504867, 45.872075   */}
        <MapComponent
          ref={mapRef}
          isTiles
          parkingLots={parkingLots}
          showUserLocation
          customUserLocation={[45.872075, 126.504867]}
        />
      </div>
      <div className="bg-linear-to-b from-transparent to-muted -mt-4 h-10 absolute z-999 w-full top-115" />

      {/* 选择停车场 */}
      <div className="mt-4 px-4">
        <div className="bg-primary/20 rounded-xl shadow-sm">
          <div className="p-2 px-4 flex text-sm items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/images/star_li.png" alt="star" className="w-6 h-6" />
              <h1 className="text-accent font-bold">
                试试 AI 帮您选择最近停车场
              </h1>
            </div>
            <Button variant={"secondary"} className="text-white" size={"xs"}>
              去试试 <ArrowRight />
            </Button>
          </div>
          <div className="bg-white rounded-xl w-full flex flex-col pt-6 pb-3 gap-4">
            <div className="flex items-center gap-4 px-6">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <h2 className="text-sm">
                从{" "}
                <span className="text-secondary font-bold">
                  黑龙江建筑职业技术大学
                </span>{" "}
                出发
              </h2>
            </div>
            <div className="px-3">
              <div className="flex items-center justify-between bg-muted rounded-xl p-3 w-full">
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => sheetRef.current?.open()}
                >
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <h1 className="text-xl font-bold text-primary">
                    您想去哪儿？
                  </h1>
                </div>
                {unfinishedRecord && unfinishedRecord.parking_lot_name && (
                  <div
                    onClick={handleUnfinishedRecord}
                    className="text-muted-foreground text-sm font-medium bg-white p-2 rounded-xl shadow-sm"
                  >
                    {unfinishedRecord.parking_lot_name.length > 5
                      ? unfinishedRecord.parking_lot_name.slice(0, 5) + "..."
                      : unfinishedRecord.parking_lot_name}
                  </div>
                )}
              </div>
            </div>
            <span className="text-muted-foreground text-sm flex px-5 pb-2">
              点击
              <p className="text-accent font-bold">&nbsp;地图标点&nbsp;</p>
              或点击
              <p className="text-orange-400 font-bold">
                &nbsp;您想去哪儿？&nbsp;
              </p>
              选择目的地
            </span>
          </div>
        </div>
      </div>

      {/* AI帮您选择最近的停车场 */}
      <div className="px-4 mt-12">
        <div className="bg-orange-100 border border-orange-400 py-2 rounded-2xl w-full relative flex items-center justify-between px-4">
          <img
            src="/images/ai-man.png"
            alt=""
            className="absolute w-32 h-32 -top-15 -left-5"
          />
          <div className="pl-20">
            <h1 className="text-orange-600 font-bold">试试 AI 小哲</h1>
            <p className="text-xs text-muted-foreground">
              让 <span className="text-amber-600">"小哲同学"</span>{" "}
              帮你寻找最近停车场
            </p>
          </div>
          <Button className="rounded-xl bg-amber-500">去试试</Button>
        </div>
      </div>

      <BottomSheet
        ref={sheetRef}
        className="px-3 shadow-2xl"
        detents={["90%"]}
        grabberVisible
      >
        <InputGroup className="rounded-xl h-12">
          <InputGroupInput
            placeholder="搜索停车场"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <div className="mt-4 flex flex-col items-center gap-2 max-h-[calc(90vh-120px)] overflow-y-auto">
          {displayParkingLots.length > 0 ? (
            displayParkingLots.map((lot) => (
              <div
                key={lot.id}
                onClick={() => handleParkingLotSelect(lot)}
                className="p-3 bg-white rounded-xl shadow-sm w-[97%] hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CircleParking className="w-5 h-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <div className="font-bold text-md">
                      {lot.parking_lot_name}
                    </div>
                    <div className="text-muted-foreground text-xs truncate w-60">
                      {lot.cityname + lot.adname + lot.address}
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground text-xs self-end">
                  {lot.km}km
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? "未找到匹配的停车场" : "暂无预约记录的停车场"}
            </div>
          )}
        </div>
      </BottomSheet>
    </main>
  );
}
