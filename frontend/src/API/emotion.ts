// 웹캠 프레임 감정분석 API
import axios from "axios";

const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL;

export interface EmotionRequest {
  sessionId: string;
  image: string; // base64 JPEG (캔버스로 캡처한 웹캠 프레임)
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
