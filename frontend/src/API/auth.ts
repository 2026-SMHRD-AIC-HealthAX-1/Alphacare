// 회원가입, 로그인, 아이디/비밀번호 찾기
//중요한 데이터 or 보안이 중요한 데이터는 Post방식
import { api } from "./axios";
import {
  SignupRequest,
  SignupResponse,
  CheckDupResponse,
  LoginRequest,
  LoginResponse,
  MemberInfo,
} from "./user";

// 1. 아이디 중복 확인 (memberDup)
export const checkDuplicateId = async (userId: string): Promise<boolean> => {
  const response = await api.get<CheckDupResponse>("/api/member/checkid", {
    params: { id: userId },
  });
  return response.data.isDuplicate; // true: 중복, false: 사용가능
};
// 2. 회원가입 (setMember)
export const signupUser = async (newUser: SignupRequest): Promise<SignupResponse> => {
  const response = await api.post<SignupResponse>("/api/member/signup", newUser);
  return response.data;
};
// 3. 로그인 (memberLogin)
export const loginUser = async (loginData: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/api/member/login", loginData);
  return response.data;
};
// 4. 회원 정보 조회 (getMember)
export const getMemberInfo = async (memberNo: number): Promise<MemberInfo> => {
  const response = await api.get<MemberInfo>(`/api/member/${memberNo}`);
  return response.data;
};