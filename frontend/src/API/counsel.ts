//상담 페이지

import { api } from "./axios"; // 기존 axios 인스턴스 경로에 맞게 지정

// FastAPI(/counsel/finish)가 계산해서 돌려준 상담 요약 데이터 (counselSession.ts의
// CounselSummaryResult와 동일한 모양)
export interface CounselSummaryPayload {
  counselDate: string;                   // 상담 시작 시각 (YYYY-MM-DD HH:mm:ss, 한국시간)
  summary: string;                       // 상담 전체 요약
  emotionScores: Record<string, number>; // 감정 카테고리별 평균 점수 (키: e01~e06)
  status: "COMPLETED" | "ABORTED";       // 정상종료 / 이탈 상태 구분
}

// base64 데이터 URL(카메라 캡처 이미지)을 실제 파일로 보낼 수 있게 Blob으로 변환함
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

// 상담 종료 시 백엔드(/api/counsel)로 직접 전송하는 함수
// 백엔드가 @RequestPart("data")/@RequestPart("startImage")/@RequestPart("endImage")로
// multipart/form-data를 받으므로 FormData로 조립해서 보냄.
// axios 대신 fetch를 쓰는 이유: api 인스턴스의 기본 Content-Type(application/json) 때문에
// FormData를 보내도 boundary가 안 붙어서 415가 나는 문제가 실제로 있었어서 fetch를 씀
export const saveCounselRecord = async (
  summary: CounselSummaryPayload,
  startImageDataUrl: string | null,
  endImageDataUrl: string | null
): Promise<{ counselFlag: boolean }> => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(summary)], { type: "application/json" }));

  // 카메라를 사용하지 않은 상담은 이미지가 없어 이 파트가 비는데,
  // 백엔드 startImage/endImage가 필수 파트라 이 경우 저장이 실패함 (백엔드 팀 확인 필요)
  if (startImageDataUrl) {
    formData.append("startImage", dataUrlToBlob(startImageDataUrl), "start.jpg");
  }
  if (endImageDataUrl) {
    formData.append("endImage", dataUrlToBlob(endImageDataUrl), "end.jpg");
  }

  // 백엔드가 로그인 세션 쿠키로 회원을 조회하므로 credentials: "include" 필수
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/counsel`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`상담 데이터 저장 요청 실패: ${response.status}`);
  }

  return response.json();
};

// 상담 기록 조회 응답 타입 (백엔드 CounselResponseDTO와 매칭)
// startImage/endImage는 백엔드가 byte[]로 내려주는데, Jackson이 자동으로 base64 문자열로 직렬화해줌
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

// 로그인한 회원의 상담 기록 전체 조회 함수 (세션 기준으로 백엔드가 회원을 판별함)
// 세션 만료(401) 처리는 axios.ts의 공통 인터셉터가 처리하므로 여기서 별도 분기 불필요
export const getCounselData = async (): Promise<CounselRecord[]> => {
  const response = await api.get("/api/counsel");
  return response.data;
};
