import { useNavigate, useParams } from "react-router";
import { useParkingLotsStore } from "@/stores";
import { useEffect, useState, useRef } from "react";
import TitleBar from "@/components/title.bar";
import { Button } from "@/components/ui/button";
import { INFRARED_WEBSOCKET_URL } from "@/lib/env";

export default function JoinParkNavigationPage() {
  const { parkingLots, fetchParkingLots } = useParkingLotsStore();
  const { parkingLotId } = useParams();
  const navigate = useNavigate();

  // 停车位状态：1表示有车，0表示无车
  const [parkingSpotStatus, setParkingSpotStatus] = useState<number>(0);
  // WebSocket 连接状态
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // WebSocket 引用
  const wsRef = useRef<WebSocket | null>(null);

  const [parkingLotName, setParkingLotName] = useState<string>("");

  // 拖动相关状态
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // WebSocket 连接
  useEffect(() => {
    if (!INFRARED_WEBSOCKET_URL) {
      console.error("WebSocket URL 未配置");
      return;
    }

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(INFRARED_WEBSOCKET_URL);

        ws.onopen = () => {
          console.log("WebSocket 连接成功");
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          const data = event.data.trim();
          console.log("收到 WebSocket 消息:", data);

          // 解析消息，只接受 "0" 或 "1"
          if (data === "1" || data === "0") {
            setParkingSpotStatus(parseInt(data, 10));
          } else {
            console.warn("收到未知的 WebSocket 消息:", data);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket 错误:", error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log("WebSocket 连接关闭");
          setIsConnected(false);

          // 5秒后尝试重连
          setTimeout(() => {
            console.log("尝试重新连接 WebSocket...");
            connectWebSocket();
          }, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error("WebSocket 连接失败:", error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // 清理函数：组件卸载时关闭 WebSocket
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function fetchParkingLotName() {
      await fetchParkingLots();
    }
    fetchParkingLotName();
  }, [fetchParkingLots]);

  useEffect(() => {
    setParkingLotName(
      parkingLots.find((lot) => lot.id === parseInt(parkingLotId!, 10))
        ?.parking_lot_name ?? "",
    );
  }, [parkingLots, parkingLotId]);

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 处理鼠标开始拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // 处理鼠标移动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // 处理鼠标抬起
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 根据状态选择图片
  const parkingSpotImage =
    parkingSpotStatus === 1 ? "/parking/1-1.png" : "/parking/0-1.png";

  return (
    <div className="w-full h-screen bg-muted">
      <TitleBar
        className="px-6 py-2 text-md mb-0 shadow-sm bg-white rounded-full left-4 top-4 absolute z-10"
        title={`${parkingLotName}`}
      />

      {/* WebSocket 连接状态指示器 */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className="text-xs font-medium">
          {isConnected ? "已连接" : "未连接"}
        </span>
      </div>

      <div className="absolute left-4 right-4 top-20 z-999 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-2">
          <div className="bg-primary h-2 w-2 rounded-full" />
          <span className="text-xs font-medium text-primary">您的停车位</span>
        </div>
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-xl p-2">
          <div className="bg-white h-2 w-2 rounded-full" />
          <span className="text-xs font-medium text-white">已占用停车位</span>
        </div>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-2">
          <div className="bg-amber-500 h-2 w-2 rounded-full" />
          <span className="text-xs font-medium text-amber-500">已预约车位</span>
        </div>
      </div>

      {/* 停车场图片容器 */}
      <div
        className="h-screen w-screen overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 可拖动的停车位图片 */}
        <div
          className={`absolute ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease",
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={parkingSpotImage}
            alt="停车位"
            className="w-auto h-auto max-w-none select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* 小哲同学提示框 */}
      <div className="fixed bottom-25 left-5 right-5 p-4 bg-amber-100/80 backdrop-blur-sm rounded-xl border-amber-600 border z-10">
        <img
          src="/images/ai-man.png"
          alt=""
          className="w-25 h-25 absolute -top-20 left-0"
        />
        <h1 className="text-amber-500 font-bold text-md">
          小哲同学已为您生成最佳停车位
        </h1>
      </div>

      {/* 完成按钮 */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/60 backdrop-blur-sm z-10">
        <Button
          className="w-full rounded-full h-14 text-md"
          onClick={() => navigate("/parkings")}
        >
          完成
        </Button>
      </footer>
    </div>
  );
}
