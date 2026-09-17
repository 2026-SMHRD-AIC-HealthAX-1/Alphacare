import { api } from "./axios";
import {
  SignupRequest,
  CheckDupResponse,
  LoginRequest,
  LoginResponse,
  FindIdRequest,
  FindPwRequest
} from "./user";

// 아이디 중복확인 API (GET /api/member/checkid?id=xxx)
export const checkDuplicateId = async (id: string): Promise<boolean> => {
  const response = await api.get<CheckDupResponse>(`/api/member/checkid`, {
    params: { id }
  });
  return response.data.isDuplicate; 
};

// 회원가입
export const signupUser = async (newUser: SignupRequest): Promise<string> => {
  const response = await api.post<string>("/api/signUp", newUser);
  return response.data;
};

// 로그인
export const loginUser = async (loginData: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/api/member/login", loginData);
  return response.data;
};

// 아이디 찾기
export const findID = async (findIdData : FindIdRequest) : Promise<string> =>{
  const response = await api.post<string>("/api/member/findId", findIdData);
  return response.data;
};

// 비밀번호 찾기
export const findPW = async (findPwData : FindPwRequest) : Promise<string> => {
  const response = await api.post<string>("/api/member/findPw", findPwData);
  return response.data;
};