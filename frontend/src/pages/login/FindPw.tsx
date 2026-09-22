import { useState } from "react";
import { findPW } from "../../API/auth";

export default function FindPw() {

  const [id, setId] = useState("");
  const [tel, setTel] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null); // 발급받은 임시 비밀번호

  //휴대폰 번호: 숫자만, 11자리 제한
  const handleTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
    setTel(onlyDigits);
  };

  //비밀번호 찾기 요청
  const handleFindPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !tel.trim()) {
      alert("아이디와 휴대폰 번호를 모두 입력해주세요");
      return;
    }
    if (tel.length !== 11) {
      alert("휴대폰 번호 11자리를 정확히 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const result = await findPW({ id, tel });
      if (result?.pw) {
        setTempPw(result.pw); // alert 대신 복사 가능한 모달로 표시
      } else {
        alert("일치하는 회원 정보가 없습니다.");
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        alert(error.response.data?.message || "일치하는 회원 정보가 없습니다.");
      } else {
        alert("비밀번호 찾기 도중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  //임시 비밀번호 복사
  const handleCopy = async () => {
    if (!tempPw) return;
    try {
      await navigator.clipboard.writeText(tempPw);
      alert("복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다. 직접 드래그해서 복사해주세요.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170] dark:text-teal-400">
          비밀번호 찾기
        </h1>

        <form onSubmit={handleFindPw} className="space-y-4 sm:space-y-6">
          {/* 아이디 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
              아이디
            </label>
            <div className="flex-1 flex flex-col gap-1 w-full">
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="아이디를 입력해주세요"
                className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* 휴대폰 번호 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
              휴대폰 번호
            </label>
            <div className="flex-1 flex flex-col gap-1 w-full">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={11}
                value={tel}
                onChange={handleTelChange}
                placeholder="숫자 11자리 입력 (- 없이)"
                className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* 하단 버튼 구역 */}
          <div className="flex flex-col items-center gap-3 pt-6 w-full">
            <div className="flex flex-col items-center gap-2 w-64 mx-auto">
              <button
                type="submit"
                disabled={loading}
                className="w-64 h-11 flex items-center justify-center bg-[#0D9488] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? "찾는 중..." : "비밀번호 찾기"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 임시 비밀번호 발급 결과 모달 */}
      {tempPw && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#1F6170] dark:text-teal-400">임시 비밀번호 발급</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              로그인 후 꼭 비밀번호를 변경해주세요.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={tempPw}
                onFocus={(e) => e.target.select()}
                className="flex-1 border rounded-md px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 text-sm font-bold text-white bg-[#1F6170] rounded-md hover:opacity-90 transition-opacity"
              >
                복사
              </button>
            </div>
            <button
              type="button"
              onClick={() => setTempPw(null)}
              className="w-full h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}