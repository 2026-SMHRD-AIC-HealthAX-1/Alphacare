// 상담 기록 저장/조회 API

import { api, handleSessionExpired } from "./axios";

// FastAPI(/counsel/finish)가 계산한 상담 요약 데이터
export interface CounselSummaryPayload {
  counselDate: string;                   // 상담 시작 시각 (YYYY-MM-DD HH:mm:ss, 한국시간)
  summary: string;                       // 상담 전체 요약
  emotionScores: Record<string, number>; // 감정 카테고리별 평균 점수 (키: e01~e06)
  status: "COMPLETED" | "ABORTED";       // 정상종료 / 이탈 상태 구분
}

// base64 데이터 URL을 Blob으로 변환
const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

// 상담 기록 저장 (multipart: data + 시작/종료 이미지, 세션 만료 시 null 반환)
export const saveCounselRecord = async (
  summary: CounselSummaryPayload,
  startImageDataUrl: string | null,
  endImageDataUrl: string | null
): Promise<{ counselFlag: boolean } | null> => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(summary)], { type: "application/json" }));

  // 이미지가 있을 때만 첨부
  if (startImageDataUrl) {
    formData.append("startImage", dataUrlToBlob(startImageDataUrl), "start.jpg");
  }
  if (endImageDataUrl) {
    formData.append("endImage", dataUrlToBlob(endImageDataUrl), "end.jpg");
  }

  // 세션 쿠키 포함
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/counsel`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (response.status === 401) {
    handleSessionExpired();
    return null;
  }

  if (!response.ok) {
    throw new Error(`상담 데이터 저장 요청 실패: ${response.status}`);
  }

  return response.json();
};

// 상담 기록 조회 응답 타입 (이미지는 base64 문자열)
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
  startImage: string;       // 상담 시작 시점 이미지 (base64)
  endImage: string;         // 상담 종료 시점 이미지 (base64)
}

// 로그인 회원의 상담 기록 전체 조회
export const getCounselData = async (): Promise<CounselRecord[]> => {
  // 상담마다 시작/종료 이미지가 함께 내려와 응답이 커질 수 있어서 기본 5초보다 넉넉하게 기다림
  const response = await api.get("/api/counsel", { timeout: 20000 });
  return response.data;
};

// 저장된 주간 감정 요약
export interface WeeklySummaryRecord {
  weekStart: string;   // 그 주 월요일 (YYYY-MM-DD)
  summary: string;     // 요약 문단
  counselCount: number; // 요약을 생성했을 당시의 그 주 상담 개수
}

// 저장된 주간 감정 요약 조회 (없거나 그 사이 상담이 늘었으면 null - 새로 생성해야 함)
export const getSavedWeeklySummary = async (
  weekStart: string,
  counselCount: number
): Promise<WeeklySummaryRecord | null> => {
  const response = await api.get<WeeklySummaryRecord>("/api/counsel/weekly-summary", {
    params: { weekStart, counselCount },
    validateStatus: (status) => status === 200 || status === 204,
  });
  return response.status === 200 ? response.data : null;
};

// 주간 감정 요약 저장 (같은 주 기록이 있으면 갱신)
export const saveWeeklySummary = async (record: WeeklySummaryRecord): Promise<void> => {
  await api.post("/api/counsel/weekly-summary", record);
};
