import { Link } from "react-router-dom";

export default function MainPage() {
  return (
    <div>
      <h1>
        메인페이지
      </h1>
    
      {/* 테스트용 심리상담 페이지 버튼 */}
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <Link to="/Counsel" className="btn btn-ghost text-xl">
            심리상담 페이지
          </Link>
        </div>
      </div>
    </div>
  )
}
