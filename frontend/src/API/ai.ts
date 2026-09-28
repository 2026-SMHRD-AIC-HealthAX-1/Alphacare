// Feely AI 챗봇(FastAPI) 서버와 통신하는 함수 모음
import axios from "axios";

// FastAPI 챗봇 서버 주소
const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL;

export interface ChatRequest {
  sessionId: string; // 상담 세션 ID
  message: string;   // 사용자가 입력한 메시지
}

export interface ChatResponse {
  reply: string; // Feely AI의 응답 텍스트
}

// 사용자 메시지를 챗봇 서버로 보내고 AI 응답 받기
export const sendChatMessage = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await axios.post<ChatResponse>(`${FASTAPI_BASE_URL}/chat`, data);
  return response.data;
};

// 챗봇 서버 상태 확인 (상담 화면 상태 표시등)
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    await axios.get(`${FASTAPI_BASE_URL}/test`, {
      timeout: 4000,
      params: { _: Date.now() }, // 캐시 방지
    });
    return true;
  } catch {
    return false;
  }
};
