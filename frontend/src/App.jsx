import React, { useState } from 'react';
import CounselingRoom from './components/CounselingRoom'; // 분할 UI 컴포넌트로 교체 완료

export default function App() {
  const [token, setToken] = useState(null);
  const [inRoom, setInRoom] = useState(false);
  const [roomName, setRoomName] = useState('');

  const handleJoinDemo = async () => {
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123!' })
      });
      if (!loginRes.ok) throw new Error('로그인 실패 - 서버를 확인해주세요.');

      const roomRes = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ title: 'AI 원격 상담 테스트 화상방' })
      });
      if (!roomRes.ok) throw new Error('방 생성 실패 (접근 권한이 없습니다)');
      const roomData = await roomRes.json();
      
      setRoomName(roomData.livekitRoomName);

      const tokenRes = await fetch(`/api/rooms/${roomData.livekitRoomName}/token`, {
        credentials: 'include' 
      });
      if (!tokenRes.ok) throw new Error('LiveKit 토큰 발급 실패');
      const tokenData = await tokenRes.json();

      setToken(tokenData.token);
      setInRoom(true);
    } catch (error) {
      alert("백엔드 연동 에러가 발생했습니다: " + error.message);
      console.error(error);
    }
  };

  if (inRoom) {
    // 뼈대를 CounselingRoom(좌우 분할 레이아웃)으로 교체
    return (
      <CounselingRoom 
        token={token} 
        serverUrl="wss://airemote-sxsx98nj.livekit.cloud" 
        roomName={roomName} 
        onLeave={() => { setInRoom(false); setRoomName(''); }} 
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 drop-shadow-sm">
          AI 원격 상담 플랫폼
        </h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">
          안전하고 프라이빗한 전문 상담을 시작하세요.
        </p>
        <button 
          onClick={handleJoinDemo}
          className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white sm:text-lg font-bold rounded-xl transition-all shadow hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-200"
        >
          화상 상담 접속 테스트
        </button>
      </div>
    </div>
  );
}
