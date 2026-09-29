import { Link } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../../API/auth";
import { setAuthCookies, ApiError } from "../../API/axios";
import { getKakaoAuthUrl } from "../../utils/kakao";
import { showToast, showToastAfterReload } from "../../utils/toast";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [userPw, setUserPw] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !userPw.trim()) {
      showToast("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    try {
      const res = await loginUser({
        id: userId,
        pw: userPw,
        isDuplicate: false,
        loginFlag: false,
      });

      if (res.loginFlag) {
        // 쿠키에는 아이디가 아니라 실제 이름을 저장 (상담 요약 등에서 이름으로 표시하기 위함)
        const displayName = res.name || userId;
        setAuthCookies(displayName);
        showToastAfterReload(`${displayName}님, 환영합니다!`);
        window.location.href = import.meta.env.BASE_URL;
      } else {
        showToast("아이디 또는 비밀번호가 일치하지 않습니다.");
      }
    } catch (e) {
      const error = e as ApiError;
      if (error?.response?.status === 401) {
        // 아이디/비밀번호 불일치
        showToast("아이디 또는 비밀번호가 일치하지 않습니다.");
      } else {
        console.error("로그인 오류 :", error);
        showToast("로그인 처리 중 서버 통신 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170] dark:text-teal-400">
          로그인
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 아이디 */}
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:h-9">
            <label className="w-full sm:absolute sm:left-[calc(50%-144px)] sm:top-1/2 sm:w-36 sm:-translate-y-1/2 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
              아이디
            </label>
            <div className="flex-1 flex justify-center sm:absolute sm:left-[calc(50%+4px)] sm:top-1/2 sm:ml-0 sm:-translate-y-1/2 sm:justify-start">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="아이디를 입력해주세요"
                className="w-[219px] border rounded-md px-3 py-1.5 text-sm focus:outline-none"
              />
            </div>
          </div>
          {/* 비밀번호 */}
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:h-9">
            <label className="w-full sm:absolute sm:left-[calc(50%-144px)] sm:top-1/2 sm:w-36 sm:-translate-y-1/2 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
              비밀번호
            </label>
            <div className="flex-1 flex justify-center sm:absolute sm:left-[calc(50%+4px)] sm:top-1/2 sm:ml-0 sm:-translate-y-1/2 sm:justify-start">
              <input
                type="password"
                value={userPw}
                onChange={(e) => setUserPw(e.target.value)}
                placeholder="비밀번호를 입력해주세요"
                className="w-[219px] border rounded-md px-3 py-1.5 text-sm focus:outline-none"
              />
            </div>
          </div>
          {/* 하단 버튼 및 링크 */}
          <div className="flex flex-col items-center gap-3 pt-6 w-full">
            <div className="w-64 flex flex-col gap-3 mx-auto">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center text-xs">
                <Link to="/FindId" className="justify-self-end pr-4 hover:underline">아이디 찾기</Link>
                <span className="text-gray-300 dark:text-gray-600 font-light select-none">|</span>
                <Link to="/FindPw" className="justify-self-start pl-4 hover:underline">비밀번호 찾기</Link>
              </div>
              <div className="flex items-center gap-2 w-full">
                <Link
                  to="/SignUp"
                  className="flex-1 h-11 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-base sm:text-lg rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  회원가입
                </Link>
                <button
                  type="submit"
                  className="flex-1 h-11 flex items-center justify-center bg-[#0D9488] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                >
                  로그인
                </button>
              </div>
              <button
                type="button"
                onClick={() => { window.location.href = getKakaoAuthUrl(); }}
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
