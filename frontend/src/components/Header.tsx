import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/Feely_Logo.png"
import { useEffect, useState } from "react";
import { logoutUser } from "../API/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(localStorage.getItem("member_no") || localStorage.getItem("user"));
  });

  // 다크모드 기능
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
  });

  useEffect(() => {
    const syncLoginState = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("member_no") || localStorage.getItem("user")));
    };

    window.addEventListener("storage", syncLoginState);
    syncLoginState();

    return () => window.removeEventListener("storage", syncLoginState);
  }, []);

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

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.warn("서버 로그아웃 실패, 클라이언트 세션만 정리합니다.", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("member_no");
      setIsLoggedIn(false);
      alert("로그아웃되었습니다.");
      navigate("/Login");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full h-[70px] bg-white border-b border-gray-200">
      <div className="w-full px-1 sm:px-5 py-2 flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center">
          <Link to="/">
            <img src={logo} alt="Feely Logo" className="h-16 w-auto object-contain -translate-y-2" />
          </Link>
        </div>

        {/* 다크모드 토글 버튼 */}
        <button
          onClick={toggleDarkMode}
          className="ml-3 px-2.5 py-1 text-xs border rounded-md border-gray-300 dark:border-gray-600 hover:opacity-80 transition-all -translate-y-2
          flex items-center jstify-center"
        >
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>

        {/* 페이지 이동 글씨 */}
        <nav className="flex items-center gap-1 sm:gap-3 text-xs sm:text-base font-medium whitespace-nowrap ml-auto -translate-y-3">
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

          {!isLoggedIn ? (
            <>
              {/* 회원가입 */}
              <Link to="/SignUp" className="hover:underline">
                Sing up
              </Link>

              <span className="text-gray-300 font-light select-none">|</span>
              {/* 로그인 */}
              <Link to="/Login" className="hover:underline">
                Login
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="hover:underline text-left"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}