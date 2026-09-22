// FastAPI 상담 세션 생명주기(시작 / 프레임 전송 / 종료) 관련 API
// 백엔드(Spring) 저장은 이제 프론트가 로그인 세션 쿠키를 직접 들고 하므로,
// FastAPI에는 요약/감정평균 계산 용도로만 사용함 (counsel.ts의 saveCounselRecord 참고)
import axios from "axios";

const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL;

// FastAPI가 계산해서 돌려주는 상담 요약 결과 - 이 값을 그대로
// counsel.ts의 saveCounselRecord에 넘겨서 백엔드에 저장함
export interface CounselSummaryResult {
  counselDate: string;                   // 상담 시작 시각 (YYYY-MM-DD HH:mm:ss)
  summary: string;                       // 상담 요약
  emotionScores: Record<string, number>; // 감정 카테고리별 평균 점수 (e01~e06)
  status: "COMPLETED" | "ABORTED";
}

// 상담이 시작됐을 때(카메라 사용 여부 선택 직후) 한 번 호출 - FastAPI에 시작 시각만 기록해둠
export const startCounselSession = async (sessionId: string): Promise<void> => {
  await axios.post(`${FASTAPI_BASE_URL}/counsel/start`, { sessionId });
};

// 상담 중 주기적으로 감정분석 점수(scores)를 FastAPI 세션 데이터에 누적 전달함
// (평균 계산 및 상담 종료 처리는 FastAPI가 상담 종료 시점에 직접 담당함)
export const sendEmotionSample = async (
  sessionId: string,
  scores: Record<string, number>
): Promise<void> => {
  await axios.post(`${FASTAPI_BASE_URL}/counsel/emotion-sample`, { sessionId, scores });
};

// 상담 종료 버튼을 눌렀을 때 호출 - FastAPI가 요약/감정평균을 계산해서 돌려줌
// (실제 백엔드 저장은 이 결과를 받은 프론트가 counsel.ts의 saveCounselRecord로 따로 수행함)
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

// 상담 종료 버튼을 누르지 않고 페이지를 이탈했을 때(sendBeacon) 호출 -
// 백엔드 저장은 하지 않고, FastAPI 메모리에 쌓인 세션 데이터만 정리함
export const COUNSEL_ABORT_BEACON_URL = `${FASTAPI_BASE_URL}/counsel/abort`;
