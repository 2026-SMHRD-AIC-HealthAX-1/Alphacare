# -*- coding: utf-8 -*-
"""
chatbot_main.py

Feely 챗봇/상담 전용 FastAPI 서버 (임시 작업용 파일).
팀원이 server/main.py에서 감정분석(/emotion) 쪽을 작업 중이라 그 파일은 건드리지 않고,
챗봇/상담 관련 기능은 전부 여기서 따로 완성해둠.

[병합 방법] 팀원 작업(진짜 얼굴표정 분석 모델) 끝나면 아래 내용을 main.py로 옮기면 됨:
  1. import 구문 전체 (main.py에 이미 있는 것과 중복되는 건 합칠 것)
  2. app = FastAPI() / CORSMiddleware 설정
     - main.py에도 이미 app = FastAPI()와 동일한 CORS 설정이 있으므로,
       이 파일에서 app 인스턴스를 새로 만들지 말고 main.py의 app 하나만 남길 것
  3. 아래 엔드포인트 전부:
     - GET  /test                    (헬스체크)
     - POST /chat                    (챗봇 대화)
     - POST /counsel/start           (상담 시작 기록)
     - POST /counsel/initial-emotion (상담 시작 시 첫 감정 계산: 텍스트 0.6 + 표정 0.4)
     - POST /counsel/emotion-sample  (상담 중 감정 샘플 누적)
     - POST /counsel/finish          (상담 종료, 요약/감정평균 계산)
     - POST /counsel/abort           (상담 중 이탈 시 정리)
     - POST /counsel/weekly-summary  (주간 AI 요약, 캐시 포함)
  4. 위 엔드포인트가 쓰는 Pydantic 모델들(WeeklySummaryRequest ~ CounselSummaryResponse,
     InitialEmotionRequest/Response 포함), 헬퍼 함수(_average_emotion_scores,
     _classify_text_emotion, _summarize_session), 세션 저장용 dict(chat_sessions,
     counsel_sessions, weekly_summary_cache)도 전부 같이 옮길 것
  5. 단, 맨 아래 "테스트 전용 임시 스텁" 구분선 아래(EmotionRequest/EmotionResponse/
     emotion_stub, /emotion)는 절대 같이 옮기면 안 됨 - main.py에 진짜 버전이 따로 있음

단독으로 바로 실행해서 테스트도 가능:
    uvicorn chatbot_main:app --reload --port 8000
"""

import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Feely_ChatBot.py는 ChatBot 폴더에 있음. 이 파일이 나중에 main.py로 옮겨져도
# 항상 정확히 찾을 수 있도록 실행 위치와 상관없이 절대경로로 계산함
CHATBOT_DIR = Path(__file__).resolve().parent.parent / "ChatBot"
sys.path.append(str(CHATBOT_DIR))

# Feely_ChatBot.py 내부에서도 load_dotenv(".APIenv")를 상대경로로 호출하는데,
# 실행 위치(cwd)에 따라 못 찾을 수 있어서 여기서 절대경로로 먼저 로드해둠
load_dotenv(dotenv_path=CHATBOT_DIR / ".APIenv")

from Feely_ChatBot import FeelySession, call_feely  # noqa: E402  (경로 설정 이후에 import해야 함)

app = FastAPI()

# Feely 프론트엔드(로컬 개발 서버) 요청만 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 상담 세션별 대화 히스토리(FeelySession)를 메모리에 들고 있음
# 서버 재시작하면 초기화됨 - 여러 대에 나눠 돌리거나 오래 유지하려면 나중에 DB/Redis로 옮겨야 함
chat_sessions: dict[str, FeelySession] = {}

# 상담 시작~종료까지 쌓아둘 데이터 (시작 시각, 프레임별 감정분석 결과)
# 이것도 chat_sessions와 마찬가지로 메모리 저장이라 서버 재시작하면 초기화됨
counsel_sessions: dict[str, dict] = {}

# 주간 AI 요약 캐시 - 캐시 키는 (회원번호, 주 시작일) 이고, 값은 {count, summary} 임.
# "주가 끝나는 시점"이라는 건 없어서(상담이 언제 끝날지 모름), 캐시를 만들 때 반영했던
# 상담 개수(count)와 지금 요청의 상담 개수가 같으면 캐시를 그대로 쓰고, 다르면(=새 상담이 늘어난) 다시 생성함
weekly_summary_cache: dict[tuple[int, str], dict] = {}

