import React, { useEffect, useRef, useState } from 'react';

/**
 * 브라우저 마이크의 오디오 스트림(Web Audio API)을 훔쳐와서 원시 PCM(16kHz, 16-bit)으로 
 * 변환 후 파이썬 FastAPI 서버에 웹소켓으로 쏘는 컴포넌트.
 */
export default function STTStreamer({ roomName }) {
  const wsRef = useRef(null);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    // 파이썬 FastAPI 웹소켓 주소 (포트 8001)
    wsRef.current = new WebSocket(`ws://localhost:8001/api/stt/stream/${roomName}`);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'transcript') {
        // 들어온 텍스트 자막을 UI에 누적시킴
        setTranscript(prev => {
           const newText = prev + (prev ? '\n' : '') + data.text;
           // 방지턱: 텍스트가 너무 길어지면 최신 3줄 정도만 남기도록 슬라이싱
           const lines = newText.split('\n');
           return lines.slice(-3).join('\n');
        });
      }
    };

    let audioContext;
    let processor;
    let source;
    let stream;
    let gainNode;

    const startRecording = async () => {
      try {
        // 백그라운드에서 조용히 마이크 스트림 하나를 더 가져옵니다. 
        // (LiveKit용과 별개로 순수 PCM 추출 목적)
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Whisper 모델이 16000Hz를 강제 요구하므로 샘플 레이트를 맞춰줍니다.
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        source = audioContext.createMediaStreamSource(stream);
        
        // 1024 샘플(약 64ms) 단위로 쪼개서 이벤트를 발생시키는 노드
        processor = audioContext.createScriptProcessor(1024, 1, 1);
        
        processor.onaudioprocess = (e) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // 브라우저는 float32(-1.0 ~ 1.0) 범위를 줍니다.
            const inputData = e.inputBuffer.getChannelData(0); 
            
            // C언어나 Python struct처럼 완전한 16-bit 정수형 바이너리로 변환
            const int16Array = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              let s = Math.max(-1, Math.min(1, inputData[i]));
              int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            // 변환된 이진 배열 버퍼를 통째로 웹소켓 송신! (무전기 기능)
            wsRef.current.send(int16Array.buffer);
          }
        };

        // 내 목소리가 다시 내 스피커로 출력(메아리)되는 것을 막기 위해 볼륨(gain)을 0으로 끕니다.
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        
        // 오디오 연결 파이프라인 형성: 마이크 -> 프로세서 -> 메아리방지용 볼륨조절기 -> 스피커
        source.connect(processor);
        processor.connect(gainNode);
        gainNode.connect(audioContext.destination);
      } catch (err) {
        console.error("STT Audio Capture Error:", err);
      }
    };

    startRecording();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (processor) processor.disconnect();
      if (source) source.disconnect();
      if (gainNode) gainNode.disconnect();
      if (audioContext) audioContext.close();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [roomName]);

  return (
    <div className="absolute bottom-6 left-6 right-6 lg:left-1/4 lg:right-1/4 bg-black/70 backdrop-blur-md p-5 rounded-2xl text-white shadow-2xl border border-white/10 z-50 pointer-events-none transition-all">
      <div className="flex items-center gap-2 mb-2">
         <span className="relative flex h-3 w-3">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
         </span>
         <h3 className="text-red-400 font-bold text-sm tracking-widest uppercase">실시간 AI 자막 엔진 동작 중</h3>
      </div>
      <p className="text-xl md:text-2xl font-medium leading-relaxed drop-shadow-md min-h-[4rem] whitespace-pre-wrap">
        {transcript || "대화를 시작하면 이곳에 자막이 표시됩니다..."}
      </p>
    </div>
  );
}
