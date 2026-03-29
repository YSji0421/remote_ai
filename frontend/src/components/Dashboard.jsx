import React, { useState, useEffect } from 'react';

/**
 * 로그인 후 보여지는 메인 대시보드
 * - 상담 기록 목록 카드 + 상세 조회 모달
 * - 새 상담 시작 버튼
 */
export default function Dashboard({ user, onStartCounseling, onLogout }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null); // 상세 모달 대상
  const [detailLoading, setDetailLoading] = useState(false);

  // 페이지 진입 시 내 상담 기록 목록 API 호출
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch('/api/records/my', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (err) {
        console.error('기록 조회 에러:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // 특정 카드 클릭 → 상세 API 조회 → 모달 표시
  const handleCardClick = async (recordId) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/records/${recordId}`, { credentials: 'include' });
      if (res.ok) {
        const detail = await res.json();
        setSelectedRecord(detail);
      }
    } catch (err) {
      console.error('상세 조회 에러:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-gray-900 to-slate-900 text-white">

      {/* 상단 네비게이션 바 */}
      <nav className="bg-gray-900/60 backdrop-blur-sm border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm">✨</div>
          <span className="font-extrabold text-lg tracking-tight">AI 원격 상담</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 transition px-3 py-1.5 rounded-lg hover:bg-red-900/20 border border-transparent hover:border-red-800"
          >
            로그아웃
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* 히어로 섹션 */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2">안녕하세요 👋</h1>
            <p className="text-gray-400 text-lg">AI가 분석한 상담 기록을 확인하거나 새 상담을 시작하세요.</p>
          </div>
          <button
            onClick={onStartCounseling}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            새 상담 시작
          </button>
        </div>

        {/* 상담 기록 목록 */}
        <h2 className="text-xl font-bold text-gray-200 mb-5">상담 기록</h2>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 gap-3">
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            기록을 불러오는 중...
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600 space-y-3 border border-dashed border-gray-700 rounded-2xl">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">아직 상담 기록이 없습니다.</p>
            <p className="text-sm">새 상담을 시작하면 여기에 기록이 쌓입니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {records.map(record => (
              <div
                key={record.id}
                onClick={() => handleCardClick(record.id)}
                className="bg-gray-800/50 border border-gray-700 hover:border-indigo-500 rounded-2xl p-6 cursor-pointer transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-indigo-900/20 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="font-bold text-white group-hover:text-indigo-300 transition">{record.roomTitle || '상담 세션'}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{new Date(record.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                  {record.summaryPreview || '요약 내용이 없습니다.'}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-indigo-400 font-semibold">
                  <span>상세 보기</span>
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세 보기 모달 */}
      {(selectedRecord || detailLoading) && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex items-center justify-center h-48 gap-3 text-gray-400">
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                상세 내용 불러오는 중...
              </div>
            ) : selectedRecord && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-extrabold text-white">상담 기록 상세</h2>
                  <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-white transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-8">
                  {selectedRecord.roomTitle} · {new Date(selectedRecord.createdAt).toLocaleString('ko-KR')}
                </p>

                {/* AI 요약 */}
                <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-2xl p-6 mb-6">
                  <h3 className="text-indigo-300 font-bold text-sm uppercase tracking-widest mb-3">✨ AI 요약</h3>
                  <div className="text-gray-200 leading-relaxed whitespace-pre-wrap text-sm">{selectedRecord.summary}</div>
                </div>

                {/* 전체 녹취록 */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                  <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-3">📄 전체 녹취록</h3>
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">{selectedRecord.transcript}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
