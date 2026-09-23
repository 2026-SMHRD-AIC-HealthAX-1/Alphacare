import { Link } from "react-router-dom";
import logo from "../assets/Feely_Logo_2.png";
import { useState, useEffect } from "react";
import { logout } from "../API/auth";
import { clearAuthCookies } from "../API/axios";
import Cookies from "js-cookie";

export default function Header() {
  // 로그인 상태 및 사용자 ID 관리
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");

  // 마운트 시 쿠키 확인
  useEffect(() => {
    const authStatus = Cookies.get("isLoggedIn") === "true";
    const savedUserId = Cookies.get("userId") || "";

    setIsLoggedIn(authStatus);
    setUserId(savedUserId);
  }, []);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await logout();

      } catch (error) {
        console.error("로그아웃 오류 발생")
    } finally {
      clearAuthCookies();

      setIsLoggedIn(false);
      setUserId("");
      alert("로그아웃 되었습니다.")
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full h-[70px] bg-white dark:bg-gray-900 transition-colors">
      <div className="w-full px-1 sm:px-5 py-2 flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center">
          <Link to="/">
            <img
              src={logo}
              alt="Feely Logo"
              className="h-12 w-auto object-contain -translate-y--2"
            />
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center gap-1 sm:gap-3 text-xs sm:text-base font-medium whitespace-nowrap ml-auto -translate-y-1">
          {/* 상담 페이지 */}
          <Link to="/Counsel" className="hover:underline">
            상담하기
          </Link>

          {isLoggedIn ? (
            <>
              {/* 세로 구분선 */}
              <span className="text-gray-300 font-light select-none">|</span>

              {/* 마이페이지 이동 버튼 */}
              <Link to="/MyPage" className="hover:underline">
                MyPage
              </Link>

              {/* 세로 구분선 */}
              <span className="text-gray-300 font-light select-none">|</span>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="hover:underline bg-transparent border-none p-0 text-inherit font-medium cursor-pointer"
              >
                Logout
              </button>

              {/* 세로 구분선 */}
              <span className="text-gray-300 font-light select-none">|</span>

              {/* 회원 정보 문구 */}
              <span className="text-[#1F6170] dark:text-teal-400 font-semibold">
                {userId}님
              </span>
            </>
          ) : (
            <>
              {/* 세로 구분선 */}
              <span className="text-gray-300 font-light select-none">|</span>

              {/* 회원가입 */}
              <Link to="/SignUp" className="hover:underline">
                Sign up
              </Link>

              {/* 세로 구분선 */}
              <span className="text-gray-300 font-light select-none">|</span>

              {/* 로그인 */}
              <Link to="/Login" className="hover:underline">
                Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
