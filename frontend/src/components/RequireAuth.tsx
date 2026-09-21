import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

// 로그인 안 한 사용자가 /MyPage 같은 보호된 페이지에 주소창으로 직접 들어오는 것을 막는 라우트 가드
// Header.tsx와 동일하게 isLoggedIn 쿠키로 로그인 여부를 판단함
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = Cookies.get("isLoggedIn") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
