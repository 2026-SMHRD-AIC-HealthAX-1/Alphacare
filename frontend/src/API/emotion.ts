// FastAPI 감정분석(/emotion) 서버와 통신하는 함수
// 주의: 지금 AI/server/main.py의 /emotion은 아직 진짜 얼굴표정 모델이 아니라
// 항상 { emotion: "happy", confidence: 0.87 } 고정값만 돌려주는 테스트용 스텁이고,
// 요청도 이미지가 아니라 name(문자열) 하나만 받는 상태임 (EmotionRequest.name).
// 팀원이 실제 모델을 붙이면 EmotionRequest에 image 필드를 추가하고,
// 응답도 카테고리별 점수(e01~e06)로 내려주도록 맞춰야 이 함수가 의미있는 값을 받아옴.
import axios from "axios";

const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL;

export interface EmotionRequest {
  sessionId: string;
  image: string; // base64 JPEG (캔버스로 캡처한 웹캠 프레임)
}

// 감정 카테고리별 점수 (e01: 중립, e02: 기쁨, e03: 슬픔, e04: 분노, e05: 당황, e06: 불안)
// 아직 실제 모델이 이 형태로 안 돌아오면 scores가 없을 수 있어서 optional로 둠
export interface EmotionResponse {
  scores?: Record<string, number>;
  emotion?: string;
  confidence?: number;
}

export const sendEmotionFrame = async (data: EmotionRequest): Promise<EmotionResponse> => {
  const response = await axios.post<EmotionResponse>(`${FASTAPI_BASE_URL}/emotion`, data);
  return response.data;
};
