import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { AxiosError } from "@/lib/api";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // 登录
        const response = await api.auth.login({ username, password });
        if (response.data.token) {
          // 登录成功后，跳转到首页进行进一步验证
          navigate("/");
        }
      } else {
        // 注册
        await api.auth.register({ username, password });
        // 注册成功后自动切换到登录
        setIsLogin(true);
        setPassword("");
        setError("注册成功，请登录");
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || "操作失败";
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
            {isLogin ? "登录" : "注册"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "登录到智慧停车系统" : "创建一个新账户"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className={`text-sm ${error.includes("成功") ? "text-green-600" : "text-red-600"}`}>
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "处理中..." : isLogin ? "登录" : "注册"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? (
              <>
                还没有账户？{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError("");
                  }}
                  className="text-primary hover:underline"
                >
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账户？{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError("");
                  }}
                  className="text-primary hover:underline"
                >
                  返回登录
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
