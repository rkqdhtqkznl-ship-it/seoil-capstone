import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 카카오 개발자 콘솔에 등록한 도메인(http://localhost:3000)과 맞추기 위해 포트를 3000으로 고정합니다.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
});
