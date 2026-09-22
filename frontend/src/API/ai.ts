// Feely AI 챗봇(FastAPI) 서버와 통신하는 함수 모음
import axios from "axios";

// FastAPI 챗봇 서버 주소 (Spring 백엔드와는 별개 서버, .env의 VITE_FASTAPI_BASE_URL 사용)
const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL;

export interface ChatRequest {
  sessionId: string; // 상담 1회당 하나씩 발급하는 대화 식별자
  message: string;   // 사용자가 입력한 메시지
}

export interface ChatResponse {
  reply: string; // Feely AI의 응답 텍스트
}

// 사용자 메시지를 FastAPI 챗봇 서버로 보내고 AI 응답을 받아오는 함수
export const sendChatMessage = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await axios.post<ChatResponse>(`${FASTAPI_BASE_URL}/chat`, data);
  return response.data;
};

// FastAPI 챗봇 서버가 살아있는지 확인 (상담 화면의 상태 표시등에 사용 - 켜지면 초록, 꺼지면 빨강)
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    await axios.get(`${FASTAPI_BASE_URL}/test`, {
      timeout: 4000,
      params: { _: Date.now() }, // 캐시 때문에 서버가 꺼져도 예전 응답이 재사용되는 것을 방지
    });
    return true;
  } catch {
    return false;
  }
};
