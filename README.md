# 현재가 미래로 — 중랑구 통학로 안전지도

React 기반 팀 프로젝트 데모입니다. 지도 화면은 **Kakao Maps JavaScript API**를 사용합니다.

## 실행 방법

1. [Kakao Developers](https://developers.kakao.com/console/app)에서 앱을 선택하고 **JavaScript 키**를 준비합니다.
2. 해당 앱의 **플랫폼 → Web**에 로컬 주소 `http://localhost:3000`을 등록합니다. 배포 시에는 배포 도메인도 등록하세요.
3. `client` 폴더에 `.env` 파일을 만들고 아래 내용을 입력합니다.

```env
REACT_APP_KAKAO_MAP_KEY=여기에_JavaScript_키
```

4. 터미널에서 `client` 폴더로 이동한 뒤 실행합니다.(cd client)

```bash
npm install
npm start
```

브라우저에서 `http://localhost:3000`을 엽니다. `.env`를 수정한 경우 개발 서버를 재시작하세요.

## 참고

- `REACT_APP_` 변수는 브라우저 코드에 포함되므로 비밀키를 넣지 마세요. Kakao JavaScript 키는 도메인 제한을 설정하세요.
- 지도 위 스쿨존·CCTV·주정차·제보 위치는 기능 확인용 예시 데이터이며, 공식 공공데이터가 아닙니다.
- 제보는 현재 브라우저의 `localStorage`에 저장되며 서버와 동기화되지 않습니다.
