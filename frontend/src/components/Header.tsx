import { Link } from "react-router-dom";
import logo from "../assets/Feely_Logo.png"

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <div className="w-full px-6 py-4 flex items-center justify-between">
      {/* 로고 */}
        <div className="flex items-center">
          <Link to="/">
            <img src={logo} alt="Feely Logo" className="h-8 w-auto object-contain" />
          </Link>
        </div>

      <nav className="flex items-center text-gray-800 font-medium text-lg ml-auto">
        {/* 페이지 이동 글씨 */}
        {/* 상담 페이지 */}
        <Link to="/Counsel">
          상담하기
        </Link>

        {/* 세로 구분선 */}
        <span className="mx-4 text-gray-300 font-light select-none"> | </span>

        {/* 마이페이지 이동 버튼 */}
        <Link to="/MyPage">
          MyPage
        </Link>

        {/* 세로 구분선 */}
        <span className="mx-4 text-gray-300 font-light select-none"> | </span>

        {/* 회원가입 */}
        <Link to="/SignUp">
          Sing up
        </Link>

        {/* 세로 구분선 */}

        <span className="mx-4 text-gray-300 font-light select-none"> | </span>

        {/* 로그인 */}
        <Link to="/Login">
          Login
        </Link>
      </nav>
      </div>
    </header>
  );
}