# 한국 표준시(KST, UTC+9) - DST가 없는 나라라 고정 오프셋으로 충분함 (zoneinfo/tzdata 의존성 불필요)
KST = timezone(timedelta(hours=9))

EMOTION_KEYS = ["e01", "e02", "e03", "e04", "e05", "e06"]


class WeeklySummaryRequest(BaseModel):
    memberNo: int
    weekStart: str  # 이번 주 월요일 (YYYY-MM-DD) - 캐시 키의 일부로만 쓰임
    summaries: list[str]  # 이번 주 상담 기록들의 개별 요약(counselSum) 목록


class WeeklySummaryResponse(BaseModel):
    summary: str


class ChatRequest(BaseModel):
    sessionId: str  # 프론트에서 상담 시작 시 발급하는 대화 식별자 (예: crypto.randomUUID())
    message: str    # 사용자가 입력한 메시지


class ChatResponse(BaseModel):
    reply: str


class InitialEmotionRequest(BaseModel):
    sessionId: str
    moodText: str
    # 카메라를 안 쓰면 None -> 텍스트 100%로 처리함
    faceScores: Optional[dict[str, float]] = None


class InitialEmotionResponse(BaseModel):
    emotionScores: dict[str, float]


class CounselStartRequest(BaseModel):
    sessionId: str


class EmotionSampleRequest(BaseModel):
    sessionId: str
    scores: dict[str, float]  # 프레임 하나를 분석한 결과 (키: e01~e06)


class CounselFinishRequest(BaseModel):
    sessionId: str
    status: str = "COMPLETED"              # 정상 종료: COMPLETED, 브라우저 이탈: ABORTED (프론트가 지정)


class CounselAbortRequest(BaseModel):
    sessionId: str


class CounselSummaryResponse(BaseModel):
    # 프론트가 이 값을 받아서 백엔드(/api/counsel)에 맞는 모양(multipart + 이미지)으로
    # 다시 가공해서 직접 전송함 (counsel.ts의 saveCounselRecord 참고)
    counselDate: str
    summary: str
    emotionScores: dict[str, float]
    status: str


def _average_emotion_scores(samples: list) -> dict:
    """세션 동안 쌓인 프레임별 감정점수 리스트를 e01~e06 평균으로 압축함.
    샘플이 하나도 없으면(카메라를 안 켰거나 분석 서버가 응답이 없었던 경우) 0.0으로 채워서 보냄.
    """
    if not samples:
        return {key: 0.0 for key in EMOTION_KEYS}

    sums = {key: 0.0 for key in EMOTION_KEYS}
    counts = {key: 0 for key in EMOTION_KEYS}

    for sample in samples:
        for key in EMOTION_KEYS:
            value = sample.get(key)
            if value is not None:
                sums[key] += value
                counts[key] += 1

    return {
        key: (sums[key] / counts[key] if counts[key] > 0 else 0.0)
        for key in EMOTION_KEYS
    }


TEXT_EMOTION_SYSTEM_PROMPT = (
    "너는 사용자가 입력한 오늘의 기분/일상 텍스트를 읽고 감정을 분류하는 도우미야. "
    "중립, 기브, 슬픔, 화남, 우울, 불안 6개 감정 각각의 비중을 0~1 사이 값으로 추정해서 합이 1이 되게 해. "
    "다른 설명 없이 아래 형식의 JSON만 출력해: "
    '{"e01": 0.0, "e02": 0.0, "e03": 0.0, "e04": 0.0, "e05": 0.0, "e06": 0.0} '
    "(e01=중립, e02=기브, e03=슬픔, e04=화남, e05=우울, e06=불안)"
)


def _classify_text_emotion(text: str) -> dict:
    """오늘의 기분 텍스트를 Claude로 6개 감정 점수(합 1)로 변환함.
    빈 텍스트거나 분류 실패/JSON 파싱 실패 시에는 중립(e01=1.0)으로 안전하게 폴백함.
    """
    fallback = {key: (1.0 if key == "e01" else 0.0) for key in EMOTION_KEYS}

    if not text or not text.strip():
        return fallback

    try:
        raw_reply = call_feely(
            TEXT_EMOTION_SYSTEM_PROMPT,
            [{"role": "user", "content": text}],
            max_tokens=200,
        )
        parsed = json.loads(raw_reply)
        scores = {key: max(0.0, float(parsed.get(key, 0.0))) for key in EMOTION_KEYS}
        total = sum(scores.values())
        if total <= 0:
            return fallback
        return {key: value / total for key, value in scores.items()}
    except Exception as err:
        # 파싱이든 Claude 호출 실패든 여기서 다 잡아서 상담 시작 자체가 안 멉히게 함
        print(f"텍스트 감정 분류 실패: {err}")
        return fallback


