import { Outlet } from "react-router-dom";
import Header from "./Header"
import Footer from "./Footer"

export default function Layout() {
  return (
    <div className = "min-h-screen flex flex-col bg-base-100">
      {/* Header */}
      <Header />

      {/* 모든 페이지에 적용할 반응형 코드 */}
      {/* 모바일 px-4, 태블릿 px-8, pc max-w-7xl 중앙정렬  */}
      <main className = "flex-q w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}