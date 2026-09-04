//유저 데이터 관리 - 마이페이지 데이터 조회

export interface UserData {
  id?: string;        // json-server 자동 생성 고유 ID
  ID: string;         // 사용자 아이디
  kakaoID: string;     // 카카오 연동 아이디
  PW: string;         // 비밀번호
  name: string;       // 이름
  tel: string;        // 휴대폰 번호
  signDate: string;   // 가입일자
}