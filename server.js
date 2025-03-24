// server.js - Express 서버 설정
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// API 키 설정
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ZEP_API_KEY = process.env.ZEP_API_KEY || 'zep_sk_live_IrbZzD0BoWJ5UbVZMJzA0fGa'; // ZEP API 키 추가

// ZEP API 엔드포인트
const ZEP_API_BASE_URL = 'https://api.zep.ai/v2';

// Google Gemini AI 초기화
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Gemini AI 모델 초기화 - 모든 목적을 위한 통합 모델
const modelContent = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-lite",
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

// 키워드 생성용 모델 - 더 낮은 온도값으로 설정
const modelKeywords = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-lite",
  generationConfig: {
    temperature: 0.2,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024,
  }
});

// 효율적인 국제 정치 검색을 위한 키워드와 언론사 설정
const internationalKeywords = [
  'International politics',
  'Global affairs',
  'Foreign policy',
  'Geopolitics',
  'International relations',
  'Global security',
  'Trade policy',
  'United Nations',
  'Human rights',
  'Regional conflicts',
  'Nuclear issues',
  'Climate change',
  'Energy security',
  'Migration',
  'Defense policy'
];

const koreaKeywords = [
  'South Korea',
  'Korean Peninsula',
  'North Korea',
  'Korean foreign policy',
  'Inter-Korean relations',
  'Korean economy',
  'Korean politics'
];

const majorNewsSites = [
  'bbc.com',
  'cnn.com',
  'reuters.com',
  'apnews.com',
  'bloomberg.com',
  'theguardian.com',
  'nytimes.com',
  'washingtonpost.com',
  'aljazeera.com',
  'scmp.com',
  'foreignpolicy.com',
  'foreignaffairs.com',
  'thediplomat.com',
  'koreaherald.com',
  'koreatimes.co.kr',
  'koreajoongangdaily.joins.com'
];

// Gemini API 요청 관리 시스템
const geminiTracker = {
  requestQueue: [],
  processingQueue: false,
  lastRequestTime: 0,
  requestsInWindow: 0,
  // Gemini API는 분당 요청 수 제한이 있으므로 보수적으로 설정
  maxRequestsPerMinute: 20,
  windowDuration: 60 * 1000, // 1분 (밀리초)
  retryDelays: [2000, 4000, 8000, 15000, 30000], // 재시도 시 지연시간 (단위: ms)
  
  async enqueueRequest(requestFn, retryCount = 0) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        requestFn,
        resolve,
        reject,
        retryCount
      });
      
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  },
  
  async processQueue() {
    if (this.requestQueue.length === 0) {
      this.processingQueue = false;
      return;
    }
    
    this.processingQueue = true;
    
    // 현재 시간 기준 분당 요청 수 계산 및 대기 처리
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // 윈도우 초기화 (1분 이상 지난 경우)
    if (timeSinceLastRequest > this.windowDuration) {
      this.requestsInWindow = 0;
    }
    
    // 분당 최대 요청 수에 도달한 경우 대기
    if (this.requestsInWindow >= this.maxRequestsPerMinute) {
      const remainingTime = this.windowDuration - timeSinceLastRequest;
      const waitTime = remainingTime > 0 ? remainingTime + 1000 : 1000; // 최소 1초 대기
      console.log(`Gemini API 레이트 리밋에 도달하여 ${waitTime}ms 대기 중...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestsInWindow = 0;
    }
    
    // 큐에서 다음 요청 가져오기
    const nextRequest = this.requestQueue.shift();
    
    try {
      // 요청 수행
      this.requestsInWindow++;
      this.lastRequestTime = Date.now();
      const result = await nextRequest.requestFn();
      nextRequest.resolve(result);
    } catch (error) {
      // 429 에러(Too Many Requests)인 경우 재시도
      if (error.status === 429 && nextRequest.retryCount < this.retryDelays.length) {
        const delay = this.retryDelays[nextRequest.retryCount];
        console.log(`Gemini API 429 오류: ${nextRequest.retryCount + 1}번째 재시도, ${delay}ms 후...`);
        
        // 재시도 큐에 다시 추가 (지연 후)
        setTimeout(() => {
          this.requestQueue.push({
            ...nextRequest,
            retryCount: nextRequest.retryCount + 1
          });
          
          if (!this.processingQueue) {
            this.processQueue();
          }
        }, delay);
      } else {
        // 재시도 횟수 초과 또는 다른 오류인 경우 에러 반환
        nextRequest.reject(error);
      }
    }
    
    // 요청 간 간격 두기 (안전장치)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 다음 요청 처리
    this.processQueue();
  },
  
  // Gemini API 호출 래퍼 함수
  async generateContent(params) {
    return this.enqueueRequest(async () => {
      try {
        return await modelContent.generateContent(params);
      } catch (error) {
        throw error;
      }
    });
  },
  
  // 키워드 생성 모델용 래퍼 함수
  async generateKeywords(params) {
    return this.enqueueRequest(async () => {
      try {
        return await modelKeywords.generateContent(params);
      } catch (error) {
        throw error;
      }
    });
  }
};

// 데이터 저장소
let searchCache = {}; // 검색 결과 캐싱
let keywordCache = {}; // 생성된 키워드 캐싱
let articleCache = {}; // 생성된 기사 캐싱
let archiveData = {}; // 아카이브 데이터 저장소

// 아카이브 데이터 저장 위치
const ARCHIVE_DIR = 'H:\\#2_Ai\\오비스아카이브';
const ARCHIVE_FILE = path.join(ARCHIVE_DIR, 'archive.json');

// 아카이브 데이터를 로컬에 저장하는 함수
const saveArchiveData = () => {
  try {
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
      console.log(`아카이브 디렉토리 생성: ${ARCHIVE_DIR}`);
    }
    
    // 데이터를 JSON 형식으로 저장
    fs.writeFileSync(
      ARCHIVE_FILE,
      JSON.stringify(archiveData, null, 2),
      'utf8'
    );
    
    console.log(`아카이브 데이터가 ${ARCHIVE_FILE}에 저장되었습니다.`);
    return true;
  } catch (error) {
    console.error('아카이브 데이터 저장 중 오류:', error);
    return false;
  }
};

// 아카이브 데이터를 로컬에서 불러오는 함수
const loadArchiveData = () => {
  try {
    // 파일이 존재하는지 확인
    if (!fs.existsSync(ARCHIVE_FILE)) {
      console.log(`아카이브 파일이 존재하지 않습니다: ${ARCHIVE_FILE}`);
      return false;
    }
    
    // 파일에서 데이터 읽기
    const data = fs.readFileSync(ARCHIVE_FILE, 'utf8');
    
    // JSON 파싱
    const parsedData = JSON.parse(data);
    
    // 아카이브 데이터 업데이트
    Object.assign(archiveData, parsedData);
    
    console.log(`아카이브 데이터를 ${ARCHIVE_FILE}에서 로드했습니다.`);
    return true;
  } catch (error) {
    console.error('아카이브 데이터 로드 중 오류:', error);
    return false;
  }
};

// API 요청량 추적 및 제한 시스템 (Brave API 전용)
const braveRequestTracker = {
  monthlyLimit: 20000000, // 40일 기준 약 500,000/일
  currentCount: 0,
  lastReset: null,
  
  // 레이트 리밋 관리를 위한 추가 속성
  requestQueue: [],
  processingQueue: false,
  lastRequestTime: 0,
  requestsInLastSecond: 0,
  maxRequestsPerSecond: 18, // 브레이브 API 제한보다 안전하게 18로 설정
  
  canMakeRequest() {
    // 월 초기화 확인
    const now = new Date();
    if (!this.lastReset || now.getMonth() !== this.lastReset.getMonth()) {
      this.currentCount = 0;
      this.lastReset = now;
    }
    
    return this.currentCount < this.monthlyLimit;
  },
  
  incrementCount() {
    this.currentCount++;
    // 1000번 요청마다 로그 출력
    if (this.currentCount % 1000 === 0) {
      console.log(`API 사용량: ${this.currentCount}/${this.monthlyLimit} (${((this.currentCount/this.monthlyLimit)*100).toFixed(2)}%)`);
    }
  },
  
  // 레이트 리밋을 고려한 API 요청 큐 추가
  async enqueueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      // 요청 함수와 콜백을 큐에 추가
      this.requestQueue.push({
        requestFn,
        resolve,
        reject
      });
      
      // 큐가 처리 중이 아니면 처리 시작
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  },
  
  // 큐 처리 함수
  async processQueue() {
    if (this.requestQueue.length === 0) {
      this.processingQueue = false;
      return;
    }
    
    this.processingQueue = true;
    
    // 현재 시간을 기준으로 1초 내 요청 수 계산 및 대기 처리
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < 1000) {
      // 1초 이내에 이미 최대 요청 수에 도달했으면 대기
      if (this.requestsInLastSecond >= this.maxRequestsPerSecond) {
        const waitTime = 1000 - timeSinceLastRequest + 50; // 추가 50ms 안전장치
        console.log(`레이트 리밋에 도달하여 ${waitTime}ms 대기 중...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestsInLastSecond = 0;
      }
    } else {
      // 1초 이상 지났으면 카운터 초기화
      this.requestsInLastSecond = 0;
    }
    
    // 큐에서 다음 요청 가져오기
    const nextRequest = this.requestQueue.shift();
    
    try {
      // 요청 수행
      this.requestsInLastSecond++;
      this.lastRequestTime = Date.now();
      const result = await nextRequest.requestFn();
      nextRequest.resolve(result);
    } catch (error) {
      nextRequest.reject(error);
    }
    
    // 연속적인 요청 사이에 작은 지연 추가 (안전장치)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 다음 요청 처리
    this.processQueue();
  }
};

