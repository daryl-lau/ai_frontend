import { ACCESS_TOKEN_KEY } from "@/constants";

const useAuth = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const isAuthenticated = !!token;
  return { isAuthenticated };
};

export default useAuth;
