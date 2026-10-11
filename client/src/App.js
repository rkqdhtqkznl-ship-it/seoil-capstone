import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  const markersRef = useRef([]);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return undefined;
    try {
      const map = L.map(mapElement.current, { zoomControl: false }).setView([37.5953, 127.0873], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: 'topright' }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    } catch (error) {
      setMapError('지도를 초기화하지 못했어요. 페이지를 새로고침해 주세요.');
    }
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map && centerRequest > 0) map.flyTo([37.5953, 127.0873], 14, { duration: 0.6 });
  }, [centerRequest]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = points.map(point => {
      const style = TYPES[point.type] || TYPES.report;
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: selectedId === point.id ? 12 : 9,
        color: '#ffffff', weight: 3, fillColor: style.color, fillOpacity: 0.98,
      }).addTo(map);
      marker.bindTooltip(`${style.icon} ${point.title}`, { direction: 'top', offset: [0, -8] });
      marker.on('click', () => onSelect(point));
      return marker;
    });
  }, [points, onSelect, selectedId]);

  return <div className="map-wrap"><div className="map-canvas" ref={mapElement} />{mapError && <div className="map-error">{mapError}</div>}<div className="map-stamp">중랑구 통학로 안전 지도 <span>· 예시 위치 포함</span></div></div>;
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
          <section className="page-heading"><div><div className="eyebrow">JUNGNANG-GU · SAFETY MAP</div><h1>우리 동네 통학로 지도</h1><p>학교 주변의 위험 요소와 안전 시설을 한눈에 확인하세요.</p></div><div className="updated-pill"><span>●</span> 지도 서비스 준비 완료</div></section>
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
            <div className="map-footer"><span><i className="online-dot" /> 지도 데이터 연결됨</span><span>지도 타일 © OpenStreetMap contributors</span></div>
          </section>
          <section className="bottom-grid"><div className="info-card"><div className="section-title"><div><h2>최근 위험정보</h2><p>통학로에서 확인할 정보예요.</p></div><button className="text-button" onClick={() => setPage('list')}>전체 보기 →</button></div>{allPoints.slice(-3).reverse().map(point => <button className="recent-row" key={point.id} onClick={() => { setSelected(point); setPage('map'); }}><span className="recent-icon" style={{ background: (TYPES[point.type] || TYPES.report).color }}>{(TYPES[point.type] || TYPES.report).icon}</span><span className="recent-copy"><strong>{point.title}</strong><small>{point.detail}</small></span><span className="row-arrow">›</span></button>)}</div><div className="tip-card"><div className="tip-icon">💡</div><div><h2>안전한 통학 팁</h2><p>횡단보도에서는 멈춰서 좌우를 살피고, 주차된 차량 주변에서는 운전자와 눈을 맞춘 뒤 이동해요.</p><button className="text-button" onClick={() => setPage('about')}>서비스 안내 →</button></div></div></section>
        </>}

        {page === 'list' && <section className="content-card page-card"><div className="eyebrow">SAFETY INFORMATION</div><h1>위험정보 목록</h1><p className="page-intro">지도에 표시된 학교 안전시설과 위험정보를 확인할 수 있어요.</p><div className="list-search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="정보명 또는 설명 검색" /></div><div className="data-list">{visiblePoints.length ? visiblePoints.map(point => <button className="data-row" key={point.id} onClick={() => { setSelected(point); setPage('map'); }}><span className="data-icon" style={{ background: (TYPES[point.type] || TYPES.report).color }}>{(TYPES[point.type] || TYPES.report).icon}</span><span className="data-copy"><strong>{point.title}</strong><small>{point.detail}</small></span><span className="type-tag">{(TYPES[point.type] || TYPES.report).label}</span><span className="row-arrow">›</span></button>) : <div className="empty-state">검색 결과가 없습니다.</div>}</div></section>}

        {page === 'report' && <section className="content-card report-card"><div className="eyebrow">COMMUNITY REPORT</div><h1>위험정보 제보하기</h1><p className="page-intro">통학로 주변 위험 요소를 알려주세요. 제보는 현재 브라우저에 저장되어 지도에 표시됩니다.</p>{notice && <div className="notice">{notice}</div>}<form onSubmit={submitReport} className="report-form"><label>위험 유형<select value={reportType} onChange={e => setReportType(e.target.value)}><option>보행 위험</option><option>불법 주정차</option><option>신호등·횡단보도</option><option>시설물 파손</option><option>기타</option></select></label><label>위치 설명 <span className="optional">선택</span><input value={reportPlace} onChange={e => setReportPlace(e.target.value)} placeholder="예: ○○초등학교 정문 앞" maxLength={80} /></label><label>위험 내용 <span className="required">필수</span><textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="어떤 위험이 있는지 구체적으로 적어주세요." maxLength={200} rows={5} required /></label><div className="form-note">※ 데모 버전에서는 위치 좌표가 중랑구 주변에 예시로 지정됩니다. 실제 제보 시스템을 운영하려면 서버와 데이터베이스 연결이 필요합니다.</div><button className="primary-button" type="submit">제보 등록하기 <span>→</span></button></form></section>}

        {page === 'about' && <section className="content-card page-card"><div className="eyebrow">ABOUT THIS PROJECT</div><h1>현재가 미래로</h1><p className="page-intro">중랑구 초등학생의 안전한 통학 환경을 위해 위험정보와 안전시설을 지도에서 확인하는 팀 프로젝트입니다.</p><div className="about-grid"><div className="about-feature"><span>🗺️</span><h3>지도 기반 정보</h3><p>학교 안전구역과 위험정보를 지도 위에서 확인합니다.</p></div><div className="about-feature"><span>🔎</span><h3>빠른 검색</h3><p>학교명과 위험정보를 검색하고 종류별로 필터링합니다.</p></div><div className="about-feature"><span>🙋</span><h3>주민 참여</h3><p>위험 요소를 제보해 지역 안전에 참여할 수 있습니다.</p></div></div><div className="notice">현재 표시되는 지점은 화면 기능 확인을 위한 예시 데이터입니다. 실제 운영 전에는 공식 학교·CCTV·스쿨존 자료와 서버 저장 기능을 연결해야 합니다.</div><button className="primary-button" onClick={() => setPage('map')}>안전지도 보러 가기 →</button></section>}
      </main>
    </div>
    {notice && page !== 'report' && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    <footer className="app-footer">현재가 미래로 <span>·</span> 중랑구 통학로 안전지도 <span>·</span> 팀 프로젝트 데모</footer>
  </div>;
}

function Stat({ icon, label, value, unit, color }) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-copy"><span>{label}</span><strong>{value}<small>{unit}</small></strong></div><div className="stat-spark">↗</div></div>;
}

export default App;
