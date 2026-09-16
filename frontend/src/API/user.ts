//회원가입 요청 데이터 인터페이스
export interface SignupRequest {
  id: string;         // 사용자 아이디
  kakaoID: string;     // 카카오 연동 아이디
  pw: string;         // 비밀번호
  name: string;       // 이름
  phone: string;        // 휴대폰 번호
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
}

//로그인 응답
export interface LoginResponse {
  loginFlag : boolean;
  member_no : number;
}

export interface MemberInfo {
  memberNo : number;
  id : string;
  name : string;
  phone: string;
  sns? : string;
  role: string;
  mileage:number;
}