# -*- coding: utf-8 -*-
"""
main.py

Feely AI 서버 (FastAPI) - 챗봇/상담 + 얼굴표정 감정분석을 하나의 서버로 합침.
- 챗봇/상담(/chat, /counsel/*) 로직은 chatbot_main.py에서 그대로 옮겨옴
  (다만 chatbot_main.py 자체의 테스트용 /emotion 스텁은 제외 - 아래 실제 버전으로 대체됨)
- 감정분석(/emotion)은 실제 학습된 PyTorch 모델(Feely_emotion_model.pt)과
  MediaPipe 얼굴 랜드마크(face_landmarker.task)로 동작함

단독 실행:
    uvicorn main:app --reload --port 8000
"""

import base64
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn as nn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
from pydantic import BaseModel

# Feely_ChatBot.py와 .APIenv는 AI 폴더 바로 밑(이 파일 기준 한 단계 위)에 있음.
# 실행 위치(cwd)와 상관없이 항상 정확히 찾을 수 있도록 이 파일 기준 절대경로로 계산함
AI_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(AI_DIR))

# Feely_ChatBot.py 내부에서도 load_dotenv(".APIenv")를 상대경로로 호출하는데,
# 실행 위치에 따라 못 찾을 수 있어서 여기서 절대경로로 먼저 로드해둠
load_dotenv(dotenv_path=AI_DIR / ".APIenv")

from Feely_ChatBot import FeelySession, call_feely  # noqa: E402 (경로 설정 이후에 import해야 함)

app = FastAPI()

# Feely 프론트엔드(로컬 개발 서버) 요청만 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 감정분석 - PyTorch 모델 + MediaPipe 얼굴 랜드마크
# ============================================================

# e01=중립, e02=기쁨, e03=슬픔, e04=분노, e05=당황, e06=불안 (프론트/상담 로직과 동일한 순서)
EMOTION_KEYS = ["e01", "e02", "e03", "e04", "e05", "e06"]


class FeelyEmotionModel(nn.Module):
    """학습 때 사용한 모델 구조 그대로 - 체크포인트 가중치와 구조가 반드시 일치해야 함"""

    def __init__(self):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(10, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 6),
        )

    def forward(self, x):
        return self.network(x)


# 모델/랜드마커 파일을 이 파일과 같은 폴더에서 찾음 (실행 위치가 달라도 항상 정확히 찾기 위해
# 절대경로 사용 - 예전 코드에 있던 "C:\face_landmarker.task" 하드코딩 경로는 다른 PC에서는
# 파일이 없어서 서버가 아예 못 뜨는 문제가 있었음)
_SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(_SERVER_DIR, "Feely_emotion_model.pt")
FACE_LANDMARKER_PATH = os.path.join(_SERVER_DIR, "face_landmarker.task")

# MediaPipe(C++ 쪽) 파일 로더가 윈도우에서 경로에 한글이 섞여 있으면 못 여는 문제가 있어서
# (예: "...\\바탕 화면\\...\\핵심프로젝트\\..." 경로에서 RuntimeError: Unable to open file, errno=-1),
# 경로를 직접 넘기지 않고 파이썬에서 파일을 먼저 바이트로 읽어서 넘겨줌
# (파이썬 open()은 유니코드 경로를 문제없이 읽음 - 아래 model_asset_buffer로 전달)
with open(FACE_LANDMARKER_PATH, "rb") as _f:
    _face_landmarker_bytes = _f.read()

_checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)

emotion_model = FeelyEmotionModel()
emotion_model.load_state_dict(_checkpoint["model_state_dict"])
emotion_model.eval()

# 학습 때 사용한 입력 특징의 평균/표준편차 (표준화용)
_feature_mean = torch.tensor(_checkpoint["feature_mean"], dtype=torch.float32)
_feature_std = torch.tensor(_checkpoint["feature_std"], dtype=torch.float32)

print("Feely 감정모델 로드 완료 - 입력 개수:", _checkpoint.get("input_size"), "감정 개수:", _checkpoint.get("num_classes"))


