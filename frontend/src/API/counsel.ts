//상담 페이지

import {api} from "./axios"; // 기존 axios 인스턴스 경로에 맞게 지정

// 백엔드 DB 전송용 인터페이스 (memberNo는 세션으로 식별되므로 안 보냄)
export interface CounselDataPayload {
  counselDate: string;                  // 상담 시작 시각 (YYYY-MM-DD HH:mm:ss, 한국시간)
  summary: string;                      // 상담 전체 요약
  emotionScores: Record<string, number>; // 감정 카테고리별 평균 점수 (키: e01~e06)
  startImagePath: string | null;        // 상담 시작 시점 캡처 이미지
  endImagePath: string | null;          // 상담 종료 시점 캡처 이미지
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
// 세션 만료(401) 처리는 axios.ts의 공통 인터셉터가 처리하므로 여기서 별도 분기 불필요
export const getCounselData = async (): Promise<CounselRecord[]> => {
  const response = await api.get("/api/counsel");
  return response.data;
};