SUMMARY_SYSTEM_PROMPT = (
    "너는 방금 끝난 심리상담 대화를 기록용으로 요약하는 도우미야. "
    "환자(사용자)가 이번 상담에서 어떤 이야기를 했고 어떤 감정을 느꼈는지, "
    "상담사가 어떻게 반응했는지를 3~5문장의 한국어 존댓말로 담백하게 요약해. "
    "진단이나 평가하는 표현은 쓰지 말고, 실제 대화 내용을 근거로만 작성해."
)


def _summarize_session(session: Optional[FeelySession]) -> str:
    """상담 대화 히스토리를 바탕으로 짧은 상담 요약을 생성함.
    대화가 비어있으면(채팅 없이 바로 종료한 경우) 굳이 Claude를 호출하지 않음.
    """
    if session is None or not session.history:
        return ""

    try:
        return call_feely(
            SUMMARY_SYSTEM_PROMPT,
            session.history + [{"role": "user", "content": "지금까지 상담 내용을 요약해줘."}],
            max_tokens=400,
        )
    except Exception as err:
        # 요약 생성에 실패해도 상담 저장 자체는 막지 않고 빈 문자열로 진행함
        print(f"상담 요약 생성 실패: {err}")
        return ""


@app.get("/test")
def test_api():
    return {"message": "Feely AI 서버가 정상적으로 실행 중입니다!"}


@app.post("/chat", response_model=ChatResponse)
def chat_api(data: ChatRequest):
    # 처음 보는 sessionId면 새 상담 대화(FeelySession)를 새로 만듦
    if data.sessionId not in chat_sessions:
        chat_sessions[data.sessionId] = FeelySession()

    session = chat_sessions[data.sessionId]
    reply = session.send(data.message)

    return ChatResponse(reply=reply)


@app.post("/counsel/start")
def counsel_start(data: CounselStartRequest):
    # 상담이 실제로 시작되는 시점(카메라 사용 여부 선택 직후)에 프론트가 호출함
    # 시작 이미지는 프론트가 직접 들고 있으므로, 여기서는 시작 시각만 기록해둠
    counsel_sessions[data.sessionId] = {
        "startTime": datetime.now(KST),
        "emotionSamples": [],
    }
    return {"ok": True}


@app.post("/counsel/initial-emotion", response_model=InitialEmotionResponse)
def counsel_initial_emotion(data: InitialEmotionRequest):
    # 상담 시작 시점의 "첫 감정"을 계산함.
    # 텍스트(오늘의 기분 입력) 0.6 + 표정분석 0.4 가중합이 기본이고,
    # 카메라를 안 쒨서 표정 점수가 없으면(faceScores=None) 억지로 0.6:0.4를 유지하지 않고
    # 텍스트 100%로 처리함. 이 응답은 프론트가 그대로
    # sendEmotionSample()로 넘겨서 상담 중 감정 평균(_average_emotion_scores)에 첫 샘플로 섮이는 것을 전제로 함
    text_scores = _classify_text_emotion(data.moodText)

    if not data.faceScores:
        return InitialEmotionResponse(emotionScores=text_scores)

    combined = {
        key: text_scores[key] * 0.6 + data.faceScores.get(key, 0.0) * 0.4
        for key in EMOTION_KEYS
    }
    return InitialEmotionResponse(emotionScores=combined)


@app.post("/counsel/emotion-sample")
def counsel_emotion_sample(data: EmotionSampleRequest):
    # 상담 중 5초마다 프론트가 카메라 프레임 분석 결과(/emotion 응답)를 그대로 넘겨줌
    # -> 세션별로 누적해뒀다가 상담 종료 시 평균을 냄
    session_data = counsel_sessions.setdefault(
        data.sessionId,
        {"startTime": datetime.now(KST), "emotionSamples": []},
    )
    session_data["emotionSamples"].append(data.scores)
    return {"ok": True}


