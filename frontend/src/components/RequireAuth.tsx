import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

// 비로그인 사용자의 보호 페이지 접근 차단 (isLoggedIn 쿠키 기준)
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = Cookies.get("isLoggedIn") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
