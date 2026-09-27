// 회원가입 요청
export interface SignupRequest {
  id: string;
  pw: string;
  kakaoID?: string;
  name: string;
  tel: string;
  isDuplicate : boolean;
  loginFlag : boolean
}

// 회원가입 응답
export interface SignupResponse {
  joinFlag : boolean;
  message? : string;
}

// 아이디 중복확인 응답
export interface CheckDupResponse {
  isDuplicate : boolean;
}

// 로그인 요청
export interface LoginRequest {
  id : string;
  pw : string;
  isDuplicate? : boolean;
  loginFlag? : boolean;
}

// 로그인 응답
export interface LoginResponse {
  loginFlag : boolean;
  mileage? : number | null;
}

// 아이디 찾기
export interface FindIdRequest {
  name : string;
  tel : string;
}

export interface FindIdResponse {
  id : string | null;
  message? : string;
}

// 비밀번호 찾기
export interface FindPwRequest {
  id : string;
  tel : string;
}

export interface FindPwResponse {
  pw : string | null;
  message? : string;
}

// 회원정보 수정
export interface UpdateMemberRequest {
  pw? : string;
  tel? : string;
}

export interface UpdateMemberResponse {
  message? : string;
}

// 보유 마일리지 조회 응답
export interface MemberMileageResponse {
  mileage : number | null;
  message? : string;
  success? : boolean;
}