import { Link } from "react-router-dom";
import logo from "../assets/Feely_Logo.png"
import { useState } from "react";

export default function Navbar() {
  // 다크모드 기능
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
  });

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <div className="w-full px-3 sm:px-6 py-3 flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center">
          <Link to="/">
            <img src={logo} alt="Feely Logo" className="h-20 w-auto object-contain" />
          </Link>
        </div>

        {/* 다크모드 토글 버튼 */}
        <button
          onClick={toggleDarkMode}
          className="ml-3 px-2.5 py-1 text-xs border rounded-md border-gray-300 dark:border-gray-600 hover:opacity-80 transition-all"
        >
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>

        {/* 페이지 이동 글씨 */}
        <nav className="flex items-center gap-1 sm:gap-3 text-xs sm:text-base font-medium whitespace-nowrap ml-auto">
          {/* 상담 페이지 */}
          <Link to="/Counsel" className="hover:underline">
            상담하기
          </Link>

          {/* 세로 구분선 */}
          <span className="text-gray-300 font-light select-none">|</span>

          {/* 마이페이지 이동 버튼 */}
          <Link to="/MyPage" className="hover:underline">
            MyPage
          </Link>

          {/* 세로 구분선 */}
          <span className="text-gray-300 font-light select-none">|</span>

          {/* 회원가입 */}
          <Link to="/SignUp" className="hover:underline">
            Sing up
          </Link>

          {/* 세로 구분선 */}

          <span className="text-gray-300 font-light select-none">|</span>
          {/* 로그인 */}
          <Link to="/Login" className="hover:underline">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}