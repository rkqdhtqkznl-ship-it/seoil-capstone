import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function MainPage() {
  return <h2>🏫 스쿨존 안심 지도 (메인 화면)</h2>;
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