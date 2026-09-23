import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Mshop from "./Mshop";
import { updateMember, logout } from "../../API/auth";
import { clearAuthCookies } from "../../API/axios";
import { isValidPassword, isValidPhone, sanitizePhoneInput } from "../../utils/validation";

export default function MyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 헤더의 사용자 이름 드롭다운 메뉴에서 전달되는 tab 값으로 화면을 분기 (profile: 회원정보수정, Mshop: 마일리지샵)
  const activeTab = searchParams.get("tab") === "Mshop" ? "Mshop" : "profile";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [updating, setUpdating] = useState(false);

  // 회원정보 수정 제출: 비밀번호/전화번호 중 입력된 값만 서버로 전송
  const handleUpdateMember = async () => {
    if (!password && !phone) {
      alert("수정할 내용을 입력해주세요.");
      return;
    }

    if (password && password !== passwordConfirm) {
      alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (password && !isValidPassword(password)) {
      alert("비밀번호는 영문, 숫자, 특수문자로 구성된 8자리 이상이어야 합니다.");
      return;
    }

    if (phone && !isValidPhone(phone)) {
      alert("휴대폰 번호 11자리를 정확히 입력해주세요");
      return;
    }

    try {
      setUpdating(true);
      const result = await updateMember({
        pw: password || undefined,
        tel: phone || undefined,
      });
      alert(result.message ?? "회원정보가 수정되었습니다. 보안을 위해 다시 로그인해주세요.");

      // 회원정보 수정에 성공하면 보안을 위해 로그아웃시키고 로그인 페이지로 이동
      // (window.location.href로 하드 이동하면 vite/Router의 base인 "/Feely"가 안 붙어서
      //  라우팅이 안 됐음 - signup페이지(postSignup)처럼 react-router의 navigate를 사용해야
      //  base 설정과 상관없이 항상 올바르게 이동함)
      try {
        await logout();
      } catch (logoutError) {
        console.error("로그아웃 오류:", logoutError);
      } finally {
        clearAuthCookies();
        navigate("/Login");
      }
    } catch (error: any) {
      // 401(세션 만료)은 axios 인터셉터가 알림 + 메인페이지 이동을 공통으로 처리함
      if (error?.response?.status !== 401) {
        alert(error?.response?.data?.message ?? "회원정보 수정 중 오류가 발생했습니다.");
      }
      console.error("회원정보 수정 오류:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-2 sm:px-6 min-h-[750px]">
      {activeTab === "profile" && (
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[800px] p-6 sm:p-8 dark:border-gray-700">

            {/* 제목 */}
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-[80px] text-center">
              회원정보 수정
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateMember();
              }}
              className="w-full max-w-[500px] mx-auto mt-[50px] space-y-6"
            >

              {/* 비밀번호 */}
              <div className="grid grid-cols-[130px_1fr] items-start gap-4">
                <label className="pt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  비밀번호
                </label>

                <div className="w-full">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-50 h-11 px-4 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1F6170]"
                  />

                  <p className="text-[12px] text-gray-400 mt-2">
                    영어, 숫자, 특수문자로 구성된 8자리 이상
                  </p>
                </div>
              </div>


              {/* 비밀번호 확인 */}
              <div className="grid grid-cols-[130px_1fr] items-center gap-4">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  비밀번호 확인
                </label>

                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-50 h-11 px-4 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1F6170]"
                />
              </div>


              {/* 핸드폰번호 */}
              <div className="grid grid-cols-[130px_1fr] items-start gap-4">
                <label className="pt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  핸드폰번호
                </label>

                <div className="w-full">
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phone}
                    maxLength={11}
                    onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                    placeholder="`-`을 제외한 전화번호를 입력해주세요"
                    className="w-50 h-11 px-4 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-[#1F6170]"
                  />

                  <p className="text-[12px] text-gray-400 mt-2">
                    010으로 시작하는 11자리 숫자로 입력해주세요.
                  </p>
                </div>
              </div>


              {/* 정보수정완료 */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-[170px] h-[40px] bg-[#0D9488] text-white rounded-lg font-semibold text-sm flex items-center justify-center hover:bg-[#0D9488] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {updating ? "수정 중..." : "정보수정완료"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {activeTab === "Mshop" && <Mshop />}
    </div>
  );
}