# 세션별 MediaPipe 랜드마커 - VIDEO 모드는 타임스탬프가 계속 증가하는 "하나의 이어진 영상"을
# 전제로 동작하기 때문에, 전역 랜드마커 하나를 여러 상담(세션)이 같이 쓰면 서로 다른 사람의
# 프레임이 섞여서 추적 상태가 꼬임. 그래서 sessionId마다 랜드마커 인스턴스와 타임스탬프를
# 따로 두고, 상담이 끝나면 정리(release)함
session_landmarkers: dict = {}
session_last_timestamp: dict = {}

# 세션별 개인 중립 기준 생성용
session_neutral_samples: dict = {}
session_neutral_baselines: dict = {}
session_neutral_start_times: dict = {}


def _get_session_landmarker(session_id: str):
    """세션 전용 FaceLandmarker를 가져오거나, 처음 요청이면 새로 만듦"""
    if session_id not in session_landmarkers:
        base_options = mp_python.BaseOptions(model_asset_buffer=_face_landmarker_bytes)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        session_landmarkers[session_id] = vision.FaceLandmarker.create_from_options(options)
        session_last_timestamp[session_id] = 0
    return session_landmarkers[session_id]


def release_session_landmarker(session_id: str) -> None:
    """상담 종료/이탈 시 세션 전용 랜드마커 리소스를 정리함 (안 하면 세션마다 계속 쌓여서 메모리 누수)"""
    landmarker = session_landmarkers.pop(session_id, None)
    if landmarker is not None:
        landmarker.close()
    session_last_timestamp.pop(session_id, None)


def extract_landmark_feature(face_image, session_id: str):
    """얼굴 이미지 한 장에서 478개 랜드마크(x,y,z) = 1434개 좌표를 추출함.
    세션 전용 랜드마커를 사용해서 동시 접속 중인 다른 세션과 추적 상태가 섞이지 않게 함"""
    if face_image is None or face_image.size == 0:
        return None

    landmarker = _get_session_landmarker(session_id)

    rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)

    # VIDEO 모드는 타임스탬프가 항상 증가해야 해서, 세션별로 마지막 값을 따로 기억해둠
    timestamp_ms = int(time.monotonic() * 1000)
    if timestamp_ms <= session_last_timestamp[session_id]:
        timestamp_ms = session_last_timestamp[session_id] + 1
    session_last_timestamp[session_id] = timestamp_ms

    result = landmarker.detect_for_video(mp_image, timestamp_ms)
    if not result.face_landmarks:
        return None

    landmarks = result.face_landmarks[0]
    feature = []
    for landmark in landmarks:
        feature.extend([landmark.x, landmark.y, landmark.z])

    return np.array(feature, dtype=np.float32)


def make_ver5_base_feature(feature):
    """1434개 랜드마크를 얼굴 중심이 0이 되고 얼굴 크기가 1이 되도록 보정함
    (사람마다, 카메라 거리마다 얼굴 위치/크기가 달라도 같은 기준으로 비교하기 위함)"""
    if feature is None or feature.shape != (1434,):
        return None

    landmarks = feature.reshape(478, 3).astype(np.float32)

    center_x = np.mean(landmarks[:, 0])
    center_y = np.mean(landmarks[:, 1])

    relative_landmarks = landmarks.copy()
    relative_landmarks[:, 0] -= center_x
    relative_landmarks[:, 1] -= center_y

    face_width = np.max(landmarks[:, 0]) - np.min(landmarks[:, 0])
    face_height = np.max(landmarks[:, 1]) - np.min(landmarks[:, 1])
    face_scale = max(face_width, face_height)
    if face_scale < 1e-6:
        return None

    relative_landmarks[:, 0] /= face_scale
    relative_landmarks[:, 1] /= face_scale
    relative_landmarks[:, 2] /= face_scale

    base_feature = relative_landmarks.reshape(-1).astype(np.float32)
    if not np.isfinite(base_feature).all():
        return None

    return base_feature


