import { MapComponent } from "@/components/map.container";
import { Button } from "@/components/ui/button";
import { Bell, Search, LogOut } from "lucide-react";
import { api, type ParkingLot, getToken, clearToken } from "@/lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

function App() {
  const navigate = useNavigate();
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAuthAndFetchData() {
      // 1. 检查是否登录
      const token = getToken();
      if (!token) {
        navigate("/auth");
        return;
      }

      try {
        // 2. 检查车牌号绑定状态
        const plateStatus = await api.usersVehiclePlate.status();
        if (!plateStatus.data.bound) {
          navigate("/bind-vehicle");
          return;
        }

        // 3. 获取停车场数据
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

        if (!cancelled) {
          setParkingLots(items);
          setIsCheckingAuth(false);
        }
      } catch (err) {
        console.error("Auth check or data fetch failed:", err);
        // 如果API调用失败（如token无效），跳转到登录页
        clearToken();
        navigate("/auth");
      }
    }

    void checkAuthAndFetchData();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    clearToken();
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
    <main className="w-full h-screen bg-muted overflow-auto px-8 pt-8">
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
        <MapComponent isTiles parkingLots={parkingLots} />
      </div>
      <div data-slot="card" className="w-full mt-3 grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl p-2 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-md font-bold">
              别克君威 28T{" "}
              <span className="bg-linear-to-br from-blue-500 to-blue-600 p-1 rounded-md text-white text-xs">
                白色
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">2025款</p>
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
            <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg text-xl font-bold tracking-wider border-2 border-white shadow-lg">
              黑C17813
            </div>
          </div>
        </div>
      </div>
      <Button className="mt-3 w-full bg-linear-to-br from-primary to-accent rounded-xl" size={"lg"}>停车预约</Button>
    </main>
  );
}

export default App;
