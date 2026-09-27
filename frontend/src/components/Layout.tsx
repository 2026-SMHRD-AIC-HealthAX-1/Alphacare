import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  // OS 다크모드 설정 자동 적용
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // 초기 실행 및 변경 감지
    handleThemeChange(mediaQuery);
    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);

  return (
    // 전체 배경색/글자색 지정
    <div className="min-h-screen flex flex-col overflow-x-clip bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Header */}
      <Header />

      {/* 페이지 메인 영역 */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}