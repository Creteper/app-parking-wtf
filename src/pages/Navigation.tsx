import { MapComponent, type MapHandle } from "@/components/map.container";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuthStore } from "@/stores";
import {
  api,
  type ParkingLot,
  type NavigationRouteResponse,
  type NavigationStep,
  type RouteData,
} from "@/lib/api";
import {
  ArrowLeft,
  Navigation2,
  ArrowRight,
  ArrowUp,
  CornerDownRight,
  CornerDownLeft,
  RefreshCw,
  RotateCcw,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// 起始点位置（用户提供的坐标）
const START_LOCATION: [number, number] = [45.872075, 126.504867];

// 起始点名称
const START_NAME = "哈尔滨建筑科技技术大学";

// action 中文映射
const actionTextMap: Record<string, string> = {
  右转: "右转",
  左转: "左转",
  左转调头: "左转调头",
  右转调头: "右转调头",
  直行: "直行",
  靠左: "靠左",
  靠右: "靠右",
  向左前方行驶: "向左前方行驶",
  向右前方行驶: "向右前方行驶",
  到达目的地: "到达目的地",
};

// 语音播报函数
const speak = (text: string): void => {
  if (!("speechSynthesis" in window)) {
    console.warn("浏览器不支持 Web Speech API");
    return;
  }

  // 取消之前的播报
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // window.speechSynthesis.speak(utterance);
};

// action 图标映射
const actionIcons: Record<string, React.ReactNode> = {
  右转: <CornerDownRight className="w-5 h-5" />,
  左转: <CornerDownLeft className="w-5 h-5" />,
  左转调头: <RotateCcw className="w-5 h-5" />,
  右转调头: <RefreshCw className="w-5 h-5" />,
  直行: <ArrowUp className="w-5 h-5" />,
  靠左: <ArrowLeft className="w-5 h-5" />,
  靠右: <ArrowRight className="w-5 h-5" />,
  到达: <Navigation2 className="w-5 h-5" />,
};

export default function NavigationPage() {
  const { parkingLotId } = useParams<{ parkingLotId: string }>();
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fullPath, setFullPath] = useState<[number, number][]>([]);

  const { checkAuthAndVehicle } = useAuthStore();
  const navigate = useNavigate();
  const mapRef = useRef<MapHandle>(null);

  // 数据获取完成后设置地图中心
  useEffect(() => {
    if (!isLoading && parkingLot && mapRef.current) {
      // 路线加载完成后，设置中心点为起始位置
      if (fullPath.length > 0) {
        console.log(START_LOCATION);
        mapRef.current.setCenter(START_LOCATION, 16);
      }
    }
  }, [isLoading, parkingLot, fullPath.length]);

  // 加载完成后播放语音
  useEffect(() => {
    if (!isLoading && parkingLot && currentStep) {
      const parkingName = parkingLot.parking_lot_name || "目的地";
      const actionText =
        actionTextMap[currentStep.action] || currentStep.action || "行驶";
      const distance = currentStep.distance || "未知";

      const speechText = `开始导航从，${START_NAME}出发，驶向${parkingName}。向${actionText}行驶${distance}米`;
      speak(speechText);
    }
  }, [isLoading, parkingLot, currentStep]);

  // 解析 polyline 字符串为 [lat, lng][] 数组
  const parsePolyline = useCallback((polyline: string): [number, number][] => {
    if (!polyline) return [];
    return polyline.split(";").map((coord) => {
      const parts = coord.split(",");
      if (parts.length < 2) return [0, 0] as [number, number];
      const lng = Number(parts[0]);
      const lat = Number(parts[1]);
      return [lat, lng] as [number, number];
    });
  }, []);

  // 获取内部的 route 数据（处理可能的嵌套）
  const getInnerRoute = (route: NavigationRouteResponse): RouteData | null => {
    const r = route.route;
    if (Array.isArray(r)) return r;
    if ("paths" in r) return r;
    if ("route" in r) return r.route as RouteData;
    return null;
  };

  // 获取完整路径
  const getFullPath = useCallback(
    (route: NavigationRouteResponse): [number, number][] => {
      const innerRoute = getInnerRoute(route);
      if (!innerRoute) return [];

      if (Array.isArray(innerRoute)) {
        return innerRoute.map((p) => [p.lat, p.lng] as [number, number]);
      }

      if (innerRoute.paths && Array.isArray(innerRoute.paths)) {
        const positions: [number, number][] = [];
        for (const path of innerRoute.paths) {
          if (path.steps) {
            for (const step of path.steps) {
              positions.push(...parsePolyline(step.polyline));
            }
          }
        }
        console.log("解析的路线坐标:", positions);
        return positions;
      }
      return [];
    },
    [parsePolyline],
  );

  // 获取第一个 step
  const getFirstStep = useCallback(
    (route: NavigationRouteResponse): NavigationStep | null => {
      const innerRoute = getInnerRoute(route);
      if (!innerRoute) return null;

      if (Array.isArray(innerRoute)) return null;

      if (innerRoute.paths && Array.isArray(innerRoute.paths)) {
        const paths = innerRoute.paths;
        if (paths.length === 0) return null;
        const firstPath = paths[0];
        if (!firstPath.steps || firstPath.steps.length === 0) return null;
        return firstPath.steps[0];
      }
      return null;
    },
    [],
  );

  // 初始路径 - 包含完整路径用于初始化
  const initialPaths = useMemo(() => {
    if (fullPath.length === 0) return [];
    return [
      {
        id: "navigation-route",
        positions: fullPath,
        color: "#3B82F6",
        weight: 6,
      },
    ];
  }, [fullPath]);

  // 数据获取
  useEffect(() => {
    let cancelled = false;

    async function checkAuthAndFetchData() {
      try {
        setIsLoading(true);

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

        if (!parkingLotId) {
          navigate("/parkings");
          return;
        }

        const [parkingLotRes, routeRes] = await Promise.all([
          api.parkingLots.get(Number(parkingLotId)),
          api.parkingLots.getRoute(Number(parkingLotId)),
        ]);

        if (cancelled) return;

        setParkingLot(parkingLotRes.data as ParkingLot);

        const firstNavStep = getFirstStep(routeRes.data);
        setCurrentStep(firstNavStep);

        const path = getFullPath(routeRes.data);
        setFullPath(path);
      } catch (err) {
        console.error("Data fetch failed:", err);
        if (!cancelled) {
          navigate("/auth");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void checkAuthAndFetchData();

    return () => {
      cancelled = true;
    };
  }, [navigate, checkAuthAndVehicle, parkingLotId, getFirstStep, getFullPath]);

  // 获取 action 图标
  const getActionIcon = (action: string): React.ReactNode => {
    return actionIcons[action] || <Navigation2 className="w-5 h-5" />;
  };

  return (
    <main className="w-full h-screen relative overflow-hidden">
      {/* 地图 */}
      <MapComponent
        isTiles
        ref={mapRef}
        showUserLocation
        customUserLocation={[45.872075, 126.504867]}
        parkingLots={parkingLot ? [parkingLot] : []}
        initialPaths={initialPaths}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-1000">
        <div className="">
          <div className="flex items-center px-4 py-3">
            <div className="ml-2 flex-1 min-w-0 bg-white rounded-full px-7 p-3 shadow-sm">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                前往{parkingLot?.parking_lot_name || "加载中..."}
              </h1>
              {parkingLot && (
                <p className="text-sm text-gray-500 truncate">
                  {parkingLot.cityname}
                  {parkingLot.adname}
                  {parkingLot.address}
                </p>
              )}
            </div>
          </div>

          {currentStep && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 bg-white rounded-full px-6 p-3 shadow-sm">
                <div className="p-2.5 bg-blue-500 text-white rounded-full shadow-sm">
                  {getActionIcon(currentStep.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    {currentStep.road && (
                      <span className="font-medium">{currentStep.road}</span>
                    )}
                    {currentStep.distance && (
                      <span>约{currentStep.distance}米</span>
                    )}
                    {currentStep.duration && (
                      <span>
                        约{Math.ceil(Number(currentStep.duration) / 60)}分钟
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-gray-900 text-sm leading-snug">
                    {currentStep.instruction || currentStep.action}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-1000 p-4 grid grid-cols-2 gap-4">
        <Button
          onClick={() => navigate("/parkings")}
          size="lg"
          variant={"destructive"}
          className="rounded-full h-14 text-md"
        >
          <ArrowLeft className="w-8 h-8" />
          退出导航
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-full h-14 text-md bg-green-500 hover:bg-green-500">我已到达</Button>
          </DialogTrigger>
          <DialogContent className="z-1005" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="text-xl">请确认您已到达</DialogTitle>
              <DialogDescription>
                确认到达后，<span className="text-amber-500 font-bold">小哲同学将为您规划最优的停车位</span>。
              </DialogDescription>
            </DialogHeader>
            <img src="/images/ai-man.png" className="h-25 w-25 absolute right-0 -top-10" alt="" />
            <DialogFooter className="flex-row justify-end">
              <DialogClose asChild>
                <Button variant={"ghost"} type="button" className="rounded-xl">取消</Button>
              </DialogClose>
              <Button onClick={() => navigate(`/joinParkNavigation/${parkingLotId}`)} className="rounded-xl">确认到达</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-2000">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-blue-500 animate-spin" />
            <div className="text-center">
              <p className="text-gray-700 font-medium">正在加载路线...</p>
              <p className="text-sm text-gray-500 mt-1">规划最优导航路径</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
