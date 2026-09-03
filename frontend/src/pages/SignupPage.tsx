export default function SignupPage() {
  return (
    <div className = "min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12">
      <div className = "w-full max-w-2xl space-y-6">
        {/* 아이디 입력 */}
        <div className = "flex items-center gap-4">
          <label className = "w-36 text-xl font-medium">아이디</label>
          <div className = "flex-1 flex items-center gap-2">
            <input type = "id" placeholder ="아이디를 입력해주세요" className = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none"/>
            <span className = "text-lg font-medium">@</span>
            <select className = "border rounded-md px-3 py-2 text-sm focus:outline-none">
              <option value="gmail">gmail.com</option>
              <option value="naver">naver.com</option>
              <option value="daum">daum.net</option>
            </select>
            <button type = "button" className = "whitespace-nowrap shrink-0 flex-1 px-4 py-2 bg-[#1F6170] text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity">중복확인</button>
          </div>
        </div>

        {/* 비밀번호 입력 영역 */}
        <div className = "flex items-start gap-4">
          <label className="w-36 text-xl font-medium">비밀번호</label>
          <div className = "flex-1 flex flex-col gap-1">
            <input type = "pw" placeholder="비밀번호를 입력해주세요" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"/>
            <span className="text-xs pl-1">비밀번호는 영어, 숫자, 특수문자로 구성해주세요.</span>
          </div>
        </div>

        {/* 비밀번호 재확인 */}
        <div className="flex items-start gap-4">
          <label className="w-36 text-xl font-medium">비밀번호 재확인</label>
          <div className="flex-1 flex flex-col gap-1">
            <input type="checkPw" placeholder="비밀번호를 다시한번 입력해주세요." className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        {/* 이름 */}
        <div className="flex items-start gap-4">
          <label className="w-36 text-xl font-medium">이름</label>
          <div className="flex-1 flex flex-col gap-1">
            <input type="name" placeholder="이름을 입력해주세요." className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        {/* 전화번호 */}
        <div className="flex items-start gap-4">
          <label className="w-36 text-xl font-medium">휴대폰 번호</label>
          <div className="flex-1 flex flex-col gap-1">
            <input type="tel" placeholder="휴대폰 번호를 입력해주세요." className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex flex-col items-center gap-3 pt-6">
          <button type="button" className="w-64 py-3 bg-[#1F6170] text-white font-bold text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity">회원가입</button>
          <button type="button" className="w-64 py-3 bg-[#F7E600] text-white font-bold text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity">카카오톡 회원가입</button>
        </div>
      </div>
    </div>
  )
}
