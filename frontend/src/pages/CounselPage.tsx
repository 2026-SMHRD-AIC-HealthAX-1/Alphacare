import { useState, useRef, useEffect } from "react";
import { sendChatMessage, checkServerHealth } from "../API/ai";
import { sendEmotionFrame } from "../API/emotion";
import {
  startCounselSession,
  sendEmotionSample,
  finishCounselSession,
  getInitialEmotion,
  COUNSEL_ABORT_BEACON_URL,
  CounselSummaryResult,
} from "../API/counselSession";
import { saveCounselRecord } from "../API/counsel";
import { EMOTION_LABELS } from "../utils/emotion";
import { useNavigate, unstable_usePrompt } from "react-router-dom";
import Cookies from "js-cookie";
import FeelyLogo2 from "../assets/Feely_Logo_2.png";
import { showToast } from "../utils/toast";

// 4-4-4-4 박스 호흡법 단계 (각 4초씩 반복)
const BREATH_PHASES: { label: string; scale: string }[] = [
  { label: "천천히 숨을 들이쉬세요", scale: "scale-125" },
  { label: "잠시 멈추세요", scale: "scale-125" },
  { label: "천천히 숨을 내쉬세요", scale: "scale-75" },
  { label: "잠시 멈추세요", scale: "scale-75" },
];

// 빠른 답변 칩 (text: 메시지 전송, action: 호흡 가이드 열기)
const QUICK_REPLIES: { label: string; text?: string; action?: "breathing" }[] = [
  { label: "🌫️ 감정 표현이 어려워요", text: "지금 기분을 뭐라고 표현해야 할지 모르겠어요" },
  { label: "💬 그냥 들어주세요", text: "조언 말고 그냥 들어주세요" },
  { label: "🧭 조언이 필요해요", text: "제가 어떻게 하면 좋을지 조언해주세요" },
  { label: "🎯 작은 목표 정하기", text: "오늘 실천할 작은 목표 하나 정하고 싶어요" },
  { label: "📋 대화 요약해줘", text: "지금까지 한 얘기 요약해줘" },
  { label: "🌿 호흡 가이드 시작하기", action: "breathing" },
  { label: "🕊️ 오늘은 여기까지", text: "오늘은 여기까지 하고 싶어요" },
];

// 감정 코드(e01~e06) -> 한글 라벨
const EMOTION_LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  EMOTION_LABELS.map((item) => [String(item.key).replace("Rate", ""), item.label])
);

// 상담 세션 ID 생성 (randomUUID 미지원 환경은 대체값 사용)
const createSessionId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// 카메라 없이 상담 시작 (시작 시각 기록 + 오늘의 기분 텍스트로 첫 감정 계산)
const startCounselWithoutCamera = (sessionId: string, moodText: string) => {
  startCounselSession(sessionId).catch((err) => {
    console.warn("상담 시작 기록 실패:", err);
  });
  getInitialEmotion(sessionId, moodText)
    .then((scores) => sendEmotionSample(sessionId, scores))
    .catch((err) => {
      console.debug("첫 감정 계산 실패:", err);
    });
};

interface Message {
  id: number;
  sender: "ai" | "user";
  text: string;
  time: string;
  emotionTag?: string;
}

