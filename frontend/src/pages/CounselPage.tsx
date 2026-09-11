import { useState } from "react";

export default function CounselPage() {
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [inputText, setInputText] = useState("");

  // 팀원 시연용 목업 대화 데이터
  const [messages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "안녕하세요, 병욱님! 오늘 표정에서 약간의 피로감이 느껴지네요. 오늘 하루 어떤 일이 있으셨나요?",
      time: "오후 4:32",
      emotionTag: "피로/긴장 감지",
    },
    {
      id: 2,
      sender: "user",
      text: "오늘 프로젝트 회의도 길었고, 계속 화면만 보고 있었더니 눈도 피곤하고 조금 지치네요.",
      time: "오후 4:33",
    },
    {
      id: 3,
      sender: "ai",
      text: "하루 종일 집중하시느라 정말 고생 많으셨어요. 말씀하시는 동안 표정이 조금 더 부드러워지셨네요! 잠시 어깨에 힘을 빼고 편안하게 이야기 나눠볼까요?",
      time: "오후 4:33",
      emotionTag: "안도/편안함 상승",
    },
  ]);

  // 팀원 시연용 실시간 감정 확률 목업 데이터
  const emotionStats = [
    { label: "😌 편안함", score: 58, color: "bg-[#1F6170]" },
    { label: "😃 긍정/행복", score: 24, color: "bg-emerald-500" },
    { label: "😣 피로/긴장", score: 14, color: "bg-amber-500" },
    { label: "😢 슬픔/우울", score: 4, color: "bg-rose-400" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      
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
                카메라 사용중
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              사용자의 얼굴 표정과 대화를 종합 분석하여 맞춤형 상담을 진행합니다.
            </p>
          </div>
        </div>

        {/* 세션 컨트롤 버튼들 */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
            ⏱️ 08:42 진행 중
          </span>
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 rounded-lg transition-colors"
          >
            상담 종료
          </button>
        </div>
      </div>

      {/* 2. 메인 컨텐츠 영역: 좌측 웹캠/분석 + 우측 AI 채팅 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ===================== 좌측: 웹캠 & 실시간 표정 분석 대시보드 (5열) ===================== */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 웹캠 비디오 화면 카드 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                📷 실시간 얼굴 영상
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ● 30 FPS 안정적
              </span>
            </div>

            {/* 웹캠 뷰파인더 */}
            <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center border border-gray-800 shadow-inner">
              {isCamOn ? (
                <>
                  {/* 시연용 웹캠 시뮬레이션 화면 */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/40 to-gray-950/80 flex flex-col items-center justify-center text-center p-4">
                    {/* 얼굴 인식 가이드 박스 UI */}
                    <div className="w-44 h-56 border-2 border-dashed border-[#1F6170] rounded-3xl relative flex items-center justify-center animate-pulse">
                      <span className="text-4xl">🧑‍💻</span>
                      <div className="absolute top-2 left-2 bg-[#1F6170]/90 text-white text-[10px] px-2 py-0.5 rounded">
                        Face Tracked
                      </div>
                    </div>
                  </div>

                  {/* 좌측 상단 실시간 감정 태그 */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    주요 감정: <strong>편안함 (58%)</strong>
                  </div>

                  {/* 우측 상단 랜드마크 포인트 표시 */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-cyan-300 px-2.5 py-1 rounded-lg text-[11px] font-mono">
                    Mesh: 468 pts
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 gap-2">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span className="text-xs font-medium">카메라가 꺼져 있습니다</span>
                </div>
              )}
            </div>

            {/* 카메라 & 마이크 제어 바 */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCamOn(!isCamOn)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isCamOn
                      ? "bg-[#1F6170] text-white hover:bg-[#184d59]"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {isCamOn ? "📷 비디오 ON" : "📷 비디오 OFF"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isMicOn
                      ? "bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700"
                      : "bg-red-100 text-red-600 dark:bg-red-950/40"
                  }`}
                >
                  {isMicOn ? "🎙️ 마이크 ON" : "🔇 음소거"}
                </button>
              </div>

              <span className="text-[11px] text-gray-400">
                AI 모델: ResNet / MediaPipe
              </span>
            </div>
          </div>

        </div>

        {/* ===================== 우측: AI 심리상담 대화 인터페이스 (7열) ===================== */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col h-[680px] overflow-hidden">
          
          {/* 챗봇 상단 바 */}
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

            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700 transition-colors"
              title="대화 초기화"
            >
              🔄 다시 시작
            </button>
          </div>

          {/* 채팅 메시지 스크롤 영역 */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* AI 말풍선일 경우 태그 표시 */}
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

                {/* 메시지 말풍선 */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#1F6170] text-white rounded-tr-none font-medium"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>

                {/* 전송 시간 */}
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* 추천 답변 칩(Quick Reply Chips) */}
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

          {/* 하단 입력 영역 */}
          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              
              {/* 음성 입력 버튼 (STT 아이콘) */}
              <button
                type="button"
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-[#1F6170] hover:border-[#1F6170] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shrink-0"
                title="음성으로 말하기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* 텍스트 입력창 */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="마음속에 있는 생각이나 감정을 자유롭게 적어보세요..."
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F6170] focus:border-transparent transition-all"
              />

              {/* 전송 버튼 */}
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