def make_ver5_expression_feature(base_feature):
    """정규화된 1434개 랜드마크에서, 모델이 실제로 학습한 표정 특징 10개(입/눈/눈썹 관련 거리)를 계산함.
    팀원의 학습 스크립트에 있던 계산식 그대로 옮긴 것 - 순서가 feature_mean/feature_std 학습 때와 같아야 함"""
    if base_feature is None or base_feature.shape != (1434,):
        return None

    landmarks = base_feature.reshape(478, 3)

    def distance_2d(index1, index2):
        point1 = landmarks[index1, :2]
        point2 = landmarks[index2, :2]
        return float(np.linalg.norm(point1 - point2))

    # 1. 입 가로 너비
    mouth_width = distance_2d(61, 291)

    # 2. 입 벌어진 정도
    mouth_open = distance_2d(13, 14)

    # 3. 입꼬리 높이
    mouth_corner_y = (landmarks[61, 1] + landmarks[291, 1]) / 2.0
    mouth_center_y = (landmarks[13, 1] + landmarks[14, 1]) / 2.0
    mouth_corner_height = mouth_center_y - mouth_corner_y

    # 4. 왼쪽 눈 개방 정도
    left_eye_open = np.mean([
        distance_2d(159, 145),
        distance_2d(160, 144),
        distance_2d(158, 153),
    ])

    # 5. 오른쪽 눈 개방 정도
    right_eye_open = np.mean([
        distance_2d(386, 374),
        distance_2d(385, 380),
        distance_2d(387, 373),
    ])

    # 6. 왼쪽 눈썹 높이
    left_brow_height = distance_2d(105, 159)

    # 7. 오른쪽 눈썹 높이
    right_brow_height = distance_2d(334, 386)

    # 8. 왼쪽 눈썹 평균 높이
    left_brow_mean_height = np.mean([
        distance_2d(70, 159),
        distance_2d(63, 159),
        distance_2d(105, 159),
    ])

    # 9. 오른쪽 눈썹 평균 높이
    right_brow_mean_height = np.mean([
        distance_2d(300, 386),
        distance_2d(293, 386),
        distance_2d(334, 386),
    ])

    # 10. 눈썹 안쪽 평균 거리
    brow_inner_distance = np.mean([
        distance_2d(107, 336),
        distance_2d(66, 296),
        distance_2d(105, 334),
    ])

    expression_feature = np.array([
        mouth_width,
        mouth_open,
        mouth_corner_height,
        left_eye_open,
        right_eye_open,
        left_brow_height,
        right_brow_height,
        left_brow_mean_height,
        right_brow_mean_height,
        brow_inner_distance,
    ], dtype=np.float32)

    if expression_feature.shape != (10,):
        return None
    if not np.isfinite(expression_feature).all():
        return None

    return expression_feature


def reduce_to_model_features(base_feature):
    """1434개 정규화된 랜드마크를 모델 입력 10개 특징으로 바꿈 (make_ver5_expression_feature 그대로 호출)"""
    return make_ver5_expression_feature(base_feature)


