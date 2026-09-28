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
  UpdateMemberResponse,
  MemberMileageResponse
} from "./user";

// 아이디 중복확인
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

// 회원정보 수정 (입력된 값만 반영)
export const updateMember = async (
  updateData: UpdateMemberRequest
): Promise<UpdateMemberResponse> => {
  const response = await api.put<UpdateMemberResponse>("/api/member/", updateData);
  return response.data;
};

// 보유 마일리지 조회
export const getMemberMileage = async (): Promise<MemberMileageResponse> => {
  const response = await api.get<MemberMileageResponse>("/api/member/mileage");
  return response.data;
};

// 마일리지 적립/사용 내역
export interface MileageHistoryItem {
  type: "EARN" | "USE";
  amount: number;
  reason: string;
  createdAt: string;
}

// 마일리지 적립/사용 내역 조회
export const getMileageHistory = async (): Promise<MileageHistoryItem[]> => {
  const response = await api.get<MileageHistoryItem[]>("/api/member/mileage/history");
  return response.data;
};

// 카카오 로그인/가입 결과 응답
export interface KakaoLoginResponse {
  status: "LOGIN" | "NEED_SIGNUP" | "ERROR";
  kakaoId: string | null;
  nickname: string | null;
  loginFlag: boolean;
  mileage?: number | null;
  message?: string;
}

// 카카오 인가코드로 로그인 시도 (기존 회원이면 로그인, 신규면 추가정보 입력 필요 응답)
export const kakaoLogin = async (code: string): Promise<KakaoLoginResponse> => {
  const response = await api.post<KakaoLoginResponse>("/api/member/kakao/login", { code });
  return response.data;
};

// 카카오 최초 가입 완료 (전화번호 없이 바로 가입)
export const kakaoSignup = async (data: {
  kakaoId: string;
  nickname: string | null;
}): Promise<KakaoLoginResponse> => {
  const response = await api.post<KakaoLoginResponse>("/api/member/kakao/signup", data);
  return response.data;
};
