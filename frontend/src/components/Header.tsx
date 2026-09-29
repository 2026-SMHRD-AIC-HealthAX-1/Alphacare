import { Link } from "react-router-dom";
import logo from "../assets/Feely_Logo_2.png";
import { useState, useEffect, useRef } from "react";
import { logout } from "../API/auth";
import { clearAuthCookies } from "../API/axios";
import { getMyRole } from "../API/admin";
import Cookies from "js-cookie";

export default function Header() {
  // 로그인 상태 및 사용자 ID (쿠키 기준)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => Cookies.get("isLoggedIn") === "true");
  const [userId, setUserId] = useState<string>(() => Cookies.get("userId") || "");

  // 관리자 여부 (관리자 페이지 버튼 노출용)
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getMyRole().then((role) => setIsAdmin(role === "ADMIN")).catch(() => setIsAdmin(false));
  }, [isLoggedIn]);

  // 사용자 이름 드롭다운 메뉴(회원정보수정, 마일리지샵) 표시 여부
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 드롭다운 메뉴 바깥을 클릭하면 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await logout();

      } catch {
        console.error("로그아웃 오류 발생")
    } finally {
      clearAuthCookies();

      setIsLoggedIn(false);
      setUserId("");
      alert("로그아웃 되었습니다.")
      window.location.assign(import.meta.env.BASE_URL);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full h-[70px] bg-white dark:bg-gray-900 transition-colors">
      <div className="w-full px-1 sm:px-5 py-2 flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center">
          <Link
            to="/"
            onClick={(event) => {
              const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
              const currentPath = window.location.pathname.replace(/\/$/, "");

              if (currentPath === basePath) {
                event.preventDefault();
                window.location.reload();
              }
            }}
          >
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

          {/* 관리자 페이지 (관리자 계정만 노출) */}
          {isAdmin && (
            <>
              <span className="text-gray-300 font-light select-none">|</span>
              <Link to="/Admin" className="hover:underline">
                관리자 페이지
              </Link>
            </>
          )}

          {isLoggedIn ? (
            <>
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

              {/* 회원 이름: 호버/클릭 시 회원정보수정, 마일리지샵 메뉴 표시 */}
              <div
                ref={menuRef}
                className="relative"
                onMouseEnter={() => setMenuOpen(true)}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="text-[#1F6170] dark:text-teal-400 font-semibold bg-transparent border-none p-0 cursor-pointer"
                >
                  {userId}님
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full w-36 pt-2 z-50">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                      <Link
                        to="/MyPage?tab=Mshop"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        마일리지 샵
                      </Link>
                      <Link
                        to="/MyPage?tab=profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        회원정보수정
                      </Link>
                    </div>
                  </div>
                )}
              </div>
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
