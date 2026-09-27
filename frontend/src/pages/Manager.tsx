import React, { useEffect, useState } from 'react';
import { getMileageProducts, updateMileageProduct, MileageProduct } from '../API/mileage';
import { getMembers, updateAdminMember, getServerStatus, AdminMember, ServerStatus } from '../API/admin';
import { checkServerHealth } from '../API/ai';
import { getAllMusic, createMusic, updateMusic, deleteMusic, MusicRecommendation } from '../API/music';
import { EMOTION_LABELS } from '../utils/emotion';
import { ApiError } from '../API/axios';

// --- 타입 정의 ---
interface Member {
  userSeq: number;
  userId: string;
  userName: string;
  userTel: string;
  attendanceCount: number;
  totalCounselCount: number;
  isHighRisk: boolean;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}



// 서버 에러 응답의 message를 꺼내거나 기본 문구 반환
const getErrorMessage = (e: unknown): string => {
  const err = e as ApiError;
  return err?.response?.data?.message || '요청 처리 중 오류가 발생했습니다.';
};

// 빈 값이 0으로 저장되는 것을 막기 위한 숫자 입력 검증 (정수, 0 이상만 허용)
const parseNonNegativeInt = (value: string): number | null => {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'music' | 'products' | 'attendance'>('members');
  const [searchTerm, setSearchTerm] = useState('');

  // 출석률 계산 기준일 (월 30일 기준)
  const TOTAL_MONTH_DAYS = 30;

  // 샘플 데이터
  const [members] = useState<Member[]>([
    { userSeq: 1, userId: 'user01', userName: '김철수', userTel: '010-1234-5678', attendanceCount: 15, totalCounselCount: 8, isHighRisk: true, status: 'ACTIVE' },
    { userSeq: 2, userId: 'user02', userName: '이영희', userTel: '010-8765-4321', attendanceCount: 22, totalCounselCount: 12, isHighRisk: false, status: 'ACTIVE' },
    { userSeq: 3, userId: 'user03', userName: '박민수', userTel: '010-5555-6666', attendanceCount: 3, totalCounselCount: 1, isHighRisk: false, status: 'BLOCKED' },
  ]);

  // 추천 음악 목록 (실제 DB 조회)
  const [musicList, setMusicList] = useState<MusicRecommendation[]>([]);
  // 신규 등록 입력값
  const [newMusic, setNewMusic] = useState({ title: '', singer: '', genre: EMOTION_LABELS[0].label });
  // 곡별 수정값 (저장 전 임시 상태)
  const [musicEdits, setMusicEdits] = useState<Record<number, { title: string; singer: string; genre: string }>>({});

  const refreshMusic = () => getAllMusic().then((list) => {
    setMusicList(list);
    setMusicEdits(Object.fromEntries(list.map((m) => [m.music_no, { title: m.title, singer: m.singer, genre: m.genre }])));
  });

  useEffect(() => {
    if (activeTab !== 'music') return;
    refreshMusic().catch(() => setMusicList([]));
  }, [activeTab]);

  // 추천 음악 신규 등록
  const handleMusicCreate = async () => {
    if (!newMusic.title.trim() || !newMusic.singer.trim()) return;
    try {
      await createMusic(newMusic.title.trim(), newMusic.singer.trim(), newMusic.genre);
      setNewMusic({ title: '', singer: '', genre: EMOTION_LABELS[0].label });
      refreshMusic();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  // 추천 음악 수정
  const handleMusicSave = async (musicNo: number) => {
    const edit = musicEdits[musicNo];
    if (!edit || !edit.title.trim() || !edit.singer.trim()) {
      alert('제목과 가수를 입력해주세요.');
      return;
    }
    try {
      await updateMusic(musicNo, edit.title.trim(), edit.singer.trim(), edit.genre);
      refreshMusic();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  // 추천 음악 삭제
  const handleMusicDelete = async (musicNo: number) => {
    if (!window.confirm('이 추천 음악을 삭제하시겠습니까?')) return;
    try {
      await deleteMusic(musicNo);
      refreshMusic();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  // 실제 회원 목록 (관리자 API 조회)
  const [realMembers, setRealMembers] = useState<AdminMember[]>([]);
  // 회원별 역할/마일리지 수정값 (저장 전 임시 상태) - 아이디/이름/전화번호는 본인만 수정 가능하도록 관리 대상에서 제외
  const [memberEdits, setMemberEdits] = useState<Record<number, { role: string; mileage: string }>>({});

  useEffect(() => {
    if (activeTab !== 'members') return;
    getMembers().then((list) => {
      setRealMembers(list);
      setMemberEdits(Object.fromEntries(list.map((m) => [m.memberNo, { role: m.role, mileage: String(m.mileage) }])));
    }).catch(() => setRealMembers([]));
  }, [activeTab]);

  // 회원 역할/마일리지 저장
  const handleMemberSave = async (memberNo: number) => {
    const edit = memberEdits[memberNo];
    if (!edit) return;
    const mileage = parseNonNegativeInt(edit.mileage);
    if (mileage === null) {
      alert('마일리지를 0 이상의 숫자로 입력해주세요.');
      return;
    }
    try {
      const updated = await updateAdminMember(memberNo, { role: edit.role, mileage });
      setRealMembers((prev) => prev.map((m) => (m.memberNo === memberNo ? updated : m)));
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  // 백엔드 / DB / AI 서버 상태 (대시보드 상단 위젯, 진입 시 1회 조회)
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    getServerStatus().then(setServerStatus).catch(() => setServerStatus({ backendUp: false, dbUp: false }));
    checkServerHealth().then(setAiOnline);
  }, []);

  // 마일리지 상품 목록 (실제 DB 조회)
  const [products, setProducts] = useState<MileageProduct[]>([]);
  // 상품별 가격 수정값, 새로 선택한 이미지 파일 (저장 전 임시 상태)
  const [priceEdits, setPriceEdits] = useState<Record<number, string>>({});
  const [imageEdits, setImageEdits] = useState<Record<number, File | null>>({});

  useEffect(() => {
    if (activeTab !== 'products') return;
    getMileageProducts().then((list) => {
      setProducts(list);
      setPriceEdits(Object.fromEntries(list.map((p) => [p.prodNo, String(p.prodPrice)])));
    }).catch(() => setProducts([]));
  }, [activeTab]);

  // 파일을 base64 문자열로 변환 (data URL 접두어 제거)
  const readAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.readAsDataURL(file);
    });

  // 상품 저장: 가격과(선택 시) 이미지를 함께 DB에 반영
  const handleProductSave = async (prodNo: number) => {
    const prodPrice = parseNonNegativeInt(priceEdits[prodNo]);
    if (prodPrice === null) {
      alert('가격을 0 이상의 숫자로 입력해주세요.');
      return;
    }
    try {
      const file = imageEdits[prodNo];
      const prodImage = file ? await readAsBase64(file) : undefined;
      const updated = await updateMileageProduct(prodNo, { prodPrice, prodImage });
      setProducts((prev) => prev.map((p) => (p.prodNo === prodNo ? updated : p)));
      setImageEdits((prev) => ({ ...prev, [prodNo]: null }));
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  // 회원 필터링 (출석률 모니터링 탭에서 사용)
  const filteredMembers = members.filter((m) =>
    m.userId.includes(searchTerm) || m.userName.includes(searchTerm) || m.userTel.includes(searchTerm)
  );

  // 실제 회원 필터링 (회원관리 탭에서 사용)
  const filteredRealMembers = realMembers.filter((m) =>
    m.id.includes(searchTerm) || m.name.includes(searchTerm) || m.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">관리자 페이지</h1>

        {/* 1. 상단 서버 상태 모니터링 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: '백엔드 서버', up: serverStatus?.backendUp ?? null },
            { label: 'DB', up: serverStatus?.dbUp ?? null },
            { label: 'AI 서버', up: aiOnline },
          ].map(({ label, up }) => (
            <div key={label} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label} 상태</p>
              <div className="mt-2">
                <span className={`text-2xl font-bold ${up === null ? 'text-gray-400' : up ? 'text-green-600' : 'text-red-600'}`}>
                  {up === null ? '확인 중...' : up ? '정상' : '연결 안 됨'}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* 2. 탭 네비게이션 */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl px-4 pt-3">
          <nav className="flex gap-4 sm:gap-8 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              회원관리
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'music'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              추천 음악 메타데이터 관리
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'products'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              마일리지 상품 관리
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              회원 출석률 모니터링
            </button>
          </nav>
        </div>

        {/* 3. 탭별 컨텐츠 영역 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-b-xl shadow-sm border border-gray-100 dark:border-gray-700">

          {/* TAB 1: 회원관리 */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="아이디, 이름, 전화번호 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b">
                      <th className="p-3">회원번호</th>
                      <th className="p-3">아이디</th>
                      <th className="p-3">이름</th>
                      <th className="p-3">전화번호</th>
                      <th className="p-3 text-center">역할</th>
                      <th className="p-3 text-center">마일리지</th>
                      <th className="p-3 text-center">저장</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRealMembers.map((member) => {
                      const edit = memberEdits[member.memberNo] ?? { role: member.role, mileage: String(member.mileage) };
                      const setEdit = (patch: Partial<typeof edit>) =>
                        setMemberEdits((prev) => ({ ...prev, [member.memberNo]: { ...edit, ...patch } }));
                      return (
                        <tr key={member.memberNo} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="p-3">{member.memberNo}</td>
                          <td className="p-3 font-medium">{member.id}</td>
                          <td className="p-3">{member.name}</td>
                          <td className="p-3">{member.phone}</td>
                          <td className="p-3 text-center">
                            <select
                              value={edit.role}
                              onChange={(e) => setEdit({ role: e.target.value })}
                              className="p-1 border rounded text-sm"
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              value={edit.mileage}
                              onChange={(e) => setEdit({ mileage: e.target.value })}
                              className="w-24 p-1 border rounded text-sm text-center"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleMemberSave(member.memberNo)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-semibold"
                            >
                              저장
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: 추천 음악 관리 */}
          {activeTab === 'music' && (
            <div className="space-y-6">
              {/* 음악 추가 폼 */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleMusicCreate(); }}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">제목</label>
                  <input
                    type="text"
                    placeholder="음악 제목"
                    value={newMusic.title}
                    onChange={(e) => setNewMusic((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">가수</label>
                  <input
                    type="text"
                    placeholder="아티스트"
                    value={newMusic.singer}
                    onChange={(e) => setNewMusic((prev) => ({ ...prev, singer: e.target.value }))}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">매핑 감정</label>
                  <select
                    value={newMusic.genre}
                    onChange={(e) => setNewMusic((prev) => ({ ...prev, genre: e.target.value }))}
                    className="w-full p-2 border rounded text-sm"
                  >
                    {EMOTION_LABELS.map((e) => (
                      <option key={e.label} value={e.label}>{e.emoji} {e.label}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded text-sm font-medium hover:bg-indigo-700">
                  음악 신규 등록
                </button>
              </form>

              {/* 음악 목록 테이블 */}
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b text-gray-600 dark:text-gray-400">
                    <th className="p-3">ID</th>
                    <th className="p-3">음악 제목</th>
                    <th className="p-3">가수</th>
                    <th className="p-3">매핑 감정</th>
                    <th className="p-3 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {musicList.map((m) => {
                    const edit = musicEdits[m.music_no] ?? { title: m.title, singer: m.singer, genre: m.genre };
                    const setEdit = (patch: Partial<typeof edit>) =>
                      setMusicEdits((prev) => ({ ...prev, [m.music_no]: { ...edit, ...patch } }));
                    return (
                      <tr key={m.music_no} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="p-3">{m.music_no}</td>
                        <td className="p-3">
                          <input
                            value={edit.title}
                            onChange={(e) => setEdit({ title: e.target.value })}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            value={edit.singer}
                            onChange={(e) => setEdit({ singer: e.target.value })}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={edit.genre}
                            onChange={(e) => setEdit({ genre: e.target.value })}
                            className="p-1 border rounded text-sm"
                          >
                            {!EMOTION_LABELS.some((e) => e.label === edit.genre) && (
                              <option value={edit.genre}>⚠ {edit.genre} (알 수 없는 값)</option>
                            )}
                            {EMOTION_LABELS.map((e) => (
                              <option key={e.label} value={e.label}>{e.emoji} {e.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => handleMusicSave(m.music_no)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-semibold"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => handleMusicDelete(m.music_no)}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* TAB: 마일리지 상품 이미지 관리 */}
          {activeTab === 'products' && (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b text-gray-600 dark:text-gray-400">
                  <th className="p-3">상품번호</th>
                  <th className="p-3">상품명</th>
                  <th className="p-3">가격</th>
                  <th className="p-3">현재 이미지</th>
                  <th className="p-3">새 이미지</th>
                  <th className="p-3 text-center">저장</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.prodNo} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="p-3">{p.prodNo}</td>
                    <td className="p-3 font-medium">{p.prodName}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={priceEdits[p.prodNo] ?? String(p.prodPrice)}
                        onChange={(e) => setPriceEdits((prev) => ({ ...prev, [p.prodNo]: e.target.value }))}
                        className="w-24 p-1 border rounded text-sm"
                      />
                    </td>
                    <td className="p-3">
                      {p.prodImage ? (
                        <img src={`data:image/png;base64,${p.prodImage}`} alt={p.prodName} className="w-14 h-14 object-cover rounded border" />
                      ) : (
                        <span className="text-xs text-gray-400">이미지 없음</span>
                      )}
                    </td>
                    <td className="p-3">
                      <input
                        type="file"
                        accept="image/*"
                        className="text-xs"
                        onChange={(e) => setImageEdits((prev) => ({ ...prev, [p.prodNo]: e.target.files?.[0] ?? null }))}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleProductSave(p.prodNo)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-semibold"
                      >
                        저장
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {/* TAB 3: 회원 출석률 모니터링 */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-2">
                <input
                  type="text"
                  placeholder="회원 검색 (아이디, 이름)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">기준 일수: 월 {TOTAL_MONTH_DAYS}일</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b">
                      <th className="p-3">회원번호</th>
                      <th className="p-3">아이디</th>
                      <th className="p-3">이름</th>
                      <th className="p-3 text-center">출석일수</th>
                      <th className="p-3 text-center">월 출석률</th>
                      <th className="p-3">출석 달성도</th>
                      <th className="p-3 text-center">출석 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMembers.map((member) => {
                      const rate = Math.round((member.attendanceCount / TOTAL_MONTH_DAYS) * 100);
                      return (
                        <tr key={member.userSeq} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="p-3">{member.userSeq}</td>
                          <td className="p-3 font-medium">{member.userId}</td>
                          <td className="p-3">{member.userName}</td>
                          <td className="p-3 text-center">{member.attendanceCount} / {TOTAL_MONTH_DAYS}일</td>
                          <td className="p-3 text-center font-bold text-indigo-600">{rate}%</td>
                          <td className="p-3 w-48">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${rate >= 70 ? 'bg-indigo-600' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {rate < 40 ? (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                X
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                O
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPage;