import { api } from "./axios";
import {
  SignupRequest,
  SignupResponse,
  CheckDupResponse,
  LoginRequest,
  LoginResponse,
  FindIdRequest,
  FindPwRequest,
  FindIdResponse,
  FindPwResponse,
  UpdateMemberRequest,
  UpdateMemberResponse
} from "./user";

// 아이디 중복확인 API (GET /api/member/checkid?id=xxx)
export const checkDuplicateId = async (id: string): Promise<boolean> => {
  const response = await api.get<CheckDupResponse>(`/api/member/checkid`, {
    params: { id }
  });
  return response.data.isDuplicate; 
};

// 회원가입
export const signupUser = async (newUser: SignupRequest): Promise<SignupResponse> => {
  const response = await api.post<SignupResponse>("/api/member/signup", newUser);
  return response.data;
};

// 로그인
export const loginUser = async (loginData: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/api/member/login", loginData);
  return response.data;
};

// 아이디 찾기
export const findID = async (findIdData : FindIdRequest) : Promise<FindIdResponse> =>{
  const response = await api.get<FindIdResponse>("/api/member/findId", {
    params : {name : findIdData.name, phone : findIdData.tel}
  });
  return response.data;
};

// 비밀번호 찾기
export const findPW = async (findPwData: FindPwRequest): Promise<FindPwResponse> => {
  const response = await api.post<FindPwResponse>("/api/member/findPw", findPwData);
  return response.data;
};

export const logout = async () : Promise<void> => {
  await api.post("/api/member/logout");
};

// 회원정보 수정 (비밀번호, 전화번호 - 값이 있는 필드만 서버에서 반영)
export const updateMember = async (
  updateData: UpdateMemberRequest
): Promise<UpdateMemberResponse> => {
  const response = await api.put<UpdateMemberResponse>("/api/member/", updateData);
  return response.data;
};
