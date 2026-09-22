//상담 페이지

import { api } from "./axios"; // 기존 axios 인스턴스 경로에 맞게 지정

// FastAPI(/counsel/finish)가 계산해서 돌려준 상담 요약 데이터 (counselSession.ts의
// CounselSummaryResult와 동일한 모양) - 이걸 그대로 백엔드가 원하는 형태로 다시 가공해서 보냄
export interface CounselSummaryPayload {
  counselDate: string;                   // 상담 시작 시각 (YYYY-MM-DD HH:mm:ss, 한국시간)
  summary: string;                       // 상담 전체 요약
  emotionScores: Record<string, number>; // 감정 카테고리별 평균 점수 (키: e01~e06)
  status: "COMPLETED" | "ABORTED";       // 정상종료 / 이탈 상태 구분
}

// 상담 종료 시 백엔드(/api/counsel)로 직접 전송하는 함수
// 지금 백엔드 컨트롤러가 @RequestBody(JSON)로 받고, DTO도 emotionScore 단일 값(Double) 하나만
// 받으므로(6개 카테고리 Map 아님) 일반 JSON POST로 보냄.
// 이미지 저장 로직도 지금은 "test" 고정 문자열이라 실제로 안 쓰이므로 이미지는 아예 안 보냄
// (백엔드가 카테고리별 컬럼/이미지 저장을 다시 지원하면 이 함수도 다시 바꿔야 함)
export const saveCounselRecord = async (
  summary: CounselSummaryPayload
): Promise<{ counselFlag: boolean }> => {
  // 지금 백엔드는 감정점수를 6개 카테고리가 아니라 emotionScore 하나로만 받으므로,
  // 6개 평균을 다시 한 번 평균 낸 값 하나를 임시로 보냄 (카테고리별 구분은 유실됨)
  const scores = Object.values(summary.emotionScores);
  const overallScore =
    scores.length > 0 ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;

  const response = await api.post("/api/counsel", {
    counselDate: summary.counselDate,
    summary: summary.summary,
    emotionScore: overallScore,
    status: summary.status,
  });
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
