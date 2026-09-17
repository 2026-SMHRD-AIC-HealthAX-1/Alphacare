import { api } from "./axios";
import {
  SignupRequest,
  CheckDupResponse,
  LoginRequest,
  LoginResponse,
} from "./user";

// 아이디 중복확인 API (GET /api/member/checkid?id=xxx)
export const checkDuplicateId = async (id: string): Promise<boolean> => {
  const response = await api.get<CheckDupResponse>(`/api/member/checkid`, {
    params: { id }
  });
  // 백엔드 MemberDto의 isDuplicate 필드값 반환
  return response.data.isDuplicate; 
};

// 회원가입 (setMember)
export const signupUser = async (newUser: SignupRequest): Promise<string> => {
  const response = await api.post<string>("/api/signUp", newUser);
  return response.data;
};

// 로그인 (memberLogin)
export const loginUser = async (loginData: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/api/member/login", loginData);
  return response.data;
};