def predict_emotion_scores(base_feature):
    """모델 입력 특징을 표준화한 뒤 모델에 넣어 감정 6개 확률(e01~e06, 합계 1.0)을 계산함.
    10개 특징 추출 자체가 실패하면(얼굴 각도가 이상하거나 좌표가 이상하면) None을 돌려줌"""
    model_input = reduce_to_model_features(base_feature)
    if model_input is None:
        return None

    input_tensor = (torch.tensor(model_input, dtype=torch.float32) - _feature_mean) / _feature_std
    input_tensor = input_tensor.unsqueeze(0)

    with torch.no_grad():
        logits = emotion_model(input_tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

    return {key: probabilities[i].item() for i, key in enumerate(EMOTION_KEYS)}

def predict_emotion_from_delta(delta_10f):
    # Δ10F가 올바른 10개 특징인지 확인
    if delta_10f is None or delta_10f.shape != (10,):
        return None

    # 확인 1 : 모델로 전달되는 Δ10F
    print("[확인] 모델에 전달된 delta_10f =", delta_10f)

    # 학습 때 사용한 평균과 표준편차로 표준화
    input_tensor = (
        torch.tensor(delta_10f, dtype=torch.float32) - _feature_mean
    ) / _feature_std

    # 모델에 넣을 수 있도록 [10] → [1, 10] 형태로 변경
    input_tensor = input_tensor.unsqueeze(0)

    # 확인 2 : 실제 모델 입력 크기
    print("[확인] 모델 입력 shape =", input_tensor.shape)

    # 확인 3 : 표준화가 끝난 실제 모델 입력값
    print("[확인] 표준화된 모델 입력 =", input_tensor)

    # 6감정 모델로 예측
    with torch.no_grad():
        logits = emotion_model(input_tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

    # 6감정 확률을 딕셔너리로 변환
    scores = {
        key: probabilities[i].item()
        for i, key in enumerate(EMOTION_KEYS)
    }

    # 확인 4 : 모델이 예측한 6감정 확률
    print("[확인] 얼굴 6감정 scores =", scores)

    # 확인 5 : 6감정 확률의 전체 합
    print("[확인] 6감정 확률 합계 =", sum(scores.values()))

    return scores


def decode_base64_image(data_url: str):
    """프론트가 canvas.toDataURL()로 만든 'data:image/jpeg;base64,...' 문자열을 OpenCV 이미지로 변환"""
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]
    binary = base64.b64decode(data_url)
    array = np.frombuffer(binary, dtype=np.uint8)
    return cv2.imdecode(array, cv2.IMREAD_COLOR)


class EmotionRequest(BaseModel):
    sessionId: str
    image: str  # base64 JPEG (캔버스로 캡처한 웹캠 프레임)


class EmotionResponse(BaseModel):
    # 얼굴을 못 찾은 프레임도 있을 수 있어서(사용자가 잠깐 화면 밖으로 벗어남 등) optional로 둠
    scores: Optional[dict] = None


# ============================================================
# 챗봇/상담 (chatbot_main.py에서 그대로 옮겨옴)
# ============================================================

# 상담 세션별 대화 히스토리(FeelySession)를 메모리에 들고 있음
# 서버 재시작하면 초기화됨 - 여러 대에 나눠 돌리거나 오래 유지하려면 나중에 DB/Redis로 옮겨야 함
chat_sessions: dict = {}

# 상담 시작~종료까지 쌓아둘 데이터 (시작 시각, 프레임별 감정분석 결과)
counsel_sessions: dict = {}

# 한국 표준시(KST, UTC+9) - DST가 없는 나라라 고정 오프셋으로 충분함
KST = timezone(timedelta(hours=9))


class WeeklySummaryItem(BaseModel):
    summary: str  # 상담 한 건의 요약
    emotion: str  # 그 상담의 대표 감정


class WeeklySummaryRequest(BaseModel):
    items: list[WeeklySummaryItem]  # 이번 주 상담 순서대로 나열
    userName: Optional[str] = None  # 요약문에서 "사용자" 대신 부를 이름


class WeeklySummaryResponse(BaseModel):
    summary: str


class ChatRequest(BaseModel):
    sessionId: str
    message: str


class ChatResponse(BaseModel):
    reply: str


class InitialEmotionRequest(BaseModel):
    sessionId: str
    moodText: str
    faceScores: Optional[dict] = None


class InitialEmotionResponse(BaseModel):
    emotionScores: dict


class CounselStartRequest(BaseModel):
    sessionId: str


class EmotionSampleRequest(BaseModel):
    sessionId: str
    scores: dict


class CounselFinishRequest(BaseModel):
    sessionId: str
    status: str = "COMPLETED"
    userName: Optional[str] = None  # 요약문에서 "사용자" 대신 부를 이름


class CounselAbortRequest(BaseModel):
    sessionId: str


class CounselSummaryResponse(BaseModel):
    counselDate: str
    summary: str
    emotionScores: dict
    status: str


def _average_emotion_scores(samples: list) -> dict:
    """세션 동안 쌓인 프레임별 감정점수 리스트를 e01~e06 평균으로 압축함.
    샘플이 하나도 없으면 0.0으로 채워서 보냄"""
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
    "중립, 기쁨, 슬픔, 분노, 당황, 불안 6개 감정 각각의 비중을 0~1 사이 값으로 추정해서 합이 1이 되게 해. "
    "다른 설명 없이 아래 형식의 JSON만 출력해: "
    '{"e01": 0.0, "e02": 0.0, "e03": 0.0, "e04": 0.0, "e05": 0.0, "e06": 0.0} '
    "(e01=중립, e02=기쁨, e03=슬픔, e04=분노, e05=당황, e06=불안)"
)


