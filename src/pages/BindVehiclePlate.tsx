import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/lib/api";
import type { AxiosError } from "@/lib/api";
import { vehiclePlateRegions } from "@/lib/vehiclePlateData";

export default function BindVehiclePlate() {
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 省份选项
  const provinceOptions = useMemo(() => {
    return vehiclePlateRegions.map((region) => ({
      value: region.code,
      label: `${region.province} (${region.code})`,
    }));
  }, []);

  // 根据选择的省份获取城市列表
  const cityOptions = useMemo(() => {
    if (!selectedProvince) return [];

    const province = vehiclePlateRegions.find((r) => r.code === selectedProvince);
    if (!province) return [];

    return province.cities.map((city) => ({
      value: `${province.code}${city.letter}`,
      label: `${city.name} (${city.letter})`,
      cityLetter: city.letter,
    }));
  }, [selectedProvince]);

  // 当省份改变时，重置城市选择
  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedCity("");
  };

  // 生成预览车牌号
  const previewPlate = useMemo(() => {
    if (!selectedCity) return "";
    if (!plateNumber) return selectedCity;
    return `${selectedCity}${plateNumber}`;
  }, [selectedCity, plateNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedProvince) {
      setError("请选择省份");
      return;
    }

    if (!selectedCity) {
      setError("请选择城市");
      return;
    }

    if (plateNumber.length !== 5) {
      setError("请输入完整的5位车牌号码");
      return;
    }

    setLoading(true);

    try {
      const fullPlate = `${selectedCity}${plateNumber}`;
      await api.usersVehiclePlate.bind({ vehicle_plate: fullPlate });
      // 绑定成功后跳转到首页
      navigate("/");
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || "绑定失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full h-screen bg-muted flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            绑定车牌号
          </CardTitle>
          <CardDescription className="text-center">
            请选择省份、城市并输入您的车牌号以继续使用系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 省份选择 */}
            <div className="space-y-2">
              <Label htmlFor="province">选择省份</Label>
              <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                <SelectTrigger id="province">
                  <SelectValue placeholder="请选择省份" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {provinceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 城市选择和车牌号输入在同一行 */}
            <div className="space-y-2">
              <Label>选择城市并输入车牌号码</Label>
              <div className="flex items-center gap-2">
                {/* 城市选择 */}
                <Select
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                  disabled={!selectedProvince}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择城市" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {cityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 车牌号输入 */}
                <InputOTP
                  maxLength={5}
                  value={plateNumber}
                  onChange={(value) => setPlateNumber(value.toUpperCase())}
                  disabled={!selectedCity}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-muted-foreground">
                先选择省份，再选择城市，最后输入5位车牌号码
              </p>
            </div>

            {/* 预览 */}
            {previewPlate && (
              <div className="space-y-2">
                <Label>车牌预览</Label>
                <div className="flex justify-center">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg text-2xl font-bold tracking-wider border-2 border-white shadow-lg">
                    {previewPlate}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !selectedProvince || !selectedCity || plateNumber.length !== 5}
            >
              {loading ? "绑定中..." : "确认绑定"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
