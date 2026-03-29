import React, { useState } from 'react';
import LoginPage      from './components/LoginPage';
import Dashboard      from './components/Dashboard';
import RoomLobby      from './components/RoomLobby';
import CounselingRoom from './components/CounselingRoom';

/**
 * 뷰 상태 4단계:
 *  'login'     → 로그인/회원가입 폼
 *  'dashboard' → 내 상담 기록 대시보드 (기록 열람 + "상담 대기실" 버튼)
 *  'lobby'     → 상담 대기실 (방 목록 조회 + 방 만들기)
 *  'room'      → LiveKit 화상 상담방
 */
export default function App() {
  const [view, setView]         = useState('login');
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);
  const [roomName, setRoomName] = useState('');

  // 로그인 성공 → 대시보드
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  // 대시보드 "상담 시작" → 로비
  const handleGoToLobby = () => setView('lobby');

  // 로비에서 방 입장 → 화상방
  const handleJoinRoom = ({ token: lkToken, roomName: lkRoomName }) => {
    setToken(lkToken);
    setRoomName(lkRoomName);
    setView('room');
  };

  // 통화 종료 → 대시보드로 복귀
  const handleLeaveRoom = () => {
    setToken(null);
    setRoomName('');
    setView('dashboard');
  };

  // 로그아웃 → 로그인 페이지
  const handleLogout = () => {
    setUser(null);
    setView('login');
  };

  // ── 뷰 라우팅 ──────────────────────────────────────────────
  if (view === 'room' && token) {
    return (
      <CounselingRoom
        token={token}
        serverUrl="wss://airemote-sxsx98nj.livekit.cloud"
        roomName={roomName}
        onLeave={handleLeaveRoom}
      />
    );
  }

  if (view === 'lobby') {
    return (
      <RoomLobby
        onJoinRoom={handleJoinRoom}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'dashboard' && user) {
    return (
      <Dashboard
        user={user}
        onStartCounseling={handleGoToLobby}  // 대시보드 → 로비
        onLogout={handleLogout}
      />
    );
  }

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}
