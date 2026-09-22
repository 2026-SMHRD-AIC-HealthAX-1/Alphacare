// FastAPI 상담 세션 생명주기(시작 / 프레임 전송 / 종료) 관련 API
// 백엔드(Spring) 저장은 더 이상 프론트가 직접 하지 않고, FastAPI가 /counsel/finish에서 대신 처리함
import axios from "axios";

const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL;

export interface CounselFinishResult {
  counselFlag: boolean;
  message?: string;
}

// 상담이 실제로 시작되는 시점에 호출 - 시작 시각/시작 이미지를 FastAPI 쪽에 기록해둠
export const startCounselSession = async (
  sessionId: string,
  startImagePath: string | null
): Promise<void> => {
  await axios.post(`${FASTAPI_BASE_URL}/counsel/start`, { sessionId, startImagePath });
};

// 카메라 프레임 하나를 분석한 결과(scores)를 FastAPI 세션 저장소에 누적시킴
// (평균은 이제 프론트가 아니라 FastAPI가 상담 종료 시점에 계산함)
export const sendEmotionSample = async (
  sessionId: string,
  scores: Record<string, number>
): Promise<void> => {
  await axios.post(`${FASTAPI_BASE_URL}/counsel/emotion-sample`, { sessionId, scores });
};

// 상담 종료 시점에 호출 - FastAPI가 요약/감정평균을 계산해서 백엔드로 직접 저장까지 처리함
export const finishCounselSession = async (
  sessionId: string,
  memberId: string,
  endImagePath: string | null,
  status: "COMPLETED" | "ABORTED" = "COMPLETED"
): Promise<CounselFinishResult> => {
  const response = await axios.post<CounselFinishResult>(
    `${FASTAPI_BASE_URL}/counsel/finish`,
    { sessionId, memberId, endImagePath, status }
  );
  return response.data;
};

// 탭/브라우저를 닫을 때는 axios가 아니라 navigator.sendBeacon으로 보내야 안정적으로 전송되므로,
// 그때 쓸 수 있게 URL만 따로 export해둠
export const COUNSEL_FINISH_BEACON_URL = `${FASTAPI_BASE_URL}/counsel/finish`;
