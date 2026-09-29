// 웹캠 프레임 감정분석 API
import axios from "axios";

const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL;

export interface EmotionRequest {
  sessionId: string;
  image: string; // base64 JPEG (캔버스로 캡처한 웹캠 프레임)
  finalizeNeutral?: boolean; // true면 질의응답(기분 입력) 종료 시점 - 중립 기준점을 지금까지 모은 샘플로 확정
  resetNeutral?: boolean; // true면 카메라를 껐다가 다시 켠 시점 - 기존 중립 기준을 버리고 새로 수집 시작
}

// 감정 카테고리별 점수 (e01~e06, 얼굴 미검출 시 없음)
export interface EmotionResponse {
  scores?: Record<string, number>;
  emotion?: string;
  confidence?: number;
}

export const sendEmotionFrame = async (data: EmotionRequest): Promise<EmotionResponse> => {
  const response = await axios.post<EmotionResponse>(`${FASTAPI_BASE_URL}/emotion`, data);
  return response.data;
};
