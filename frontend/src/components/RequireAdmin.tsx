import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMyRole } from "../API/admin";

// 관리자(ADMIN) 역할이 아니면 관리자 페이지 접근 차단
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    getMyRole().then(setRole).catch(() => setRole("GUEST"));
  }, []);

  if (role === null) return null;
  if (role !== "ADMIN") return <Navigate to="/" replace />;

  return <>{children}</>;
}
