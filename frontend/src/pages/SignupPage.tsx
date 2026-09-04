// import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkDuplicateId, signupUser } from "../API/auth";

export default function SignupPage() {
  //기능 구현 부분

  const navigate = useNavigate();

  //입력 필드 기본 값 선언
  const [userId, setuserId] = useState("");
  const [checkId, setcheckId] = useState(false);
  const [userPw, setuserPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");

  //아이디 입력칸 수정 시 중복확인 상태 초기화
  const renameCheckId = (e: React.ChangeEvent<HTMLInputElement>) => {
    setuserId(e.target.value);
    setcheckId(false);
  }

  //아이디 중복 확인 기능
  const clickCheckDuplicate = async () => {
    //아이디 입력란 공백시
    if (!userId.trim()) {
      alert("아이디를 입력해주세요");
      return
    }

    try {
      //아이디 중복시 true, 미중복시 false
      const isDuplicate = await checkDuplicateId(userId);
      console.log(isDuplicate);

      if (isDuplicate) {
        alert("이미 사용중인 아이디 입니다.")
        setcheckId(false);
      }
      else {
        alert("사용 가능한 아이디 입니다.")
        //아이디 중복 확인 여부 통과
        setcheckId(true);
      }
    } catch (error) {
      console.log("중복 확인 오류");
      alert("중복 확인 중 오류 발생")
      setcheckId(false);
    }
  }

  //휴대폰 번호 숫자가 아닌 문자 제거
  const checkTel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNum = e.target.value.replace(/[^0-9]/g, "");
    setTel(onlyNum);
  }

  //회원가입
  const postSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    //아이디 규칙, 영어, 숫자, 특수문자로만 구성된 8자리
    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    const telRegex = /^010\d{8}$/;
    
    //빈칸 확인
    if (!userId || !userPw || !pwConfirm || !name || !tel) {
      alert("모든 입력칸을 채워주세요")
      return;
    }
    
    //아이디 중복확인 여부 검사
    if (!checkId) {
      alert("아이디 중복확인을 해주세요")
      return;
    }

    //비밀번호 규칙 확인
    if (!pwRegex.test(userPw)) {
      alert("비밀번호는 영문, 숫자 특수문자로 구성된 8자리 이상이여야 합니다.")
      return
    }

    //비밀번호 일치 확인
    if (userPw !== pwConfirm) {
      alert("비밀번호가 일치하지 않습니다.")
      return;
    }

    //휴대폰 번호 11자리 확인
    if (!telRegex.test(tel)) {
      alert("휴대폰 번호 11자리를 정확히 입력해주세요")
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      await signupUser({
        ID: userId,
        kakaoID: "",
        PW: userPw,
        name: name,
        tel: tel,
        signDate: today,
      });

      alert("회원가입이 완료되었습니다.")
      navigate("/");

    } catch (error) {
      console.error("회원가입 오류 : ", error)
      alert("회원가입 도중 오류가 발생했습니다.")
    }
  }

  //디자인 구현부분
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170]">
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
                className="flex-1 min-w-0 border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <button
                type="button" onClick={clickCheckDuplicate}
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
                value={userPw}
                onChange={(e) => setuserPw(e.target.value)}
                placeholder="비밀번호를 입력해주세요"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
              <span className="text-xs text-gray-500 pl-1">
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={tel}
                onChange={checkTel}
                maxLength={11}
                placeholder="`-`을 제외한 전화번호를 입력해주세요"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex flex-col items-center gap-3 pt-6 w-full">
            <div className="w-full max-w-[520px] flex flex-col gap-3">
              <button
                type="submit"
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
        </form>
      </div>
    </div>
  );
}