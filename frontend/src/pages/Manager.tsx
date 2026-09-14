import React, { useState } from 'react';

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

interface Music {
  musicId: number;
  title: string;
  artist: string;
  genre: string;
  emotionTag: string;
  registeredAt: string;
}

interface LoginLog {
  logId: number;
  attemptId: string;
  userSeq: number | null;
  isSuccess: boolean;
  ipAddress: string;
  device: string;
  attemptedAt: string;
  failReason?: string;
}

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'music' | 'attendance' | 'logs'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  // 출석률 계산 기준일 (월 30일 기준)
  const TOTAL_MONTH_DAYS = 30;

  // 샘플 데이터
  const [members] = useState<Member[]>([
    { userSeq: 1, userId: 'user01', userName: '김철수', userTel: '010-1234-5678', attendanceCount: 15, totalCounselCount: 8, isHighRisk: true, status: 'ACTIVE' },
    { userSeq: 2, userId: 'user02', userName: '이영희', userTel: '010-8765-4321', attendanceCount: 22, totalCounselCount: 12, isHighRisk: false, status: 'ACTIVE' },
    { userSeq: 3, userId: 'user03', userName: '박민수', userTel: '010-5555-6666', attendanceCount: 3, totalCounselCount: 1, isHighRisk: false, status: 'BLOCKED' },
  ]);

  const [musicList, setMusicList] = useState<Music[]>([
    { musicId: 1, title: 'Weightless', artist: 'Marconi Union', genre: 'Ambient', emotionTag: '불안', registeredAt: '2026-09-01' },
    { musicId: 2, title: 'River Flows in You', artist: '이루마', genre: 'New Age', emotionTag: '슬픔', registeredAt: '2026-09-05' },
  ]);

  const [loginLogs] = useState<LoginLog[]>([
    { logId: 101, attemptId: 'user01', userSeq: 1, isSuccess: true, ipAddress: '192.168.1.10', device: 'Chrome / Windows', attemptedAt: '2026-09-14 09:30:12' },
    { logId: 102, attemptId: 'unknown_user', userSeq: null, isSuccess: false, ipAddress: '211.234.55.12', device: 'Firefox / Mac', attemptedAt: '2026-09-14 09:45:00', failReason: '존재하지 않는 아이디' },
  ]);

  // 회원 필터링
  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.userId.includes(searchTerm) || m.userName.includes(searchTerm) || m.userTel.includes(searchTerm);
    const matchesRisk = highRiskOnly ? m.isHighRisk : true;
    return matchesSearch && matchesRisk;
  });

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">관리자 페이지</h1>

        {/* 1. 상단 대시보드 요약 위젯 */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">서버 / DB 상태</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-green-600">정상 (Good)</span>
              <span className="text-xs text-gray-400">CPU 18% | RAM 42%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">금일 상담 건수</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-800">24건</span>
              <span className="text-xs text-blue-500 font-semibold">+12% vs 어제</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">평균 회원 출석률</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-800">78.5%</span>
              <span className="text-xs text-gray-400">월간 집계</span>
            </div>
          </div>
        </section>

        {/* 2. 탭 네비게이션 */}
        <div className="border-b border-gray-200 bg-white rounded-t-xl px-4 pt-3">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              회원 및 고위험군 관리
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'music'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              추천 음악 메타데이터 관리
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              회원 출석률 모니터링
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              접속 및 보안 모니터링
            </button>
          </nav>
        </div>

        {/* 3. 탭별 컨텐츠 영역 */}
        <div className="bg-white p-6 rounded-b-xl shadow-sm border border-gray-100">

          {/* TAB 1: 회원 및 고위험군 관리 */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-2">
                <input
                  type="text"
                  placeholder="아이디, 이름, 전화번호 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <label className="flex items-center space-x-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highRiskOnly}
                    onChange={(e) => setHighRiskOnly(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <span>고위험군 회원의 데이터만 보기</span>
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 border-b">
                      <th className="p-3">회원번호</th>
                      <th className="p-3">아이디</th>
                      <th className="p-3">이름</th>
                      <th className="p-3">전화번호</th>
                      <th className="p-3 text-center">출석일수</th>
                      <th className="p-3 text-center">총 상담 횟수</th>
                      <th className="p-3 text-center">계정 상태</th>
                      <th className="p-3 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMembers.map((member) => (
                      <tr key={member.userSeq} className="hover:bg-gray-50">
                        <td className="p-3">{member.userSeq}</td>
                        <td className="p-3 font-medium">{member.userId}</td>
                        <td className="p-3">{member.userName}</td>
                        <td className="p-3">{member.userTel}</td>
                        <td className="p-3 text-center">{member.attendanceCount}일</td>
                        <td className="p-3 text-center">{member.totalCounselCount}회</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-1 text-xs rounded font-medium ${member.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                              }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          <button className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 text-xs font-semibold">
                            상세
                          </button>
                          <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-xs">
                            상태변경
                          </button>
                        </td>
                      </tr>
                    ))}
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
                onSubmit={(e) => e.preventDefault()}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">제목</label>
                  <input type="text" placeholder="음악 제목" className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">가수</label>
                  <input type="text" placeholder="아티스트" className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">장르</label>
                  <input type="text" placeholder="장르" className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">매핑 감정 태그</label>
                  <select className="w-full p-2 border rounded text-sm">
                    <option value="불안">불안/스트레스</option>
                    <option value="슬픔">슬픔/우울</option>
                    <option value="분노">분노</option>
                    <option value="기쁨">기쁨</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded text-sm font-medium hover:bg-indigo-700">
                  음악 신규 등록
                </button>
              </form>

              {/* 음악 목록 테이블 */}
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-600">
                    <th className="p-3">ID</th>
                    <th className="p-3">음악 제목</th>
                    <th className="p-3">가수</th>
                    <th className="p-3">장르</th>
                    <th className="p-3">매핑 감정</th>
                    <th className="p-3">등록일자</th>
                    <th className="p-3 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {musicList.map((m) => (
                    <tr key={m.musicId} className="hover:bg-gray-50">
                      <td className="p-3">{m.musicId}</td>
                      <td className="p-3 font-medium">{m.title}</td>
                      <td className="p-3">{m.artist}</td>
                      <td className="p-3">{m.genre}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                          {m.emotionTag}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{m.registeredAt}</td>
                      <td className="p-3 text-center">
                        <button className="text-red-600 hover:text-red-800 text-xs font-semibold">삭제</button>
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
                <span className="text-xs text-gray-500">기준 일수: 월 {TOTAL_MONTH_DAYS}일</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 border-b">
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
                        <tr key={member.userSeq} className="hover:bg-gray-50">
                          <td className="p-3">{member.userSeq}</td>
                          <td className="p-3 font-medium">{member.userId}</td>
                          <td className="p-3">{member.userName}</td>
                          <td className="p-3 text-center">{member.attendanceCount} / {TOTAL_MONTH_DAYS}일</td>
                          <td className="p-3 text-center font-bold text-indigo-600">{rate}%</td>
                          <td className="p-3 w-48">
                            <div className="w-full bg-gray-200 rounded-full h-2">
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

          {/* TAB 4: 접속 및 보안 모니터링 */}
          {activeTab === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-600">
                    <th className="p-3">로그 ID</th>
                    <th className="p-3">시도 아이디</th>
                    <th className="p-3">회원 번호</th>
                    <th className="p-3">성공 여부</th>
                    <th className="p-3">접속 IP</th>
                    <th className="p-3">접속 기기</th>
                    <th className="p-3">시도 일시</th>
                    <th className="p-3">실패 사유</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loginLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-gray-50">
                      <td className="p-3">{log.logId}</td>
                      <td className="p-3 font-medium">{log.attemptId}</td>
                      <td className="p-3">{log.userSeq ?? '-'}</td>
                      <td className="p-3">
                        {log.isSuccess ? (
                          <span className="text-green-600 font-bold text-xs">성공</span>
                        ) : (
                          <span className="text-red-600 font-bold text-xs">실패</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600">{log.ipAddress}</td>
                      <td className="p-3 text-gray-600">{log.device}</td>
                      <td className="p-3 text-gray-500">{log.attemptedAt}</td>
                      <td className="p-3 text-red-500 text-xs">{log.failReason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </main>
  );
};

export default AdminPage;