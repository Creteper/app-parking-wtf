import { MapComponent } from "@/components/map.container";
import { Button } from "@/components/ui/button";
import { Bell, Search, LogOut, Trash, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useRef } from "react";
import BottomSheet, { type BottomSheetRef } from "@wldyslw/react-bottom-sheet";
import { Card, CardContent, CardTitle } from "./components/ui/card";
import dayjs from "dayjs";
import {
  useAuthStore,
  useParkingLotsStore,
  useParkingRecordsStore,
} from "@/stores";

function App() {
  const navigate = useNavigate();
  const sheetRef = useRef<BottomSheetRef>(null);

  // 使用 Zustand stores
  const { isCheckingAuth, checkAuthAndVehicle, logout } = useAuthStore();
  const { parkingLots, fetchParkingLots } = useParkingLotsStore();
  const { parkingRecords, fetchParkingRecords } = useParkingRecordsStore();

  useEffect(() => {
    let cancelled = false;

    async function checkAuthAndFetchData() {
      try {
        // 1. 检查认证和车辆绑定状态
        const { isAuthenticated, isVehicleBound } =
          await checkAuthAndVehicle();

        if (cancelled) return;

        if (!isAuthenticated) {
          navigate("/auth");
          return;
        }

        if (!isVehicleBound) {
          navigate("/bind-vehicle");
          return;
        }

        // 2. 获取停车场数据和停车记录
        await Promise.all([fetchParkingLots(), fetchParkingRecords()]);
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
  }, [navigate, checkAuthAndVehicle, fetchParkingLots, fetchParkingRecords]);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (isCheckingAuth) {
    return (
      <div className="w-full h-screen bg-muted flex items-center justify-center">
        <p className="text-lg">加载中...</p>
      </div>
    );
  }

  return (
    <main className="w-full h-[calc(100vh-6.6rem)] bg-muted overflow-y-scroll px-8 pt-8 pb-4">
      <header
        data-slot="titlebar"
        className="flex items-center gap-2 justify-between"
      >
        <div className="flex items-center gap-2">
          <img src="/images/pakingPhoto.png" alt="logo" className="w-10 h-10" />
          <h1 className="text-xl font-bold">智慧停车</h1>
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
          <Button
            variant={"secondary"}
            size={"icon"}
            className="bg-background rounded-full shadow-sm"
            onClick={handleLogout}
            title="退出登录"
          >
            <LogOut />
          </Button>
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border-2 border-white">
            <img
              src="/images/avatar.jpg"
              alt="用户头像"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>
      <div
        data-slot="map-container"
        className="w-full h-64 rounded-xl overflow-hidden mt-6 shadow-sm border-white border-4"
      >
        <MapComponent isTiles parkingLots={parkingLots} showUserLocation />
      </div>
      <Button
        onClick={() => navigate("/parkings")}
        className="w-full mt-3 bg-linear-to-br from-blue-400 to-blue-600 rounded-xl h-12"
      >
        前往停车场
      </Button>
      <div data-slot="card" className="w-full mt-3 grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl p-2 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-md font-bold">别克君威 28T</h1>
            <p className="text-xs text-muted-foreground">
              2025款{" "}
              <span className="bg-linear-to-br from-blue-500 to-blue-600 p-1 rounded-md text-white text-xs">
                白色
              </span>
            </p>
          </div>
          <img src="./images/car-photo.png" alt="" />
        </div>
        <div className="bg-white rounded-xl p-2 flex flex-col items-center gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-md font-bold">绑定车牌号</h1>
            <p className="text-xs text-muted-foreground">
              在这里查看你绑定的车牌号
            </p>
          </div>
          <div className="flex justify-center mt-1">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg text-md font-bold tracking-wider border-2 border-white shadow-lg">
              黑C17813
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col gap-4">
        <div className="bg-white rounded-xl p-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">预约记录</h1>
          <Button onClick={() => navigate("/parkingRecords")} variant={"link"} className="text-sm text-muted-foreground">
            查看全部
          </Button>
        </div>
        <div className="flex flex-col gap-4 select-none">
          {parkingRecords ? (
            parkingRecords.map((record) => (
              <div
                key={record.id}
                className="gap-2 bg-white rounded-xl p-4 relative"
              >
                <div className=" flex flex-col gap-2">
                  <h1 className="text-lg font-bold">
                    {record.parking_lot_name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary rounded-xl p-2 text-white">
                      {dayjs(record.arrival_time).format("HH:MM")}
                    </div>
                    <span>-</span>
                    <div className="bg-primary rounded-xl p-2 text-white">
                      {dayjs(record.leave_date).format("HH:MM")}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {dayjs(record.arrival_time).format("YYYY-MM-DD")} -{" "}
                    {dayjs(record.leave_date).format("YYYY-MM-DD")}{" "}
                  </div>
                </div>
                <div className="bg-primary rounded-r-xl w-10 h-full p-2 text-white absolute right-0 bottom-0 top-0 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center">
              暂无预约记录
            </div>
          )}
        </div>
      </div>
      <BottomSheet
        className="px-3 shadow-2xl"
        detents={["12%", "30%"]}
        grabberVisible
        largestUndimmedDetentIndex={2}
        ref={sheetRef}
        permanent
      >
        <div className="h-full w-full overflow-hidden flex flex-col gap-4">
          <Button
            onClick={() => navigate("/parkingForm")}
            className="mt-3 w-full bg-linear-to-br from-primary to-accent rounded-xl h-12"
          >
            停车预约
          </Button>
          <Card>
            <CardTitle className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <img src="./images/tips.svg" className="h-8 w-8" />
                <h1 className="text-xl font-bold">停车小贴士</h1>
              </div>
              <p className="text-sm text-muted-foreground">更新于3小时前</p>
            </CardTitle>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                工作日8：00 - 10：00，17：00 -
                19：00为停车高峰，建议错峰出行或提前预约车位。
              </p>
            </CardContent>
          </Card>
        </div>
      </BottomSheet>
    </main>
  );
}

export default App;
