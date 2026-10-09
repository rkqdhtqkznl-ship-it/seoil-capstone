import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';

// 1. 메인 페이지 (스쿨존 안심 지도)
function MainPage() {
  const [serverStatus, setServerStatus] = useState('백엔드 연결 확인 중...');

  useEffect(() => {
    // 백엔드 Health Check API 호출
    axios.get('http://localhost:5000/api/health')
      .then((response) => {
        setServerStatus(response.data.message);
      })
      .catch((error) => {
        console.error('백엔드 연동 에러:', error);
        setServerStatus('❌ 백엔드 서버와 연결하지 못했습니다.');
      });
  }, []);

  return (
    <div>
      <h2>🗺️ 스쿨존 안심 지도 (메인 화면)</h2>
      
      {/* 백엔드 연동 상태 표시 박스 */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#eef6ff', 
        border: '1px solid #b6d4fe',
        borderRadius: '8px', 
        marginTop: '15px',
        marginBottom: '20px'
      }}>
        <strong>🔌 백엔드 연결 상태: </strong> 
        <span style={{ color: '#0d6efd', fontWeight: 'bold' }}>{serverStatus}</span>
      </div>

      {/* 제보 게시판 이동 버튼 */}
      <Link to="/report">
        <button style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#0d6efd',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          제보게시판이동 ➔
        </button>
      </Link>
    </div>
  );
}

// 2. 제보 페이지 (위험 지역 제보하기)
function ReportPage() {
  return (
    <div>
      <h2>🚨 위험 지역 제보하기 (제보 게시판)</h2>
      <p>중랑구 내 위험한 스쿨존 구역이나 불법 주정차 요인을 제보해 주세요.</p>
      
      {/* 메인 화면으로 돌아가기 버튼 */}
      <Link to="/">
        <button style={{
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '15px'
        }}>
          ⬅️ 메인 지도 화면으로 돌아가기
        </button>
      </Link>
    </div>
  );
}

// 상단 헤더 및 라우팅 설정
function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <header style={{ borderBottom: '2px solid #ddd', pb: '10px', mb: '20px' }}>
          <h1>🏫 현재가 미래로 - 중랑구 아동 안심 스쿨존</h1>
        </header>
        
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;