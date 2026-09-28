import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { kakaoLogin, kakaoSignup } from "../../API/auth";
import { setAuthCookies, ApiError } from "../../API/axios";

// 카카오 로그인 콜백 처리: 인가코드로 로그인 시도 -> 신규회원이면 전화번호 없이 바로 가입 처리
export default function KakaoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // StrictMode에서 useEffect가 두 번 실행돼도 인가코드 교환은 한 번만 되도록 방지
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    // 로그인/회원가입 버튼 중 어디서 왔는지(state)에 따라 실패 시 돌아갈 페이지를 정함
    const cameFromSignup = searchParams.get("state") === "signup";
    const fallbackPath = cameFromSignup ? "/Signup" : "/Login";

    const code = searchParams.get("code");
    if (!code) {
      alert("카카오 로그인 정보를 받지 못했습니다.");
      navigate(fallbackPath);
      return;
    }

    const goToMain = (name: string | null, id: string) => {
      setAuthCookies(name || id || "카카오회원");
      alert(`${name || "회원"}님, 환영합니다!`);
      window.location.href = import.meta.env.BASE_URL;
    };

    kakaoLogin(code)
      .then((result) => {
        if (result.status === "LOGIN") {
          goToMain(result.nickname, result.kakaoId || "");
          return;
        }

        if (result.status === "NEED_SIGNUP") {
          // 전화번호 입력 없이 바로 가입 완료
          return kakaoSignup({ kakaoId: result.kakaoId || "", nickname: result.nickname }).then((signupResult) => {
            if (signupResult.status === "LOGIN") {
              goToMain(signupResult.nickname, signupResult.kakaoId || "");
              return;
            }
            alert(signupResult.message || "카카오 회원가입에 실패했습니다.");
            navigate(fallbackPath);
          });
        }

        alert(result.message || "카카오 로그인에 실패했습니다.");
        navigate(fallbackPath);
      })
      .catch((e) => {
        const error = e as ApiError;
        console.error("카카오 로그인 오류 : ", error);
        alert("카카오 로그인 처리 중 서버 통신 오류가 발생했습니다.");
        navigate(fallbackPath);
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <p className="text-gray-500 dark:text-gray-400">카카오 로그인 처리 중입니다...</p>
    </div>
  );
}
