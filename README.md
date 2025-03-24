# 국제 정치 뉴스 분석 플랫폼 (Political News Analyzer)

본 프로젝트는 국제 정치 관련 뉴스를 자동으로 수집하고 AI를 활용하여 분석하여 제공하는 웹 애플리케이션입니다.

## 특징

- 실시간 국제 정치 뉴스 수집 및 분석
- 주요 토픽 자동 추출 및 정리
- 날짜별 토픽 정렬 기능
- 심층 분석 기사 자동 생성
- MZ 세대를 위한 대체 스타일 제공
- 아카이브 기능으로 과거 분석 결과 열람 가능

## 기술 스택

- Frontend: HTML, CSS (Tailwind CSS), JavaScript
- Backend: Node.js, Express
- AI: Google Gemini API
- 검색 API: Brave Search API

## 설치 방법

```bash
# 저장소 클론
git clone <repository-url>

# 디렉토리 이동
cd political-news-analyzer

# 의존성 설치
npm install

# 환경 변수 설정
# .env 파일을 생성하고 다음 항목들을 설정:
# GEMINI_API_KEY=<your-gemini-api-key>
# BRAVE_API_KEY=<your-brave-api-key>

# 서버 실행
node server.js
```

## 사용 방법

1. 브라우저에서 `http://localhost:3000` 접속
2. "분석 시작" 버튼 클릭하여 최신 국제 정치 토픽 분석
3. 관심 있는 토픽 클릭하여 상세 분석 기사 확인
4. MZ 버전 버튼을 통해 대체 스타일의 기사 확인 가능
5. 아카이브 메뉴를 통해 과거 분석 결과 접근 가능

## 버전 정보

- Ver 0.1 - 프로토타입 버전 (현재)
  - 기본 기능 구현
  - 영어 검색 및 한국어 기사 생성
  - 날짜별 토픽 정렬 기능

## 라이선스

This project is licensed under the MIT License - see the LICENSE file for details. 