// 검색 키워드 생성 함수
async function generateSearchKeywords(topic) {
  try {
    // 캐시 키 생성
    const cacheKey = `search_keywords_${topic.id}`;
    
    // 캐시 확인 (12시간 내 캐시된 결과가 있으면 재사용)
    if (keywordCache[cacheKey] && (Date.now() - keywordCache[cacheKey].timestamp < 12 * 60 * 60 * 1000)) {
      console.log(`캐시에서 '${topic.title}' 키워드 로드`);
      return keywordCache[cacheKey].keywords;
    }
    
    console.log(`"${topic.title}"에 대한 키워드 생성 중...`);
    
    // Gemini로 영어 키워드 생성
    const prompt = `
    Generate a list of 10 English search keywords or phrases related to the following topic about international politics: 
    
    "${topic.title}"
    
    The keywords should be effective for searching recent news articles in English. Include "latest" or similar words to ensure up-to-date results. Return ONLY the keywords in a JSON array format.
    
    Example output:
    ["keyword 1", "keyword 2", "keyword 3", ...]
    `;
    
    // Gemini API 호출
    const result = await modelKeywords.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    
    const response = result.response;
    
    // 응답 파싱
    let keywords;
    try {
      // JSON 형식으로 추출 시도
      const text = response.text().trim();
      const jsonMatch = text.match(/\[.*\]/s);
      
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      } else {
        // 단순 줄 기반 파싱 (대체 방법)
        keywords = text.split('\n')
          .map(line => line.replace(/^[0-9]+\.\s*"|"$|^"|^-\s+|^\*\s+/g, '').trim())
          .filter(line => line.length > 0);
      }
      
      console.log('생성된 키워드:', keywords);
    } catch (parseError) {
      console.error('키워드 파싱 오류:', parseError);
      
      // 파싱 실패 시 기본 영어 키워드 사용
      keywords = [
        `${topic.title} latest news`,
        `${topic.title} recent developments`,
        `${topic.title} international impact`,
        `${topic.title} political analysis`,
        `${topic.title} global implications`,
        `${topic.title} current status`,
        `${topic.title} international response`,
        `${topic.title} key players`
      ];
    }
    
    // 유효한 키워드 확인 (최소 3개)
    if (!Array.isArray(keywords) || keywords.length < 3) {
      // 기본 영어 키워드 사용
      keywords = [
        `${topic.title} latest news`,
        `${topic.title} recent developments`,
        `${topic.title} international impact`,
        `${topic.title} political analysis`,
        `${topic.title} global implications`
      ];
    }
    
    // 캐시에 저장
    keywordCache[cacheKey] = {
      keywords,
      timestamp: Date.now()
    };
    
    return keywords;
  } catch (error) {
    console.error('키워드 생성 중 오류 발생:', error);
    
    // 오류 발생 시 기본 영어 키워드 반환
    return [
      `${topic.title} latest news`,
      `${topic.title} international relations`,
      `${topic.title} political analysis`,
      `${topic.title} global implications`,
      `${topic.title} current status`
    ];
  }
}

// Brave 검색 API 요청 함수
async function searchBrave(query, options = {}) {
  // 레이트 리밋을 고려하여 요청을 큐에 추가
  return braveRequestTracker.enqueueRequest(async () => {
    try {
      // 기본 옵션 설정
      const {
        count = 10,
        freshness = 'w', // 일주일로 확장 (d:day, w:week, m:month)
        search_lang = 'en', // 영어 검색을 기본값으로 설정
        country = 'US', // 미국 검색으로 기본값 변경
        safesearch = 'moderate'
      } = typeof options === 'object' ? options : { count: options };

      console.log(`Searching Brave for: "${query}" with options:`, 
        JSON.stringify({ count, freshness, search_lang, country }));
      
      // 요청량 확인
      if (!braveRequestTracker.canMakeRequest()) {
        console.warn('월간 검색 한도에 도달했습니다.');
        return []; // 빈 배열 반환
      }
      
      // 캐싱 키 생성
      const cacheKey = `${query}-${count}-${freshness}-${search_lang}-${country}`;
      
      // 캐시 확인 (1시간 내 캐시된 결과가 있으면 재사용, 최신성 유지를 위해 시간 단축)
      if (searchCache[cacheKey] && (Date.now() - searchCache[cacheKey].timestamp < 1 * 60 * 60 * 1000)) {
        console.log(`캐시에서 검색 결과 로드: "${query}"`);
        return searchCache[cacheKey].results;
      }
      
      // API 호출 횟수 증가
      braveRequestTracker.incrementCount();
      
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': BRAVE_API_KEY
        },
        params: {
          q: query,
          count,
          freshness,
          search_lang,
          country,
          safesearch
          // result_filter parameter 제거 (제한요소 제거)
        }
      });
      
      // 결과가 없는 경우 처리
      if (!response.data?.web?.results) {
        console.warn(`검색 결과 없음: "${query}"`);
        // 결과가 없을 경우 빈 배열 반환
        return [];
      }
      
      const results = response.data.web.results;
      console.log(`Search results count: ${results.length}`);
      
      // 결과 캐싱
      searchCache[cacheKey] = {
        results,
        timestamp: Date.now()
      };
      
      return results;
    } catch (error) {
      console.error('Brave 검색 API 오류:', error.message);
      console.error('상태 코드:', error.response?.status);
      console.error('응답 데이터:', error.response?.data);
      
      // 429 에러(레이트 리밋)일 경우 재시도
      if (error.response?.status === 429) {
        console.log('레이트 리밋에 도달했습니다. 잠시 후 재시도합니다.');
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 대기
        return []; // 재시도 대신 빈 결과 반환
      }
      
      // API 오류 시 빈 배열 반환
      console.log('오류로 인해 빈 결과 반환');
      return [];
    }
  });
}

