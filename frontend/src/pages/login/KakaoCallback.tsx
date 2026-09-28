import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { kakaoLogin, kakaoSignup } from "../../API/auth";
import { setAuthCookies, ApiError } from "../../API/axios";
import { isValidPhone, sanitizePhoneInput } from "../../utils/validation";

// 카카오 로그인 콜백 처리: 인가코드로 로그인 시도 -> 신규회원이면 전화번호 추가입력 화면 표시
export default function KakaoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [needPhone, setNeedPhone] = useState(false);
  const [kakaoId, setKakaoId] = useState("");
  const [nickname, setNickname] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  // StrictMode에서 useEffect가 두 번 실행돼도 인가코드 교환은 한 번만 되도록 방지
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const code = searchParams.get("code");
    if (!code) {
      alert("카카오 로그인 정보를 받지 못했습니다.");
      navigate("/Login");
      return;
    }

    kakaoLogin(code)
      .then((result) => {
        if (result.status === "LOGIN") {
          setAuthCookies(result.nickname || result.kakaoId || "카카오회원");
          alert(`${result.nickname || "회원"}님, 환영합니다!`);
          window.location.href = import.meta.env.BASE_URL;
          return;
        }

        if (result.status === "NEED_SIGNUP") {
          setKakaoId(result.kakaoId || "");
          setNickname(result.nickname);
          setNeedPhone(true);
          return;
        }

        alert(result.message || "카카오 로그인에 실패했습니다.");
        navigate("/Login");
      })
      .catch((e) => {
        const error = e as ApiError;
        console.error("카카오 로그인 오류 : ", error);
        alert("카카오 로그인 처리 중 서버 통신 오류가 발생했습니다.");
        navigate("/Login");
      });
  }, [searchParams, navigate]);

  // 신규회원 추가정보(전화번호) 입력 후 가입 완료
  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPhone(phone)) {
      alert("휴대폰 번호 11자리를 정확히 입력해주세요");
      return;
    }

    try {
      const result = await kakaoSignup({ kakaoId, nickname, phone });

      if (result.status === "LOGIN") {
        setAuthCookies(result.nickname || result.kakaoId || "카카오회원");
        alert(`${result.nickname || "회원"}님, 환영합니다!`);
        window.location.href = import.meta.env.BASE_URL;
        return;
      }

      alert(result.message || "회원가입에 실패했습니다.");
    } catch (e) {
      const error = e as ApiError;
      console.error("카카오 회원가입 오류 : ", error);
      alert("회원가입 처리 중 서버 통신 오류가 발생했습니다.");
    }
  };

  if (!needPhone) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <p className="text-gray-500 dark:text-gray-400">카카오 로그인 처리 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170] dark:text-teal-400">
          추가 정보 입력
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {nickname ? `${nickname}님, ` : ""}Feely 이용을 위해 휴대폰 번호를 입력해주세요.
        </p>
        <form onSubmit={handleSubmitPhone} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
              휴대폰 번호
            </label>
            <div className="flex-1 flex justify-center">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                maxLength={11}
                placeholder="`-`을 제외한 전화번호를 입력해주세요"
                className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 pt-6 w-full">
            <button
              type="submit"
              className="w-64 h-11 flex items-center justify-center bg-[#0D9488] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              가입 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
