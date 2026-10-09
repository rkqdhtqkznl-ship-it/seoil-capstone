const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 서버 작동 확인용 테스트 API
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: '백엔드 서버가 정상적으로 실행 중입니다!' });
});

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});