//상담 페이지

import {api} from "./axios"; // 기존 axios 인스턴스 경로에 맞게 지정

// 백엔드 DB 전송용 인터페이스
export interface CounselDataPayload {
  counselId?: number;       // 상담번호
  userId: number;           // 회원번호
  counselDate: string;      // 상담일자 (시간 포함: YYYY-MM-DD HH:mm:ss)
  sessionTurn: number;      // 상담 차수
  summary: string;          // 상담요약
  emotionCategory: string;  // 대표 감정분류
  emotionScore: number;     // 감정 점수 (0 ~ 100)
  status: "COMPLETED" | "ABORTED"; // 정상종료 / 이탈 상태 구분
}

// 상담 데이터 백엔드 POST 전송 함수
export const sendCounselData = async (data: CounselDataPayload) => {
  //api주소 설정 해야함
  const response = await api.post("/api/counsel", data);
  return response.data;
};

// 상담 기록 조회 응답 타입 (백엔드 CounselResponseDTO와 매칭)
export interface CounselRecord {
  counselNo: number;
  memberNo: number;
  counselSum: string;       // 상담 요약
  e01Rate: number;          // 중립
  e02Rate: number;          // 기쁨
  e03Rate: number;          // 슬픔
  e04Rate: number;          // 분노
  e05Rate: number;          // 당황
  e06Rate: number;          // 불안
  counselDttm: string;      // 상담 일시 (YYYY-MM-DD HH:mm:ss)
  startImgPath: string;     // 상담 시작 시점 이미지 경로
  endImgPath: string;       // 상담 종료 시점 이미지 경로
}

// 로그인한 회원의 상담 기록 전체 조회 함수 (세션 기준으로 백엔드가 회원을 판별함)
export const getCounselData = async (): Promise<CounselRecord[]> => {
  const response = await api.get("/api/counsel");
  return response.data;
};
