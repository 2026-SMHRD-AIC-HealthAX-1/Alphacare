import { useState, useRef, useEffect } from "react";
import { sendCounselData, CounselDataPayload } from "../API/counsel";
import { useNavigate } from "react-router-dom";

interface Message {
  id: number;
  sender: "ai" | "user";
  text: string;
  time: string;
  emotionTag?: string;
}

// 백엔드 전송용 페이로드에 이미지 필드 확장
interface ExtendedCounselDataPayload extends CounselDataPayload {
  startImage?: string | null;
  endImage?: string | null;
}

export default function CounselPage() {
  const navigate = useNavigate();

  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [inputText, setInputText] = useState("");

  // 초기 기분 입력 모달 상태
  const [isInitialModalOpen, setIsInitialModalOpen] = useState(true);
  const [initialMoodText, setInitialMoodText] = useState("");

  // 시작 / 종료 표정 테스트용 데이터 State
  const [startImage, setStartImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const isNormalExit = useRef(false);

  // 1. 웹캠 미디어 스트림 제어
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isCamOn) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((userStream) => {
          stream = userStream;
          if (videoRef.current) {
            videoRef.current.srcObject = userStream;
          }
        })
        .catch((err) => {
          console.warn("웹캠을 연결할 수 없어 테스트 모드로 진행합니다:", err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCamOn]);

  // 2. 테스트 데이터 생성 함수
  const getMockCounselData = (status: "COMPLETED" | "ABORTED"): CounselDataPayload => {
    const now = new Date();
    const formattedDate = now.toISOString().replace("T", " ").substring(0, 19);

    return {
      counselId: 101,
      userId: 1,
      counselDate: formattedDate,
      sessionTurn: 1,
      summary:
        status === "COMPLETED"
          ? "오늘 길어진 업무 회의로 눈과 마음의 피로감을 호소했으나, 공감 대화를 통해 편안함과 안도감을 회복함."
          : "상담 진행 중 비정상 이탈 발생 (이탈 시점까지의 데이터)",
      emotionCategory: "편안함",
      emotionScore: 58,
      status,
    };
  };

  // 3. 이탈 감지 및 sendBeacon 전송
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isNormalExit.current) {
        e.preventDefault();
        e.returnValue = "상담 종료 버튼을 누르지 않을 경우 상담 요약이 제대로 이루어지지 않을 수 있습니다.";
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isNormalExit.current) {
        const payload: ExtendedCounselDataPayload = {
          ...getMockCounselData("ABORTED"),
          startImage: startImage || "startImg",
          endImage: "endImg",
        };
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon("/api/counsel", blob);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startImage]);

  // 4. 초기 기분 제출 및 상담/표정분석 시작 (테스트용 이미지 데이터 전달)
  const handleStartCounseling = () => {
    if (!initialMoodText.trim()) {
      alert("오늘의 기분이나 일상을 간단히 입력해주세요!");
      return;
    }

    // 테스트용 더미 데이터 세팅
    setStartImage("startImg");

    // 첫 대화로 등록
    handleSendMessage(initialMoodText);

    // 모달 닫기
    setIsInitialModalOpen(false);
  };

  // 5. 상담 종료 핸들러 (테스트용 이미지 데이터 전달)
  const handleFinishCounseling = async () => {
    if (!window.confirm("상담을 종료하시겠습니까?")) return;

    isNormalExit.current = true;

    const payload: ExtendedCounselDataPayload = {
      ...getMockCounselData("COMPLETED"),
      startImage: startImage || "startImg",
      endImage: "endImg",
    };

    try {
      await sendCounselData(payload);
      alert("상담이 정상적으로 종료되었습니다.");
      navigate("/mypage");
    } catch (error) {
      console.error("상담 데이터 전송 실패:", error);
      alert("데이터 전송 중 오류가 발생했습니다.");
    }
  };

  // 6. 대화 목록 및 메시지 전송 로직
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      text: "안녕하세요, 병욱님! 상담 시작 전, 오늘 하루 어떤 일이 있으셨고 기분은 어떠신가요?",
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (customText?: string) => {
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

    setTimeout(() => {
      const aiReply: Message = {
        id: Date.now() + 1,
        sender: "ai",
        text: "말씀해주셔서 감사해요. 솔직한 감정을 나누는 것만으로도 마음이 한결 가벼워질 수 있어요. 표정을 보며 함께 이야기 나눠볼게요.",
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        emotionTag: "초기 표정/감정 분석 완료",
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6 relative">

      {/* 초기 기분 입력 모달 팝업 */}
      {isInitialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <span className="text-4xl">👋</span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                오늘 하루는 어떠셨나요?
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                상담을 시작하기 전, 오늘 있었던 일이나 지금 느끼는 감정을 편하게 남겨주세요.
              </p>
            </div>

            <textarea
              rows={3}
              value={initialMoodText}
              onChange={(e) => setInitialMoodText(e.target.value)}
              placeholder="예: 오늘 프로젝트 회의가 길어져서 조금 피곤해요..."
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F6170] resize-none"
            />

            <button
              type="button"
              onClick={handleStartCounseling}
              className="w-full py-3 bg-[#1F6170] hover:bg-[#184d59] text-white font-medium rounded-xl transition-all shadow-md active:scale-98"
            >
              상담 시작하기 (표정 분석 개시)
            </button>
          </div>
        </div>
      )}

      {/* 1. 상단 상태 헤더 바 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Feely 실시간 AI 심리상담실
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1F6170]/10 text-[#1F6170] dark:bg-[#1F6170]/20 dark:text-cyan-300">
                {isInitialModalOpen ? "대기 중" : "카메라 분석 진행 중"}
              </span>
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
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-lg transition-colors cursor-pointer"
          >
            상담 종료
          </button>
        </div>
      </div>

      {/* 2. 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* 좌측: 웹캠 / 실시간 표정 분석 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                📷 실시간 얼굴 영상
              </span>
            </div>

            <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center border border-gray-800 shadow-inner">
              {isCamOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />

                  {!isInitialModalOpen && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-44 h-56 border-2 border-dashed border-[#1F6170] rounded-3xl relative flex items-center justify-center animate-pulse">
                          <div className="absolute top-2 left-2 bg-[#1F6170]/90 text-white text-[10px] px-2 py-0.5 rounded">
                            Face Tracked
                          </div>
                        </div>
                      </div>

                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        주요 감정: <strong>편안함 (58%)</strong>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 gap-2">
                  <span className="text-xs font-medium">카메라가 꺼져 있습니다</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setIsCamOn(!isCamOn)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${isCamOn
                    ? "bg-[#1F6170] text-white hover:bg-[#184d59]"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
              >
                {isCamOn ? "📷 비디오 ON" : "📷 비디오 OFF"}
              </button>

              <span className="text-[11px] text-gray-400">
                AI 모델: ResNet / MediaPipe
              </span>
            </div>
          </div>
        </div>

        {/* 우측: AI 채팅 영역 */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col h-[680px] overflow-hidden">

          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1F6170] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                Feely
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  Feely AI 상담사
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  공감형 대화 및 맞춤 심리 케어
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
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
                      ? "bg-[#1F6170] text-white rounded-tr-none font-medium"
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
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-[#1F6170]/10 hover:text-[#1F6170] text-gray-600 dark:text-gray-300 whitespace-nowrap transition-colors"
            >
              🌿 호흡 가이드 시작하기
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-[#1F6170]/10 hover:text-[#1F6170] text-gray-600 dark:text-gray-300 whitespace-nowrap transition-colors"
            >
              📝 오늘 고민 구체적으로 쓰기
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-[#1F6170]/10 hover:text-[#1F6170] text-gray-600 dark:text-gray-300 whitespace-nowrap transition-colors"
            >
              ☕ 잠깐 휴식하기
            </button>
          </div>

          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-2.5 rounded-xl border transition-all shrink-0 flex items-center justify-center ${isMicOn
                    ? "bg-red-500 border-red-500 text-white shadow-sm animate-pulse"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-[#1F6170] hover:border-[#1F6170] hover:bg-gray-50 dark:hover:bg-gray-700"
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
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isMicOn ? "음성을 듣고 있습니다..." : "마음속에 있는 생각이나 감정을 자유롭게 적어보세요..."}
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F6170] focus:border-transparent transition-all"
              />

              <button
                type="submit"
                className="p-2.5 bg-[#1F6170] text-white rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm shrink-0 flex items-center justify-center"
                title="메시지 전송"
              >
                <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}