export default function CounselPage() {
  const navigate = useNavigate();

  // 카메라 켜짐 여부 (모달에서 선택 전까지 꺼짐)
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [inputText, setInputText] = useState("");

  // 초기 모달 단계 (camera: 카메라 사용 선택, mood: 기분 입력) - 카메라를 먼저 물어봐야
  // 기분을 입력하는 동안 백그라운드에서 표정 기준점 수집을 미리 시작할 수 있음
  const [isInitialModalOpen, setIsInitialModalOpen] = useState(true);
  const [preCounselStep, setPreCounselStep] = useState<"mood" | "camera">("camera");
  const [initialMoodText, setInitialMoodText] = useState("");


  // 카메라 연결 실패 안내 문구
  const [cameraError, setCameraError] = useState<string | null>(null);
  // 카메라 목록 / 선택한 카메라
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // 마이크 장치 선택 + 입력 감도(볼륨) 표시용
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [micVolume, setMicVolume] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // 내 얼굴 화면 숨김 여부 (분석은 계속 진행)
  const [isSelfViewHidden, setIsSelfViewHidden] = useState(false);

  // 실시간 주요 감정 표시값
  const [latestEmotion, setLatestEmotion] = useState<{ label: string; percent: number } | null>(null);
  // 챗봇 서버 연결 상태 (표시등)
  const [isServerOnline, setIsServerOnline] = useState(true);
  // 호흡 가이드 모달 열림 여부 / 현재 단계
  const [isBreathingGuideOpen, setIsBreathingGuideOpen] = useState(false);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  // 채팅 목록 스크롤 컨테이너
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  // 음성인식 인스턴스
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isNormalExit = useRef(false);
  // 상담 시작 처리 여부 (중복 시작 방지)
  const counselStartedRef = useRef(false);
  // 상담 종료 요약 결과 (저장 재시도 시 재사용)
  const summaryRef = useRef<CounselSummaryResult | null>(null);
  // 상담 종료 처리 중 여부 (중복 저장 방지)
  const isFinishingRef = useRef(false);
  // 상담 종료 후 요약/저장 진행 안내 문구 (null이면 안내창 숨김)
  const [savingMessage, setSavingMessage] = useState<string | null>(null);
  // 감정분석 요청이 아직 응답 전인지 (응답이 늦을 때 요청이 계속 쌓이지 않게 함)
  const emotionRequestPendingRef = useRef(false);
  // 상담 시작 시점 캡처 이미지
  const startImageRef = useRef<string | null>(null);
  // 상담 세션 ID (챗봇 대화/감정 샘플 구분)
  const chatSessionIdRef = useRef<string>(createSessionId());

  // 1. 웹캠 연결 (전면 카메라 우선, 실패 시 기본 옵션으로 재시도)
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const stopStream = (s: MediaStream | null) => {
      s?.getTracks().forEach((track) => track.stop());
    };

    // 카메라 오류 종류별 안내 문구
    const describeError = (err: unknown): string => {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          return "카메라 권한이 거부되었습니다. 브라우저/기기 설정에서 카메라 권한을 허용해주세요.";
        }
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          return "사용 가능한 카메라를 찾을 수 없습니다.";
        }
        if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          return "카메라가 다른 프로그램에서 사용 중입니다. 다른 앱(화상회의, 다른 브라우저 탭 등)을 종료한 후 다시 시도해주세요.";
        }
      }
      return "카메라를 연결할 수 없습니다.";
    };

    const startCamera = async () => {
      setCameraError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        // getUserMedia 미지원 환경 (비보안 접속, 구형 브라우저)
        setCameraError("이 브라우저/접속 환경에서는 카메라를 사용할 수 없습니다. (HTTPS 접속이 필요할 수 있습니다)");
        return;
      }

      try {
        if (selectedCameraId) {
          // 선택한 카메라로 연결
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedCameraId } },
            audio: false,
          });
        } else {
          // 1차: 전면 카메라 요청
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "user" } },
            audio: false,
          });
        }
      } catch {
        try {
          // 2차: 기본 옵션으로 재시도
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (err) {
          if (cancelled) return;
          console.warn("웹캠 연결 실패:", err);
          setCameraError(describeError(err));
          stream = null;
          return;
        }
      }

      if (cancelled) {
        stopStream(stream);
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 연결 성공 후 카메라 목록 갱신
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          setCameraDevices(devices.filter((d) => d.kind === "videoinput"));
        }
      } catch {
        // 목록 조회 실패는 무시
      }
    };

    if (isCamOn) {
      startCamera();
    }

    return () => {
      cancelled = true;
      stopStream(stream);
    };
  }, [isCamOn, selectedCameraId]);

  // 챗봇 서버 상태 5초마다 확인
  useEffect(() => {
    let cancelled = false;

    const check = () => {
      checkServerHealth().then((online) => {
        if (!cancelled) setIsServerOnline(online);
      });
    };

    check();
    const intervalId = window.setInterval(check, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  // 호흡 가이드 단계 4초마다 전환
  useEffect(() => {
    if (!isBreathingGuideOpen) return;

    const intervalId = window.setInterval(() => {
      setBreathPhaseIndex((prev) => (prev + 1) % BREATH_PHASES.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [isBreathingGuideOpen]);

  // 2. 마이크 음성인식 (Web Speech API)
  useEffect(() => {
    if (!isMicOn) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    // 사용자가 마이크를 직접 끄거나(cleanup) 진짜 오류가 난 경우에만 true로 바뀜.
    // 브라우저가 일정 시간마다 세션을 제멋대로 끊는 건 정상 동작이라 이 값이 false로 남아있고,
    // 그 경우 onend에서 바로 재시작해서 사용자 입장에선 마이크가 계속 켜진 것처럼 보이게 함
    let stoppedIntentionally = false;

    // 인식된 음성을 입력창에 반영
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };

    // 무음(no-speech)/재시작 중 중단(aborted)은 정상 흐름이라 마이크를 끄지 않음
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.warn("음성 인식 오류:", event.error);
      stoppedIntentionally = true;
      setIsMicOn(false);
    };

    recognition.onend = () => {
      if (!stoppedIntentionally) {
        try {
          recognition.start();
        } catch {
          // 이미 시작 중인 경우 등은 무시
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      stoppedIntentionally = true;
      recognition.stop();
    };
  }, [isMicOn]);

  // 2-0. 마이크 사용 중 일정 시간 새로운 음성이 없으면 엔터를 누른 것처럼 자동 전송
  useEffect(() => {
    if (!isMicOn || !inputText.trim()) return;

    const timeoutId = window.setTimeout(() => {
      handleSendMessage();
      inputRef.current?.focus();
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isMicOn, inputText]);

  // 2-1. 마이크 입력 감도(음량) 측정 + 장치 목록 갱신
  // 주의: SpeechRecognition API 자체는 입력 장치를 지정할 방법이 없어서(OS/브라우저 기본 마이크 고정)
  // 아래 장치 선택은 이 볼륨 미터에만 적용되고, 실제 음성 인식 입력 장치까지 강제로 바꾸지는 못함
  useEffect(() => {
    if (!isMicOn) {
      setMicVolume(0);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let rafId = 0;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
        });
      } catch (err) {
        console.warn("마이크 볼륨 측정용 연결 실패:", err);
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // 마이크 장치 목록 갱신 (권한 허용 후에만 label이 채워짐)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setMicDevices(devices.filter((d) => d.kind === "audioinput"));
      } catch {
        // 목록 조회 실패는 무시
      }

      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const normalized = (data[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        setMicVolume(Math.min(100, Math.round(rms * 300)));
        rafId = requestAnimationFrame(tick);
      };
      tick();
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      audioContext?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isMicOn, selectedMicId]);

  // 3. 현재 비디오 프레임을 base64(JPEG)로 캡처 (카메라 꺼짐 시 null)
  const captureFrame = (): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 미리보기와 같은 방향으로 좌우반전
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  };


  // 4. 1초마다 웹캠 프레임 감정분석 후 감정 샘플 전달
  // 카메라를 켠 순간부터 바로 시작함 - 기분 입력 모달이 떠 있는 동안에도 백그라운드에서
  // 계속 전송돼서, 개인 중립 표정 기준점(NEUTRAL_SAMPLE_TARGET장)이 그 사이에 다 모임
  useEffect(() => {
    if (!isCamOn) return;

    const intervalId = window.setInterval(() => {
      // 이전 프레임 응답 대기 중이거나 상담 종료 버튼을 누른 뒤면 보내지 않음
      if (emotionRequestPendingRef.current || isNormalExit.current) return;

      const frame = captureFrame();
      if (!frame) return;

      emotionRequestPendingRef.current = true;
      sendEmotionFrame({ sessionId: chatSessionIdRef.current, image: frame })
        .then((result) => {
          if (!result.scores || isNormalExit.current) return;

          sendEmotionSample(chatSessionIdRef.current, result.scores).catch((err) => {
            console.debug("감정 샘플 전달 실패:", err);
          });

          const topEntry = Object.entries(result.scores).sort((a, b) => b[1] - a[1])[0];
          if (topEntry) {
            const [code, value] = topEntry;
            setLatestEmotion({
              label: EMOTION_LABEL_BY_CODE[code] ?? code,
              percent: Math.round(value * 100),
            });
          }
        })
        .catch((err) => {
          // 감정분석 서버 오류는 상담 진행에 영향 없음
          console.debug("감정분석 서버 응답 없음:", err);
        })
        .finally(() => {
          emotionRequestPendingRef.current = false;
        });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isCamOn]);

  // 5. 이탈 경고 및 이탈 시 FastAPI 세션 정리
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isNormalExit.current) {
        e.preventDefault();
        e.returnValue = "상담 종료 버튼을 누르지 않을 경우 상담 요약이 제대로 이루어지지 않을 수 있습니다.";
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isNormalExit.current) {
        // 종료 버튼 없이 이탈 시 FastAPI 세션 데이터 정리
        const payload = { sessionId: chatSessionIdRef.current };
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon(COUNSEL_ABORT_BEACON_URL, blob);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 5-1. 상담 종료 버튼 없이 페이지를 벗어나려는 경우 경고 (헤더 링크 이동, 뒤로가기/앞으로가기 전부 포함)
  // react-router의 data router 기능이라 App.tsx도 createBrowserRouter로 바꿔놔야 동작함
  unstable_usePrompt({
    when: ({ currentLocation, nextLocation }) =>
      !isNormalExit.current && currentLocation.pathname !== nextLocation.pathname,
    message: "상담 종료 버튼을 누르지 않을 경우 상담 요약이 정상적으로 저장되지 않을 수 있습니다. 그래도 이동하시겠습니까?",
  });

  // 6. 카메라 사용 여부 선택 후 기분 입력 단계로 이동 (카메라를 켰다면 이 시점부터
  // 백그라운드에서 프레임 전송이 시작돼 기분 입력하는 동안 중립 기준점이 모임)
  const handleCameraChoice = (useCamera: boolean) => {
    setIsCamOn(useCamera);
    setPreCounselStep("mood");
  };

  // 오늘의 기분 제출 -> 실제 상담 시작 (카메라 사용 시 이 시점 프레임 + 기분 텍스트로 첫 감정 계산)
  const handleMoodSubmit = () => {
    if (!initialMoodText.trim()) {
      showToast("오늘의 기분이나 일상을 간단히 입력해주세요!", "info");
      return;
    }

    if (isCamOn && !cameraError) {
      const frame = captureFrame();
      // 기분 입력(질의응답)이 끝나는 시점 - 지금까지 모은 표정 샘플로 중립 기준점을 확정하도록 신호를 보냄
      const initialScores = frame
        ? sendEmotionFrame({ sessionId: chatSessionIdRef.current, image: frame, finalizeNeutral: true }).then((result) => result.scores)
        : Promise.resolve(undefined);

      initialScores
        .then((faceScores) => getInitialEmotion(chatSessionIdRef.current, initialMoodText, faceScores ?? undefined))
        .then((scores) => sendEmotionSample(chatSessionIdRef.current, scores))
        .catch((err) => {
          console.debug("첫 감정 계산 실패:", err);
        });
    } else if (!isCamOn) {
      counselStartedRef.current = true;
      startCounselWithoutCamera(chatSessionIdRef.current, initialMoodText);
    }

    // 첫 대화로 등록
    handleSendMessage(initialMoodText);

    // 모달 닫기
    setIsInitialModalOpen(false);
  };

  // 카메라 연결 실패 시 카메라 없이 상담 시작
  useEffect(() => {
    if (!cameraError || isInitialModalOpen || counselStartedRef.current) return;
    counselStartedRef.current = true;
    startCounselWithoutCamera(chatSessionIdRef.current, initialMoodText);
  }, [cameraError, isInitialModalOpen, initialMoodText]);

  // 마이크 켜기/끄기 (음성인식 미지원 브라우저는 안내)
  const toggleMic = () => {
    if (!isMicOn && !(window.SpeechRecognition || window.webkitSpeechRecognition)) {
      showToast("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome에서 사용해주세요.", "info");
      return;
    }
    setIsMicOn(!isMicOn);
  };

  // 7. 상담 종료: 요약 계산 후 회원이면 DB 저장 (비회원은 저장 없이 메인 이동)
  const handleFinishCounseling = async () => {
    if (isFinishingRef.current) return;
    if (!window.confirm("상담을 종료하시겠습니까?")) return;

    isNormalExit.current = true;

    const isLoggedIn = Cookies.get("isLoggedIn") === "true";
    if (!isLoggedIn) {
      finishCounselSession(chatSessionIdRef.current, "ABORTED").catch((err) => {
        console.warn("상담 세션 정리 실패:", err);
      });
      navigate("/");
      return;
    }

    const endImage = captureFrame();
    isFinishingRef.current = true;

    try {
      if (!summaryRef.current) {
        setSavingMessage("오늘 나눈 이야기를 요약하고 있어요");
        summaryRef.current = await finishCounselSession(
          chatSessionIdRef.current,
          "COMPLETED",
          Cookies.get("userId")
        );
      }
      setSavingMessage("상담 기록을 저장하고 있어요");
      const result = await saveCounselRecord(summaryRef.current, startImageRef.current, endImage);
      if (!result) return;

      if (result.counselFlag) {
        showToast("상담이 정상적으로 종료되었습니다.", "success");
        navigate("/");
      } else {
        showToast("상담 데이터 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("상담 데이터 전송 실패:", error);
      showToast("데이터 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      isFinishingRef.current = false;
      setSavingMessage(null);
    }
  };

  // 8. 대화 목록 및 메시지 전송
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // 새 메시지 시 채팅 컨테이너만 맨 아래로 스크롤
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const timeString = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: textToSend,
      time: timeString,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText("");

    // 챗봇 서버에 메시지 전송 후 응답 추가
    try {
      const result = await sendChatMessage({
        sessionId: chatSessionIdRef.current,
        message: textToSend,
      });

      const aiReply: Message = {
        id: Date.now() + 1,
        sender: "ai",
        text: result.reply,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (error) {
      console.error("AI 챗봇 응답 오류:", error);
      const errorReply: Message = {
        id: Date.now() + 1,
        sender: "ai",
        text: "죄송해요, 지금 응답을 받아오는 데 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorReply]);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6 relative">

      {/* 초기 기분 입력 / 카메라 사용 확인 모달 */}
      {isInitialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {preCounselStep === "mood" ? (
              <>
                <div className="text-center">
                  <span className="block text-4xl mb-2.5">👋</span>
                  <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    오늘 하루는 어떠셨나요?
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    상담을 시작하기 전
                    <br />
                    오늘 있었던 일이나 지금 느끼는 감정을 편하게 남겨주세요.
                  </p>
                </div>

                <textarea
                  rows={3}
                  value={initialMoodText}
                  onChange={(e) => setInitialMoodText(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter: 제출, Shift+Enter: 줄바꿈
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleMoodSubmit();
                    }
                  }}
                  placeholder="예: 오늘 프로젝트 회의가 길어져서 조금 피곤해요..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-2 focus:border-[#0D9488] resize-none"
                />

                <button
                  type="button"
                  onClick={handleMoodSubmit}
                  className="w-full py-3 bg-[#0D9488] hover:bg-[#0F766E] text-white font-medium rounded-xl transition-all shadow-md active:scale-98"
                >
                  상담 시작하기
                </button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <span className="block text-4xl mb-2.5">📷</span>
                  <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    카메라를 사용하시겠어요?
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    표정을 함께 분석하면 더 정확한 상담이 가능해요.
                    <br />
                    원치 않으시면 대화만으로도 진행할 수 있어요.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleCameraChoice(false)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all"
                  >
                    사용 안 함
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCameraChoice(true)}
                    className="flex-1 py-3 bg-[#0D9488] hover:bg-[#0F766E] text-white font-medium rounded-xl transition-all shadow-md active:scale-98"
                  >
                    사용하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 상담 종료 후 요약/저장 중 안내 (저장이 끝날 때까지 화면 조작 막음) */}
      {savingMessage && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="status" aria-live="polite">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full px-6 py-8 shadow-2xl flex flex-col items-center gap-5 text-center">
            <span className="w-12 h-12 rounded-full border-4 border-[#0D9488]/20 border-t-[#0D9488] animate-spin" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">저장 중입니다</h2>
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">{savingMessage}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">창을 닫거나 이동하지 말고 잠시만 기다려주세요.</p>
            </div>
          </div>
        </div>
      )}

      {/* 호흡 가이드 모달 */}
      {isBreathingGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#1F6170]/10 dark:bg-cyan-400/10 flex items-center justify-center shrink-0">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1F6170] dark:bg-cyan-400 transition-transform duration-[4000ms] ease-in-out ${BREATH_PHASES[breathPhaseIndex].scale}`}
              />
            </div>

            <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100 text-center">
              {BREATH_PHASES[breathPhaseIndex].label}
            </p>

            <button
              type="button"
              onClick={() => setIsBreathingGuideOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 1. 상단 상태 헤더 바 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 ml-5">
          <div className="relative flex h-3.5 w-3.5 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isServerOnline ? "bg-emerald-400" : "bg-red-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isServerOnline ? "bg-emerald-500" : "bg-red-500"}`}
              title={isServerOnline ? "AI 서버 연결됨" : "AI 서버 연결 안 됨"}
            ></span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Feely 실시간 AI 심리상담실
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              사용자의 얼굴 표정과 대화를 종합 분석하여 맞춤형 상담을 진행합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleFinishCounseling}
            className="px-4 py-3 text-xs sm:text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0 mr-5"
          >
            상담 종료
          </button>
        </div>
      </div>

      {/* 2. 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* 좌측: 웹캠 / 실시간 표정 분석 - 좌우로 나뉘는 lg 이상에서만 스크롤해도 따라오게 고정 */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-[86px] lg:self-start">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                실시간 얼굴 영상
              </span>
            </div>

            <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center border border-gray-800 shadow-inner">
              {cameraError ? (
                <div className="flex flex-col items-center text-gray-400 gap-2 px-4 text-center">
                  <span className="text-xs font-medium">{cameraError}</span>
                </div>
              ) : isCamOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    // scroll 중 Chrome이 transform 걸린 video를 재합성하지 않아 화면에 고정돼 보이는 버그 방지
                    className="w-full h-full object-cover transform -scale-x-100 will-change-transform"
                    onLoadedData={() => {
                      // 첫 프레임을 시작 이미지로 캡처하고 상담 시작 기록
                      // (첫 감정 계산은 오늘의 기분 제출 시점에 별도로 찍은 프레임으로 처리함)
                      if (!counselStartedRef.current) {
                        const frame = captureFrame();
                        if (frame) {
                          counselStartedRef.current = true;
                          startImageRef.current = frame;
                          startCounselSession(chatSessionIdRef.current).catch((err) => {
                            console.warn("상담 시작 기록 실패:", err);
                          });
                        }
                      }
                    }}
                  />

                  {!isInitialModalOpen && (
                    <>
                      <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        {latestEmotion ? (
                          <>
                            주요 감정: <strong>{latestEmotion.label} ({latestEmotion.percent}%)</strong>
                          </>
                        ) : (
                          "감정 분석 대기 중..."
                        )}
                      </div>
                    </>
                  )}

                  {/* 내 얼굴 화면 숨기기 버튼 */}
                  <button
                    type="button"
                    onClick={() => setIsSelfViewHidden((prev) => !prev)}
                    className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    title={isSelfViewHidden ? "내 화면 보기" : "내 화면 숨기기"}
                  >
                    {isSelfViewHidden ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>

                  {/* 숨김 상태 오버레이 */}
                  {isSelfViewHidden && (
                    <div className="absolute inset-0 z-10 bg-gray-900/95 flex flex-col items-center justify-center gap-2 text-gray-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                      <span className="text-xs font-medium">내 화면을 숨겼어요 (분석은 계속 진행돼요)</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 gap-2">
                  <span className="text-xs font-medium">카메라가 꺼져 있습니다</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                type="button"
                onClick={() => setIsCamOn(!isCamOn)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${isCamOn
                  ? "bg-[#0D9488] text-white hover:bg-[#184d59]"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
              >
                {isCamOn ? "📷 비디오 ON" : "📷 비디오 OFF"}
              </button>

              {/* 카메라 선택 (여러 대일 때) */}
              {isCamOn && cameraDevices.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  title="사용할 카메라 선택"
                >
                  <option value="">자동 선택</option>
                  {cameraDevices.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `카메라 ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* 우측: AI 채팅 영역 */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col h-[75vh] min-h-[420px] lg:h-[680px] overflow-hidden">

          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/70">
            <div className="flex items-center gap-3">
              <img
                src={FeelyLogo2}
                alt="Feely AI 상담사"
                className="h-8 w-auto max-w-[100px] object-contain shrink-0"
              />
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  AI 상담사
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  공감형 대화 및 맞춤 심리 케어
                </p>
              </div>
            </div>
          </div>

          <div ref={chatContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="flex items-center gap-2 mb-1 pl-1">
                    <span className="text-xs font-bold text-[#1F6170] dark:text-cyan-300">
                      Feely AI
                    </span>
                    {msg.emotionTag && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-[#1F6170] dark:text-cyan-300 border border-[#1F6170]/20 font-medium">
                        🔍 {msg.emotionTag}
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                    ? "bg-[#0D9488] text-white rounded-tr-none font-medium"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-tl-none"
                    }`}
                >
                  {msg.text}
                </div>

                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* 추천 답변 칩 */}
          <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-gray-400 shrink-0">빠른 답변:</span>
            {QUICK_REPLIES.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.action === "breathing") {
                    setBreathPhaseIndex(0);
                    setIsBreathingGuideOpen(true);
                  } else if (item.text) {
                    handleSendMessage(item.text);
                  }
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-[#1F6170]/10 hover:text-[#1F6170] dark:hover:bg-[#1F6170]/30 dark:hover:text-cyan-300 text-gray-600 dark:text-gray-300 whitespace-nowrap transition-colors shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
                // 전송 후에도 커서를 입력창에 유지 (마이크로 계속 말하면서 보낼 때 다시 클릭 안 해도 되게)
                inputRef.current?.focus();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2.5 rounded-xl border transition-all shrink-0 flex items-center justify-center ${isMicOn
                    ? "bg-red-500 border-red-500 text-white shadow-sm animate-pulse"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-[#1F6170] hover:border-[#0D9488] hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                title={isMicOn ? "마이크 끄기" : "마이크 켜기"}
              >
                {isMicOn ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 10v1a7 7 0 01-14 0v-1" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18v4M8 22h8" />
                    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isMicOn ? "음성을 듣고 있습니다..." : "마음속에 있는 생각이나 감정을 자유롭게 적어보세요."}
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F6170] focus:border-transparent transition-all"
              />

              <button
                type="submit"
                className="p-2.5 bg-[#0D9488] text-white rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm shrink-0 flex items-center justify-center"
                title="메시지 전송"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.77 59.77 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </form>

            {isMicOn && (
              <div className="flex items-center gap-2 mt-2 px-1">
                {micDevices.length > 1 && (
                  <select
                    value={selectedMicId}
                    onChange={(e) => setSelectedMicId(e.target.value)}
                    className="min-w-0 px-2 py-1 rounded-lg text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    title="사용할 마이크 선택"
                  >
                    <option value="">자동 선택</option>
                    {micDevices.map((device, idx) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `마이크 ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[10px] text-gray-400 shrink-0">입력 감도</span>
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0D9488] transition-[width] duration-100"
                    style={{ width: `${micVolume}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              음성 인식(마이크 입력)은 Chrome 브라우저에서만 지원됩니다.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
