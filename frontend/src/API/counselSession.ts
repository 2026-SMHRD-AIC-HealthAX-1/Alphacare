// FastAPI 상담 세션 API (시작 / 감정 샘플 / 종료)
import axios from "axios";

const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL;

// FastAPI 상담 요약 결과
export interface CounselSummaryResult {
  counselDate: string;                   // 상담 시작 시각 (YYYY-MM-DD HH:mm:ss)
  summary: string;                       // 상담 요약
  emotionScores: Record<string, number>; // 감정 카테고리별 평균 점수 (e01~e06)
  status: "COMPLETED" | "ABORTED";
}

// 상담 시작 시각 기록
export const startCounselSession = async (sessionId: string): Promise<void> => {
  await axios.post(`${FASTAPI_BASE_URL}/counsel/start`, { sessionId });
};

// 오늘의 기분 텍스트(+표정 점수)로 첫 감정 점수 계산
export const getInitialEmotion = async (
  sessionId: string,
  moodText: string,
  faceScores?: Record<string, number>
): Promise<Record<string, number>> => {
  const response = await axios.post<{ emotionScores: Record<string, number> }>(
    `${FASTAPI_BASE_URL}/counsel/initial-emotion`,
    { sessionId, moodText, faceScores: faceScores ?? null }
  );
  return response.data.emotionScores;
};

// 상담 중 감정 점수 샘플 전달
export const sendEmotionSample = async (
  sessionId: string,
  scores: Record<string, number>
): Promise<void> => {
  await axios.post(`${FASTAPI_BASE_URL}/counsel/emotion-sample`, { sessionId, scores });
};

// 상담 종료: 요약/감정 평균 계산 결과 받기
export const finishCounselSession = async (
  sessionId: string,
  status: "COMPLETED" | "ABORTED" = "COMPLETED"
): Promise<CounselSummaryResult> => {
  const response = await axios.post<CounselSummaryResult>(
    `${FASTAPI_BASE_URL}/counsel/finish`,
    { sessionId, status }
  );
  return response.data;
};

// 주간 요약 생성 요청 항목 (상담 순서대로 하나씩)
export interface WeeklySummaryItem {
  summary: string; // 상담 요약
  emotion: string;  // 그 상담의 대표 감정
}

// 이번 주 상담 내용 + 감정 흐름을 짧은 문단으로 요약 (저장은 백엔드가 담당, 여기선 텍스트 생성만 함)
export const generateWeeklySummary = async (
  items: WeeklySummaryItem[]
): Promise<string> => {
  const response = await axios.post<{ summary: string }>(
    `${FASTAPI_BASE_URL}/counsel/weekly-summary`,
    { items }
  );
  return response.data.summary;
};

// 페이지 이탈 시 세션 정리용 sendBeacon 주소
export const COUNSEL_ABORT_BEACON_URL = `${FASTAPI_BASE_URL}/counsel/abort`;
