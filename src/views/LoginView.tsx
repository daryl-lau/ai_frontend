import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router";
import { ACCESS_TOKEN_KEY, LOGIN_FROM_PATH } from "@/constants";
import { authApi } from "@/api/auth";
import useAuth from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import cn from "classnames";
import githubIcon from "@/assets/imgs/github.svg";
import googleIcon from "@/assets/imgs/google.svg";

function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      const returnPath = location.state?.from?.pathname || sessionStorage.getItem(LOGIN_FROM_PATH) || "/";
      navigate(returnPath, { replace: true });
    }
  }, [isAuthenticated]);

  const from = location.state?.from?.pathname;
  if (from) {
    sessionStorage.setItem(LOGIN_FROM_PATH, from);
  }

  const onLoginSuccess = (accessToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    const returnPath = location.state?.from?.pathname || sessionStorage.getItem(LOGIN_FROM_PATH) || "/";
    navigate(returnPath, { replace: true });
  };

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
      const res = await authApi.sendSMS({ phone });
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
      const res = await authApi.smsLogin({ phone, code });
      if (res?.code === 200) {
        const { access_token } = res?.data || {};
        if (!access_token) {
          throw new Error("未获取到 token");
        }
        onLoginSuccess(access_token);
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

  const { data, isEnabled } = useQuery({
    queryKey: ["getToken"],
    enabled: searchParams.get("oauth") == "success",
    queryFn: async () => {
      const res = await authApi.token();
      return res?.data ?? null;
    },
  });

  useEffect(() => {
    if (isEnabled && data?.access_token) {
      onLoginSuccess(data?.access_token);
    }
  }, [data, isEnabled]);

  const handleGithubLogin = async () => {
    try {
      setMessage("");
      const res = await authApi.githubLogin();
      if (res?.code !== 200 || !res?.data?.authorization_url) {
        setMessage(res?.msg || "无法发起 GitHub 登录");
        return;
      }
      window.location.assign(res.data.authorization_url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "无法发起 GitHub 登录";
      setMessage(errorMessage);
    }
  };

  return (
    <section
      className={cn(
        "min-h-screen w-full bg-linear-to-br from-slate-100 via-white",
        "to-sky-100 flex pt-40 justify-center px-4",
      )}
    >
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
                <div
                  className={cn(
                    "focus-within:border-primary w-full flex justify-between",
                    "px-4 py-2.5 border border-gray-300 rounded-4xl",
                  )}
                >
                  <input
                    className=" border-none outline-none placeholder-gray-300 text-sm w-40"
                    placeholder="请输入验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                  />
                  <button
                    type="button"
                    className={cn(
                      "text-sm select-none flex items-center bg-transparent",
                      "border-none cursor-pointer disabled:cursor-not-allowed",
                    )}
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
              className="w-full h-10.5 rounded-4xl bg-primary hover:bg-primary/80 py-2 text-white cursor-pointer"
            >
              {loading ? "请稍等..." : "登录"}
            </button>
            <div className="pl-3 h-5">{message ? <p className="text-sm text-red-400">{message}</p> : null}</div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="w-full border-b border-gray-300 ml-2"></div>
              <div className="w-30 flex justify-center">或者</div>
              <div className="w-full border-b border-gray-300 mr-2"></div>
            </div>
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={loading}
              className={cn(
                "w-full rounded-4xl border border-slate-300 bg-white hover:bg-slate-50 py-2.5",
                "text-slate-800 cursor-pointer flex items-center pl-[25%] h-10.5",
              )}
            >
              <img className="mr-3" src={githubIcon} alt="" />
              <span className="">使用 GitHub 登录</span>
            </button>
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={loading}
              className={cn(
                "w-full rounded-4xl border border-slate-300 bg-white hover:bg-slate-50 py-2.5",
                "text-slate-800 cursor-pointer flex items-center pl-[25%] h-10.5",
              )}
            >
              <img className="mr-3 w-5 h-5" src={googleIcon} alt="" />
              <span>使用 Google 登录</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginView;
