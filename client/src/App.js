import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';

function MainPage() {
  const [serverStatus, setServerStatus] = useState('백엔드 연결 확인 중...');

  useEffect(() => {
    // 백엔드 서버(http://localhost:5000/api/health)에 요청 보냄
    axios.get('http://localhost:5000/api/health')
      .then((response) => {
        // 백엔드에서 보낸 메시지를 상태값에 저장
        setServerStatus(response.data.message);
      })
      .catch((error) => {
        console.error('백엔드 연동 에러:', error);
        setServerStatus('❌ 백엔드 서버와 연결하지 못했습니다.');
      });
  }, []);

  return (
    <div>
      <h2>🏫 스쿨존 안심 지도 (메인 화면)</h2>
      
      {/* 백엔드 연동 결과 출력 상자 */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#eef6ff', 
        border: '1px solid #b6d4fe',
        borderRadius: '8px', 
        marginTop: '15px' 
      }}>
        <strong>🔌 백엔드 연결 상태: </strong> 
        <span style={{ color: '#0d6efd', fontWeight: 'bold' }}>{serverStatus}</span>
      </div>
    </div>
  );
}

function ReportPage() {
  return <h2>🚨 위험 지역 제보하기 (제보 화면)</h2>;
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '20px' }}>
        <h1>현재가 미래로 - 중랑구 스쿨존 안전 지도</h1>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;