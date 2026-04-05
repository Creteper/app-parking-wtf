import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, MapPin, Clock, User } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAuthStore,
  useFinishedParkingRecordsStore,
  useUnfinishedParkingRecordsStore,
} from "@/stores";
import type { ParkingRecord } from "@/lib/api";
import TitleBar from "@/components/title.bar";

/**
 * 预约记录页面
 * 功能：
 * - 使用 Tabs 切换已完成和未完成的预约记录
 * - 显示预约记录的详细信息
 * - 支持查看停车场位置
 */
export default function ParkingRecordsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("unfinished");

  // Zustand stores
  const { checkAuthAndVehicle } = useAuthStore();
  const { parkingRecords: unfinishedRecords, fetchUnfinishedParkingRecords } =
    useUnfinishedParkingRecordsStore();
  const { parkingRecords: finishedRecords, fetchFinishedParkingRecords } =
    useFinishedParkingRecordsStore();

  // 初始化：检查认证并获取数据
  useEffect(() => {
    let cancelled = false;

    async function checkAuthAndFetchData() {
      try {
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

        // 获取已完成和未完成的预约记录
        await Promise.all([
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
    fetchUnfinishedParkingRecords,
    fetchFinishedParkingRecords,
  ]);

  // 渲染单个预约记录卡片
  const renderRecordCard = (record: ParkingRecord) => (
    <Card key={record.id} className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span>{record.parking_lot_name || "未知停车场"}</span>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              record.status === "已完成"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {record.status || "未完成"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>到达时间：</span>
          <span className="font-medium text-foreground">
            {record.arrival_time
              ? dayjs(record.arrival_time).format("YYYY-MM-DD HH:mm")
              : "未设置"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>离开时间：</span>
          <span className="font-medium text-foreground">
            {record.leave_date
              ? dayjs(record.leave_date).format("YYYY-MM-DD HH:mm")
              : "未设置"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>车牌号：</span>
          <span className="font-medium text-foreground">
            {record.vehicle_plate || "未设置"}
          </span>
        </div>
        {record.owner_phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>联系电话：</span>
            <span className="font-medium text-foreground">
              {record.owner_phone}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <main className="w-full min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <TitleBar className="p-6 mb-0" title="预约记录" />

      {/* 主内容区域 */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unfinished">
              未完成 ({unfinishedRecords.length})
            </TabsTrigger>
            <TabsTrigger value="finished">
              已完成 ({finishedRecords.length})
            </TabsTrigger>
          </TabsList>

          {/* 未完成的预约 */}
          <TabsContent value="unfinished" className="mt-4">
            {unfinishedRecords.length > 0 ? (
              <div>
                {unfinishedRecords.map((record) => renderRecordCard(record))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm">
                  暂无未完成的预约记录
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate("/parkingForm")}
                >
                  去预约停车位
                </Button>
              </div>
            )}
          </TabsContent>

          {/* 已完成的预约 */}
          <TabsContent value="finished" className="mt-4">
            {finishedRecords.length > 0 ? (
              <div>
                {finishedRecords.map((record) => renderRecordCard(record))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm">
                  暂无已完成的预约记录
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
