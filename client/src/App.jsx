import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const INITIAL_POINTS = [
  { id: 's1', type: 'school', title: '신내초등학교 스쿨존', detail: '어린이 보호구역 · 제한속도 30km/h', lat: 37.6056, lng: 127.0967, risk: '보통' },
  { id: 's2', type: 'school', title: '면목초등학교 스쿨존', detail: '어린이 보호구역 · 제한속도 30km/h', lat: 37.5889, lng: 127.0872, risk: '보통' },
  { id: 's3', type: 'school', title: '망우초등학교 스쿨존', detail: '어린이 보호구역 · 제한속도 30km/h', lat: 37.5998, lng: 127.1032, risk: '낮음' },
  { id: 'p1', type: 'parking', title: '불법 주정차 단속 지점', detail: '등하교 시간대 시야 확보 주의', lat: 37.5941, lng: 127.0804, risk: '높음' },
  { id: 'p2', type: 'parking', title: '횡단보도 인근 차량 정차', detail: '보행자 시야를 가릴 수 있음', lat: 37.6011, lng: 127.0912, risk: '높음' },
  { id: 'c1', type: 'cctv', title: '방범 CCTV', detail: '안전 확인용 CCTV 위치 예시', lat: 37.5904, lng: 127.0991, risk: '낮음' },
  { id: 'c2', type: 'cctv', title: '통학로 CCTV', detail: '안전 확인용 CCTV 위치 예시', lat: 37.6003, lng: 127.0787, risk: '낮음' },
  { id: 'r1', type: 'report', title: '보행로 주변 위험 제보', detail: '사용자 제보 예시 데이터', lat: 37.5972, lng: 127.0851, risk: '주의' },
  { id: 'r2', type: 'report', title: '골목길 시야 확보 필요', detail: '사용자 제보 예시 데이터', lat: 37.5869, lng: 127.0942, risk: '주의' },
];

const TYPES = {
  school: { label: '스쿨존', icon: '🏫', color: '#ef476f' },
  parking: { label: '불법 주정차', icon: '🚗', color: '#ff9638' },
  cctv: { label: 'CCTV', icon: '📹', color: '#17a673' },
  report: { label: '사용자 제보', icon: '⚠️', color: '#8857e8' },
};

function loadReports() {
  try { return JSON.parse(localStorage.getItem('school-safety-reports') || '[]'); }
  catch { return []; }
}

