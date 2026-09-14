import { useState } from "react";

export default function EmotionGraph() {
  const [currentWeek, setCurrentWeek] = useState("5월 19일 - 5월 25일");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black-900 dark:text-black-100 pb-2 border-b border-gray-200 dark:border-gray-700">
        감정 그래프
      </h1>

      {/* 주간 감정 리포트 메인 카드 */}
      <div className="border border-gray-300 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-6">
        {/* 날짜 이동 헤더 */}
        <div className="flex items-center justify-center gap-4">
          <button className="text-black-800 hover:text-black dark:text-black-300 dark:hover:text-white font-bold text-lg">&lt;</button>
          <span className="text-lg font-bold text-black-900 dark:text-black-100">{currentWeek}</span>
          <button className="text-black-800 hover:text-black dark:text-black-300 dark:hover:text-white font-bold text-lg">&gt;</button>
        </div>

        {/* 그래프 영역 */}
        <div className="border border-gray-300 dark:border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-black-900 dark:text-black-100 mb-4">일주일 동안의 감정 변화</h3>

          <div className="flex h-56 items-stretch">
            {/* Y축 범주 */}
            <div className="flex flex-col justify-between text-xs text-black-900 dark:text-black-100 pr-4 border-r border-gray-300 dark:border-gray-700 font-bold">
              <span className="flex items-center gap-1">😀 매우 행복</span>
              <span className="flex items-center gap-1">🙂 행복</span>
              <span className="flex items-center gap-1">😐 보통</span>
              <span className="flex items-center gap-1">😡 불안</span>
              <span className="flex items-center gap-1">😭 매우 우울</span>
            </div>

            {/* 차트 시각화 (더미 차트 영역) */}
            <div className="flex-1 flex flex-col justify-between pl-4 relative">
              <div className="w-full border-b border-dashed border-gray-300 dark:border-gray-700 h-0"></div>
              <div className="w-full border-b border-dashed border-gray-300 dark:border-gray-700 h-0"></div>
              <div className="w-full border-b border-dashed border-gray-300 dark:border-gray-700 h-0"></div>
              <div className="w-full border-b border-dashed border-gray-300 dark:border-gray-700 h-0"></div>
              <div className="w-full border-b border-dashed border-gray-300 dark:border-gray-700 h-0"></div>

              {/* X축 일자 */}
              <div className="absolute bottom-[-24px] left-4 right-0 flex justify-between text-xs text-black-900 dark:text-black-100 font-bold">
                <span>19(월)</span>
                <span>20(화)</span>
                <span>21(수)</span>
                <span>22(목)</span>
                <span>23(금)</span>
                <span>24(토)</span>
                <span>25(일)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 요약 및 추천 음악 2열 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* 이번 주 감정 요약 */}
          <div className="border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-2">
            <h4 className="font-bold text-black-900 dark:text-black-100 text-sm">이번 주 감정 요약</h4>
            <p className="text-xs text-black-800 dark:text-black-200 leading-relaxed pt-1 font-medium">
              이번 주에는 다양한 감정을 경험하셨네요.<br />
              특히 주말에 갈수록 기분이 좋아지는 경향이 보여요!
            </p>
          </div>

          {/* 맞춤 음악 추천 */}
          <div className="border border-gray-300 dark:border-gray-800 rounded-xl p-5 space-y-3">
            <h4 className="font-bold text-black-900 dark:text-black-100 text-sm">맞춤 음악 추천</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md border border-purple-400 flex-shrink-0"></div>
                <div>
                  <p className="font-bold text-black-900 dark:text-black-100">좋은 날</p>
                  <p className="text-black-700 dark:text-black-300">아이유</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md border border-green-400 flex-shrink-0"></div>
                <div>
                  <p className="font-bold text-black-900 dark:text-black-100">숨의 시간</p>
                  <p className="text-black-700 dark:text-black-300">김필</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}