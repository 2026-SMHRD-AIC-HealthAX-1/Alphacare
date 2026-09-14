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
  const response = await api.post("/api/test", data);
  return response.data;
};