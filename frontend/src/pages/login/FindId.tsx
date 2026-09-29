import { useState } from "react";
import { ApiError } from "../../API/axios";
import { findID } from "../../API/auth";
import { useNavigate } from "react-router-dom";

export default function FindId() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [loading, setLoading] = useState(false);

  // 아이디 찾기 요청
  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tel.trim()) {
      alert("이름과 휴대폰 번호를 모두 입력해주세요");
      return;
    }
    if (tel.length !== 11) {
      alert("휴대폰 번호 11자리를 정확히 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const result = await findID({ name, tel });
      if (result?.id) {
        alert(`회원님의 아이디는 ${result.id} 입니다.`);
        navigate("/Login");
      } else {
        alert("일치하는 회원 정보가 없습니다.");
      }
    } catch (e) {
      const error = e as ApiError;
      if (error?.response?.status === 404) {
        // 매칭 실패
        alert(error.response.data?.message || "일치하는 회원 정보가 없습니다.");
      } else {
        // 그 외 오류
        alert("아이디 찾기 도중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 휴대폰 번호: 숫자만, 11자리 제한
  const handleTelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
    setTel(onlyDigits);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170] dark:text-teal-400">
          아이디 찾기
        </h1>

        <form onSubmit={handleFindId} className="space-y-4 sm:space-y-6">
          {/* 이름 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
              이름
            </label>
            <div className="flex-1 flex flex-col gap-1 w-full">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력해주세요"
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
              {/* 아이디 찾기 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-64 h-11 flex items-center justify-center bg-[#0D9488] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? "찾는 중..." : "아이디 찾기"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}