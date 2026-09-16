import { Link, useNavigate } from "react-router-dom";
import { loginUser, getMemberInfo } from "../../API/auth"
import { useState } from "react";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [userPw, setUserPw] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !userPw.trim()) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    try {
      // 1. 로그인 요청 (memberLogin)
      const res = await loginUser({ id: userId, pw: userPw });
      if (res.loginFlag) {
        // 2. 회원 기본 정보 조회 (getMember)
        const memberInfo = await getMemberInfo(res.member_no);

        // 3. 브라우저 세션/로컬 스토리지에 로그인 사용자 정보 저장
        localStorage.setItem("user", JSON.stringify(memberInfo));
        localStorage.setItem("member_no", String(res.member_no));
        alert(`${memberInfo.name}님, 환영합니다!`);
        navigate("/"); // 메인 페이지로 이동
      } else {
        alert("아이디 또는 비밀번호가 일치하지 않습니다.");
      }
    } catch (error: any) {
      console.error("로그인 오류 :", error);
      alert("로그인 처리 중 서버 통신 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170]">
          로그인
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 아이디 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
              아이디
            </label>
            <div className="flex-1 flex justify-center">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="아이디를 입력해주세요"
                className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          {/* 비밀번호 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
              비밀번호
            </label>
            <div className="flex-1 flex justify-center">
              <input
                type="password"
                value={userPw}
                onChange={(e) => setUserPw(e.target.value)}
                placeholder="비밀번호를 입력해주세요"
                className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          {/* 하단 버튼 및 링크 */}
          <div className="flex flex-col items-center gap-3 pt-6 w-full">
            <div className="w-64 flex flex-col gap-3 mx-auto">
              <div className="flex items-center justify-center text-xs">
                <Link to="/FindId" className="hover:underline">아이디 찾기</Link>
                <span className="mx-4 text-gray-300 font-light select-none">|</span>
                <Link to="/FindPw" className="hover:underline">비밀번호 찾기</Link>
              </div>
              <div className="flex items-center gap-2 w-full">
                <Link
                  to="/SignUp"
                  className="flex-1 h-11 flex items-center justify-center bg-gray-100 text-gray-700 font-bold text-base sm:text-lg rounded-lg shadow-sm hover:bg-gray-200 transition-colors"
                >
                  회원가입
                </Link>
                <button
                  type="submit"
                  className="flex-1 h-11 flex items-center justify-center bg-[#1F6170] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                >
                  로그인
                </button>
              </div>
              <button
                type="button"
                className="w-64 h-11 flex items-center justify-center bg-[#F7E600] text-black font-bold text-base sm:text-lg rounded-lg shadow-sm hover:brightness-90 transition-all"
              >
                카카오톡 로그인
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}