def _classify_text_emotion(text: str) -> dict:
    """오늘의 기분 텍스트를 Claude로 6개 감정 점수(합 1)로 변환함.
    빈 텍스트거나 분류 실패/JSON 파싱 실패 시에는 중립(e01=1.0)으로 안전하게 폴백함"""
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
        print(f"텍스트 감정 분류 실패: {err}")
        return fallback


def _summary_system_prompt(user_name: str) -> str:
    # 이름이 있으면 "OOO님이"(받침 있는 '님' 기준 항상 '이'), 없으면 "사용자가"
    who, particle = (f"{user_name}님", "이") if user_name else ("사용자", "가")
    return (
        "너는 방금 끝난 심리상담 대화를 기록용으로 요약하는 도우미야. "
        f"{who}{particle} 이번 상담에서 어떤 이야기를 했고 어떤 감정을 느꼈는지, "
        "상담사가 어떻게 반응했는지를 한국어 존댓말로 담백하게 요약해. "
        "반드시 2~3문장, 줄바꿈 없이 한 문단으로만 작성하고 절대 그 이상 길게 쓰지 마. "
        "진단이나 평가하는 표현은 쓰지 말고, 실제 대화 내용을 근거로만 작성해."
    )


def _summarize_session(session, user_name: str = "") -> str:
    """상담 대화 히스토리를 바탕으로 짧은 상담 요약을 생성함.
    대화가 비어있으면 굳이 Claude를 호출하지 않음"""
    if session is None or not session.history:
        return ""

    try:
        return call_feely(
            _summary_system_prompt(user_name),
            session.history + [{"role": "user", "content": "지금까지 상담 내용을 2~3문장으로 요약해줘."}],
            max_tokens=160,
        )
    except Exception as err:
        print(f"상담 요약 생성 실패: {err}")
        return ""


def _weekly_summary_system_prompt(user_name: str) -> str:
    who = f"{user_name}님" if user_name else "사용자"
    return (
        "너는 한 주간 진행된 여러 심리상담 세션을 짧게 정리하는 도우미야. "
        "아래는 이번 주 상담 순서대로 나열한 (상담 요약, 그날의 대표 감정) 목록이야. "
        f"{who}을 지칭할 일이 있으면 '{who}'이라고 불러. "
        "반드시 두세 줄(2~3문장) 이내로, 다음 두 가지만 담아 한국어 존댓말로 담백하게 요약해: "
        "1) 이번 주에 어떤 일들이 있었는지 핵심만 간단히, "
        "2) 한 주 동안 감정이 어떻게 변화했는지. "
        "군더더기 없이 짧게 작성하고, 진단하거나 평가하는 표현은 쓰지 마."
    )


# ============================================================
# 엔드포인트
# ============================================================

@app.get("/test")
def test_api():
    # 상담 화면의 서버 상태 표시등(초록/빨강)이 접속 확인용으로 호출함
    return {"message": "Feely AI 서버가 정상적으로 실행 중입니다!"}


