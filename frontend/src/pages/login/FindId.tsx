import { Link } from "react-router-dom";
import { useState } from "react";
import { findID } from "../../API/auth";

export default function FindId() {

  const[name, setName] = useState("");
  const[tel, setTel] = useState("");
  const[foundId, setFoundId] = useState<string | null>(null);

  //아이디 찾기
  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tel.trim()) {
      alert("이름과 휴대폰 번호를 모두 입력해주세요");
      return;
    }

    try {
      const resultId = await findID({name, tel});
      if (resultId) {
        setFoundId(resultId);
      } else {
        alert("일치하는 회원 정보가 없습니다.")
      }
    }catch(error : any){
      alert("아이디 찾기 도중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#1F6170]">
          아이디 찾기
        </h1>
        {/* 이름 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="w-full sm:w-36 text-base sm:text-xl font-medium shrink-0 whitespace-nowrap">
            이름
          </label>
          <div className="flex-1 flex flex-col gap-1 w-full">
            <input
              type="text"
              value={name}
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
              type="password"
              value={tel}
              placeholder="휴대폰번호를 입력해주세요"
              className="w-64 border rounded-md px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* 하단 버튼 및 링크 구역 */}
        <div className="flex flex-col items-center gap-3 pt-6 w-full">
          <div className="flex item-center justify-cneter w-64 mx-auto flex flex-col  gap-3">
            {/* 아이디 찾기 버튼 */}
            <div className="flex items-center gap-2 w-64 mx-auto">
              <Link
                to="/SignUp"
                className=" w-64 h-11 flex items-center justify-center bg-[#1F6170] text-white font-bold text-base sm:text-lg rounded-lg shadow-sm hover:opacity-90 transition-opacity"
              >
                아이디 찾기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}