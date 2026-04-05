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
import { type ParkingLot } from "@/lib/api";
import BottomSheet, { type BottomSheetRef } from "@wldyslw/react-bottom-sheet";
import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import AIChatSheet from "@/components/AIChatSheet";

/**
 * 停车场选择页面
 * 功能：
 * - 显示地图和停车场标记
 * - 支持搜索停车场
 * - 显示有预约记录的停车场列表
 * - 点击停车场后导航到导航页
 */
export default function ParkingsPage() {
  const navigate = useNavigate();

  // useState
  const [sortedParkingLots, setSortedParkingLots] = useState<ParkingLot[]>([]);

  // ============ 状态管理 ============
  // Zustand stores - 认证、停车场、停车记录状态
  const { checkAuthAndVehicle } = useAuthStore();
  const { parkingLots, fetchParkingLots } = useParkingLotsStore();
  const { parkingRecords: unfinishedRecords, fetchUnfinishedParkingRecords } =
    useUnfinishedParkingRecordsStore();
  const { parkingRecords: finishedRecords, fetchFinishedParkingRecords } =
    useFinishedParkingRecordsStore();

  // 组件引用
  const mapRef = useRef<MapHandle>(null);
  const sheetRef = useRef<BottomSheetRef>(null);
  const aiSheetRef = useRef<BottomSheetRef | null>(null);

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState("");

  // ============ 数据处理 ============
  // 获取最近一条未完成的停车记录
  const unfinishedRecord =
    unfinishedRecords.length > 0 ? unfinishedRecords[0] : undefined;

  // 合并所有停车记录并按到达时间倒序排列
  const allRecords = [...unfinishedRecords, ...finishedRecords].sort((a, b) => {
    const dateA = new Date(a.arrival_time).getTime();
    const dateB = new Date(b.arrival_time).getTime();
    return dateB - dateA;
  });

  // 创建已预约停车场的 ID 集合，用于快速查找
  const bookedParkingLotIds = new Set(
    allRecords.map((r) => r.parking_lot_id).filter(Boolean),
  );

  // ============ 列表数据计算 ============
  // 默认展示：有预约记录的停车场
  const defaultParkingLots = parkingLots.filter((lot) =>
    bookedParkingLotIds.has(lot.id),
  );

  // 搜索结果：根据搜索关键词过滤停车场
  const searchResults = searchQuery
    ? parkingLots.filter((lot) =>
        lot.parking_lot_name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  // 判断是否处于搜索状态
  const isSearching = searchQuery.trim().length > 0;

  /**
   * 冒泡排序算法 - 按距离升序排列停车场
   * @param parkingLots 停车场数组
   * @returns 排序后的新数组（不修改原数组）
   */
  const bubbleSort = (parkingLots: ParkingLot[]) => {
    // 深拷贝避免修改原数组
    const sorted = [...parkingLots];
    const len = sorted.length;
    for (let i = 0; i < len; i++) {
      let swapped = false;
      for (let j = 0; j < len - 1 - i; j++) {
        // 转换为数字进行比较，避免字符串排序问题
        if (Number(sorted[j].km) > Number(sorted[j + 1].km)) {
          [sorted[j], sorted[j + 1]] = [sorted[j + 1], sorted[j]];
          swapped = true;
        }
      }
      if (!swapped) break;
    }
    return sorted;
  };

  useEffect(() => {
    const sortedParkingLots = bubbleSort(parkingLots);
    setSortedParkingLots(sortedParkingLots);
  }, [parkingLots]);

  // ============ 事件处理 ============
  /**
   * 处理停车场选择
   * 关闭底部弹出层后跳转到导航页
   */
  const handleParkingLotSelect = (parkingLot: (typeof parkingLots)[0]) => {
    console.log("选中的停车场:", parkingLot);
    sheetRef.current?.close();
    setTimeout(() => {
      navigate(`/navigation/${parkingLot.id}`);
    }, 200);
  };

  /**
   * 处理未完成记录快速跳转
   * 查找并选中与未完成记录同名的停车场
   */
  const handleUnfinishedRecord = () => {
    parkingLots.map((items) => {
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
            <Button
              variant={"secondary"}
              className="text-white"
              size={"xs"}
              onClick={() => aiSheetRef.current?.open()}
            >
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
          <Button
            className="rounded-xl bg-amber-500"
            onClick={() => aiSheetRef.current?.open()}
          >
            去试试
          </Button>
        </div>
      </div>

      {/* ============ 底部弹出层：停车场列表 ============ */}
      <BottomSheet
        ref={sheetRef}
        className="px-3 shadow-2xl"
        detents={["90%"]}
        grabberVisible
      >
        {/* 搜索输入框 */}
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

        {/* 停车场列表容器 */}
        <div className="mt-4 flex flex-col items-center gap-2 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* 默认展示：有预约记录的停车场 */}
          {!isSearching && (
            <>
              {defaultParkingLots.length > 0 && (
                <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden relative">
                  <div className="text-md font-bold px-2 border-b border-amber-500/20 text-orange-500 flex items-center py-2">
                    小哲同学推荐您
                  </div>
                  <img
                    src="/images/ai-man.png"
                    alt=""
                    className="w-16 h-16 absolute right-0 top-0"
                  />

                  {defaultParkingLots.map((lot) => (
                    <div
                      key={lot.id}
                      onClick={() => handleParkingLotSelect(lot)}
                      className="p-3 bg-white shadow-sm hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CircleParking className="w-5 h-5 text-muted-foreground" />
                        <div className="flex flex-col">
                          <div className="font-bold text-md flex items-center gap-2">
                            {lot.parking_lot_name}
                            <span className="text-xs text-white bg-primary p-0.5 px-2 rounded-full">
                              预约停车场
                            </span>
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
                  ))}
                </div>
              )}
              <div className="w-full mt-4">
                <h1 className="text-sm font-bold text-muted-foreground">
                  附近停车场
                </h1>
                {sortedParkingLots && sortedParkingLots.length > 0 && (
                  <div>
                    {Array.from({ length: Math.min(5, sortedParkingLots.length) }).map((_, index) => {
                      const lot = sortedParkingLots[index];
                      if (!lot) return null;
                      return (
                        <div
                          key={lot.id}
                          onClick={() => handleParkingLotSelect(lot)}
                          className="p-3 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
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
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 搜索结果 */}
          {isSearching && (
            <>
              <div className="w-full px-2 text-sm text-muted-foreground font-medium">
                搜索结果 ({searchResults.length})
              </div>
              {searchResults.length > 0 ? (
                searchResults.map((lot) => (
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
                  未找到匹配的停车场
                </div>
              )}
            </>
          )}
        </div>
      </BottomSheet>

      {/* AI Chat Sheet */}
      <AIChatSheet
        sheetRef={aiSheetRef}
        parkingLots={parkingLots}
        unfinishedRecords={unfinishedRecords}
        onSelect={handleParkingLotSelect}
      />
    </main>
  );
}
