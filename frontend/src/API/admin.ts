// 관리자 페이지 전용 API (역할 확인, 회원 목록, 서버 상태)
import { api } from "./axios";

export interface AdminMember {
  memberNo: number;
  id: string;
  name: string;
  phone: string;
  role: string;
  mileage: number;
}

export interface ServerStatus {
  backendUp: boolean;
  dbUp: boolean;
}

// 현재 세션의 역할 조회 (비로그인 시 GUEST)
export const getMyRole = async (): Promise<string> => {
  const response = await api.get<{ role: string }>("/api/admin/role");
  return response.data.role;
};

// 회원 목록 조회 (관리자 전용)
export const getMembers = async (): Promise<AdminMember[]> => {
  const response = await api.get<AdminMember[]>("/api/admin/members");
  return response.data;
};

// 회원 정보 수정 (관리자 전용 - 역할/마일리지만 변경 가능)
export const updateAdminMember = async (
  memberNo: number,
  updates: { role?: string; mileage?: number }
): Promise<AdminMember> => {
  const response = await api.put<AdminMember>(`/api/admin/members/${memberNo}`, updates);
  return response.data;
};

// 백엔드 / DB 상태 조회
export const getServerStatus = async (): Promise<ServerStatus> => {
  const response = await api.get<ServerStatus>("/api/admin/status");
  return response.data;
};
