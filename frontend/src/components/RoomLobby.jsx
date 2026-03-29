import React, { useState, useEffect, useCallback } from 'react';

/**
 * 상담 대기실 로비
 * - 방 목록 자동 폴링 (3초마다 최신 정보 갱신)  
 * - 방 만들기 모달
 * - 참여 인원수 표시 (최대 2명 기준)
 */
export default function RoomLobby({ onJoinRoom, onBack }) {
  const [rooms, setRooms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle]     = useState('');
  const [creating, setCreating]     = useState(false);

  // 방 목록 조회 함수 (3초마다 폴링)
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.error('방 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    // 3초마다 자동 갱신 (참여 인원 실시간 반영)
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
  }, [fetchRooms]);

  // 방 만들기
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const roomRes = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (!roomRes.ok) throw new Error('방 생성 실패');
      const roomData = await roomRes.json();

      // 생성 즉시 입장
      await joinRoom(roomData.livekitRoomName);
    } catch (err) {
      alert('방 생성 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setCreating(false);
      setShowCreate(false);
      setNewTitle('');
    }
  };

  // 방 입장 (토큰 발급 후 상위 컴포넌트에 전달)
  const joinRoom = async (livekitRoomName) => {
    try {
      const tokenRes = await fetch(`/api/rooms/${livekitRoomName}/token`, {
        credentials: 'include',
      });
      if (!tokenRes.ok) throw new Error('토큰 발급 실패');
      const tokenData = await tokenRes.json();
      onJoinRoom({ token: tokenData.token, roomName: livekitRoomName });
    } catch (err) {
      alert('입장 실패: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-gray-900 to-slate-900 text-white p-6">
      {/* 상단 헤더 */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition p-2 rounded-xl hover:bg-gray-800"
            >
              ← 뒤로
            </button>
            <h1 className="text-2xl font-extrabold">상담 대기실</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            방 만들기
          </button>
        </div>

        {/* 방 목록 */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500 gap-3">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            목록 불러오는 중...
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600 space-y-3 border border-dashed border-gray-700 rounded-2xl">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">개설된 상담방이 없습니다.</p>
            <p className="text-sm">오른쪽 상단의 "방 만들기"로 새 방을 만들어보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 text-right mb-1">🔄 3초마다 자동 갱신</p>
            {rooms.map(room => {
              // 참여 인원 / 최대 2명 (상담사 + 내담자)
              const isFull = room.participantCount >= 2;
              return (
                <div
                  key={room.roomId}
                  className={`flex items-center justify-between bg-gray-800/60 border rounded-2xl px-6 py-4 transition-all ${
                    isFull
                      ? 'border-gray-700 opacity-60'
                      : 'border-gray-700 hover:border-indigo-500 hover:bg-gray-800 hover:shadow-xl hover:shadow-indigo-900/20'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-white text-lg">{room.title}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">개설자: {room.ownerNickname}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* 참여 인원 배지 */}
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      isFull ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'
                    }`}>
                      {room.participantCount} / 2
                    </span>
                    <button
                      onClick={() => !isFull && joinRoom(room.livekitRoomName)}
                      disabled={isFull}
                      className={`font-bold px-5 py-2 rounded-xl transition-all text-sm ${
                        isFull
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow hover:shadow-indigo-500/30'
                      }`}
                    >
                      {isFull ? '정원 초과' : '입장'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 방 만들기 모달 */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl w-full max-w-md p-8"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-extrabold text-white mb-6">새 상담방 만들기</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">방 제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="예: 홍길동 님 1회기 상담"
                  required
                  autoFocus
                  className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 font-bold py-3 rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
                >
                  {creating ? '생성 중...' : '만들고 입장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