@app.post("/emotion", response_model=EmotionResponse)
def emotion_api(data: EmotionRequest):

    # 현재 진행 중인 상담인지 먼저 확인
    # 이미 끝난 상담이면 5초마다 얼굴 정보가 들어와도 분석하지 않음
    if data.sessionId not in counsel_sessions:
        print("[확인] 종료된 상담의 얼굴 분석 요청 무시 =", data.sessionId)
        return EmotionResponse(scores=None)

    # 상담 중 5초마다 카메라 얼굴 정보를 받아 분석
    face_image = decode_base64_image(data.image)

    # 얼굴 랜드마크 추출 및 위치/크기 보정
    feature = extract_landmark_feature(face_image, data.sessionId)
    base_feature = make_ver5_base_feature(feature)

    if base_feature is None:
        # 얼굴을 못 찾은 프레임은 이번 샘플만 건너뜀
        return EmotionResponse(scores=None)

    # 현재 얼굴의 10개 표정 특징 추출
    current_10f = make_ver5_expression_feature(base_feature)

    if current_10f is None:
        return EmotionResponse(scores=None)

    # 상담 시작 후 100초 동안 개인 중립 표정 후보 수집
    start_time = session_neutral_start_times.get(data.sessionId)

    print("[확인] 현재 sessionId =", data.sessionId)
    print("[확인] 중립 시작시간 =", start_time)

    if start_time is not None:
        elapsed_time = time.monotonic() - start_time

        # 상담 시작 후 100초가 지나기 전
        if elapsed_time < 100:
            session_neutral_samples.setdefault(
                data.sessionId,
                []
            ).append(
                current_10f.copy()
            )

        # 상담 시작 후 100초가 지난 경우
        else:

            # 이미 개인 중립 기준이 있으면 그대로 사용
            if data.sessionId in session_neutral_baselines:
                neutral_10f = session_neutral_baselines[data.sessionId]

            # 아직 개인 중립 기준이 없으면 한 번만 생성
            else:
                samples = session_neutral_samples.get(
                    data.sessionId,
                    []
                )

                # 유효한 중립 표정 후보가 최소 10개 필요
                if len(samples) < 10:
                    return EmotionResponse(scores=None)

                # 전체 후보의 특징별 중앙값 계산
                sample_array = np.stack(samples)
                median_10f = np.median(
                    sample_array,
                    axis=0
                )

                # 각 특징의 변화 폭 계산
                mad_10f = np.median(
                    np.abs(sample_array - median_10f),
                    axis=0
                )

                # 0으로 나누는 것 방지
                safe_mad_10f = np.maximum(
                    mad_10f,
                    1e-6
                )

                # 각 후보가 중앙값에서 얼마나 떨어졌는지 계산
                normalized_diff = (
                    sample_array - median_10f
                ) / safe_mad_10f

                distances = np.linalg.norm(
                    normalized_diff,
                    axis=1
                )

                # 중앙값과 가장 가까운 중립 후보 5개 선택
                nearest_indices = np.argsort(
                    distances
                )[:5]

                nearest_5 = sample_array[
                    nearest_indices
                ]

                # 선택된 5개의 중앙값을 개인 중립 기준으로 확정
                neutral_10f = np.median(
                    nearest_5,
                    axis=0
                ).astype(np.float32)

                # 개인 중립 기준 저장
                session_neutral_baselines[
                    data.sessionId
                ] = neutral_10f

                print("[확인] 개인 중립 기준 생성 완료")
                print("[확인] 전체 중립 후보 개수 =", len(samples))
                print("[확인] 최종 선택 샘플 개수 =", len(nearest_5))
                print("[확인] neutral_10f =", neutral_10f)

    # 개인 중립 기준이 아직 만들어지지 않았으면
    # 얼굴 감정분석을 기다림
    if data.sessionId not in session_neutral_baselines:
        return EmotionResponse(scores=None)

    # 현재 얼굴 10개 특징에서 개인 중립 기준을 빼서
    # 평소 중립 표정과 비교해 얼마나 변했는지 계산
    neutral_10f = session_neutral_baselines[data.sessionId]
    delta_10f = current_10f - neutral_10f

    print("[확인] 현재 current_10f =", current_10f)
    print("[확인] 개인 neutral_10f =", neutral_10f)
    print("[확인] 계산된 delta_10f =", delta_10f)

    # 중립 표정과의 변화량을 학습된 6감정 모델에 전달
    scores = predict_emotion_from_delta(delta_10f)

    return EmotionResponse(scores=scores)


