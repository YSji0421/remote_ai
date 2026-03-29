import React, { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

/**
 * 로컬 및 원격 마이크 트랙들을 하나로 믹싱하여 MediaRecorder로 굽는 컴포넌트
 */
function AudioMixerRecorder({ isRecording, onRecordingComplete }) {
  const tracks = useTracks([Track.Source.Microphone]);
  const audioCtxRef = useRef(null);
  const destRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const sourcesRef = useRef([]);

  useEffect(() => {
    if (!isRecording) return;

    // 최초 1회 오디오 컨텍스트 & 레코더 생성
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      destRef.current = audioCtxRef.current.createMediaStreamDestination();

      // 브라우저 호환성을 위해 webm 선호, 안 되면 ogg 등 기본값
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }

      mediaRecorderRef.current = new MediaRecorder(destRef.current.stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        onRecordingComplete(blob);
        chunksRef.current = []; // 초기화
      };

      mediaRecorderRef.current.start();
    }

    // 마이크 트랙 갱신 시 연결
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    // 기존 소스 연결 해제
    sourcesRef.current.forEach(s => s.disconnect());
    sourcesRef.current = [];

    // 활성화된 모든 마이크(본인+상대방)를 믹서에 병합
    tracks.forEach(trackRef => {
      const mediaStreamTrack = trackRef.publication?.track?.mediaStreamTrack || trackRef.track?.mediaStreamTrack;
      if (mediaStreamTrack && mediaStreamTrack.readyState === 'live') {
        try {
          const stream = new MediaStream([mediaStreamTrack]);
          const source = audioCtxRef.current.createMediaStreamSource(stream);
          source.connect(destRef.current);
          sourcesRef.current.push(source);
        } catch (err) {
          console.warn("트랙 믹싱 에러:", err);
        }
      }
    });

  }, [tracks, isRecording]);

  // isRecording 상태가 false로 변하면 녹음 중지
  useEffect(() => {
    if (!isRecording && mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      audioCtxRef.current?.close();
    }
  }, [isRecording]);

  return null; // 순수 로직 컴포넌트이므로 UI는 없음
}

export default function CounselingRoom({ token, serverUrl, roomName, onLeave }) {
  const [isRecording, setIsRecording] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const handleDisconnect = () => {
    console.log("통화가 종료되었습니다. 녹음을 중지하고 분석을 시작합니다.");
    setIsRecording(false);
    // isRecording이 false가 되면서 AudioMixerRecorder가 stop()을 호출하고, onRecordingComplete가 트리거됨
  };

  const handleRecordingComplete = async (blob) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("audio_file", blob, "counseling_record.webm");

      // 1. FastAPI AI 서버로 오디오 파일 전송
      const res = await fetch("http://127.0.0.1:8001/api/analyze-record", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data);

        // 2. Spring Boot로 결과 전송하여 DB에 AES-256 암호화 저장
        try {
          const saveRes = await fetch("/api/records/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // ⭐ 수정 2: 인증 쿠키(JWT)를 백엔드에 전달하기 위해 credentials 옵션 추가
            credentials: 'include',
            body: JSON.stringify({
              roomName: roomName,
              transcript: data.transcript,
              summary: data.summary
            })
          });
          console.log("데이터 암호화 저장 완료");
        } catch (dbErr) {
          console.error("DB 저장 실패:", dbErr);
        }

      } else {
        alert("AI 서버 분석 실패 (상태 코드: " + res.status + ")");
        onLeave(); // 실패 시 로비로 반환
      }
    } catch (e) {
      console.error("FastAPI 통신 에러:", e);
      alert("AI 서버와 연결할 수 없습니다. 서버가 켜져 있는지 확인해주세요.");
      onLeave();
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-950 overflow-hidden font-sans">

      {/* 1. 좌측 화상 통화 영역 */}
      <div className="flex-1 relative border-r border-gray-800 shadow-xl bg-black">
        {/* 통화 중일 때 화면 */}
        {!report && !isAnalyzing && (
          <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={serverUrl}
            onDisconnected={handleDisconnect}
            data-lk-theme="default"
            className="w-full h-full"
          >
            <VideoConference />
            <RoomAudioRenderer />
            {/* 오디오 믹싱 숨은 컴포넌트 */}
            <AudioMixerRecorder
              isRecording={isRecording}
              onRecordingComplete={handleRecordingComplete}
            />
          </LiveKitRoom>
        )}

        {/* 분석 중일 때 딤처리 및 스피너 */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm">
            <svg className="animate-spin h-14 w-14 text-indigo-500 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-2xl font-extrabold text-white tracking-wider mb-2 animate-pulse">AI 상담 분석 중...</h2>
            <p className="text-gray-400 text-center px-4 max-w-sm">녹음된 전체 통화 내용을 고품질로 텍스트화하고<br />Gemini 요약 모델을 가동하고 있습니다.<br />잠시만 기다려 주세요.</p>
          </div>
        )}

        {/* 최종 분석 완료 보고서 화면 */}
        {report && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 p-8 overflow-y-auto">
            <div className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="bg-indigo-600 text-white rounded-lg p-2">✨</span>
                AI 상담 요약 리포트
              </h2>

              <div className="bg-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-indigo-400 font-bold mb-3 uppercase tracking-widest text-sm">핵심 요약</h3>
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {report.summary}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={onLeave}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition duration-200 shadow-lg"
                >
                  로비로 돌아가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. 우측 패널 (안내 고정) */}
      <div className="w-full md:w-96 bg-gray-900 flex flex-col shadow-2xl z-10 transition-all duration-300">
        <div className="p-5 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-extrabold text-lg tracking-wide">시스템 상태</h2>
          <span className="flex items-center gap-2 bg-gray-900 px-3 py-1 pb-1.5 rounded-full border border-gray-700">
            <span className={"relative flex h-2.5 w-2.5 mt-0.5"}>
              <span className={"absolute inline-flex h-full w-full rounded-full opacity-75 " + (isRecording ? "bg-red-400 animate-ping" : "bg-gray-500")}></span>
              <span className={"relative inline-flex rounded-full h-2.5 w-2.5 " + (isRecording ? "bg-red-500" : "bg-gray-500")}></span>
            </span>
            <span className="text-xs text-gray-300 font-bold uppercase mt-0.5">
              {isRecording ? "통화 녹음 중" : "녹음 종료"}
            </span>
          </span>
        </div>

        <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center space-y-6 bg-gradient-to-b from-gray-900 to-gray-950">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center shadow-inner border border-gray-700 mb-2">
            <svg className={"w-10 h-10 " + (isRecording ? "text-red-500" : "text-gray-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          </div>

          <div className="text-center space-y-3">
            <h3 className="text-lg font-bold text-gray-200">일괄 녹음 자동화</h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-[250px] mx-auto break-keep">
              빠짐없는 맥락 파악을 위해 실시간 스트리밍 대신 전체 통화를 녹음합니다.<br /><br />
              화면 하단의 빨간색 <strong className="text-red-400">Leave</strong> 버튼을 눌러 통화를 종료하시면, 즉시 AI 분석이 시작됩니다.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
