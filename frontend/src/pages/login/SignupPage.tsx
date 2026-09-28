import { ApiError } from "../../API/axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkDuplicateId, signupUser } from "../../API/auth";
import { isValidPassword, isValidPhone, sanitizePhoneInput } from "../../utils/validation";
import { getKakaoAuthUrl } from "../../utils/kakao";

export default function SignupPage() {

  // 회원가입 완료 후 페이지 이동
  const navigate = useNavigate();

  // 입력값 상태
  const [userId, setuserId] = useState("");
  const [checkId, setcheckId] = useState(false);
  const [userPw, setuserPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setphone] = useState("");

  // 아이디 수정 시 중복확인 상태 초기화
  const renameCheckId = (e: React.ChangeEvent<HTMLInputElement>) => {
    setuserId(e.target.value);
    setcheckId(false);
  }

  // 아이디 중복 확인
  const clickCheckDuplicate = async () => {
    // 아이디 공백 체크
    if (!userId.trim()) {
      alert("아이디를 입력해주세요");
      return
    }

    try {
      // 중복이면 true
      const isDuplicate = await checkDuplicateId(userId);

      if (isDuplicate) {
        alert("이미 사용중인 아이디 입니다.")
        setcheckId(false);
      }
      else {
        alert("사용 가능한 아이디 입니다.")
        setcheckId(true);
      }
    } catch {
      console.log("중복 확인 오류");
      alert("중복 확인 중 오류 발생")
      setcheckId(false);
    }
  }

  // 휴대폰 번호: 숫자만, 11자리 제한
  const checkphone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setphone(sanitizePhoneInput(e.target.value));
  }

  // 회원가입
  const postSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !userPw || !pwConfirm || !name || !phone) {
      alert("모든 입력칸을 채워주세요");
      return;
    }

    if (!checkId) {
      alert("아이디 중복확인을 해주세요");
      return;
    }

    if (!isValidPassword(userPw)) {
      alert("비밀번호는 영문, 숫자, 특수문자로 구성된 8자리 이상이어야 합니다.");
      return;
    }

    if (userPw !== pwConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!isValidPhone(phone)) {
      alert("휴대폰 번호 11자리를 정확히 입력해주세요");
      return;
    }

    try {
      const result = await signupUser({
        id: userId,
        pw: userPw,
        name: name,
        tel: phone,
        kakaoID: "",
        isDuplicate : false,
        loginFlag : false
      });

      if (!result.joinFlag) {
        alert(result.message || "회원가입에 실패했습니다.");
        return;
      }
      alert(result.message || "회원가입이 완료되었습니다.");
      navigate("/Login");
    } catch (e) {
      const error = e as ApiError;
      console.error("회원가입 오류 : ", error);
      // 백엔드 에러 메시지 표시
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("회원가입 처리 중 서버 오류가 발생했습니다.");
      }
    }
  };

  // 화면
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170] dark:text-teal-400">
          회원가입
        </h1>

        <form onSubmit={postSignup} className="space-y-4 sm:space-y-6">
          {/* 아이디 입력 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
              아이디
            </label>
            <div className="flex-1 flex items-center gap-2 w-full">
              <input
                type="text"
                value={userId}
                onChange={renameCheckId}
                placeholder="아이디를 입력해주세요"
                className="w-64  border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <button
                type="button" onClick={clickCheckDuplicate}
                className="whitespace-nowrap shrink-0 px-3 sm:px-4 py-2 bg-[#0D9488] text-white text-xs sm:text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
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
                value={userPw}
                onChange={(e) => setuserPw(e.target.value)}
                placeholder="비밀번호를 입력해주세요"
                className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                영어, 숫자, 특수문자로 구성된 8자리 이상
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
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력해주세요."
                className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력해주세요."
                className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
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
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={checkphone}
                maxLength={11}
                placeholder="`-`을 제외한 전화번호를 입력해주세요"
                className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex flex-col items-center gap-3 pt-6 w-full">
            <div className="w-64 flex flex-col gap-3 mx-auto">
              <button
                type="submit"
                className="w-64 py-3 bg-[#0D9488] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity"
              >
                회원가입
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = getKakaoAuthUrl(); }}
                className="w-64 py-3 bg-[#F7E600] text-black font-bold text-base sm:text-lg rounded-lg shadow-sm hover:brightness-90 transition-all"
              >
                카카오톡 회원가입
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}