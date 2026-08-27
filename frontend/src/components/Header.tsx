import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      {/* 로고, 이름 */}
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl">
          Feely
        </Link>
      </div>

      {/* 상담페이지 이동 */}
      

      {/* 로그인, 회원가입 버튼 */}
      <div className="navbar-end gap-2">
        <Link to="/SignUp" className="btn">
          Sing up
        </Link>
        <Link to="/Login" className="btn">
          Login
        </Link>
        {/* 테스트용 마이페이지 이동 버튼 */}
        <Link to="/MyPage" className="btn">
          MyPage
        </Link>
      </div>
    </div>
  );
}
