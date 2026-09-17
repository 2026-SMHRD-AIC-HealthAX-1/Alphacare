//회원가입 요청 데이터 인터페이스
export interface SignupRequest {
  id: string;
  pw: string;
  kakaoID?: string;
  name: string;
  tel: string;
  isDuplicate : boolean;
  loginFlag : boolean
}

//회원가입 응답
export interface SignupResponse {
  joinFlag : boolean;
  message? : string;
}

//아이디 중복확인 응답
export interface CheckDupResponse {
  isDuplicate : boolean;
}

//로그인 요청 데이터 인터페이스
export interface LoginRequest {
  id : string;
  pw : string;
  isDuplicate? : boolean;
  loginFlag? : boolean;
}

//로그인 응답
export interface LoginResponse {
  loginFlag : boolean;
  member_no : number;
}