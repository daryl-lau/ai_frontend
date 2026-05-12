import { Navigate } from "react-router";
import { useUserStore } from "@/store";

const LoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userInfo = useUserStore((s: any) => s.userInfo);
  const isInitializing = useUserStore((s: any) => s.isInitializing);

  if (isInitializing) {
    return <></>;
  }

  if (userInfo && userInfo.userid) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default LoginRoute;
