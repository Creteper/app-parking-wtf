import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { api, type ParkingLot, type AxiosError } from "@/lib/api";
import TitleBar from "@/components/title.bar";

const ParkingForm = () => {
  const navigate = useNavigate();
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    parking_lot_id: "",
    owner_phone: "",
  });

  const [arrivalTime, setArrivalTime] = useState<Date | undefined>();
  const [leaveTime, setLeaveTime] = useState<Date | undefined>();

  // 获取停车场列表和车牌信息
  useEffect(() => {
    async function fetchData() {
      try {
        // 获取停车场列表
        const lotsRes = await api.parkingLots.list({ pageSize: 100 });
        setParkingLots(lotsRes.data.data || []);

        // 获取用户车牌信息
        const plateRes = await api.usersVehiclePlate.status();
        if (plateRes.data.vehicle_plate) {
          setVehiclePlate(plateRes.data.vehicle_plate);
        }
      } catch (err) {
        console.error("数据获取失败:", err);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证日期时间是否已选择
    if (!arrivalTime) {
      setError("请选择到达时间");
      return;
    }
    if (!leaveTime) {
      setError("请选择离开时间");
      return;
    }

    setLoading(true);

    try {
      // 格式化日期时间为 ISO 字符串
      await api.parkingRecords.create({
        parking_lot_id: parseInt(formData.parking_lot_id),
        arrival_time: format(arrivalTime, "yyyy-MM-dd'T'HH:mm:ss"),
        leave_date: format(leaveTime, "yyyy-MM-dd'T'HH:mm:ss"),
        owner_phone: formData.owner_phone,
      });

      // 提交成功后返回首页
      navigate("/");
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || "提交失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-muted px-8 pt-8 pb-8">
      {/* 顶部导航栏 */}
      <TitleBar title="车位预约" />

      {/* 车辆信息展示 - 竖向排列 */}
      <div className="space-y-3 mb-6">
        {/* 车辆图片卡片 */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-bold">别克君威 28T</h2>
                <p className="text-sm text-muted-foreground">
                  2025款{" "}
                  <span className="bg-linear-to-br from-blue-500 to-blue-600 px-2 py-0.5 rounded-md text-white text-xs">
                    白色
                  </span>
                </p>
              </div>
              <div className="flex justify-start">
                <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-lg font-bold tracking-wider border-2 border-white shadow-lg">
                  {vehiclePlate || "未绑定"}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="">
            <img src="/images/car-photo.png" alt="车辆照片" className="" />
          </CardContent>
        </Card>
      </div>

      {/* 预约表单 */}
      <Card>
        <CardHeader>
          <CardTitle>填写预约信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 停车场选择 */}
            <div className="space-y-2">
              <Label htmlFor="parking_lot">
                选择停车场 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.parking_lot_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, parking_lot_id: value })
                }
              >
                <SelectTrigger id="parking_lot">
                  <SelectValue placeholder="请选择停车场" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {parkingLots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id.toString()}>
                      {lot.parking_lot_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 到达时间 */}
            <div className="space-y-2">
              <Label htmlFor="arrival_time">
                到达时间 <span className="text-red-500">*</span>
              </Label>
              <DateTimePicker
                date={arrivalTime}
                setDate={setArrivalTime}
                placeholder="选择到达日期和时间"
              />
            </div>

            {/* 离开时间 */}
            <div className="space-y-2">
              <Label htmlFor="leave_date">
                离开时间 <span className="text-red-500">*</span>
              </Label>
              <DateTimePicker
                date={leaveTime}
                setDate={setLeaveTime}
                placeholder="选择离开日期和时间"
              />
            </div>

            {/* 车主手机号 */}
            <div className="space-y-2">
              <Label htmlFor="owner_phone">
                车主手机号 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="owner_phone"
                type="tel"
                placeholder="请输入手机号"
                value={formData.owner_phone}
                onChange={(e) =>
                  setFormData({ ...formData, owner_phone: e.target.value })
                }
                required
                maxLength={11}
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="text-sm text-red-600 text-center">{error}</div>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={
                loading ||
                !formData.parking_lot_id ||
                !arrivalTime ||
                !leaveTime ||
                !formData.owner_phone
              }
            >
              {loading ? "提交中..." : "确认预约"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default ParkingForm;
