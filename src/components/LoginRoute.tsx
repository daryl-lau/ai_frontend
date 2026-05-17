import { Navigate } from "react-router";
import useAuth from "@/hooks/useAuth";

const LoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default LoginRoute;
