import { useState } from "react";
import EmotionGraph from "./EmotionCalender";
import CounselCalendar from "./WeeklyReport";

export default function MyPage() {
  const [activeMenu, setActiveMenu] = useState<"profile" | "graph" | "calendar">("graph");

  return (
    <div className="flex max-w-7xl mx-auto py-4 px-2 sm:px-6 gap-8 min-h-[750px]">
      {/* 1. LNB 좌측 서브메뉴 (항상 고정) */}
      <aside className="w-40 flex-shrink-0 space-y-2 border-r border-gray-200 dark:border-gray-700 pr-6">
        <button
          onClick={() => setActiveMenu("profile")}
          className={`w-full text-left py-2.5 px-3 rounded-lg text-base transition-colors ${activeMenu === "profile"
            ? "text-[#1F6170] font-bold dark:text-teal-400"
            : "text-gray-600 dark:text-gray-400 hover:text-[#1F6170]"
            }`}
        >
          마이페이지
        </button>
        <button
          onClick={() => setActiveMenu("graph")}
          className={`w-full text-left py-2.5 px-3 rounded-lg text-base transition-colors ${activeMenu === "graph"
            ? "text-[#1F6170] font-bold dark:text-teal-400"
            : "text-gray-600 dark:text-gray-400 hover:text-[#1F6170]"
            }`}
        >
          감정 그래프
        </button>
        <button
          onClick={() => setActiveMenu("calendar")}
          className={`w-full text-left py-2.5 px-3 rounded-lg text-base transition-colors ${activeMenu === "calendar"
            ? "text-[#1F6170] font-bold dark:text-teal-400"
            : "text-gray-600 dark:text-gray-400 hover:text-[#1F6170]"
            }`}
        >
          상담 캘린더
        </button>
      </aside>

      {/* 2. 메인 콘텐츠 영역 */}
      <main className="flex-1">
        {activeMenu === "profile" && (
          <div className="p-6 border rounded-xl dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">내 정보 수정</h2>
            <p className="text-sm text-gray-500 mt-2">회원 정보 관리 영역입니다.</p>
          </div>
        )}
        {activeMenu === "graph" && <EmotionGraph />}
        {activeMenu === "calendar" && <CounselCalendar />}
      </main>
    </div>
  );
}