@app.post("/chat", response_model=ChatResponse)
def chat_api(data: ChatRequest):
    if data.sessionId not in chat_sessions:
        chat_sessions[data.sessionId] = FeelySession()

    session = chat_sessions[data.sessionId]
    reply = session.send(data.message)

    return ChatResponse(reply=reply)


@app.post("/counsel/start")
def counsel_start(data: CounselStartRequest):
    counsel_sessions[data.sessionId] = {
        "startTime": datetime.now(KST),
        "emotionSamples": [],
    }

    # 개인 중립 기준 수집 시작
    session_neutral_samples[data.sessionId] = []
    session_neutral_baselines.pop(data.sessionId, None)
    session_neutral_start_times[data.sessionId] = time.monotonic()

    return {"ok": True}


@app.post("/counsel/initial-emotion", response_model=InitialEmotionResponse)
def counsel_initial_emotion(data: InitialEmotionRequest):
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
    session_data = counsel_sessions.setdefault(
        data.sessionId,
        {"startTime": datetime.now(KST), "emotionSamples": []},
    )
    session_data["emotionSamples"].append(data.scores)
    return {"ok": True}


@app.post("/counsel/finish", response_model=CounselSummaryResponse)
def counsel_finish(data: CounselFinishRequest):
    session_data = counsel_sessions.pop(
        data.sessionId,
        {"startTime": datetime.now(KST), "emotionSamples": []},
    )
    # 챗봇 대화 이력도 여기서 같이 정리함 (예전엔 abort 때만 지워져서 정상 종료 시 계속 쌓이는 누수가 있었음)
    chat_session = chat_sessions.pop(data.sessionId, None)

    # 개인 중립 데이터 삭제
    session_neutral_samples.pop(data.sessionId, None)
    session_neutral_baselines.pop(data.sessionId, None)
    session_neutral_start_times.pop(data.sessionId, None)

    release_session_landmarker(data.sessionId)

    return CounselSummaryResponse(
        counselDate=session_data["startTime"].strftime("%Y-%m-%d %H:%M:%S"),
        summary=_summarize_session(chat_session, data.userName or ""),
        emotionScores=_average_emotion_scores(session_data["emotionSamples"]),
        status=data.status,
    )


@app.post("/counsel/abort")
def counsel_abort(data: CounselAbortRequest):
    counsel_sessions.pop(data.sessionId, None)
    chat_sessions.pop(data.sessionId, None)

    # 개인 중립 데이터 삭제
    session_neutral_samples.pop(data.sessionId, None)
    session_neutral_baselines.pop(data.sessionId, None)
    session_neutral_start_times.pop(data.sessionId, None)

    release_session_landmarker(data.sessionId)
    return {"ok": True}


@app.post("/counsel/weekly-summary", response_model=WeeklySummaryResponse)
def counsel_weekly_summary(data: WeeklySummaryRequest):
    # 저장/캐시는 백엔드(Spring) DB가 담당하므로 여기서는 텍스트 생성만 함
    lines = [f"- ({item.emotion}) {item.summary}" for item in data.items if item.summary and item.summary.strip()]

    if not lines:
        return WeeklySummaryResponse(summary="")

    try:
        summary_text = call_feely(
            _weekly_summary_system_prompt(data.userName or ""),
            [{"role": "user", "content": "\n".join(lines)}],
            max_tokens=220,
        )
    except Exception as err:
        print(f"주간 요약 생성 실패: {err}")
        return WeeklySummaryResponse(summary="")

    return WeeklySummaryResponse(summary=summary_text)
