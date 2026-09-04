import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170]">
          로그인
        </h1>
        {/* 아이디 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
            아이디
          </label>
          <div className="flex-1 flex flex-col gap-1 w-full">
            <input
              type="text"
              placeholder="아이디를 입력해주세요"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* 비밀번호 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
            비밀번호
          </label>
          <div className="flex-1 flex flex-col gap-1 w-full">
            <input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* 하단 버튼 및 링크 구역 */}
        <div className="flex flex-col items-center gap-3 pt-6 w-full">
          <div className="w-full max-w-[520px] flex flex-col gap-3">

            {/* 아이디/비밀번호 찾기 링크 */}
            <div className="flex items-center justify-center text-xs">
              <Link to="/FindId" className="hover:underline">
                아이디 찾기
              </Link>
              <span className="mx-4 text-gray-300 font-light select-none">|</span>
              <Link to="/FindPw" className="hover:underline">
                비밀번호 찾기
              </Link>
            </div>

            {/* 회원가입 & 로그인 버튼 */}
            <div className="flex items-center gap-2 w-full">
              <Link
                to="/SignUp"
                className="flex-1 py-3 text-center bg-[#1F6170] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity"
              >
                회원가입
              </Link>
              <button
                type="button"
                className="flex-1 py-3 bg-[#1F6170] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity"
              >
                로그인
              </button>
            </div>

            {/* 카카오톡 회원가입 버튼 */}
            <button
              type="button"
              className="w-full py-3 bg-[#F7E600] text-black font-bold text-base sm:text-lg rounded-lg shadow-sm hover:brightness-90 transition-all"
            >
              카카오톡 회원가입
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}