@app.post("/counsel/finish", response_model=CounselSummaryResponse)
def counsel_finish(data: CounselFinishRequest):
    # 상담 종료 버튼을 누르면 프론트가 호출함
    # 백엔드(/api/counsel) 저장은 프론트가 로그인 세션 쿠키를 들고 직접 하므로,
    # 여기서는 요약/감정평균만 계산해서 돌려주기만 함
    session_data = counsel_sessions.pop(
        data.sessionId,
        {"startTime": datetime.now(KST), "emotionSamples": []},
    )
    chat_session = chat_sessions.get(data.sessionId)

    return CounselSummaryResponse(
        counselDate=session_data["startTime"].strftime("%Y-%m-%d %H:%M:%S"),
        summary=_summarize_session(chat_session),
        emotionScores=_average_emotion_scores(session_data["emotionSamples"]),
        status=data.status,
    )


@app.post("/counsel/abort")
def counsel_abort(data: CounselAbortRequest):
    # 상담 종료 버튼을 안 누르고 페이지를 이탈했을 때 프론트가 sendBeacon으로 호출함
    # 백엔드에는 저장하지 않고, 메모리에 쌓인 해당 세션 데이터만 정리해서 누수를 막음
    counsel_sessions.pop(data.sessionId, None)
    chat_sessions.pop(data.sessionId, None)
    return {"ok": True}


WEEKLY_SUMMARY_SYSTEM_PROMPT = (
    "너는 여러 번의 심리상담 세션 요약을 모아서 한 주간의 상담 경향을 정리하는 도우미야. "
    "아래는 이번 주에 진행된 상담들의 개별 요약이야. 이 내용을 종합해서 "
    "이번 주 전체적으로 어떤 이야기와 감정 흐름이 있었는지 2~3문장의 한국어 존대말로 담백하게 요약해. "
    "진단하거나 평가하는 표현은 쓰지 말고, 실제 내용에 근거해서만 작성해."
)


@app.post("/counsel/weekly-summary", response_model=WeeklySummaryResponse)
def counsel_weekly_summary(data: WeeklySummaryRequest):
    # 빈 문자열 요약은 제외함 (서버 재시작 등으로 개별 상담 요약이 비어있을 수 있음)
    valid_summaries = [s for s in data.summaries if s and s.strip()]

    if not valid_summaries:
        return WeeklySummaryResponse(summary="")

    cache_key = (data.memberNo, data.weekStart)
    cached = weekly_summary_cache.get(cache_key)

    # 캐시가 있고 그 이후로 이번 주 상담 개수가 안 늘었으면(=유효 요약 개수 동일) 그대로 재사용
    if cached is not None and cached["count"] == len(valid_summaries):
        return WeeklySummaryResponse(summary=cached["summary"])

    try:
        summary_text = call_feely(
            WEEKLY_SUMMARY_SYSTEM_PROMPT,
            [{"role": "user", "content": "\n\n".join(f"- {s}" for s in valid_summaries)}],
            max_tokens=400,
        )
    except Exception as err:
        # 생성 실패 시 캐시는 건드리지 않고 빈 문자열만 반환함 (다음 조회 때 다시 시도됨)
        print(f"주간 상담 요약 생성 실패: {err}")
        return WeeklySummaryResponse(summary="")

    weekly_summary_cache[cache_key] = {"count": len(valid_summaries), "summary": summary_text}
    return WeeklySummaryResponse(summary=summary_text)


# ------------------------------------------------------------------
# 아래부터는 테스트 전용 임시 스텁 - 팀원이 main.py에 진짜 얼굴표정 분석을 붙이기 전까지
# 상담 데이터 전달 파이프라인(카메라->감정샘플 누적->평균->백엔드 저장)을 눈으로 확인해보기 위한 용도.
# main.py로 옮길 때는 이 블록 전체를 빼고 옮길 것 (진짜 /emotion과 겹치면 안 됨)
# ------------------------------------------------------------------
class EmotionRequest(BaseModel):
    sessionId: str
    image: str  # base64 JPEG (캔버스로 캡처한 웹캠 프레임) - 스텁이라 실제로는 안 씀


class EmotionResponse(BaseModel):
    scores: dict[str, float]


@app.post("/emotion", response_model=EmotionResponse)
def emotion_stub(data: EmotionRequest):
    # 실제 이미지를 분석하지 않고, 매번 임의의 6개 감정 점수(합이 1)를 만들어서 돌려줌
    raw = {key: random.uniform(0.05, 1.0) for key in EMOTION_KEYS}
    total = sum(raw.values())
    scores = {key: round(value / total, 4) for key, value in raw.items()}
    return EmotionResponse(scores=scores)