// 최근 정치 뉴스 검색 및 분석 엔드포인트
app.post('/api/analyze', async (req, res) => {
  try {
    // 오늘 날짜 (YYYY-MM-DD 형식)
    const today = new Date().toISOString().split('T')[0];
    
    // 이미 오늘 분석한 결과가 있으면 재사용
    if (archiveData[today] && archiveData[today].topics) {
      console.log('오늘의 분석 결과를 캐시에서 불러옵니다.');
      return res.json({ 
        topics: archiveData[today].topics,
        isFromArchive: true
      });
    }

    // 모든 검색 결과를 저장할 배열
    let allResults = [];
    
    // 1. 해외 주요 언론사 사이트 검색 (site: 연산자 사용)
    console.log('해외 주요 언론사 검색 시작...');
    
    // 효율적인 검색을 위한 해외 언론사 쿼리 (영어로 변경)
    const foreignMediaQueries = [
      'site:bbc.com international politics',
      'site:cnn.com global affairs',
      'site:reuters.com international relations',
      'site:apnews.com world politics',
      'site:theguardian.com international conflicts',
      'site:nytimes.com foreign policy',
      'site:foreignpolicy.com geopolitics',
      'site:washingtonpost.com global politics'
    ];
    
    for (const query of foreignMediaQueries.slice(0, 6)) {
      const results = await searchBrave(query, {
        count: 5,
        freshness: 'w',
        search_lang: 'en',
        country: 'US',
        safesearch: 'moderate'
      });
      
      allResults = [...allResults, ...results];
      
      // API 레이트 리밋 관리
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 충분한 결과가 있으면 다음 단계로
      if (allResults.length >= 20) break;
    }
    
    console.log(`해외 언론사 검색 결과 수: ${allResults.length}`);
    
    // 2. 주요 국제 정치 키워드 검색
    if (allResults.length < 30) {
      console.log('주요 국제 정치 키워드 검색 시작...');
      
      // 영어 국제 정치 키워드 쿼리
      const internationalPoliticsQueries = [
        'Russia Ukraine war latest',
        'Israel Gaza conflict',
        'US China relations',
        'North Korea missile',
        'European Union policy',
        'United Nations Security Council',
        'G20 summit',
        'Middle East peace',
        'Africa political crisis',
        'Latin America politics'
      ];
      
      for (const query of internationalPoliticsQueries.slice(0, 6)) {
        const results = await searchBrave(query, {
          count: 5,
          freshness: 'w',
          search_lang: 'en',
          country: 'US',
          safesearch: 'moderate'
        });
        
        allResults = [...allResults, ...results];
        
        // API 레이트 리밋 관리
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 충분한 결과가 있으면 다음 단계로
        if (allResults.length >= 30) break;
      }
    }
    
    // 3. 한국 관련 해외 보도 검색
    if (allResults.length < 40) {
      console.log('한국 관련 해외 보도 검색 시작...');
      
      // 한국 관련 영어 키워드
      const koreaInternationalQueries = [
        'South Korea international relations',
        'Korean Peninsula geopolitics',
        'Republic of Korea foreign policy',
        'South Korea United Nations',
        'Korean Peninsula security',
        'Korea-US relations',
        'Korea-China relations'
      ];
      
      for (const query of koreaInternationalQueries.slice(0, 4)) {
        const results = await searchBrave(query, {
          count: 5,
          freshness: 'w',
          search_lang: 'en',
          country: 'US',
          safesearch: 'moderate'
        });
        
        allResults = [...allResults, ...results];
        
        // API 레이트 리밋 관리
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 충분한 결과가 있으면 다음 단계로
        if (allResults.length >= 40) break;
      }
    }
    
    // 4. 추가 보완 검색 (여전히 결과가 부족한 경우)
    if (allResults.length < 15) {
      console.log('추가 보완 검색 시작...');
      
      const broadQueries = [
        'international news',
        'global politics',
        'world news',
        'international affairs',
        'global issues'
      ];
      
      for (const query of broadQueries) {
        const results = await searchBrave(query, {
          count: 10,
          freshness: 'm', // 월 단위로 확장
          search_lang: 'en',
          country: 'US',
          safesearch: 'moderate'
        });
        
        allResults = [...allResults, ...results];
        
        // API 레이트 리밋 관리
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 충분한 결과가 있으면 중단
        if (allResults.length >= 30) break;
      }
    }
    
    // 검색 결과가 없는 경우 404 반환
    if (allResults.length === 0) {
      console.log('검색 결과가 없어 분석을 진행할 수 없습니다.');
      return res.status(404).json({ 
        error: '적절한 검색 결과를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.'
      });
    }
    
    // 중복 제거
    const uniqueResults = Array.from(new Set(allResults.map(r => r.url)))
      .map(url => allResults.find(r => r.url === url));
    
    console.log(`총 고유 검색 결과 개수: ${uniqueResults.length}`);
    
    // 최신 뉴스 확인 (3일로 변경)
    const recentArticles = uniqueResults.filter(result => {
      // 게시 날짜가 있는 경우 (published_date 또는 page_age)
      const dateStr = result.published_date || result.page_age || result.age || '';
      if (!dateStr) return false;
      
      try {
        // 날짜 문자열에서 Date 객체로 변환 시도
        const articleDate = new Date(dateStr);
        const now = new Date();
        const threeDaysAgo = new Date(now.setDate(now.getDate() - 3)); // 7일에서 3일로 변경
        
        // 유효한 날짜이고 3일 이내인 경우
        return !isNaN(articleDate) && articleDate >= threeDaysAgo;
      } catch (e) {
        return false; // 날짜 파싱 오류시 최신 아티클로 간주하지 않음
      }
    });
    
    console.log(`최근 3일 이내 기사 수: ${recentArticles.length}`);
    
    // 최신 기사가 전체의 30% 이상인지 확인 및 로깅
    const recentRatio = recentArticles.length / uniqueResults.length;
    console.log(`최신 기사 비율: ${(recentRatio * 100).toFixed(2)}%`);
    
    // 검색 결과에서 사용할 기사 선택 (최신 기사 우선)
    const resultsToUse = [
      ...recentArticles,
      ...uniqueResults.filter(article => !recentArticles.includes(article))
    ].slice(0, 40); // 최대 40개만 사용
    
    // 주제 분석 및 생성 로직에서 토픽 수 제한
    async function analyzeAndGenerateTopics(searchResults) {
      const topicsCache = {};
      const resultsToUse = searchResults || [];
      const recentRatio = recentArticles ? (recentArticles.length / uniqueResults.length) * 100 : 0;
      
      console.log(`최신 기사 비율: ${recentRatio.toFixed(2)}%`);
      
      try {
        // Gemini API를 통해 주제 생성
        const topics = await generateTopicsFromResults(resultsToUse);
        
        // 주제 개수를 3개로 제한 (테스트용)
        const finalTopics = topics.slice(0, 3);
        console.log(`생성된 주제 ${topics.length}개 중 ${finalTopics.length}개로 제한했습니다. (테스트 모드)`);
        
        // 최종 응답 구성
        return {
          topics: finalTopics,
          searchResults: resultsToUse
        };
      } catch (error) {
        console.error('주제 생성 중 오류:', error);
        
        // 오류 발생 시 기본 주제 반환
        const defaultTopics = generateDefaultTopics().slice(0, 3);
        
        return {
          topics: defaultTopics,
          searchResults: resultsToUse
        };
      }
    }

    // Gemini 모델을 사용한 주제 생성 및 추출 함수
    async function generateTopicsFromResults(searchResults) {
      try {
        console.log("Gemini API 호출하여 주제 생성 중...");
        
        const prompt = `
        최근 국제 정치 뉴스 기사들을 분석하여 3가지 주요 이슈나 주제를 추출해주세요. 
        각 주제는 다음 형식의 JSON 구조로 반환해주세요:
        
        {
          "topics": [
            {
              "id": 1,
              "title": "주제 제목 (간결하게)",
              "summary": "해당 주제에 대한 1-2문장 요약",
              "icon": "font-awesome 아이콘 클래스 (예: fa-newspaper, fa-globe-asia, fa-handshake 등)",
              "dateOccurred": "YYYY-MM-DD" (사건/이슈가 발생한 날짜, 최신순으로 정렬)
            },
            ...
          ]
        }
        
        반드시 정확한 JSON 형식으로 반환해주세요. 각 주제는 국제 관계, 외교, 국가 간 갈등, 협상, 국제기구 활동 등과 관련되어야 합니다.
        날짜(dateOccurred)는 가장 최근 토픽이 먼저 오도록 정렬해주세요. 오늘 날짜는 ${new Date().toISOString().split('T')[0]}입니다.
        제목과 요약은 한국어로 작성해주세요.
        `;
        
        const result = await modelContent.generateContent(prompt);
        const textResult = result.response.text();
        console.log("Gemini API 응답받음, 주제 추출 시작...");
        
        try {
          // JSON 텍스트 형식 추출 (```json으로 감싸져 있는 경우 처리)
          const jsonText = textResult.includes('```json')
            ? textResult.split('```json')[1].split('```')[0].trim()
            : textResult.includes('```')
              ? textResult.split('```')[1].split('```')[0].trim()
              : textResult;
          
          // JSON 파싱
          const parsed = JSON.parse(jsonText);
          const topics = parsed.topics || [];
          
          // 날짜 기준으로 정렬 (최신순)
          topics.sort((a, b) => {
            const dateA = a.dateOccurred ? new Date(a.dateOccurred) : new Date(0);
            const dateB = b.dateOccurred ? new Date(b.dateOccurred) : new Date(0);
            return dateB - dateA;
          });
          
          // ID 재할당 (정렬 후 번호 순서 맞추기)
          const topicsWithIds = topics.map((topic, index) => ({
            ...topic,
            id: index + 1
          }));
          
          console.log(`${topicsWithIds.length}개의 주제를 시간순으로 정렬했습니다.`);
          return topicsWithIds;
        } catch (error) {
          console.error('주제 추출 중 JSON 파싱 오류:', error);
          
          // 기본 주제 생성 (오늘 날짜 기준)
          return generateDefaultTopics();
        }
      } catch (error) {
        console.error('주제 생성 중 API 오류:', error);
        return generateDefaultTopics();
      }
    }

    // 기본 주제 생성 함수
    function generateDefaultTopics() {
      const today = new Date().toISOString().split('T')[0];
      
      return [
        {
          id: 1,
          title: "러시아-우크라이나 전쟁 최신 동향",
          summary: "러시아-우크라이나 전쟁의 최신 상황과 국제사회의 대응에 관한 분석",
          icon: "fa-fighter-jet",
          dateOccurred: today
        },
        {
          id: 2,
          title: "중동 평화 협상 진전",
          summary: "이스라엘과 팔레스타인 간의 최근 평화 협상 동향과 주변국들의 역할",
          icon: "fa-dove",
          dateOccurred: today
        },
        {
          id: 3,
          title: "미-중 경제 갈등 심화",
          summary: "무역 분쟁과 기술 패권을 둘러싼 미국과 중국의 갈등 상황과 전망",
          icon: "fa-chart-line",
          dateOccurred: today
        }
      ];
    }
    
    // 최종 응답 구성
    const responseData = await analyzeAndGenerateTopics(resultsToUse);
    
    // 아카이브 데이터 구조 초기화
    if (!archiveData[today]) {
      archiveData[today] = {
        topics: responseData.topics,
        articles: {},
        searchResults: responseData.searchResults
      };
      
      // 응답할 형식으로 포맷팅
      const formattedDate = new Date(today).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      
      archiveData[today].formattedDate = formattedDate;
    }
    
    // 즉시 응답 반환
    res.json({
      topics: archiveData[today].topics,
      isFromArchive: false
    });
    
    // 모든 검색이 끝난 후 백그라운드에서 각 주제에 대한 기사 생성
    (async () => {
      try {
        console.log('모든 검색이 완료되었습니다. 백그라운드에서 기사 생성을 시작합니다.');
        
        // 아카이브 구조가 없다면 초기화
        if (!archiveData[today]) {
          archiveData[today] = {
            topics: responseData.topics,
            articles: {},
            searchResults: responseData.searchResults
          };
        }
        
        // 각 토픽에 대해 순차적으로 기사 생성
        for (const topic of responseData.topics) {
          try {
            console.log(`토픽 ${topic.id} "${topic.title}"의 기사 생성 시작...`);
            const article = await generateArticleForTopic(topic, responseData.searchResults);
            
            // 기사 저장
            archiveData[today].articles[topic.id] = article;
            console.log(`토픽 ${topic.id}의 기사 생성 완료`);
          } catch (topicError) {
            console.error(`토픽 ${topic.id} 처리 중 오류:`, topicError);
          }
          
          // 다음 주제 처리 전 약간의 지연 (레이트 리밋 방지)
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 최종 아카이브 데이터 저장
        await saveArchiveData();
        console.log('모든 주제에 대한 기사 생성이 완료되었습니다.');
      } catch (error) {
        console.error('백그라운드 기사 생성 중 오류 발생:', error);
      }
    })();
    
  } catch (error) {
    console.error('분석 중 오류 발생:', error);
    const errorMessage = '뉴스 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API 엔드포인트 - 기사 생성
app.post('/api/generate-article', async (req, res) => {
  try {
    const { topic, searchResults = [] } = req.body;
    
    if (!topic || !topic.id || !topic.title) {
      return res.status(400).json({ error: '유효하지 않은 주제 데이터입니다.' });
    }
    
    console.log(`토픽 ID ${topic.id}에 대한 기사 생성 요청 수신`);
    
    // 기사 생성 가능여부 체크 (이미 생성 중인지 확인)
    const today = new Date().toISOString().split('T')[0];
    if (archiveData[today] && 
        archiveData[today].generatingArticles && 
        archiveData[today].generatingArticles[topic.id]) {
      console.log(`토픽 ID ${topic.id}는 이미 생성 중입니다. 잠시 기다려 주세요.`);
      
      // 생성 중 상태 응답
      return res.status(202).json({
        title: topic.title,
        content: `<div class="text-center">
          <p class="text-lg my-4">해당 기사를 생성하고 있습니다. 잠시 후 다시 확인해 주세요.</p>
          <div class="spinner h-12 w-12 mx-auto border-t-2 border-b-2 border-blue-500"></div>
        </div>`,
        generatingInProgress: true
      });
    }
    
    // 캐시된 기사 확인
    if (archiveData[today] && 
        archiveData[today].articles && 
        archiveData[today].articles[topic.id] && 
        archiveData[today].articles[topic.id].completed) {
      
      console.log(`토픽 ID ${topic.id}에 대한 캐시된 기사 반환`);
      return res.json(archiveData[today].articles[topic.id]);
    }
    
    // 기사 생성 (백그라운드로 처리)
    const article = await generateArticleForTopic(topic, searchResults);
    return res.json(article);
    
  } catch (error) {
    console.error('기사 생성 API 오류:', error);
    return res.status(500).json({
      error: '기사 생성 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

// API 엔드포인트 - 아카이브 접근
app.get('/api/archives', (req, res) => {
  try {
    // 아카이브 데이터를 날짜 기준 내림차순으로 반환
    const archives = Object.keys(archiveData)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => {
        const data = archiveData[date];
        const dateObj = new Date(date);
        
        // 서식화된 날짜
        const formattedDate = dateObj.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
        
        return {
          date: date,
          formattedDate: formattedDate,
          topics: data.topics ? data.topics.length : 0,
          articles: data.articles ? Object.keys(data.articles).length : 0
        };
      });
    
    res.json(archives);
  } catch (error) {
    console.error('아카이브 목록 API 오류:', error);
    res.status(500).json({ error: '아카이브 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// API 엔드포인트 - 특정 날짜 아카이브 접근
app.get('/api/archives/:date', (req, res) => {
  try {
    const { date } = req.params;
    
    if (!archiveData[date]) {
      return res.status(404).json({ error: '해당 날짜의 아카이브를 찾을 수 없습니다.' });
    }
    
    // 날짜 포맷팅
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    // 반환할 데이터 구성
    const responseData = {
      date,
      formattedDate,
      topics: archiveData[date].topics,
      articlesCount: Object.keys(archiveData[date].articles || {}).length
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('아카이브 상세 API 오류:', error);
    res.status(500).json({ error: '아카이브 데이터를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 아카이브 데이터 초기화 함수 (서버 시작 시 호출)
const initArchiveData = async () => {
  console.log('아카이브 데이터 초기화 중...');
  
  try {
    // 로컬 파일에서 아카이브 데이터 로드
    const success = loadArchiveData();
    if (!success) {
      console.log('새 아카이브를 시작합니다.');
      archiveData = {};
    }
    
    // 오래된 아카이브 데이터 정리 (60일 이상 된 데이터) - 7일에서 60일로 변경
    console.log('오래된 아카이브 데이터 정리 중...');
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - 60));
    
    let deletedCount = 0;
    Object.keys(archiveData).forEach(dateStr => {
      try {
        const archiveDate = new Date(dateStr);
        if (archiveDate < cutoffDate) {
          console.log(`오래된 아카이브 삭제: ${dateStr}`);
          delete archiveData[dateStr];
          deletedCount++;
        }
      } catch (err) {
        console.error(`날짜 처리 오류: ${dateStr}`, err);
      }
    });
    
    if (deletedCount > 0) {
      console.log(`${deletedCount}개의 오래된 아카이브 항목이 삭제되었습니다.`);
      
      // 변경된 데이터 저장
      saveArchiveData();
    }
    
    console.log('아카이브 데이터 초기화 완료.');
    console.log(`현재 ${Object.keys(archiveData).length}일 분량의 아카이브 데이터가 로드되었습니다.`);
  } catch (error) {
    console.error('아카이브 데이터 초기화 중 오류:', error);
    console.log('기본 빈 아카이브로 시작합니다.');
    archiveData = {};
  }
};

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  
  // 서버 시작 시 아카이브 데이터 초기화
  initArchiveData();
});

// 클라이언트 종료 이벤트 리스너 등록 (데이터 저장 목적)
process.on('SIGINT', () => {
  console.log('서버가 종료됩니다. 데이터를 저장합니다...');
  saveArchiveData();
  setTimeout(() => process.exit(0), 500);
});

process.on('SIGTERM', () => {
  console.log('서버가 종료됩니다. 데이터를 저장합니다...');
  saveArchiveData();
  setTimeout(() => process.exit(0), 500);
});

// API 엔드포인트 - 기사 버전2 생성
app.post('/api/generate-article-v2', async (req, res) => {
  try {
    const { topic, searchResults = [] } = req.body;
    
    if (!topic || !topic.id || !topic.title) {
      return res.status(400).json({ error: '유효하지 않은 주제 데이터입니다.' });
    }
    
    console.log(`토픽 ID ${topic.id}에 대한 기사 버전2 생성 요청 수신`);
    
    // 기사 생성 가능여부 체크 (이미 생성 중인지 확인)
    const today = new Date().toISOString().split('T')[0];
    
    // 현재 생성 중인지 확인
    const generatingKey = `v2_${topic.id}`;
    if (archiveData[today] && 
        archiveData[today].generatingArticles && 
        archiveData[today].generatingArticles[generatingKey]) {
      console.log(`토픽 ID ${topic.id}의 버전2 기사는 이미 생성 중입니다. 잠시 기다려 주세요.`);
      
      // 생성 중 상태 응답
      return res.status(202).json({
        title: `${topic.title} (버전 2)`,
        content: `<div class="text-center">
          <p class="text-lg my-4">버전2 기사를 생성하고 있습니다. 잠시 후 다시 확인해 주세요.</p>
          <div class="spinner h-12 w-12 mx-auto border-t-2 border-b-2 border-blue-500"></div>
        </div>`,
        generatingInProgress: true,
        isVersion2: true
      });
    }
    
    // 캐시된 버전2 기사 확인
    if (archiveData[today] && 
        archiveData[today].articlesV2 && 
        archiveData[today].articlesV2[topic.id] && 
        archiveData[today].articlesV2[topic.id].completed) {
      
      console.log(`토픽 ID ${topic.id}에 대한 캐시된 버전2 기사 반환`);
      return res.json(archiveData[today].articlesV2[topic.id]);
    }
    
    // 버전2 생성 중 표시
    if (!archiveData[today]) {
      archiveData[today] = {
        topics: [],
        articles: {},
        articlesV2: {},
        searchResults: [],
        generatingArticles: {}
      };
    }
    
    if (!archiveData[today].articlesV2) {
      archiveData[today].articlesV2 = {};
    }
    
    if (!archiveData[today].generatingArticles) {
      archiveData[today].generatingArticles = {};
    }
    
    // 생성 중 상태 표시 (v2 접두사 사용)
    archiveData[today].generatingArticles[generatingKey] = true;
    saveArchiveData();
    
    // 로딩 상태 먼저 반환
    res.status(202).json({
      title: `${topic.title} (버전 2)`,
      content: `<div class="text-center">
        <p class="text-lg my-4">새로운 버전의 기사를 생성하고 있습니다. 잠시 후 다시 확인해 주세요.</p>
        <div class="spinner h-12 w-12 mx-auto border-t-2 border-b-2 border-blue-500"></div>
      </div>`,
      generatingInProgress: true,
      isVersion2: true
    });
    
    // 백그라운드에서 버전2 기사 생성
    (async () => {
      try {
        // 버전2 기사 생성
        const article = await generateArticleForTopicV2(topic, searchResults);
        
        // 생성된 기사 저장
        archiveData[today].articlesV2[topic.id] = {
          ...article,
          isVersion2: true,
          version: 2,
          completed: true
        };
        
        // 생성 중 상태 제거
        delete archiveData[today].generatingArticles[generatingKey];
        
        // 저장
        saveArchiveData();
        console.log(`토픽 ID ${topic.id}의 버전2 기사 생성 완료 및 저장됨`);
      } catch (error) {
        console.error(`토픽 ID ${topic.id}의 버전2 기사 생성 중 오류:`, error);
        
        // 오류 시 생성 중 상태 제거
        if (archiveData[today] && archiveData[today].generatingArticles) {
          delete archiveData[today].generatingArticles[generatingKey];
          saveArchiveData();
        }
      }
    })();
    
  } catch (error) {
    console.error('버전2 기사 생성 API 오류:', error);
    return res.status(500).json({
      error: '버전2 기사 생성 중 오류가 발생했습니다.',
      message: error.message,
      isVersion2: true
    });
  }
});

// 토픽별 버전2 기사 생성 함수
async function generateArticleForTopicV2(topic, searchResults) {
  try {
    console.log(`토픽 ${topic.id} "${topic.title}"의 버전2 기사 생성 시작...`);
    
    // 요약 정보 준비
    const topicInfo = {
      title: topic.title,
      summary: topic.summary,
      date: topic.dateOccurred || new Date().toISOString().split('T')[0]
    };
    
    // 관련 뉴스 결과 필터링 (최대 20개)
    const relatedResults = searchResults && searchResults.length > 0 ?
      searchResults
        .filter(result => result.title && result.description)
        .slice(0, 20) :
      [];
    
    console.log(`토픽 ${topic.id} 관련 검색 결과 수: ${relatedResults.length}`);
    
    // 버전2 기사 생성 프롬프트 - 더 많은 MZ 세대 말투와 이모지 활용
    const prompt = `
    당신은 국제 정치 전문 저널리스트입니다. 다음 주제에 대한 심층 분석 기사의 두 번째 버전을 작성해주세요:
    
    주제: ${topicInfo.title}
    요약: ${topicInfo.summary}
    날짜: ${topicInfo.date}
    
    다음 검색 결과를 참고하여 관련성 높은 정보를 포함해 기사를 작성하세요:
    ${JSON.stringify(relatedResults.slice(0, 5))}
    
    한국어로 기사를 작성하되, 다음 가이드라인을 따라주세요:
    1. 기사는 서론, 본론, 결론 구조로 작성하세요.
    2. 객관적인 사실과 다양한 관점을 균형있게 제시하세요.
    3. HTML 형식으로 작성하세요 (<p>, <h2>, <h3>, <blockquote> 등의 태그 사용).
    4. 관련 국가, 기관, 인물에 대한 배경 정보를 제공하세요.
    5. 중요한 인용구는 <blockquote> 태그로 강조하세요.
    6. 글로벌 의미와 한국에 미치는 영향을 포함하세요.
    7. 분석과 전망으로 마무리하세요.
    8. 최소 1000단어 이상 작성하세요.
    9. 한국의 MZ세대가 쓰는 말투를 적극적으로 사용하고 이모지도 풍부하게 활용하여 유머러스하게 작성하세요. 
       (예: "~인 것 같아요 😎", "~가 레전드 🔥", "~실화냐? 😱", "찐 팩트 ✅", "솔직히 말하자면 💯", "뭐지..? 🤔", 
       "핵꿀잼 👍", "천재인 듯 🧠", "리얼.. 👀", "ㅇㅈ", "ㄹㅇ", "ㅋㅋㅋ" 등을 적극적으로 사용)
    10. 이 버전은 첫 번째 버전과 달라야 하며, 더 트렌디하고 젊은 세대가 즐길 수 있는 스타일로 작성하세요.
    11. 다양한 이모지를 섞어 사용하여 시각적 재미를 더하세요.
    
    기사 제목은 주제와 유사하면서도 MZ세대가 관심을 가질 수 있는 재미있는 표현으로 작성해주세요.
    `;
    
    console.log(`토픽 ${topic.id}에 대한 버전2 기사 생성 프롬프트 준비 완료`);
    
    try {
      console.log(`토픽 ${topic.id}에 대한 버전2 Gemini API 호출 시작...`);
      const startTime = Date.now();
      
      // 직접 API 호출 구현
      const result = await modelContent.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      
      const endTime = Date.now();
      console.log(`토픽 ${topic.id}에 대한 버전2 Gemini API 응답 완료 (${(endTime - startTime) / 1000}초 소요)`);
      
      // API 응답 확인
      if (!result || !result.response) {
        throw new Error('Gemini API에서 응답을 받지 못했습니다.');
      }
      
      const content = result.response.text();
      
      // 생성된 내용 유효성 검증
      if (!content || content.length < 500) {
        console.error(`토픽 ${topic.id}의 생성된 버전2 기사 내용이 너무 짧습니다: ${content.length}자`);
        throw new Error('생성된 버전2 기사 내용이 충분하지 않습니다. (500자 이상 필요)');
      }
      
      console.log(`토픽 ${topic.id}의 버전2 기사 내용 생성 완료 (${content.length} 자)`);
      
      // 관련 뉴스 선택 (최대 3개)
      const relatedNews = relatedResults.slice(0, 3).map(result => {
        return {
          title: result.title || '제목 없음',
          source: result.domain || result.source || '출처 미상',
          time: result.published_date || result.page_age || '날짜 불명'
        };
      });
      
      // 기사 데이터 구성
      const articleData = {
        title: `${topic.title} (버전 2)`,
        content: content,
        relatedNews: relatedNews,
        generatedAt: new Date().toISOString(),
        isVersion2: true,
        version: 2,
        completed: true
      };
      
      return articleData;
      
    } catch (apiError) {
      console.error(`토픽 ${topic.id}의 버전2 Gemini API 호출 중 오류:`, apiError);
      
      // 두 번째 시도 - 더 단순한 프롬프트로 재시도
      try {
        console.log(`토픽 ${topic.id}에 대한 버전2 Gemini API 두 번째 시도...`);
        
        // 단순화된 프롬프트로 재시도
        const simplifiedPrompt = `
        국제 정치 주제에 대한 분석 기사의 두 번째 버전을 작성해 주세요:
        
        주제: ${topicInfo.title}
        요약: ${topicInfo.summary}
        
        HTML 형식으로 작성하되, 적어도 1000단어 이상의 상세한 분석을 제공해 주세요.
        기사는 서론, 본론, 결론 구조를 갖추고, 객관적 사실과 다양한 관점을 균형 있게 제시하세요.
        한국의 MZ세대가 쓰는 말투를 적극적으로 사용하고 이모지도 풍부하게 활용하여 유머러스하게 작성하세요.
        (예: "~인 것 같아요 😎", "~가 레전드 🔥", "~실화냐? 😱", "찐 팩트 ✅" 등)
        반드시 첫 번째 버전과는 다른 스타일과 내용으로 작성해주세요.
        `;
        
        const retryResult = await modelContent.generateContent({
          contents: [{ role: "user", parts: [{ text: simplifiedPrompt }] }]
        });
        
        if (retryResult && retryResult.response) {
          const retryContent = retryResult.response.text();
          
          if (retryContent && retryContent.length >= 300) {
            console.log(`토픽 ${topic.id}의 버전2 기사 두 번째 시도 성공 (${retryContent.length} 자)`);
            
            // 기사 데이터 구성
            return {
              title: `${topic.title} (버전 2)`,
              content: retryContent,
              relatedNews: relatedResults.slice(0, 3).map(result => ({
                title: result.title || '제목 없음',
                source: result.domain || '출처 미상',
                time: result.published_date || '날짜 불명'
              })),
              generatedAt: new Date().toISOString(),
              isVersion2: true,
              version: 2,
              completed: true,
              isRetry: true
            };
          }
        }
        
        throw new Error('버전2 두 번째 시도도 실패했습니다.');
      } catch (retryError) {
        console.error(`토픽 ${topic.id}의 버전2 Gemini API 두 번째 시도 실패:`, retryError);
        
        // 기본 내용 생성
        const defaultContent = `
          <h1>${topic.title} (버전 2)</h1>
          <h2>현재 상황 분석 🔍</h2>
          <p>${topic.summary}</p>
          <p>이 주제에 대한 상세 분석 내용의 버전2를 생성하는 중 오류가 발생했습니다. 다음번 분석 시 더 자세한 내용이 제공될 예정입니다.</p>
          <p>오류 상세 내용: ${apiError.message || '알 수 없는 오류'} 😓</p>
          <h2>배경 정보 📚</h2>
          <p>이 주제는 국제 정치 분야의 중요한 이슈로, 향후 추가적인 정보와 분석이 제공될 것입니다.</p>
          <h2>영향 및 전망 🔮</h2>
          <p>현재 상황의 발전 과정을 지속적으로 모니터링하여 자세한 분석 정보를 업데이트할 예정입니다.</p>
        `;
        
        // 기본 기사 데이터 구성
        return {
          title: `${topic.title} (버전 2)`,
          content: defaultContent,
          relatedNews: relatedResults.slice(0, 3).map(result => ({
            title: result.title || '제목 없음',
            source: result.domain || '출처 미상',
            time: result.published_date || result.page_age || '날짜 불명'
          })),
          generatedAt: new Date().toISOString(),
          isVersion2: true,
          version: 2,
          completed: true,
          isErrorFallback: true
        };
      }
    }
    
  } catch (error) {
    console.error(`토픽 ${topic.id} 버전2 처리 중 오류:`, error);
    
    return {
      title: `${topic.title} (버전 2)`,
      content: `
        <h1>${topic.title} (버전 2)</h1>
        <p>이 주제에 대한 버전2 기사를 생성하는 중 오류가 발생했습니다: ${error.message}</p>
        <p>문제가 지속되면 관리자에게 문의하세요.</p>
      `,
      relatedNews: [],
      isVersion2: true,
      version: 2,
      completed: true,
      isError: true
    };
  }
}

// 토픽별 기사 생성 함수
async function generateArticleForTopic(topic, searchResults) {
  try {
    console.log(`토픽 ${topic.id} "${topic.title}"의 기사 생성 시작...`);
    
    // 요약 정보 준비
    const topicInfo = {
      title: topic.title,
      summary: topic.summary,
      date: topic.dateOccurred || new Date().toISOString().split('T')[0]
    };
    
    // 현재 날짜
    const today = new Date().toISOString().split('T')[0];
    
    // 생성 상태 표시
    if (!archiveData[today]) {
      archiveData[today] = { topics: [], articles: {}, generatingArticles: {}, searchResults: [] };
    }
    if (!archiveData[today].generatingArticles) {
      archiveData[today].generatingArticles = {};
    }
    archiveData[today].generatingArticles[topic.id] = true;
    
    // 캐시된 기사 확인 및 유효성 검증
    if (archiveData[today].articles && 
        archiveData[today].articles[topic.id] && 
        archiveData[today].articles[topic.id].content && 
        archiveData[today].articles[topic.id].content.length > 500) {
      
      console.log(`토픽 ${topic.id}에 대한 유효한 캐시된 기사가 있습니다 (${archiveData[today].articles[topic.id].content.length}자)`);
      archiveData[today].generatingArticles[topic.id] = false;
      return archiveData[today].articles[topic.id];
    }
    
    // 관련 뉴스 결과 필터링 (최대 20개)
    const relatedResults = searchResults && searchResults.length > 0 ?
      searchResults
        .filter(result => result.title && result.description)
        .slice(0, 20) :
      [];
    
    console.log(`토픽 ${topic.id} 관련 검색 결과 수: ${relatedResults.length}`);
    
    // 기사 생성 프롬프트
    const prompt = `
    당신은 국제 정치 전문 저널리스트입니다. 다음 주제에 대한 심층 분석 기사를 작성해주세요:
    
    주제: ${topicInfo.title}
    요약: ${topicInfo.summary}
    날짜: ${topicInfo.date}
    
    다음 검색 결과를 참고하여 관련성 높은 정보를 포함해 기사를 작성하세요:
    ${JSON.stringify(relatedResults.slice(0, 8))}
    
    한국어로 기사를 작성하되, 다음 가이드라인을 따라주세요:
    1. 기사는 서론, 본론, 결론 구조로 작성하세요.
    2. 객관적인 사실과 다양한 관점을 균형있게 제시하세요.
    3. HTML 형식으로 작성하세요 (<p>, <h2>, <h3>, <blockquote> 등의 태그 사용).
    4. 관련 국가, 기관, 인물에 대한 배경 정보를 제공하세요.
    5. 중요한 인용구는 <blockquote> 태그로 강조하세요.
    6. 글로벌 의미와 한국에 미치는 영향을 포함하세요.
    7. 분석과 전망으로 마무리하세요.
    8. 최소 1200단어 이상 작성하세요.
    
    기사 제목은 주제와 유사하게 작성하되, 기사의 핵심 메시지를 담아주세요.
    `;
    
    console.log(`토픽 ${topic.id}에 대한 기사 생성 프롬프트 준비 완료`);
    
    try {
      console.log(`토픽 ${topic.id}에 대한 Gemini API 호출 시작...`);
      const startTime = Date.now();
      
      // 직접 API 호출
      const result = await modelContent.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      
      const endTime = Date.now();
      console.log(`토픽 ${topic.id}에 대한 Gemini API 응답 완료 (${(endTime - startTime) / 1000}초 소요)`);
      
      // API 응답 확인
      if (!result || !result.response) {
        throw new Error('Gemini API에서 응답을 받지 못했습니다.');
      }
      
      const content = result.response.text();
      
      // 생성된 내용 유효성 검증
      if (!content || content.length < 500) {
        console.error(`토픽 ${topic.id}의 생성된 기사 내용이 너무 짧습니다: ${content.length}자`);
        throw new Error('생성된 기사 내용이 충분하지 않습니다. (500자 이상 필요)');
      }
      
      console.log(`토픽 ${topic.id}의 기사 내용 생성 완료 (${content.length} 자)`);
      
      // 관련 뉴스 선택 (최대 3개)
      const relatedNews = relatedResults.slice(0, 3).map(result => {
        return {
          title: result.title || '제목 없음',
          source: result.domain || result.source || '출처 미상',
          time: result.published_date || result.page_age || '날짜 불명'
        };
      });
      
      // 기사 데이터 구성
      const articleData = {
        title: topic.title,
        content: content,
        relatedNews: relatedNews,
        generatedAt: new Date().toISOString(),
        completed: true
      };
      
      // 아카이브에 기사 저장
      if (archiveData[today]) {
        archiveData[today].articles[topic.id] = articleData;
        archiveData[today].generatingArticles[topic.id] = false;
        // 아카이브 데이터 저장
        saveArchiveData();
      }
      
      return articleData;
    } catch (apiError) {
      console.error(`토픽 ${topic.id}의 Gemini API 호출 중 오류:`, apiError);
      
      // 기본 내용 생성
      const defaultContent = `
        <h1>${topic.title}</h1>
        <h2>현재 상황 분석</h2>
        <p>${topic.summary}</p>
        <p>이 주제에 대한 상세 분석 내용을 생성하는 중 오류가 발생했습니다. 다음번 분석 시 더 자세한 내용이 제공될 예정입니다.</p>
        <p>오류 상세 내용: ${apiError.message || '알 수 없는 오류'}</p>
        <h2>배경 정보</h2>
        <p>이 주제는 국제 정치 분야의 중요한 이슈로, 향후 추가적인 정보와 분석이 제공될 것입니다.</p>
        <h2>영향 및 전망</h2>
        <p>현재 상황의 발전 과정을 지속적으로 모니터링하여 자세한 분석 정보를 업데이트할 예정입니다.</p>
      `;
      
      // 기본 기사 데이터 구성
      const fallbackData = {
        title: topic.title,
        content: defaultContent,
        relatedNews: relatedResults.slice(0, 3).map(result => ({
          title: result.title || '제목 없음',
          source: result.domain || '출처 미상',
          time: result.published_date || '날짜 불명'
        })),
        generatedAt: new Date().toISOString(),
        completed: true,
        isErrorFallback: true
      };
      
      // 아카이브에 기본 기사 저장
      if (archiveData[today]) {
        archiveData[today].articles[topic.id] = fallbackData;
        archiveData[today].generatingArticles[topic.id] = false;
        // 아카이브 데이터 저장
        saveArchiveData();
      }
      
      return fallbackData;
    }
  } catch (error) {
    console.error(`토픽 ${topic.id} 처리 중 오류:`, error);
    
    const errorContent = `
      <h1>${topic.title}</h1>
      <p>이 주제에 대한 기사를 생성하는 중 오류가 발생했습니다: ${error.message}</p>
      <p>문제가 지속되면 관리자에게 문의하세요.</p>
    `;
    
    // 오류 정보 저장 및 생성 상태 업데이트
    const today = new Date().toISOString().split('T')[0];
    if (archiveData[today]) {
      archiveData[today].generatingArticles[topic.id] = false;
    }
    
    return {
      title: topic.title,
      content: errorContent,
      relatedNews: [],
      completed: true,
      isError: true
    };
  }
}