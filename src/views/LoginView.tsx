import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ACCESS_TOKEN_KEY } from "@/constants";
import { authApi } from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";

function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuthenticated } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const sendCode = async () => {
    if (countdown > 0) return;

    if (!/^1\d{10}$/.test(phone)) {
      setMessage("请输入正确的手机号");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const res = await authApi.send_sms({ phone });
      if (res?.code === 200) {
        setCountdown(60);
      } else {
        setMessage(res?.msg || "获取验证码失败");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "获取验证码失败";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!/^1\d{10}$/.test(phone) || !/^\d{6}$/.test(code)) {
      setMessage("请输入正确的手机号和验证码");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const res = await authApi.login({ phone, code });
      if (res?.code === 200) {
        const { access_token } = res?.data || {};
        if (!access_token) {
          throw new Error("未获取到 token");
        }
        localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
        // 更新认证状态
        setAuthenticated();
        // 使用 location.state 中的 from（来自 ProtectedRoute 重定向）
        const returnPath = location.state?.from?.pathname || "/";
        // 跳转到原页面
        navigate(returnPath, { replace: true });
      } else {
        setMessage(res?.msg || "登录失败");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "登录失败";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen w-full bg-linear-to-br from-slate-100 via-white to-sky-100 flex items-center justify-center px-4">
      <div className=" ">
        <div className="flex justify-center mb-6 text-[28px] text-primary">Deeps.cn</div>
        <div className="flex w-82">
          <div className="space-y-4 w-full">
            <div>
              <div className="focus-within:border-primary flex px-4 py-2.5 border border-gray-300 rounded-4xl">
                <span className="text-sm">+86</span>
                <input
                  className="w-full ml-2 border-none outline-none placeholder-gray-300 text-sm "
                  placeholder="请输入 11 位手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.trim())}
                />
              </div>
            </div>

            <div>
              <div className="group mt-1 flex gap-2">
                <div className="focus-within:border-primary w-full flex justify-between px-4 py-2.5 border border-gray-300 rounded-4xl ">
                  <input
                    className=" border-none outline-none placeholder-gray-300 text-sm "
                    placeholder="请输入验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                  />
                  <button
                    type="button"
                    className="text-sm select-none flex items-center bg-transparent border-none cursor-pointer disabled:cursor-not-allowed"
                    onClick={sendCode}
                    disabled={loading || countdown > 0}
                  >
                    <span className="w-px h-4 block bg-gray-300 mr-2"></span>
                    {countdown > 0 ? (
                      <span className="text-gray-300">{`${countdown}s后可重新获取`}</span>
                    ) : (
                      <span className="text-primary hover:text-primary/80">获取验证码</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-4xl bg-primary hover:bg-primary/80 py-2.5 text-white cursor-pointer"
            >
              {loading ? "处理中..." : "登录"}
            </button>

            <div className="pl-3 h-10">{message ? <p className="text-sm text-red-400">{message}</p> : null}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginView;
