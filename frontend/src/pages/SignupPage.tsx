export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170]">
          회원가입
        </h1>
        {/* 아이디 입력 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
            아이디
          </label>
          <div className="flex-1 flex items-center gap-2 w-full">
            <input
              type="text"
              placeholder="아이디를 입력해주세요"
              className="flex-1 min-w-0 border rounded-md px-3 py-2 text-sm focus:outline-none"
            />
            <span className="text-base sm:text-lg font-medium whitespace-nowrap">@</span>
            <select className="border rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none">
              <option value="gmail">gmail.com</option>
              <option value="naver">naver.com</option>
              <option value="daum">daum.net</option>
            </select>
            <button
              type="button"
              className="whitespace-nowrap shrink-0 px-3 sm:px-4 py-2 bg-[#1F6170] text-white text-xs sm:text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              중복확인
            </button>
          </div>
        </div>

        {/* 비밀번호 입력 영역 */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
            비밀번호
          </label>
          <div className="flex-1 flex flex-col gap-1 w-full">
            <input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
            />
            <span className="text-xs text-gray-500 pl-1">
              비밀번호는 영어, 숫자, 특수문자로 구성해주세요.
            </span>
          </div>
        </div>

        {/* 비밀번호 재확인 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
            비밀번호 재확인
          </label>
          <div className="flex-1 w-full">
            <input
              type="password"
              placeholder="비밀번호를 다시한번 입력해주세요."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* 이름 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
            이름
          </label>
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="이름을 입력해주세요."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* 휴대폰 번호 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
            휴대폰 번호
          </label>
          <div className="flex-1 w-full">
            <input
              type="tel"
              placeholder="휴대폰 번호를 입력해주세요."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex flex-col items-center gap-3 pt-6 w-full">
          <div className="w-full max-w-[520px] flex flex-col gap-3">
            <button
              type="button"
              className="w-full py-3 bg-[#1F6170] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              회원가입
            </button>
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