function MapView({ points, onSelect, selectedId, centerRequest }) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');

  // 1) SDK 로드 + 지도 생성
  useEffect(() => {
    let cancelled = false;
    const key = import.meta.env.VITE_KAKAO_MAP_KEY?.trim();

    if (!key) {
      setMapError('카카오 JavaScript 키가 설정되지 않았어요. client/.env 파일에 VITE_KAKAO_MAP_KEY=키값 을 입력한 뒤 개발 서버를 다시 실행해 주세요.');
      return () => { cancelled = true; };
    }

    const createMap = () => {
      if (cancelled || !mapElement.current || mapRef.current) return;
      try {
        const kakao = window.kakao;
        const map = new kakao.maps.Map(mapElement.current, {
          center: new kakao.maps.LatLng(37.5953, 127.0873),
          level: 5,
        });
        map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
        mapRef.current = map;
        setMapError('');
        setMapReady(true); // 마커 effect를 지도 생성 이후에 다시 실행시키는 신호
      } catch (error) {
        console.error('카카오 지도 생성 오류:', error);
        setMapError('지도를 생성하지 못했어요. 카카오 디벨로퍼스에서 JavaScript SDK 도메인(http://localhost:3000)과 카카오맵 활성화 여부를 확인해 주세요.');
      }
    };

    const onLoad = () => {
      if (cancelled || !window.kakao?.maps) return;
      window.kakao.maps.load(createMap); // autoload=false 이므로 load() 콜백 안에서 지도 생성
    };
    const onError = () => {
      if (!cancelled) setMapError('카카오 지도 SDK 요청에 실패했어요. JavaScript 키, 웹 도메인 등록, 네트워크 연결을 확인해 주세요.');
    };

    let script = document.querySelector('script[data-kakao-map-sdk]');
    if (window.kakao?.maps?.load) {
      onLoad();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.dataset.kakaoMapSdk = 'true';
        script.async = true;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
        document.head.appendChild(script);
      }
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
    }

    return () => {
      cancelled = true;
      if (script) {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
      }
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // 2) "중랑구 중심" 버튼
  useEffect(() => {
    const map = mapRef.current;
    const kakao = window.kakao;
    if (!mapReady || !map || !kakao?.maps) return;
    if (centerRequest > 0) {
      map.panTo(new kakao.maps.LatLng(37.5953, 127.0873));
      map.setLevel(5);
    }
  }, [centerRequest, mapReady]);

  // 3) 마커(커스텀 오버레이) 표시 - 지도가 준비된 뒤에 실행
  useEffect(() => {
    const map = mapRef.current;
    const kakao = window.kakao;
    if (!mapReady || !map || !kakao?.maps) return;
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = points.map(point => {
      const style = TYPES[point.type] || TYPES.report;
      const content = document.createElement('div');
      content.style.cssText = `background:${style.color};color:white;border:2px solid white;border-radius:18px;padding:5px 8px;font-size:15px;box-shadow:0 2px 7px #19355e40;white-space:nowrap;cursor:pointer;`;
      content.textContent = style.icon;
      content.title = point.title;
      content.addEventListener('click', () => onSelect(point));
      return new kakao.maps.CustomOverlay({
        map,
        position: new kakao.maps.LatLng(point.lat, point.lng),
        content,
        yAnchor: 1.25,
        zIndex: selectedId === point.id ? 10 : 1,
      });
    });
    return () => {
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
    };
  }, [points, onSelect, selectedId, mapReady]);

  return <div className="map-wrap"><div className="map-canvas" ref={mapElement} />{mapError && <div className="map-error">{mapError}</div>}<div className="map-stamp">카카오맵 <span>· 안전정보 위치는 예시 데이터</span></div></div>;
}

function App() {
  const [page, setPage] = useState('map');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ school: true, parking: true, cctv: true, report: true });
  const [reports, setReports] = useState(loadReports);
  const [selected, setSelected] = useState(null);
  const [reportText, setReportText] = useState('');
  const [reportType, setReportType] = useState('보행 위험');
  const [reportPlace, setReportPlace] = useState('');
  const [notice, setNotice] = useState('');
  const [centerRequest, setCenterRequest] = useState(0);
  const allPoints = useMemo(() => [...INITIAL_POINTS, ...reports], [reports]);
  const visiblePoints = useMemo(() => allPoints.filter(point => filters[point.type] && `${point.title} ${point.detail}`.toLowerCase().includes(query.toLowerCase())), [allPoints, filters, query]);
  const selectPoint = useCallback(point => setSelected(point), []);

  useEffect(() => { localStorage.setItem('school-safety-reports', JSON.stringify(reports)); }, [reports]);

  const submitReport = event => {
    event.preventDefault();
    if (!reportText.trim()) { setNotice('위험 내용을 입력해 주세요.'); return; }
    const newReport = {
      id: `user-${Date.now()}`, type: 'report', title: reportText.trim().slice(0, 45),
      detail: `${reportType}${reportPlace.trim() ? ` · ${reportPlace.trim()}` : ''}`,
      lat: 37.5953 + (Math.random() - 0.5) * 0.012, lng: 127.0873 + (Math.random() - 0.5) * 0.016,
      risk: '제보', createdAt: new Date().toLocaleString('ko-KR'),
    };
    setReports(previous => [newReport, ...previous]);
    setReportText(''); setReportPlace(''); setNotice('제보가 이 브라우저에 저장됐어요. 지도에서 보라색 표시를 확인하세요.');
    setSelected(newReport); setPage('map');
  };

  const navItems = [
    { id: 'map', icon: '⌖', label: '지도 보기' },
    { id: 'list', icon: '☷', label: '위험정보 목록' },
    { id: 'report', icon: '＋', label: '위험 제보' },
    { id: 'about', icon: 'ⓘ', label: '서비스 소개' },
  ];

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-mark">✦</div>
      <div className="brand-copy"><div className="brand-title">현재가 미래로</div><div className="brand-subtitle">중랑구 초등학생 통학로 안전지도</div></div>
      <div className="top-spacer" />
      <div className="top-message"><span className="status-dot" /> 아이들의 안전한 등굣길, 함께 만들어요</div>
      <div className="avatar">🧒🏻👧🏻</div>
    </header>

    <div className="workspace">
      <aside className="sidebar">
        <div className="nav-caption">메뉴</div>
        {navItems.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setNotice(''); }}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}
        <div className="sidebar-bottom"><div className="mini-shield">✓</div><strong>안전한 통학로</strong><span>우리 동네 위험정보를<br />함께 확인해요.</span></div>
      </aside>

      <main className="main-content">
        {page === 'map' && <>
          <section className="page-heading"><div><div className="eyebrow">JUNGNANG-GU · SAFETY MAP</div><h1>우리 동네 통학로 지도</h1><p>학교 주변의 위험 요소와 안전 시설을 한눈에 확인하세요.</p></div><div className="updated-pill"><span>●</span> 카카오 지도 API 연동</div></section>
          <div className="stats-grid">
            <Stat icon="🏫" label="스쿨존" value={allPoints.filter(p => p.type === 'school').length} unit="곳" color="pink" />
            <Stat icon="🚗" label="주정차 주의" value={allPoints.filter(p => p.type === 'parking').length} unit="곳" color="orange" />
            <Stat icon="📹" label="CCTV" value={allPoints.filter(p => p.type === 'cctv').length} unit="곳" color="green" />
            <Stat icon="⚠️" label="주민 제보" value={allPoints.filter(p => p.type === 'report').length} unit="건" color="purple" />
          </div>
          <section className="map-panel">
            <div className="map-toolbar"><div className="searchbox"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="학교명 또는 위험정보 검색" aria-label="지도 검색" />{query && <button onClick={() => setQuery('')} aria-label="검색 지우기">×</button>}</div><button className="locate-button" onClick={() => { setCenterRequest(value => value + 1); setSelected(null); }}>◎ <span>중랑구 중심</span></button></div>
            <div className="map-body"><MapView points={visiblePoints} onSelect={selectPoint} selectedId={selected?.id} centerRequest={centerRequest} />
              <div className="filter-card"><div className="card-title">지도 표시 항목 <span className="filter-count">{visiblePoints.length}</span></div>{Object.entries(TYPES).map(([key, type]) => <label className="filter-row" key={key}><input type="checkbox" checked={filters[key]} onChange={e => setFilters(prev => ({ ...prev, [key]: e.target.checked }))} /><span className="legend-icon" style={{ background: type.color }}>{type.icon}</span><span>{type.label}</span></label>)}</div>
              {selected && <div className="detail-card"><button className="close-detail" onClick={() => setSelected(null)}>×</button><span className="detail-type" style={{ color: (TYPES[selected.type] || TYPES.report).color }}>{(TYPES[selected.type] || TYPES.report).label}</span><strong>{selected.title}</strong><p>{selected.detail}</p><div className="risk-line"><span className={`risk-chip ${selected.risk === '높음' ? 'high' : ''}`}>{selected.risk || '정보'}</span><span>지도 표시 위치</span></div></div>}
            </div>
            <div className="map-footer"><span><i className="online-dot" /> 지도 데이터 연결됨</span><span>지도 © Kakao</span></div>
          </section>
          <section className="bottom-grid"><div className="info-card"><div className="section-title"><div><h2>최근 위험정보</h2><p>통학로에서 확인할 정보예요.</p></div><button className="text-button" onClick={() => setPage('list')}>전체 보기 →</button></div>{allPoints.slice(-3).reverse().map(point => <button className="recent-row" key={point.id} onClick={() => { setSelected(point); setPage('map'); }}><span className="recent-icon" style={{ background: (TYPES[point.type] || TYPES.report).color }}>{(TYPES[point.type] || TYPES.report).icon}</span><span className="recent-copy"><strong>{point.title}</strong><small>{point.detail}</small></span><span className="row-arrow">›</span></button>)}</div><div className="tip-card"><div className="tip-icon">💡</div><div><h2>안전한 통학 팁</h2><p>횡단보도에서는 멈춰서 좌우를 살피고, 주차된 차량 주변에서는 운전자와 눈을 맞춘 뒤 이동해요.</p><button className="text-button" onClick={() => setPage('about')}>서비스 안내 →</button></div></div></section>
        </>}

        {page === 'list' && <section className="content-card page-card"><div className="eyebrow">SAFETY INFORMATION</div><h1>위험정보 목록</h1><p className="page-intro">지도에 표시된 학교 안전시설과 위험정보를 확인할 수 있어요.</p><div className="list-search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="정보명 또는 설명 검색" /></div><div className="data-list">{visiblePoints.length ? visiblePoints.map(point => <button className="data-row" key={point.id} onClick={() => { setSelected(point); setPage('map'); }}><span className="data-icon" style={{ background: (TYPES[point.type] || TYPES.report).color }}>{(TYPES[point.type] || TYPES.report).icon}</span><span className="data-copy"><strong>{point.title}</strong><small>{point.detail}</small></span><span className="type-tag">{(TYPES[point.type] || TYPES.report).label}</span><span className="row-arrow">›</span></button>) : <div className="empty-state">검색 결과가 없습니다.</div>}</div></section>}

        {page === 'report' && <section className="content-card report-card"><div className="eyebrow">COMMUNITY REPORT</div><h1>위험정보 제보하기</h1><p className="page-intro">통학로 주변 위험 요소를 알려주세요. 제보는 현재 브라우저에 저장되어 지도에 표시됩니다.</p>{notice && <div className="notice">{notice}</div>}<form onSubmit={submitReport} className="report-form"><label>위험 유형<select value={reportType} onChange={e => setReportType(e.target.value)}><option>보행 위험</option><option>불법 주정차</option><option>신호등·횡단보도</option><option>시설물 파손</option><option>기타</option></select></label><label>위치 설명 <span className="optional">선택</span><input value={reportPlace} onChange={e => setReportPlace(e.target.value)} placeholder="예: ○○초등학교 정문 앞" maxLength={80} /></label><label>위험 내용 <span className="required">필수</span><textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="어떤 위험이 있는지 구체적으로 적어주세요." maxLength={200} rows={5} required /></label><div className="form-note">※ 데모 버전에서는 위치 좌표가 중랑구 주변에 예시로 지정됩니다. 실제 제보 시스템을 운영하려면 서버와 데이터베이스 연결이 필요합니다.</div><button className="primary-button" type="submit">제보 등록하기 <span>→</span></button></form></section>}

        {page === 'about' && <section className="content-card page-card"><div className="eyebrow">ABOUT THIS PROJECT</div><h1>현재가 미래로</h1><p className="page-intro">중랑구 초등학생의 안전한 통학 환경을 위해 위험정보와 안전시설을 지도에서 확인하는 팀 프로젝트입니다.</p><div className="about-grid"><div className="about-feature"><span>🗺️</span><h3>지도 기반 정보</h3><p>학교 안전구역과 위험정보를 지도 위에서 확인합니다.</p></div><div className="about-feature"><span>🔎</span><h3>빠른 검색</h3><p>학교명과 위험정보를 검색하고 종류별로 필터링합니다.</p></div><div className="about-feature"><span>🙋</span><h3>주민 참여</h3><p>위험 요소를 제보해 지역 안전에 참여할 수 있습니다.</p></div></div><div className="notice">현재 표시되는 지점은 화면 기능 확인을 위한 예시 데이터입니다. 실제 운영 전에는 공식 학교·CCTV·스쿨존 자료와 서버 저장 기능을 연결해야 합니다.</div><button className="primary-button" onClick={() => setPage('map')}>안전지도 보러 가기 →</button></section>}
      </main>
    </div>
    {notice && page !== 'report' && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    <footer className="app-footer">현재가 미래로 <span>·</span> 중랑구 통학로 안전지도 <span>·</span> Kakao Maps API · 팀 프로젝트 데모</footer>
  </div>;
}

function Stat({ icon, label, value, unit, color }) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-copy"><span>{label}</span><strong>{value}<small>{unit}</small></strong></div><div className="stat-spark">↗</div></div>;
}

export default App;
