import { useState } from "react";
import EmotionGraph from "./EmotionCalender";
import CounselCalendar from "./WeeklyReport";
import Mshop from "./Mshop";

export default function MyPage() {
  const [activeMenu, setActiveMenu] = useState<"profile" | "graph" | "calendar" | "Mshop">("graph");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="flex items-start max-w-7xl mx-auto py-4 px-2 sm:px-6 gap-8 min-h-[750px]">
      {/* 1. LNB 좌측 서브메뉴 (항상 고정) */}
      <aside className="w-40 flex-shrink-0 space-y-2 pr-6 sticky top-4 self-start relative after:absolute after:top-50 after:right-0 after:w-px after:h-[192px] after:bg-gray-200 dark:after:bg-gray-700">
        <div className="pt-50">
          <button
            onClick={() => setActiveMenu("graph")}
            className={`w-full text-center py-2.5 px-3 rounded-lg text-base transition-colors ${activeMenu === "graph"
              ? "text-[#1F6170] font-bold dark:text-teal-400"
              : "text-gray-600 dark:text-gray-400 hover:text-[#1F6170]"
              }`}
          >
            상담 캘린더
          </button>
          <button
            onClick={() => setActiveMenu("calendar")}
            className={`w-full text-center py-2.5 px-3 rounded-lg text-base transition-colors ${activeMenu === "calendar"
              ? "text-[#1F6170] font-bold dark:text-teal-400"
              : "text-gray-600 dark:text-gray-400 hover:text-[#1F6170]"
              }`}
          >
            감정 그래프
          </button>

          <button
            onClick={() => setActiveMenu("Mshop")}
            className={`w-full text-center py-2.5 px-3 rounded-lg text-base transition-colors ${activeMenu === "Mshop"
              ? "text-[#1F6170] font-bold dark:text-teal-400"
              : "text-gray-600 dark:text-gray-400 hover:text-[#1F6170]"
              }`}
          >
            마일리지 샵
          </button>

          <button
            onClick={() => setActiveMenu("profile")}
            className={`w-full text-center py-2.5 px-3 rounded-lg text-base transition-colors ${activeMenu === "profile"
              ? "text-[#1F6170] font-bold dark:text-teal-400"
              : "text-gray-600 dark:text-gray-400 hover:text-[#1F6170]"
              }`}
          >
            회원정보수정
          </button>
        </div>
      </aside>

      {/* 2. 메인 콘텐츠 영역 */}
      <main className="flex-1">
        {activeMenu === "profile" && (
  <div className="w-full flex justify-center">
    <div className="w-full max-w-[800px] border rounded-xl p-6 sm:p-8 dark:border-gray-700">

      {/* 제목 */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-[80px] text-center">
        회원정보 수정
      </h2>

      <div className="w-full max-w-[500px] mx-auto mt-[50px] space-y-6">

        {/* 아이디 */}
        <div className="grid grid-cols-[130px_1fr] items-center gap-4">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            아이디
          </label>

          <input
            type="text"
            value="사용자아이디"
            readOnly
            className="w-50 h-11 px-4 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-[13px] cursor-not-allowed outline-none"
          />
        </div>


        {/* 비밀번호 */}
        <div className="grid grid-cols-[130px_1fr] items-start gap-4">
          <label className="pt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            비밀번호
          </label>

          <div className="w-full">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-50 h-11 px-4 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1F6170]"
            />

            <p className="text-[12px] text-gray-400 mt-2">
              영문, 숫자, 특수문자를 포함한 8자리 이상으로 입력해주세요.
            </p>
          </div>
        </div>


        {/* 비밀번호 확인 */}
        <div className="grid grid-cols-[130px_1fr] items-center gap-4">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            비밀번호 확인
          </label>

          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-50 h-11 px-4 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1F6170]"
          />
        </div>


        {/* 이름 */}
        <div className="grid grid-cols-[130px_1fr] items-center gap-4">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            이름
          </label>

          <input
            type="text"
            value="홍길동"
            readOnly
            className="w-50 h-11 px-4 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-[13px] cursor-not-allowed outline-none"
          />
        </div>


        {/* 핸드폰번호 */}
        <div className="grid grid-cols-[130px_1fr] items-start gap-4">
          <label className="pt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            핸드폰번호
          </label>

          <div className="w-full">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="- 제외한 전화번호를 입력해주세요."
              className="w-50 h-11 px-4 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-[#1F6170]"
            />

            <p className="text-[13px] text-gray-400 mt-2">
              
            </p>
          </div>
        </div>


        {/* 정보수정완료 */}
        <div className="flex justify-center pt-6">
          <button
            type="button"
            onClick={() => {
              console.log("회원정보 수정:", {
                password,
                passwordConfirm,
                phone,
              });
            }}
            className="w-[170px] h-[40px] bg-[#1F6170] text-white rounded-lg font-semibold text-sm flex items-center justify-center hover:bg-[#174d59] transition-colors"
          >
            정보수정완료
          </button>
        </div>

      </div>
    </div>
  </div>
)}
        {activeMenu === "graph" && <EmotionGraph />}
        {activeMenu === "calendar" && <CounselCalendar />}
        {activeMenu === "Mshop" && <Mshop />}
      </main>
    </div>
  );
}