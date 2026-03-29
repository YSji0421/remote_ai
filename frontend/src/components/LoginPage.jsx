import React, { useState } from 'react';

/**
 * 로그인 + 회원가입을 하나의 페이지에서 토글로 제공합니다.
 * 로그인 성공 시 onLoginSuccess(userData) 콜백을 호출하여
 * App.jsx의 뷰 상태를 'dashboard'로 전환시킵니다.
 */
export default function LoginPage({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(''); // 백엔드 DTO 필드명: nickname
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // HttpOnly 쿠키 수신
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setError('이메일 또는 비밀번호가 올바르지 않습니다.'); return; }
      // 백엔드가 문자열 응답을 반환하므로, 이메일을 직접 유저 정보로 넘김
      onLoginSuccess({ email });
    } catch(err) {
      setError('서버와 연결할 수 없습니다. 백엔드가 켜져 있는지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }),
      });
      if (!res.ok) { setError('회원가입에 실패했습니다. 이미 존재하는 이메일일 수 있습니다.'); return; }
      // 회원가입 성공 → 자동으로 로그인 폼으로 전환
      setIsSignUp(false);
      setError('');
      alert('회원가입 완료! 로그인해주세요.');
    } catch(err) {
      setError('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-950 via-gray-900 to-slate-900">
      {/* 배경 글로우 효과 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600 opacity-10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 bg-gray-900/80 backdrop-blur-sm border border-gray-700 p-10 rounded-3xl shadow-2xl w-full max-w-md">
        {/* 로고 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-lg">✨</div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI 원격 상담</h1>
        </div>

        <h2 className="text-gray-300 text-lg font-semibold mb-6">
          {isSignUp ? '새 계정 만들기' : '로그인'}
        </h2>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">이름</label>
              <input
                type="text" value={nickname} onChange={e => setNickname(e.target.value)} required
                placeholder="홍길동"
                className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">이메일</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com"
              className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">비밀번호</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="mt-1 w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 mt-2"
          >
            {loading ? '처리 중...' : (isSignUp ? '회원가입' : '로그인')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? '이미 계정이 있으신가요?' : '처음이신가요?'}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold transition"
          >
            {isSignUp ? '로그인' : '회원가입'}
          </button>
        </p>
      </div>
    </div>
  );
}
