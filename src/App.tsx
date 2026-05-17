import { useEffect } from "react";
import type { FC } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { REDIRECT_TO_LOGIN_EVENT, ACCESS_TOKEN_KEY } from "@/constants";
import { authApi } from "@/api/auth.ts";
import { useUserStore } from "@/store/index.tsx";
import { useQuery } from "@tanstack/react-query";
import "./assets/index.css";

const App: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setUserInfo = useUserStore((s: any) => s.setUserInfo);

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const { data } = useQuery({
    queryKey: ["currentUser"],
    enabled: !!token,
    queryFn: async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        return null;
      }
      const res = await authApi.current();
      return res?.data?.user ?? null;
    },
  });

  useEffect(() => {
    setUserInfo({ userInfo: data || null, isInitializing: false });
  }, [data]);

  useEffect(() => {
    const handleRedirectToLogin = () => {
      navigate("/login", { replace: true, state: { from: location } });
    };

    window.addEventListener(REDIRECT_TO_LOGIN_EVENT, handleRedirectToLogin);
    return () => window.removeEventListener(REDIRECT_TO_LOGIN_EVENT, handleRedirectToLogin);
  }, [navigate]);

  return (
    <main className="w-full h-screen overflow-hidden">
      <Outlet />
    </main>
  );
};

export default App;
