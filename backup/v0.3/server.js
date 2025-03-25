// server.js - Express 서버 설정
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
require('dotenv').config();

// 필요한 모듈 추가
const Parser = require('rss-parser');
const rssParser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
  timeout: 10000, // 10초 타임아웃
  customFields: {
    item: [
      ['media:content', 'media'],
      ['description', 'description'],
      ['content:encoded', 'content'],
      ['dc:creator', 'creator']
    ]
  }
});

// RSS 피드 URL 목록 추가
const rssFeedUrls = [
  // 해외 주요 언론사 피드
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
  'https://www.theguardian.com/world/rss',
  'https://www.theguardian.com/politics/rss',
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://feeds.bbci.co.uk/news/politics/rss.xml',
  'https://www.reuters.com/world/rss/',
  'https://www.reuters.com/feedshttps://www.reuters.com/politics/rss',
  'https://apnews.com/rss/world-news',
  'https://www.aljazeera.com/xml/rss/all.xml',
  'https://foreignpolicy.com/feed/',
  'http://feeds.washingtonpost.com/rss/world',
  'https://www.washingtonpost.com/politics/rss/',
  'http://rss.cnn.com/rss/money_topstories.rss',
  'http://rss.cnn.com/rss/money_news_international.rss',
  
  // CNN
  'http://rss.cnn.com/rss/cnn_allpolitics.rss',
  'http://rss.cnn.com/rss/cnn_world.rss',
  
  // Fox News
  'https://moxie.foxnews.com/google-publisher/politics.xml',
  'https://moxie.foxnews.com/google-publisher/world.xml',
  
  // 기타 북미/유럽 언론사
  'https://feeds.npr.org/1014/rss.xml',
  'https://feeds.npr.org/1004/rss.xml',
  'https://feeds.a.dj.com/rss/RSSPolitics.xml',
  'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
  'https://www.ft.com/world?format=rss',
  'https://rss.dw.com/rdf/rss-en-all',
  'https://www.france24.com/en/rss',
  
  // 아시아/태평양 언론사
  'https://www.scmp.com/rss/3/feed',
  'https://www.scmp.com/rss/4/feed',
  'https://www3.nhk.or.jp/nhkworld/en/news/all.rss',
  'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
  'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms',
  'https://www.theaustralian.com.au/rss/world.xml',
  'https://www.theaustralian.com.au/rss/politics.xml',
  'https://www.straitstimes.com/news/world/rss.xml',
  'https://rss.cbc.ca/lineup/world.xml',
  'https://rss.cbc.ca/lineup/politics.xml',
  'https://www.abc.net.au/news/feed/51892/rss.xml',
  'https://www.rt.com/rss/news/',
  
  // 한국 언론사 피드
  // 조선일보
  'https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml',
  'https://www.chosun.com/arc/outboundfeeds/rss/category/international/?outputType=xml',
  // 중앙일보
  'https://rss.joins.com/politics/',
  'https://rss.joins.com/internationalnews/',
  // 동아일보
  'https://rss.donga.com/politics.xml',
  'https://rss.donga.com/international.xml',
  // 한겨레
  'https://www.hani.co.kr/rss/politics/',
  'https://www.hani.co.kr/rss/international/',
  // 경향신문
  'http://www.khan.co.kr/rss/rssdata/politic_news.xml',
  'http://www.khan.co.kr/rss/rssdata/world_news.xml',
  // 연합뉴스
  'https://www.yna.co.kr/RSS/politics.xml',
  'https://www.yna.co.kr/RSS/international.xml',
  // KBS
  'http://rss.kbs.co.kr/feed_news_politics.xml',
  'http://rss.kbs.co.kr/feed_news_world.xml',
  // MBC
  'https://imnews.imbc.com/rss/news/news_politics.xml',
  'https://imnews.imbc.com/rss/news/news_world.xml',
  // SBS
  'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER',
  'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=08&plink=RSSREADER',
  // JTBC
  'https://fs.jtbc.co.kr/RSS/newsflash.xml',
  // KBS World
  'http://world.kbs.co.kr/rss/rss_news.htm?lang=e',
  'http://world.kbs.co.kr/rss/rss_news.htm?lang=e&id=Po',
  'http://world.kbs.co.kr/rss/rss_news.htm?lang=e&id=Ec',
  'http://world.kbs.co.kr/rss/rss_news.htm?lang=e&id=IK',
  'http://world.kbs.co.kr/rss/rss_news.htm?lang=e&id=In',
  'http://world.kbs.co.kr/rss/rss_news.htm?lang=e&id=Dm',
  
  // SBS
  'https://news.sbs.co.kr/news/headlineRssFeed.do?plink=RSSREADER',
  'https://news.sbs.co.kr/news/newsflashRssFeed.do?plink=RSSREADER',
  'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER',
  'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=02&plink=RSSREADER',
  'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=07&plink=RSSREADER',
  
  // 연합뉴스TV
  'http://www.yonhapnewstv.co.kr/category/news/politics/feed/',
  'http://www.yonhapnewstv.co.kr/category/news/economy/feed/',
  'http://www.yonhapnewstv.co.kr/category/news/international/feed/',
  
  // JTBC
  'https://news-ex.jtbc.co.kr/v1/get/rss/section/10',
  'https://news-ex.jtbc.co.kr/v1/get/rss/section/20',
  'https://news-ex.jtbc.co.kr/v1/get/rss/section/30',
  'https://news-ex.jtbc.co.kr/v1/get/rss/section/40',
  
  // 조선일보
  'https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml',
  'https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml',
  'https://www.chosun.com/arc/outboundfeeds/rss/category/international/?outputType=xml',
  'https://www.chosun.com/arc/outboundfeeds/rss/category/national/?outputType=xml',
  
  // 동아일보
  'https://rss.donga.com/politics.xml',
  'https://rss.donga.com/economy.xml',
  'https://rss.donga.com/international.xml'
];

// RSS 피드를 파싱하는 함수
async function fetchRssFeeds() {
  console.log('📰 RSS 피드 수집 시작...');
  let allItems = [];
  
  // RSS 소스당 최대 기사 수 설정
  const MAX_ITEMS_PER_SOURCE = 12;
  
  // 사용자 에이전트 설정 (일부 사이트는 봇 차단)
  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8'
    },
    timeout: 15000, // 15초 타임아웃
    customFields: {
      item: [
        ['media:content', 'media'],
        ['media:thumbnail', 'thumbnail'],
      ]
    }
  });
  
  // 각 RSS 피드 URL에 대해 병렬로 요청을 보내지만, 오류 처리를 강화
  const feedPromises = rssFeedUrls.map(async (url) => {
    try {
      console.log(`📡 RSS 피드 가져오기: ${url}`);
      
      // URL 유효성 검사
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (urlError) {
        console.error(`❌ 잘못된 URL 형식: ${url}`);
        return [];
      }
      
      // 타임아웃 시간을 15초로 늘림
      const feedResult = await Promise.race([
        parser.parseURL(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout fetching ${url}`)), 15000)
        )
      ]);
      
      // 결과 확인
      if (!feedResult || !feedResult.items || !Array.isArray(feedResult.items)) {
        console.warn(`⚠️ ${url}에서 유효한 항목을 찾을 수 없음`);
        return [];
      }
      
      // 각 피드에서 최대 MAX_ITEMS_PER_SOURCE 항목만 가져오기
      const limitedItems = feedResult.items.slice(0, MAX_ITEMS_PER_SOURCE);
      
      // 각 아이템에 파스 정보와 RSS 플래그 추가 (오류 처리 강화)
      const items = limitedItems.map(item => {
        try {
          // 날짜 처리 개선
          let normalizedDate;
          try {
            // 다양한 날짜 형식 처리 시도
            const dateString = item.pubDate || item.isoDate || item.published || item.date;
            if (dateString) {
              const parsedDate = new Date(dateString);
              if (!isNaN(parsedDate.getTime())) {
                normalizedDate = parsedDate.toISOString();
              } else {
                normalizedDate = new Date().toISOString();
              }
            } else {
              normalizedDate = new Date().toISOString();
            }
          } catch (dateError) {
            console.warn(`⚠️ 날짜 변환 오류(${url}): ${dateError.message}. 현재 날짜로 대체`);
            normalizedDate = new Date().toISOString();
          }
          
          // 제목과 설명 텍스트 정리 (HTML 태그 제거 및 특수 문자 처리)
          const cleanText = (text) => {
            if (!text) return '';
            // HTML 태그 제거
            const withoutTags = text.replace(/<[^>]*>?/gm, ' ');
            // 여러 공백 제거
            return withoutTags.replace(/\s+/g, ' ').trim();
          };
          
          // 항목 생성
          return {
            ...item,
            source: feedResult.title || parsedUrl.hostname,
            is_from_rss: true,
            category: (item.categories && item.categories.length > 0) ? item.categories[0] : 'general',
            domain: parsedUrl.hostname,
            url: item.link || url,
            title: cleanText(item.title) || `[제목 없음] - ${parsedUrl.hostname}`,
            snippet: cleanText(item.contentSnippet || item.summary || item.description) || '',
            description: cleanText(item.contentSnippet || item.summary || item.description) || '',
            published_date: item.pubDate || item.isoDate || new Date().toISOString(),
            normalized_date: normalizedDate,
            // 메타데이터도 포함
            meta: {
              feedTitle: feedResult.title || '',
              feedDescription: feedResult.description || '',
              feedLink: feedResult.link || url
            }
          };
        } catch (itemError) {
          console.warn(`⚠️ 항목 변환 오류(${url}): ${itemError.message}`);
          return null; // 오류가 있는 항목은 null로 표시
        }
      }).filter(item => item !== null); // null 항목 제거
      
      console.log(`✅ ${url}에서 ${items.length}개의 항목을 가져왔습니다 (제한: ${MAX_ITEMS_PER_SOURCE}개)`);
      return items;
    } catch (error) {
      // 오류 로깅 개선
      let errorMessage = error.message || '알 수 없는 오류';
      let statusCode = null;
      
      if (error.response) {
        statusCode = error.response.status;
        errorMessage = `Status code ${error.response.status}`;
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = `DNS 확인 오류: ${error.hostname || url}`;
      } else if (error.message.includes('timeout')) {
        errorMessage = `요청 타임아웃 (15초 초과)`;
      }
      
      console.error(`❌ RSS 피드 ${url} 파싱 오류: ${errorMessage}`);
      
      // 재시도 로직 (선택적) - 나중에 구현할 경우를 위한 주석
      // if (retryCount < MAX_RETRIES && shouldRetry(statusCode, errorMessage)) {
      //   console.log(`🔄 RSS 피드 ${url} 재시도 중... (${retryCount + 1}/${MAX_RETRIES})`);
      //   return fetchRssFeed(url, retryCount + 1);
      // }
      
      return []; // 오류 발생 시 빈 배열 반환
    }
  });
  
  try {
    // Promise.allSettled를 사용해 일부 실패해도 진행 가능
    const results = await Promise.allSettled(feedPromises);
    let successCount = 0;
    let failCount = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allItems = [...allItems, ...result.value];
        if (result.value.length > 0) {
          successCount++;
        } else {
          // 성공했지만 항목이 없는 경우
          console.warn(`⚠️ RSS 피드 ${rssFeedUrls[index]}에서 항목을 가져왔으나 유효한 항목이 없습니다`);
        }
      } else {
        failCount++;
        console.error(`❌ RSS 피드 처리 실패: ${rssFeedUrls[index]} - ${result.reason}`);
      }
    });
    
    console.log(`📊 RSS 피드 처리 결과: 성공 ${successCount}개, 실패 ${failCount}개`);
    
    // 중복 제거 (URL 기준)
    const uniqueUrls = new Set();
    const uniqueItems = allItems.filter(item => {
      if (!item.url) return false;
      if (uniqueUrls.has(item.url)) return false;
      uniqueUrls.add(item.url);
      return true;
    });
    
    console.log(`📊 중복 제거 후 고유 항목 수: ${uniqueItems.length}개 (중복 ${allItems.length - uniqueItems.length}개 제거)`);
    
    // 빈 결과인 경우 처리
    if (uniqueItems.length === 0) {
      console.warn('⚠️ 모든 RSS 피드에서 항목을 가져오지 못했습니다.');
      return [];
    }
    
    // 최신 항목 우선 정렬 (오류 방지를 위한 안전한 정렬)
    uniqueItems.sort((a, b) => {
      try {
        const dateA = a.normalized_date ? new Date(a.normalized_date) : new Date(0);
        const dateB = b.normalized_date ? new Date(b.normalized_date) : new Date(0);
        
        // 날짜가 유효하지 않은 경우 비교 안함
        if (isNaN(dateA.getTime())) return 1;  // 무효한 날짜는 뒤로
        if (isNaN(dateB.getTime())) return -1; // 무효한 날짜는 뒤로
        
        return dateB - dateA; // 최신순 정렬
      } catch (sortError) {
        console.warn(`⚠️ 날짜 정렬 오류: ${sortError.message}`);
        return 0;
      }
    });
    
    // 최근 N일 이내 기사 수 카운트
    const recentDays = 2;
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - recentDays);
    
    const recentItems = uniqueItems.filter(item => {
      try {
        const itemDate = new Date(item.normalized_date);
        return !isNaN(itemDate.getTime()) && itemDate >= recentDate;
      } catch (e) {
        return false;
      }
    });
    
    console.log(`📊 총 ${uniqueItems.length}개의 RSS 피드 항목을 가져왔습니다`);
    console.log(`📊 최근 ${recentDays}일 이내 기사 수: ${recentItems.length}개`);
    console.log(`📊 최신 기사 비율: ${((recentItems.length / uniqueItems.length) * 100).toFixed(2)}%`);
    
    return uniqueItems;
  } catch (error) {
    console.error('❌ RSS 피드 처리 중 오류:', error);
    return [];
  }
}

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
  model: "gemini-2.0-flash-thinking-exp-1219",
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

// 키워드 생성용 모델 - 더 낮은 온도값으로 설정
const modelKeywords = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-thinking-exp-1219",
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
        freshness = 'd', // 일(d)로 변경하여 최신 컨텐츠만 가져오기
        search_lang = 'en', // 영어 검색을 기본값으로 설정
        country = 'US', // 미국 검색으로 기본값 변경
        safesearch = 'moderate'
      } = typeof options === 'object' ? options : { count: options };

      // 최신 컨텐츠 강조를 위해 날짜 관련 키워드 추가
      let queryWithDate = query;
      if (!query.includes('latest') && !query.includes('recent') && !query.includes('today') && !query.includes('2024')) {
        queryWithDate = `${query} latest`;
      }

      console.log(`🌐 Brave API 검색 요청: "${queryWithDate}" (개수: ${count}, 기간: ${freshness}, 언어: ${search_lang}, 국가: ${country})`);
      
      // 요청량 확인
      if (!braveRequestTracker.canMakeRequest()) {
        console.warn('⚠️ 월간 검색 한도에 도달했습니다.');
        return []; // 빈 배열 반환
      }
      
      // 캐싱 키 생성
      const cacheKey = `${queryWithDate}-${count}-${freshness}-${search_lang}-${country}`;
      
      // 캐시 확인 (30분 내 캐시된 결과가 있으면 재사용, 더욱 최신성 유지를 위해 시간 단축)
      if (searchCache[cacheKey] && (Date.now() - searchCache[cacheKey].timestamp < 30 * 60 * 1000)) {
        console.log(`📂 캐시에서 검색 결과 로드: "${queryWithDate}" (${searchCache[cacheKey].results.length}개 결과)`);
        return searchCache[cacheKey].results;
      }
      
      // API 호출 횟수 증가
      braveRequestTracker.incrementCount();
      
      console.log(`🔄 Brave API 호출 중...`);
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY
      },
      params: {
          q: queryWithDate,
          count,
          freshness,
          search_lang,
          country,
          safesearch
        }
      });
      
      // 결과가 없는 경우 처리
      if (!response.data?.web?.results) {
        console.warn(`❌ "${queryWithDate}" 검색 결과 없음`);
        // 결과가 없을 경우 빈 배열 반환
        return [];
      }
      
      const results = response.data.web.results;
      console.log(`✅ Brave API 응답: "${queryWithDate}" 검색 결과 ${results.length}개 수신`);
      
      // 각 검색 결과에 메타데이터 추가
      const processedResults = results.map(item => ({
        ...item,
        search_query: queryWithDate,
        normalized_date: item.published_date || item.age || new Date().toISOString(),
        is_recent: item.published_date ? 
          (new Date(item.published_date) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) : 
          (item.age && item.age.includes('day') && parseInt(item.age) <= 3)
      }));
      
      // 캐시에 저장
      searchCache[cacheKey] = {
        results: processedResults,
        timestamp: Date.now()
      };
      
      return processedResults;
  } catch (error) {
      console.error('❌ Brave 검색 API 오류:', error.message);
      if (error.response) {
        console.error('응답 상태:', error.response.status);
        console.error('응답 데이터:', error.response.data);
      }
      return [];
    }
  });
}

// 최근 정치 뉴스 검색 및 분석 엔드포인트
app.post('/api/analyze', async (req, res) => {
  try {
    console.log('\n=== 🚀 워크플로우 시작: 최신 정치 뉴스 분석 ===');
    
    // 오늘 날짜 (YYYY-MM-DD 형식)
    const today = new Date().toISOString().split('T')[0];
    
    // 이미 오늘 분석한 결과가 있으면 재사용
    if (archiveData[today] && archiveData[today].topics) {
      console.log('📂 오늘의 분석 결과를 캐시에서 불러옵니다.');
      
      // 토픽이 6개가 안 되면 기본 토픽으로 채웁니다.
      let cachedTopics = archiveData[today].topics;
      
      if (cachedTopics.length < 6) {
        console.log(`⚠️ 캐시된 토픽 수가 ${cachedTopics.length}개로 6개보다 적습니다. 기본 토픽을 추가합니다.`);
        const defaultTopics = generateDefaultTopics();
        
        // 이미 있는 ID를 제외한 기본 토픽을 추가
        const existingIds = cachedTopics.map(topic => topic.id);
        const additionalTopics = defaultTopics
          .filter(topic => !existingIds.includes(topic.id))
          .slice(0, 6 - cachedTopics.length);
        
        cachedTopics = [...cachedTopics, ...additionalTopics];
        
        // 아카이브에 업데이트된 토픽 저장
        archiveData[today].topics = cachedTopics;
        saveArchiveData();
        
        console.log(`✅ 토픽을 ${cachedTopics.length}개로 업데이트했습니다.`);
      }
      
      return res.json({ 
        topics: cachedTopics,
        isFromArchive: true
      });
    }

    // 1. RSS 피드를 먼저 가져옵니다
    console.log('🔍 RSS 피드에서 최신 뉴스 수집 시작...');
    const rssResults = await fetchRssFeeds();
    
    console.log(`✅ RSS 피드에서 ${rssResults.length}개의 뉴스 항목을 가져왔습니다.`);
    
    // RSS 항목이 부족한 경우 Brave API 검색을 통해 보완
    let allResults = [...rssResults];
    
    // 2. RSS 결과가 충분하지 않은 경우 Brave API 검색으로 보완
    if (rssResults.length < 30) {
      console.log(`⚠️ RSS 결과가 ${rssResults.length}개로 부족합니다. Brave API 검색으로 보완합니다.`);
      
      // 모든 검색 결과를 저장할 배열
      let braveResults = [];
      
      // 해외 주요 언론사 사이트 검색 (site: 연산자 사용)
      console.log('🌐 해외 주요 언론사 검색 시작...');
      
      // 효율적인 검색을 위한 해외 언론사 쿼리 (영어로 변경)
      const foreignMediaQueries = [
        'site:bbc.com international politics latest news',
        'site:cnn.com global affairs recent developments',
        'site:reuters.com international relations this week',
        'site:apnews.com world politics breaking news',
        'site:theguardian.com international conflicts latest updates',
        'site:nytimes.com foreign policy recent events',
        'site:foreignpolicy.com geopolitics latest analysis',
        'site:washingtonpost.com global politics current events'
      ];
      
      for (const query of foreignMediaQueries.slice(0, 4)) {
        const results = await searchBrave(query, {
          count: 5,
          freshness: 'd', // 일 단위로 검색하여 최신 결과만 가져오기
          search_lang: 'en',
          country: 'US',
          safesearch: 'moderate'
        });
        
        braveResults = [...braveResults, ...results];
        
        // API 레이트 리밋 관리
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 충분한 결과가 있으면 다음 단계로
        if (braveResults.length >= 20) break;
      }
      
      console.log(`✅ 해외 언론사 검색 결과 수: ${braveResults.length}개`);
      
      // 주요 국제 정치 키워드 검색
      if (braveResults.length < 20) {
        console.log('🔍 주요 국제 정치 키워드 검색 시작...');
        
        // 영어 국제 정치 키워드 쿼리
        const internationalPoliticsQueries = [
          'Russia Ukraine war latest news 2024',
          'Israel Gaza conflict recent developments',
          'US China relations breaking news',
          'North Korea missile test latest',
          'European Union policy new updates'
        ];
        
        for (const query of internationalPoliticsQueries.slice(0, 3)) {
          const results = await searchBrave(query, {
            count: 5,
            freshness: 'd',
            search_lang: 'en',
            country: 'US',
            safesearch: 'moderate'
          });
          
          braveResults = [...braveResults, ...results];
          
          // API 레이트 리밋 관리
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // 충분한 결과가 있으면 중단
          if (braveResults.length >= 20) break;
        }
      }
      
      console.log(`✅ Brave API 검색 결과 총 ${braveResults.length}개 수집 완료`);
      
      // RSS 결과와 Brave 결과 합치기
      allResults = [...rssResults, ...braveResults];
    }
    
    // 검색 결과가 없는 경우 404 반환
    if (allResults.length === 0) {
      console.log('❌ 검색 결과가 없어 분석을 진행할 수 없습니다.');
      return res.status(404).json({ 
        error: '적절한 검색 결과를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.'
      });
    }
    
    // 중복 제거
    const uniqueResults = Array.from(new Set(allResults.map(r => r.url)))
      .map(url => allResults.find(r => r.url === url));
    
    console.log(`✅ 총 고유 검색 결과 개수: ${uniqueResults.length}개`);
    
    // 최신 뉴스 필터링 (최근 2일)
    const recentArticles = uniqueResults.filter(result => {
      // normalized_date가 있으면 사용, 없으면 기존 날짜 필드 사용
      const dateStr = result.normalized_date || result.published_date || result.page_age || result.age || '';
      if (!dateStr) return false;
      
      try {
        const articleDate = new Date(dateStr);
        const now = new Date();
        const twoDaysAgo = new Date(now.setDate(now.getDate() - 2)); // 2일 이내 최신 기사만 필터링
        
        // 유효한 날짜이고 2일 이내인 경우
        return !isNaN(articleDate) && articleDate >= twoDaysAgo;
      } catch (e) {
        // is_recent 플래그가 있고 true인 경우 최신으로 간주
        return result.is_recent === true;
      }
    });
    
    console.log(`📊 최근 2일 이내 기사 수: ${recentArticles.length}개`);
    
    // 최신 기사가 전체의 30% 이상인지 확인 및 로깅
    const recentRatio = uniqueResults.length > 0 ? recentArticles.length / uniqueResults.length : 0;
    console.log(`📊 최신 기사 비율: ${(recentRatio * 100).toFixed(2)}%`);
    
    // 검색 결과에서 사용할 기사 선택 (최신 기사 우선)
    const resultsToUse = [
      ...recentArticles,
      ...uniqueResults.filter(article => !recentArticles.includes(article))
    ]; // 제한 제거
    
    // 주제 분석 및 생성 실행
    const responseData = await analyzeAndGenerateTopics(resultsToUse);
    
    // 아카이브에 데이터 저장
    if (!archiveData[today]) {
      archiveData[today] = {
        date: today,
        topics: responseData.topics,
        articles: {},
        stats: {
          topicsGenerated: responseData.topics.length,
          articlesGenerated: 0,
          rssRatio: responseData.rssRatio || 0,
          createdAt: new Date().toISOString()
        }
      };
    } else {
      archiveData[today].topics = responseData.topics;
      if (!archiveData[today].stats) {
        archiveData[today].stats = {
          topicsGenerated: responseData.topics.length,
          articlesGenerated: 0,
          rssRatio: responseData.rssRatio || 0,
          createdAt: new Date().toISOString()
        };
      } else {
        archiveData[today].stats.topicsGenerated = responseData.topics.length;
        archiveData[today].stats.rssRatio = responseData.rssRatio || 0;
      }
    }
    
    // 아카이브 데이터 저장
    saveArchiveData();
    console.log(`✅ 아카이브에 오늘(${today})의 분석 결과 저장 완료`);
    
    // 클라이언트에 응답 전송
    console.log('=== 워크플로우 완료: 최신 정치 뉴스 분석 ===\n');
    return res.json(responseData);
    
  } catch (error) {
    console.error('❌ 분석 API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      message: error.message
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
    당신은 MZ세대를 위한, 복잡한 정치/뉴스/국제이슈를 쉽고 재미있게 설명하는 인기 유튜브 채널의 크리에이티브 디렉터이자 스크립트 작가입니다. 다음 주제에 대한 8-40분 분량의 흥미로운 유튜브 영상 스크립트를 작성해주세요:
    
    주제: ${topicInfo.title}
    요약: ${topicInfo.summary}
    날짜: ${topicInfo.date}
    
    다음 검색 결과를 참고하여 관련성 높은 정보를 포함해 스크립트를 작성하세요:
    ${JSON.stringify(relatedResults.slice(0, 8))}
    
    ▶️ 콘텐츠 기획 방향:
    1. MZ세대가 어려운 뉴스, 국제/국내 정치, 복잡한 이슈를 쉽고 재밌게 접근할 수 있도록 구성
    2. 정확한 정보 전달을 기반으로 하되, 전달 방식은 가볍고 유머러스하게
    3. 시청자가 자연스럽게 영상에 몰입하고 끝까지 시청할 수 있는 스토리텔링 구조 적용
    4. 시각적 설명과 쉬운 비유를 통해 복잡한 개념을 이해하기 쉽게 풀이
    5. 무거운 주제도 재치 있는 말투와 유머로 접근하여 시청자의 부담감을 줄이기
    
    ▶️ 스크립트 구성 요소:
    1. 🔥 시선을 확 끄는 인트로 (5-15초)
       - 충격적인 통계나 의외의 사실로 시작 ("이게 실화야?", "ㄹㅇ 충격적인 사실 하나 알려드림")
       - 오늘 주제에 대한 짧고 강렬한 티저
    
    2. 🎬 오프닝 인사 및 주제 소개 (30초-1분)
       - 채널 시그니처 인사 ("안녕하세요 여러분, 오늘도 '세계정치 알잘딱깔센' 시간이 왔습니다~")
       - 오늘 다룰 주제의 중요성과 MZ세대의 일상과의 연관성 언급
       - TLDR(Too Long Didn't Read) 섹션으로 핵심 내용 미리 요약
    
    3. 🧩 메인 콘텐츠 세그먼트 구성 (몇 개의 섹션으로 나누어 구성)
       - 각 세그먼트마다 명확한 소제목과 핵심 질문 제시
       - 중간에 "잠깐, 이거 알고 계셨어요?" 같은 흥미로운 코너 삽입
       - 복잡한 국제 관계는 친구 관계나 학교/회사 상황에 비유해 설명
       - 중요 인물이나 국가는 재미있는 캐릭터화 ("러시아는 완전 킹받는 찐 츤데레 포지션이죠")
       - 예민한 이슈일수록 더 재치있는 표현과 우회적 비유로 접근
    
    4. 🎭 시각적 연출 지시 (영상 제작을 위한 가이드)
       - 화면에 표시할 그래픽, 애니메이션, 밈, 짤방 등 구체적 설명
       - 예: <i>(화면에 북한과 미국 지도자들의 얼굴을 합성한 밈 이미지 표시)</i>
       - 예: <i>(화면 분할하여 왼쪽에는 과거 사진, 오른쪽에는 현재 상황 대비)</i>
       - 중요 통계나 수치는 인포그래픽으로 제안
       - 드라마틱한 장면 전환 아이디어 제시
       - 무거운 내용일수록 시각적 유머 요소를 더 강화
    
    5. 💬 시청자 참여 유도 요소
       - "댓글로 여러분의 생각을 알려주세요, 좋댓구알 부탁드립니다~"
       - 간단한 퀴즈나 투표 요소 제안
       - 다음 영상 주제에 대한 의견 물어보기
    
    6. 🏁 결론 및 마무리 (1-2분)
       - 핵심 내용 요약 및 향후 전망
       - 주제에 대한 간단한 개인적 소견 (편향되지 않게)
       - 다음 에피소드 예고 및 구독 유도
    
    ▶️ 스크립트 작성 스타일:
    1. MZ세대 표현과 밈을 자연스럽게 활용 (과하지 않게, 소통 느낌 살리기)
       - "ㄹㅇ", "ㅇㅈ", "찐", "현타", "갑분싸", "띵언", "킹받네", "핵소름" 등 적절히 사용
       - "~인 거 실화냐", "~해서 현타옴", "~가 레전드", "핵꿀잼", "스크롤 유발자" 같은 표현 활용
       - 유행어와 밈은 문맥에 맞게 사용하되 남용하지 않기
    
    2. 재치있고 유머러스한 말투 강화
       - 심각한 주제일수록 더 가볍고 위트있게, 진중한 내용도 농담처럼 풀어내기
       - 직설적으로 말하기보다 재치있는 비유와 농담으로 표현하기
       - 극단적인 표현이나 비속어는 피하되, 재치있는 표현으로 대체하기
       - 예: "이 나라들 외교 관계는 마치 학창시절 짝사랑하다가 차인 썸남썸녀 같아요 ㅋㅋㅋ"
       - 예: "이 정책은 솔직히 말해서 '겉만 번지르르한 텅장 메이크업' 수준..."
    
    3. 예민한 주제 다루는 방법
       - 직접적인 비판보다는 재치있는 비유와 엉뚱한 예시로 우회적 표현
       - 심각한 상황도 "아니 이게 실화임? 레전드 판타지 소설도 아니고 ㅋㅋ" 같은 표현으로 완화
       - 정치적으로 민감한 부분은 양쪽 모두를 살짝 놀리는 듯한 중립적 유머 활용
       - "이건 제 개인적인 생각이지만..." 같은 프레임으로 의견 전달
       - 예: 전쟁 이야기를 할 때 "아니 진짜 여기서 본격 호그와트 결전 급 상황이..."
       - 정치인/기업인 언급 시 직접적 비판 대신 비꼬는 듯한 과장된 칭찬 사용
       - 예: "우리의 훌륭하신 ㅇㅇㅇ 장관님께서는 또 어떤 신선한 아이디어를 내놓으셨을까요? 짜잔~ 이번에는..."
       - 예: "세계 최고의 경영자라 불리시는 ㅇㅇㅇ 회장님... 그런데 왜 직원들은 또 파업 중이신지?"
       - 신체적 특징이나 사생활 언급은 완전히 피하고, 정책/결정/발언에만 집중
       - 은유와 아이러니 활용: "그야말로 완벽한 경제 정책이죠... 물가만 두 배가 됐을 뿐이에요, 뭐 별거 아니죠?"
       - 문제점 지적 시 "우리의 천재적인 ㅇㅇㅇ 님께서는 이런 디테일에는 관심이 없으신가 봐요~"
    
    4. 대화체 사용 및 친근한 어조 유지
       - "~있어요", "~인데요", "~같아요" 등의 친근한 종결어미 사용
       - 시청자에게 직접 말하듯 질문하고 호응하는 스타일
       - 복잡한 내용 설명 후 "이해되셨죠? 아니라고요? 다시 한 번 설명해드릴게요~"
    
    5. 영상 내 시각 요소와 함께 활용할 멘트
       - 화면 전환, 그래픽 표시, 효과음 활용 등 시각적 요소와 함께 할 멘트 구성
       - 예: "지금 화면에 나오는 이 그래프를 보시면 이해가 쏙쏙~ 들거예요"
       - 예민한 장면에는 유머러스한 효과음이나 밈 요소 제안
    
    ▶️ 영상 구성 아이디어:
    - 인트로: 짧은 모션 그래픽과 함께 채널 로고 등장
    - 메인 진행: 프레젠터가 화면에 등장하여 진행 또는 오프스크린 내레이션
    - 그래픽 섹션: 복잡한 개념은 애니메이션과 인포그래픽으로 설명
    - 컷어웨이: 관련 뉴스 클립, 인터뷰, 현장 영상 등 삽입 아이디어
    - 하이라이트: 중요 포인트는 화면에 텍스트로 강조표시
    - 엔딩: 다음 에피소드 티저와 함께 채널 아웃트로
    - 예민한 주제: 진지한 설명 중간에 갑자기 밈이나 유머러스한 짤방 삽입 제안
    
    스크립트 형식:
    - HTML 형식으로 작성하세요.
    - 스크립트 대사는 <p> 태그로 구분하세요.
    - 화면 지시나 연출 가이드는 <i>(괄호 안에)</i>와 같이 이탤릭체로 표시하세요.
    - 중요한 키워드나 강조할 부분은 <b>굵은 글씨</b>로 표시하세요.
    - 스크립트의 섹션을 구분하는 소제목은 <h3> 태그를 사용하세요.
    - 시선을 끄는 메인 제목은 <h1> 태그로 영상 초반에 작성하세요.
    
    분량은 주제의 복잡성과 깊이에 따라 8분에서 40분 사이로 자유롭게 구성하세요. 스크립트가 길더라도 내용이 흥미롭고 몰입감 있게 작성하는 것이 중요합니다.
    `;
    
    console.log(`토픽 ${topic.id}에 대한 버전2 기사 생성 프롬프트 준비 완료`);
    
    try {
      console.log(`🤖 Gemini API 호출하여 버전2 기사 생성 중...`);
      const startTime = Date.now();
      
      // 직접 API 호출 구현
      const result = await modelContent.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      
      const endTime = Date.now();
      console.log(`🎉 버전2 기사 생성 완료 (${(endTime - startTime) / 1000}초 소요)`);
      
      // API 응답 확인
      if (!result || !result.response) {
        throw new Error('Gemini API에서 응답을 받지 못했습니다.');
      }
      
      const content = result.response.text();
      
      // 생성된 내용 유효성 검증
      if (!content || content.length < 500) {
        console.error(`❌ 생성된 버전2 기사 내용이 너무 짧습니다: ${content.length}자`);
        throw new Error('생성된 버전2 기사 내용이 충분하지 않습니다. (500자 이상 필요)');
      }
      
      console.log(`✅ 버전2 기사 내용 생성 완료 (${content.length} 자)`);
      
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
      console.error(`❌ 버전2 기사 생성 중 오류:`, apiError);
      
      // 두 번째 시도 - 더 단순한 프롬프트로 재시도
      try {
        console.log(`🤖 Gemini API 두 번째 시도...`);
        
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
            console.log(`🎉 버전2 기사 두 번째 시도 성공 (${retryContent.length} 자)`);
            
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
        console.error(`❌ 버전2 기사 두 번째 시도 실패:`, retryError);
        
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
    console.error(`❌ 버전2 기사 생성 중 오류:`, error);
    
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
    console.log(`\n=== 📝 토픽 ${topic.id} "${topic.title}" 기사 생성 워크플로우 시작 ===`);
    console.log(`📋 워크플로우 단계 1/4: 준비 및 캐시 확인`);
    
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
      
      console.log(`✓ 토픽 ${topic.id}에 대한 유효한 캐시된 기사가 있습니다 (${archiveData[today].articles[topic.id].content.length}자)`);
      archiveData[today].generatingArticles[topic.id] = false;
      return archiveData[today].articles[topic.id];
    }
    
    console.log(`📋 워크플로우 단계 2/4: 기사 작성용 키워드 생성`);
    
    // 기사 작성을 위한 키워드 생성 (Gemini가 주제에서 키워드 추출)
    const keywords = await generateSearchKeywords(topic);
    console.log(`✓ 생성된 키워드 (${keywords.length}개): ${keywords.join(', ')}`);
    
    console.log(`📋 워크플로우 단계 3/4: 키워드 기반 상세 정보 수집`);
    
    // 각 키워드에 대한 검색 결과 수집 (키워드 별로 최대 3개 결과)
    let keywordResults = [];
    const maxResultsPerKeyword = 3;
    const keywordsToUse = keywords.slice(0, 5); // 상위 5개 키워드만 사용
    
    for (const keyword of keywordsToUse) {
      console.log(`🔍 키워드 "${keyword}" 검색 중...`);
      const results = await searchBrave(keyword, {
        count: maxResultsPerKeyword,
        freshness: 'd',
        search_lang: 'en',
        country: 'US',
        safesearch: 'moderate'
      });
      
      console.log(`✓ 키워드 "${keyword}"에 대해 ${results.length}개 결과 찾음`);
      keywordResults = [...keywordResults, ...results];
      
      // API 레이트 리밋 관리
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 기존 검색 결과에 키워드 검색 결과 병합 (중복 제거)
    let relatedResults = [];
    
    // 기존 검색 결과에서 관련된 결과 추출 (제목이나 설명에 주제 관련 키워드가 포함된 경우)
    const topicKeywords = topic.title.toLowerCase().split(/\s+/);
    const initialResults = searchResults && searchResults.length > 0 ?
      searchResults
        .filter(result => {
          const titleLower = (result.title || '').toLowerCase();
          const descLower = (result.description || '').toLowerCase();
          // 제목이나 설명에 주제의 키워드가 하나라도 포함되는지 확인
          return topicKeywords.some(keyword => 
            titleLower.includes(keyword) || descLower.includes(keyword));
        })
        .slice(0, 10) :
      [];
    
    console.log(`✓ 기존 검색 결과에서 주제 관련 결과 ${initialResults.length}개 추출`);
    
    // 모든 결과 병합 (키워드 결과 우선)
    const allRelatedResults = [...keywordResults, ...initialResults];
    
    // 중복 제거 (URL 기준)
    relatedResults = Array.from(new Set(allRelatedResults.map(r => r.url)))
      .map(url => allRelatedResults.find(r => r.url === url))
      .filter(result => result.title && result.description); // 유효한 결과만 사용
    
    console.log(`✓ 총 ${relatedResults.length}개의 고유한 관련 자료 수집됨 (키워드 검색: ${keywordResults.length}개, 기존 결과: ${initialResults.length}개)`);
    
    // 최대 20개 결과만 사용
    relatedResults = relatedResults.slice(0, 20);
    
    console.log(`📋 워크플로우 단계 4/4: 기사 콘텐츠 생성`);
    
    // 기사 생성 프롬프트
    const prompt = `
    당신은 국제 정치 전문 저널리스트입니다. 다음 주제에 대한 심층 분석 기사를 작성해주세요:
    
    주제: ${topicInfo.title}
    요약: ${topicInfo.summary}
    날짜: ${topicInfo.date}
    
    다음 검색 결과를 참고하여 관련성 높은 정보를 포함해 기사를 작성하세요:
    ${JSON.stringify(relatedResults.slice(0, 10))}
    
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
    
    console.log(`✓ 기사 생성 프롬프트 준비 완료 (${prompt.length}자)`);
    
    try {
      console.log(`🤖 Gemini API 호출하여 기사 생성 중...`);
      const startTime = Date.now();
      
      // 직접 API 호출
      const result = await modelContent.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      
      const endTime = Date.now();
      console.log(`✓ Gemini API 응답 완료 (${((endTime - startTime) / 1000).toFixed(1)}초 소요)`);
      
      // API 응답 확인
      if (!result || !result.response) {
        throw new Error('Gemini API에서 응답을 받지 못했습니다.');
      }
      
      const content = result.response.text();
      
      // 생성된 내용 유효성 검증
      if (!content || content.length < 500) {
        console.error(`❌ 생성된 기사 내용이 너무 짧습니다: ${content.length}자`);
        throw new Error('생성된 기사 내용이 충분하지 않습니다. (500자 이상 필요)');
      }
      
      console.log(`✅ 기사 내용 생성 완료 (${content.length}자)`);
      
      // 관련 뉴스 선택 (추가 가공)
      const relatedNews = relatedResults.map(result => {
        return {
          title: result.title || '제목 없음',
          source: result.domain || result.source || '출처 미상',
          time: result.published_date || result.page_age || '날짜 불명',
          url: result.url || ''
        };
      });
      
      // 기사 데이터 구성
      const articleData = {
        title: topic.title,
        content: content,
        relatedNews: relatedNews,
        generatedAt: new Date().toISOString(),
        completed: true,
        keywordsUsed: keywordsToUse,
        searchResultsCount: relatedResults.length
      };
      
      // 아카이브에 기사 저장
      if (archiveData[today]) {
        archiveData[today].articles[topic.id] = articleData;
        archiveData[today].generatingArticles[topic.id] = false;
        // 아카이브 데이터 저장
        saveArchiveData();
      }
      
      console.log(`=== 토픽 ${topic.id} "${topic.title}" 기사 생성 워크플로우 완료 ===\n`);
      return articleData;
    } catch (apiError) {
      console.error(`❌ Gemini API 호출 중 오류:`, apiError);
      
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
        relatedNews: relatedResults.map(result => ({
          title: result.title || '제목 없음',
          source: result.domain || '출처 미상',
          time: result.published_date || '날짜 불명',
          url: result.url || ''
        })),
        generatedAt: new Date().toISOString(),
        completed: true,
        isErrorFallback: true,
        error: apiError.message,
        keywordsUsed: keywordsToUse
      };
      
      // 아카이브에 기본 기사 저장
      if (archiveData[today]) {
        archiveData[today].articles[topic.id] = fallbackData;
        archiveData[today].generatingArticles[topic.id] = false;
        // 아카이브 데이터 저장
        saveArchiveData();
      }
      
      console.log(`⚠️ 토픽 ${topic.id} "${topic.title}" 기사 생성 워크플로우 완료 (오류 발생)\n`);
      return fallbackData;
    }
  } catch (error) {
    console.error(`❌ 토픽 ${topic.id} 처리 중 오류:`, error);
    
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
    
    console.log(`❌ 토픽 ${topic.id} "${topic.title}" 기사 생성 워크플로우 실패\n`);
    return {
      title: topic.title,
      content: errorContent,
      relatedNews: [],
      generatedAt: new Date().toISOString(),
      completed: true,
      isError: true,
      error: error.message
    };
  }
}

// 유튜브 스크립트 생성 함수
async function generateYoutubeScriptForTopic(topic, searchResults) {
  try {
    console.log(`\n=== 🎬 토픽 ${topic.id} "${topic.title}" 유튜브 스크립트 생성 워크플로우 시작 ===`);
    
    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];
    
    // youtubeScripts 초기화 및 진행도 설정
    if (!archiveData[today]) {
      archiveData[today] = { 
        topics: [], 
        articles: {}, 
        youtubeScripts: {} 
      };
    }
    
    if (!archiveData[today].youtubeScripts) {
      archiveData[today].youtubeScripts = {};
    }
    
    // 진행 상태 초기화 (0% - 시작)
    archiveData[today].youtubeScripts[topic.id] = {
      title: `${topic.title} - 유튜브 스크립트`,
      progress: 0,
      status: "준비 중",
      completed: false,
      generatedAt: new Date().toISOString()
    };
    
    // 아카이브 저장
    saveArchiveData();
    
    console.log(`📋 워크플로우 단계 1/4: 준비 및 캐시 확인`);
    
    // 요약 정보 준비
    const topicInfo = {
      title: topic.title,
      summary: topic.summary,
      date: topic.dateOccurred || new Date().toISOString().split('T')[0]
    };
    
    // 캐시된 유튜브 스크립트 확인
    if (archiveData[today].youtubeScripts && 
        archiveData[today].youtubeScripts[topic.id] && 
        archiveData[today].youtubeScripts[topic.id].content && 
        archiveData[today].youtubeScripts[topic.id].content.length > 500) {
      
      console.log(`✓ 토픽 ${topic.id}에 대한 유효한 캐시된 유튜브 스크립트가 있습니다 (${archiveData[today].youtubeScripts[topic.id].content.length}자)`);
      
      // 완료 상태로 표시
      archiveData[today].youtubeScripts[topic.id].progress = 100;
      archiveData[today].youtubeScripts[topic.id].status = "완료";
      archiveData[today].youtubeScripts[topic.id].completed = true;
      saveArchiveData();
      
      return archiveData[today].youtubeScripts[topic.id];
    }
    
    // 진행도 업데이트 (10% - 유튜브 키워드 생성 시작)
    archiveData[today].youtubeScripts[topic.id].progress = 10;
    archiveData[today].youtubeScripts[topic.id].status = "키워드 생성 중";
    saveArchiveData();
    
    console.log(`📋 워크플로우 단계 2/4: 유튜브 스크립트용 키워드 생성`);
    
    // 유튜브 콘텐츠에 특화된 키워드 생성
    const youtubeKeywordPrompt = `
${topic.title}(${topic.date}) 주제에 대한 흥미롭고 재미있는 유튜브 콘텐츠 제작을 위해, 검색할 키워드나 구문 10개를 생성해주세요. 
이 키워드들은 주제와 관련된 흥미로운 정보, 놀라운 사실, 다양한 관점을 찾는 데 사용될 것입니다.

주제 요약: ${topic.summary}

시청자들이 집중해서 볼만한 콘텐츠를 위해 다음과 같은 요소들을 포함할 키워드를 생성해주세요:
1. 동영상 콘텐츠로 제작했을 때 시각적으로 강렬하거나 호기심을 자극할 수 있는 요소
2. 누구나 모르는 숨겨진 사실이나 놀라울만한 정보들
3. 실제 사람들의 경험담이나 인터뷰, 증언 같은 휴먼 요소
4. 정보를 더 효과적으로 전달할 수 있는 도표, 그래프, 통계, 데이터
5. 주제에 대한 다양한 관점과 논쟁점
6. 역사적 맥락이나 과거 사례와의 비교
7. 주제의 미래 전망이나 영향
8. 전문가 견해나 분석, 인터뷰 내용
9. 문화적, 사회적 맥락과 영향
10. 일상생활에 비유할 수 있는 요소나 쉽게 이해할 수 있는 설명

키워드를 만들 때 다음 기준을 고려하세요:
- 해당 주제의 실질적인 콘텐츠 제작에 도움이 될 구체적인 키워드
- 검색 시 유용한 정보를 얻을 수 있는 키워드 (일반적이거나 광범위한 키워드는 피하기)
- 시청자의 호기심을 자극하고 클릭하고 싶게 만드는 키워드
- "숨겨진", "충격적인", "알려지지 않은", "놀라운" 등의 요소가 포함된 키워드

출력 형식:
아래와 같이 정확히 10개의 키워드를 JSON 배열 형식으로 반환해주세요. 각 키워드는 큰따옴표로 묶인 문자열이어야 합니다.

[
  "키워드1",
  "키워드2",
  "키워드3",
  ...
]

예시 출력:
[
  "신기후체제 충격적 통계",
  "기후변화 역사적 합의 전례",
  "파리협정 찬반 논쟁",
  "기후변화 피해 주민 이야기",
  "기후협약 숨겨진 조항",
  "기후변화 밈 소셜미디어 반응",
  "온실가스 배출량 놀라운 수치",
  "신기후체제 향후 10년 전망",
  "기후과학자 파리협정 평가",
  "기후변화를 설명하는 일상적 비유"
]
    `;
    
    let youtubeKeywords = [];
    try {
      // Gemini API 호출
      const keywordResult = await modelKeywords.generateContent({
        contents: [{ role: "user", parts: [{ text: youtubeKeywordPrompt }] }]
      });
      
      const keywordResponse = keywordResult.response;
      
      // 응답 파싱
      try {
        // JSON 형식으로 추출 시도
        const text = keywordResponse.text().trim();
        const jsonMatch = text.match(/\[.*\]/s);
        
      if (jsonMatch) {
          youtubeKeywords = JSON.parse(jsonMatch[0]);
      } else {
          // 단순 줄 기반 파싱 (대체 방법)
          youtubeKeywords = text.split('\n')
            .map(line => line.replace(/^[0-9]+\.\s*"|"$|^"|^-\s+|^\*\s+/g, '').trim())
            .filter(line => line.length > 0)
            .slice(0, 5);
        }
        
        console.log(`✓ 유튜브 콘텐츠용 키워드 (${youtubeKeywords.length}개): ${youtubeKeywords.join(', ')}`);
      } catch (parseError) {
        console.error(`⚠️ 유튜브 키워드 파싱 오류:`, parseError);
        youtubeKeywords = [
          `${topic.title} expert analysis`,
          `${topic.title} explained`,
          `${topic.title} recent developments visual`,
          `${topic.title} interview experts`,
          `${topic.title} international impact`
        ];
        console.log(`✓ 기본 유튜브 키워드 사용: ${youtubeKeywords.join(', ')}`);
      }
    } catch (keywordError) {
      console.error(`⚠️ 유튜브 키워드 생성 오류:`, keywordError);
      youtubeKeywords = [
        `${topic.title} expert analysis`,
        `${topic.title} explained`,
        `${topic.title} recent developments visual`,
        `${topic.title} interview experts`,
        `${topic.title} international impact`
      ];
      console.log(`✓ 기본 유튜브 키워드 사용: ${youtubeKeywords.join(', ')}`);
    }
    
    // 진행도 업데이트 (25% - 관련 정보 수집 시작)
    archiveData[today].youtubeScripts[topic.id].progress = 25;
    archiveData[today].youtubeScripts[topic.id].status = "관련 정보 수집 중";
    saveArchiveData();
    
    console.log(`📋 워크플로우 단계 3/4: 키워드 기반 상세 정보 수집`);
    
    // 각 키워드에 대한 검색 결과 수집 (키워드 별로 최대 3개 결과)
    let keywordResults = [];
    const maxResultsPerKeyword = 3;
    
    for (const keyword of youtubeKeywords) {
      console.log(`🔍 키워드 "${keyword}" 검색 중...`);
      const results = await searchBrave(keyword, {
        count: maxResultsPerKeyword,
        freshness: 'd',
        search_lang: 'en',
        country: 'US',
        safesearch: 'moderate'
      });
      
      console.log(`✓ 키워드 "${keyword}"에 대해 ${results.length}개 결과 찾음`);
      keywordResults = [...keywordResults, ...results];
      
      // API 레이트 리밋 관리
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 기존 검색 결과에 키워드 검색 결과 병합 (중복 제거)
    let relatedResults = [];
    
    // 기존 검색 결과에서 관련된 결과 추출 (제목이나 설명에 주제 관련 키워드가 포함된 경우)
    const topicKeywords = topic.title.toLowerCase().split(/\s+/);
    const initialResults = searchResults && searchResults.length > 0 ?
      searchResults
        .filter(result => {
          const titleLower = (result.title || '').toLowerCase();
          const descLower = (result.description || '').toLowerCase();
          // 제목이나 설명에 주제의 키워드가 하나라도 포함되는지 확인
          return topicKeywords.some(keyword => 
            titleLower.includes(keyword) || descLower.includes(keyword));
        })
        .slice(0, 8) :
      [];
    
    console.log(`✓ 기존 검색 결과에서 주제 관련 결과 ${initialResults.length}개 추출`);
    
    // 모든 결과 병합 (키워드 결과 우선)
    const allRelatedResults = [...keywordResults, ...initialResults];
    
    // 중복 제거 (URL 기준)
    relatedResults = Array.from(new Set(allRelatedResults.map(r => r.url)))
      .map(url => allRelatedResults.find(r => r.url === url))
      .filter(result => result.title && result.description); // 유효한 결과만 사용
    
    console.log(`✓ 총 ${relatedResults.length}개의 고유한 관련 자료 수집됨 (키워드 검색: ${keywordResults.length}개, 기존 결과: ${initialResults.length}개)`);
    
    // 최대 30개 결과만 사용 (프롬프트에는 20개만 포함됨)
    relatedResults = relatedResults.slice(0, 30);
    
    // 진행도 업데이트 (50% - 스크립트 생성 시작)
    archiveData[today].youtubeScripts[topic.id].progress = 50;
    archiveData[today].youtubeScripts[topic.id].status = "스크립트 생성 준비 중";
    saveArchiveData();
    
    console.log(`📋 워크플로우 단계 4/4: 유튜브 스크립트 생성`);
    
    // 유튜브 스크립트 생성 프롬프트
    const prompt = `
당신은 인기 있는 유튜브 뉴스/정치 콘텐츠 채널의 크리에이티브 디렉터이자 스크립트 작가입니다. 다음 주제에 대한 10-20분 분량의 유튜브 영상용 스크립트를 작성해주세요:

주제: ${topicInfo.title}
요약: ${topicInfo.summary}
날짜: ${topicInfo.date}

다음 검색 결과를 참고하여 관련성 높고 흥미로운 정보를 포함해 스크립트를 작성하세요:
${JSON.stringify(relatedResults.slice(0, 40))}

▶️ 콘텐츠 기획 방향:
1. 복잡한 뉴스, 정치, 국제 이슈를 쉽고 재미있게 설명하는 유튜브 콘텐츠
2. 정확한 정보 전달이 기본이되, 유머와 재미를 통해 시청자가 끝까지 볼 수 있도록 구성
3. 일상 속 비유와 농담을 활용해 어려운 개념도 명확하게 설명
4. 호기심을 자극하는 방식으로 시청자를 끌어들이는 스토리텔링 구조
5. 교양 콘텐츠지만 엔터테인먼트적 요소도 충분히 가미
6. 약간의 능구렁이 같은 스타일과 말투를 가미해 시청자의 호기심을 자극

**흥미로운 콘텐츠 필수 요소:**
1. '이게 진짜라고?'와 같은 놀라운 사실이나 통계를 각 세그먼트마다 최소 1-2개 포함하세요
2. 재미있는 역사적 에피소드나 배경 이야기를 포함하여 주제에 깊이를 더하세요
3. 비공식적으로 알려진 뒷이야기나 숨겨진 동기를 언급하면 좋습니다
4. 주요 인물이나 조직에 관한 흥미로운 일화나 특징을 포함하세요
5. 복잡한 개념을 일상적인 비유로 설명하세요 (예: 복잡한 경제 이론을 '피자 나눠먹기'로 비유)
6. 시청자들이 공감할 수 있는 사회적, 문화적 레퍼런스나 유행을 언급하세요
7. 간간히 재미있는 농담이나 위트 있는 멘트를 넣어주세요
8. 예상치 못한 반전이나 흥미로운 연결고리를 보여주세요
9. "이건 제가 알려드리는 비밀인데요..." 같은 능구렁이 스타일의 표현으로 시청자를 끌어들이세요
10. 미스터리를 조성하는 "대체 이런 상황이 왜 벌어진 걸까요?", "그런데 말이죠, 이 뒤에는..." 같은 표현을 활용하세요

▶️ 스크립트 구성 요소:
1. 🔥 시선을 확 끄는 인트로 (5-15초)
   - 충격적인 통계나 놀라운 사실로 시작 ("이게 실화냐?", "믿기 힘든 사실 하나 알려드립니다")
   - 오늘 주제에 대한 짧고 강렬한 소개
   - "이 사실, 아무도 모르는 건데 오직 저희 채널에서만 알려드립니다" 같은 은밀한 느낌의 문구 추가

2. 🎬 오프닝 인사 및 주제 소개 (30초-1분)
   - 캐주얼하고 친근한 인사 ("안녕하세요 여러분, 오늘도 '세계정치 한입에 이해하기' 시간이 돌아왔습니다~")
   - 오늘 다룰 주제의 중요성과 시청자의 일상과의 연관성 언급
   - TLDR(Too Long Didn't Read) 섹션으로 핵심 내용 미리 요약
   - "이 영상만 보면 다른 사람들은 모르는 걸 여러분만 알게 될 거예요" 같은 능구렁이 스타일 문구 추가

3. 🧩 메인 콘텐츠 세그먼트 구성 (여러 파트로 나누어 구성)
   - 각 세그먼트마다 명확한 소제목과 흥미로운 질문 제시
   - 중간에 "잠깐, 이거 알고 계셨어요?" 같은 흥미로운 코너 삽입
   - 복잡한 국제 관계는 친구 관계나 일상 상황에 비유해 설명
   - 핵심 인물이나 조직을 재밌게 캐릭터화 ("러시아는 무대 뒤에서 항상 관찰만 하는 스타일이죠")
   - 예민한 이슈일수록 더 재치있는 표현과 균형있는 시각으로 접근
   - "여기서 아무도 모르는 비하인드 스토리가 있는데요..." 같은 표현으로 호기심 자극
   - "그런데 말입니다~ 사실은 말이죠~" 같은 능구렁이 스타일 전환구 활용

4. 🎭 시각적 연출 지시 (영상 제작 가이드)
   - 화면에 표시할 그래픽, 애니메이션, 밈, 짤방 등 구체적 설명
   - 핵심 통계나 수치는 인포그래픽으로 표현
   - 드라마틱한 장면 전환 아이디어 제시
   - 무거운 내용일수록 시각적 유머 요소를 더 강화
   - 화면을 어둡게 하고 은밀하게 속삭이는 듯한 능구렁이 모먼트 연출 지시 포함

5. 💬 시청자 참여 유도 요소
   - "댓글로 여러분의 생각을 알려주세요, 좋댓구알 부탁드립니다~"
   - 시청자들이 답하고 싶은 재미있는 질문 제안
   - 다음 영상 주제에 대한 의견 물어보기
   - "이 비밀, 댓글에 남겨주시면 다음 영상에서 더 자세히 파헤쳐볼게요" 같은 호기심 자극 멘트

6. 🏁 결론 및 마무리 (1-2분)
   - 핵심 내용 유머러스하게 요약
   - 주제에 대한 가볍지만 의미있는 마무리 의견
   - 다음 에피소드 예고 및 구독 유도
   - "다음 영상에서는 더 놀라운 비밀을 공개할 예정이니 꼭 알림 설정하세요~" 같은 마무리 멘트 추가

**흥미로운 콘텐츠 만들기 위한 지침:**
1. 오늘 주제에 관해 시청자가 친구에게 "야, 이거 알아?" 하고 말하고 싶은 정보를 최소 5개 이상 포함하세요
2. 너무 딱딱하거나 형식적인 말투는 피하고, 대화하듯 편안한 말투를 유지하세요
3. 농담이나 재치있는 표현을 적절히 섞되, 핵심 정보 전달은 정확하게 하세요
4. 비유와 예시는 현대적이고 시청자가 공감할 수 있는 것으로 선택하세요
5. 중요한 정보 앞뒤로 흥미로운 요소를 배치해 집중력을 유지하세요
6. 전문 용어가 필요한 경우, 반드시 쉬운 설명이나 재미있는 비유를 함께 사용하세요
7. 드라마틱한 표현이나 호기심을 자극하는 문구를 적절히 사용하세요
   (예: "그런데 여기서 반전이...", "사실 아무도 모르는 이야기가 있는데요...")
8. "이게 바로 제가 아는 사실인데..."처럼 마치 내부자 정보를 알려주는 듯한 능구렁이 느낌을 주세요
9. "이 사건의 진짜 의도는..." 같은 문구로 음모론적 호기심을 자극하되, 정확한 사실에 기반한 내용만 전달하세요

▶️ 스크립트 작성 스타일:
1. 친근하고 대화하는 듯한 말투 사용
   - "~있어요", "~인데요", "~같아요" 등의 친근한 종결어미 사용
   - 가끔 "~아시겠어요?", "~놀랍지 않나요?" 같은 질문 형태로 시청자와 소통
   - "저도 처음 알았을 때 정말 놀랐어요"와 같은 개인적 반응 포함
   - "이런 사실, 다른 곳에서는 알려죠~" 같은 능구렁이 스타일 문구 추가

2. 유머와 위트 있는 표현 활용
   - 중간중간 적절한 농담 섞기
   - "이게 바로 국제 정치의 맛!" 같은 재미있는 표현 사용
   - 자기 패러디나 가벼운 말장난 포함
   - 예: "이 경제 위기는 마치 월급 탕진 후 카드값 청구서를 받은 느낌이랄까요..."
   - "이런 얘기 다른 사람한테는 못해요~" 같은 능구렁이 스타일 유머 추가

3. 시각적 요소와 함께 할 멘트
   - "화면을 보시면 아시겠지만..." 같은 표현으로 시각 자료 안내
   - 인포그래픽에 재미있는 설명 추가하기
   - 예: "이 그래프에서 볼 수 있듯이 수치가 급상승했는데요, 마치 롤러코스터 타는 기분이랄까요?"
   - "이 장면, 특별히 여러분만 보여드리는 거예요~" 같은 시청자와의 공모 느낌을 주는 표현 활용

**스크립트 포맷 규칙:**
1. 모든 나레이션과 화면 지시는 반드시 별도 줄에 작성할 것
2. 나레이션은 "나레이션: " 형식으로 시작하고 일반 텍스트로 작성
3. 화면 지시는 각각 별도 줄에 "<화면: 지시내용>" 형식으로 작성
4. 모션그래픽 요소는 "<모션그래픽: 설명>" 형식으로 작성
5. 인포그래픽 요소는 "<인포그래픽: 설명>" 형식으로 작성
6. 효과음이나 배경음악은 "<효과음: 설명>" 또는 "<음악: 설명>" 형식으로 작성
7. 장면 전환은 "<전환: 설명>" 형식으로 작성
8. 자막 지시는 "<자막: 내용>" 형식으로 작성

예시 포맷:
'''
<화면: 극적인 뉴스 헤드라인 모음>
<음악: 경쾌한 배경음악>
나레이션: 안녕하세요 여러분! 오늘은 정말 믿기 힘든 이야기로 시작해보려고 합니다. 여러분, 혹시 세계 경제의 30%가 단 다섯 개 기업에 의해 좌우된다는 사실, 알고 계셨나요?
<인포그래픽: 세계 경제에서 빅테크 기업이 차지하는 비율 시각화>
<효과음: 놀라는 효과음>
나레이션: 네, 진짜입니다. 이게 바로 오늘 우리가 파헤쳐볼 '빅테크와 국제 정치의 숨겨진 관계'인데요. 준비되셨나요? 시작합니다!
<전환: 화려한 로고 인트로>
'''

스크립트 형식:
- HTML 형식으로 작성하세요.
- 스크립트 대사는 <p> 태그로 구분하세요.
- 화면 지시나 연출 가이드는 <i>(괄호 안에)</i>와 같이 이탤릭체로 표시하세요.
- 중요한 키워드나 강조할 부분은 <b>굵은 글씨</b>로 표시하세요.
- 스크립트의 섹션을 구분하는 소제목은 <h3> 태그를 사용하세요.
- 시선을 끄는 메인 제목은 <h1> 태그로 영상 초반에 작성하세요.

분량은 주제의 복잡성과 깊이에 따라 10분에서 20분 사이로 구성하세요. 스크립트는 재미있고 흥미로우면서도 정보가 정확한 "쉽게 이해되는 교양 콘텐츠"가 되도록 작성해 주세요.
    `;
    
    // 진행도 업데이트 (75% - 스크립트 생성 중)
    archiveData[today].youtubeScripts[topic.id].progress = 75;
    archiveData[today].youtubeScripts[topic.id].status = "스크립트 생성 중";
    saveArchiveData();
    
    console.log(`유튜브 스크립트 생성 프롬프트 준비 완료`);
    
    try {
      console.log(`🤖 Gemini API 호출하여 유튜브 스크립트 생성 중...`);
      const startTime = Date.now();
      
      // 직접 API 호출
      const result = await modelContent.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      
      const endTime = Date.now();
      console.log(`🎉 유튜브 스크립트 생성 완료 (${(endTime - startTime) / 1000}초 소요)`);
      
      // API 응답 확인
      if (!result || !result.response) {
        throw new Error('Gemini API에서 응답을 받지 못했습니다.');
      }
      
      const content = result.response.text();
      
      // 생성된 내용 유효성 검증
      if (!content || content.length < 500) {
        console.error(`❌ 생성된 스크립트 내용이 너무 짧습니다: ${content.length}자`);
        throw new Error('생성된 스크립트 내용이 충분하지 않습니다. (500자 이상 필요)');
      }
      
      console.log(`✅ 유튜브 스크립트 생성 완료 (${content.length}자)`);
      
      // HTML 형식화
      const formattedContent = `
        <div class="youtube-script">
          <h1>${topic.title} - 유튜브 스크립트</h1>
          <div class="script-content">
            ${content.replace(/\[([^\]]+)\]/g, '<span class="visual-cue">[$1]</span>')}
          </div>
          <div class="script-footer">
            <p class="script-note">이 스크립트는 약 8-15분 분량의 유튜브 영상용으로 작성되었습니다.</p>
            <p class="generation-date">생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      `;
      
      // 관련 뉴스 선택
      const relatedNews = relatedResults.map(result => {
        return {
          title: result.title || '제목 없음',
          source: result.domain || result.source || '출처 미상',
          time: result.published_date || result.page_age || '날짜 불명',
          url: result.url || ''
        };
      });
      
      // 진행도 업데이트 (95% - 스크립트 가공 중)
      archiveData[today].youtubeScripts[topic.id].progress = 95;
      archiveData[today].youtubeScripts[topic.id].status = "스크립트 가공 중";
      saveArchiveData();
      
      // 스크립트 데이터 구성
      const scriptData = {
        title: `${topic.title} - 유튜브 스크립트`,
        content: formattedContent,
        rawScript: content,
        relatedNews: relatedNews,
        generatedAt: new Date().toISOString(),
        completed: true,
        progress: 100,
        status: "완료",
        keywordsUsed: youtubeKeywords,
        searchResultsCount: relatedResults.length
      };
      
      // 아카이브에 스크립트 저장
      if (archiveData[today]) {
        archiveData[today].youtubeScripts[topic.id] = scriptData;
        // 아카이브 데이터 저장
        saveArchiveData();
      }
      
      console.log(`=== 토픽 ${topic.id} "${topic.title}" 유튜브 스크립트 생성 워크플로우 완료 ===\n`);
      return scriptData;
    } catch (apiError) {
      console.error(`❌ Gemini API 호출 중 오류:`, apiError);
      
      // 진행도 업데이트 (오류 상태)
      archiveData[today].youtubeScripts[topic.id].progress = 0;
      archiveData[today].youtubeScripts[topic.id].status = "오류 발생";
      archiveData[today].youtubeScripts[topic.id].error = apiError.message;
      saveArchiveData();
      
      // 기본 내용 생성
      const defaultContent = `
        <div class="youtube-script error">
          <h1>${topic.title} - 유튜브 스크립트</h1>
          <div class="script-content">
            <p>이 주제에 대한 유튜브 스크립트를 생성하는 중 오류가 발생했습니다.</p>
            <p>오류 상세 내용: ${apiError.message || '알 수 없는 오류'}</p>
            <p>다시 시도해주세요.</p>
          </div>
        </div>
      `;
      
      // 기본 스크립트 데이터 구성
      const fallbackData = {
        title: `${topic.title} - 유튜브 스크립트`,
        content: defaultContent,
        relatedNews: relatedResults.map(result => ({
          title: result.title || '제목 없음',
          source: result.domain || '출처 미상',
          time: result.published_date || '날짜 불명',
          url: result.url || ''
        })),
        generatedAt: new Date().toISOString(),
        completed: true,
        progress: 0,
        status: "오류 발생",
        isErrorFallback: true,
        error: apiError.message,
        keywordsUsed: youtubeKeywords
      };
      
      // 아카이브에 기본 스크립트 저장
      if (archiveData[today]) {
        archiveData[today].youtubeScripts[topic.id] = fallbackData;
        // 아카이브 데이터 저장
        saveArchiveData();
      }
      
      console.log(`⚠️ 토픽 ${topic.id} "${topic.title}" 유튜브 스크립트 생성 워크플로우 완료 (오류 발생)\n`);
      return fallbackData;
      }
    } catch (error) {
    console.error(`❌ 토픽 ${topic.id} 유튜브 스크립트 처리 중 오류:`, error);
    
    // 진행도 업데이트 (오류 상태)
    if (archiveData[today] && archiveData[today].youtubeScripts && archiveData[today].youtubeScripts[topic.id]) {
      archiveData[today].youtubeScripts[topic.id].progress = 0;
      archiveData[today].youtubeScripts[topic.id].status = "오류 발생";
      archiveData[today].youtubeScripts[topic.id].error = error.message;
      saveArchiveData();
    }
    
    const errorContent = `
      <div class="youtube-script error">
        <h1>${topic.title} - 유튜브 스크립트</h1>
        <p>이 주제에 대한 유튜브 스크립트를 생성하는 중 오류가 발생했습니다: ${error.message}</p>
        <p>문제가 지속되면 관리자에게 문의하세요.</p>
      </div>
    `;
    
    console.log(`❌ 토픽 ${topic.id} "${topic.title}" 유튜브 스크립트 생성 워크플로우 실패\n`);
    return {
      title: `${topic.title} - 유튜브 스크립트`,
      content: errorContent,
      relatedNews: [],
      generatedAt: new Date().toISOString(),
      completed: true,
      progress: 0,
      status: "오류 발생",
      isError: true,
      error: error.message
    };
  }
}

// 유튜브 스크립트 생성 API 엔드포인트
app.post('/api/generate-article-youtube', async (req, res) => {
  try {
    console.log('🎬 유튜브 스크립트 API 요청 수신:', req.body.topic?.id);
    const { topic, searchResults } = req.body;
    
    if (!topic || !topic.id || !topic.title) {
      return res.status(400).json({ error: '유효한 토픽 정보가 필요합니다.' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // 캐시된 스크립트 확인 - youtubeScripts 경로 확인
    if (archiveData[today] && 
        archiveData[today].youtubeScripts && 
        archiveData[today].youtubeScripts[topic.id] &&
        archiveData[today].youtubeScripts[topic.id].completed) {
      
      console.log(`토픽 ID ${topic.id}에 대한 캐시된 유튜브 스크립트 반환`);
      return res.json(archiveData[today].youtubeScripts[topic.id]);
    }
    
    // 아직 생성 중임을 알리는 응답
    res.status(202).json({
      title: `${topic.title} - 유튜브 스크립트`,
      content: `<div class="text-center py-12">
        <p class="text-xl mb-4">유튜브 스크립트를 생성하고 있습니다...</p>
        <div class="spinner h-12 w-12 mx-auto border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-500">첫 생성에는 30초~1분 정도 소요될 수 있습니다.</p>
      </div>`,
      generatingInProgress: true,
      topicId: topic.id
    });
    
    // 백그라운드에서 스크립트 생성
    (async () => {
      try {
        console.log(`🎬 토픽 ${topic.id} "${topic.title}"의 유튜브 스크립트 생성 시작...`);
        
        // 스크립트 생성
        const script = await generateYoutubeScriptForTopic(topic, searchResults);
        
        // youtubeScripts 객체가 없다면 초기화
        if (!archiveData[today]) {
          archiveData[today] = { topics: [], articles: {}, youtubeScripts: {} };
        }
        if (!archiveData[today].youtubeScripts) {
          archiveData[today].youtubeScripts = {};
        }
        
        // 스크립트 저장 - 명확하게 youtubeScripts에만 저장
        archiveData[today].youtubeScripts[topic.id] = {
          ...script,
          completed: true
        };
        
        // 아카이브 저장
        saveArchiveData();
        
        console.log(`✅ 토픽 ${topic.id}의 유튜브 스크립트 생성 및 저장 완료`);
      } catch (error) {
        console.error(`❌ 백그라운드 스크립트 생성 중 오류:`, error);
        
        // 오류 발생 시에도 상태 업데이트
        if (archiveData[today] && archiveData[today].youtubeScripts) {
          archiveData[today].youtubeScripts[topic.id] = {
            title: `${topic.title} - 유튜브 스크립트`,
            content: `<div class="p-4 border border-red-200 bg-red-50 rounded">
              <h3 class="text-lg font-semibold text-red-700">오류 발생</h3>
              <p>유튜브 스크립트 생성 중 문제가 발생했습니다: ${error.message}</p>
            </div>`,
            error: error.message,
            completed: true,
            hasError: true
          };
          saveArchiveData();
        }
      }
    })();
  } catch (error) {
    console.error('❌ 유튜브 스크립트 API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      message: error.message 
    });
  }
});

// 주제 분석 및 생성 로직에서 토픽 수 제한
async function analyzeAndGenerateTopics(searchResults) {
  const topicsCache = {};
  const resultsToUse = searchResults || [];
  
  console.log(`\n=== 🧠 주제 선정 워크플로우 시작 ===`);
  console.log(`📊 입력 데이터: 총 ${resultsToUse.length}개 뉴스 아이템`);
  
  // RSS 피드 결과 비율 계산
  const rssResults = resultsToUse.filter(item => item.is_from_rss);
  const rssRatio = resultsToUse.length > 0 ? (rssResults.length / resultsToUse.length) * 100 : 0;
  console.log(`📊 RSS 피드 비율: ${rssRatio.toFixed(2)}% (${rssResults.length}/${resultsToUse.length})`);
  
  try {
    // Gemini API를 통해 주제 생성
    console.log(`🤖 Gemini API를 사용하여 주제 생성 시작...`);
    const topics = await generateTopicsFromResults(resultsToUse);
    
    // 주제 개수를 10개로 제한
    const finalTopics = topics.slice(0, 10);
    console.log(`✅ 생성된 주제 ${topics.length}개 중 ${finalTopics.length}개로 제한했습니다`);
    
    // 최종 응답 구성
    console.log(`=== 주제 선정 워크플로우 완료 ===\n`);
    return {
      topics: finalTopics,
      searchResults: resultsToUse,
      rssRatio: rssRatio
    };
  } catch (error) {
    console.error('❌ 주제 생성 중 오류:', error);
    
    // 오류 발생 시 기본 주제 반환
    const defaultTopics = generateDefaultTopics().slice(0, 10);
    console.log(`⚠️ 오류로 인해 기본 주제 ${defaultTopics.length}개를 사용합니다`);
    
    console.log(`=== 주제 선정 워크플로우 완료 (오류 발생) ===\n`);
    return {
      topics: defaultTopics,
      searchResults: resultsToUse,
      rssRatio: rssRatio,
      error: error.message
    };
  }
}

// Gemini 모델을 사용한 주제 생성 및 추출 함수
async function generateTopicsFromResults(searchResults) {
  try {
    console.log(`🤖 Gemini API 호출하여 주제 생성 중...`);
    
    // RSS 결과와 Brave 결과 구분
    const rssResults = searchResults.filter(item => item.is_from_rss);
    const braveResults = searchResults.filter(item => !item.is_from_rss).slice(0, 10);
    
    console.log(`📊 주제 생성에 사용할 데이터: RSS 결과 ${rssResults.length}개, Brave 결과 ${braveResults.length}개`);
    
    // RSS 결과 우선 배치 (제한 제거)
    const combinedResults = [...rssResults, ...braveResults];
    
    // 결과를 카테고리별로 그룹화 (RSS 결과에만 해당)
    const categoryGroups = {};
    rssResults.forEach(item => {
      const category = item.category || 'general';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(item);
    });
    
    console.log(`📊 RSS 카테고리 분포: ${Object.keys(categoryGroups).map(cat => `${cat}(${categoryGroups[cat].length})`).join(', ')}`);
    
    // 객체를 JSON으로 안전하게 변환하는 함수
    function safeStringify(obj) {
      const cache = new Set();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          // 순환 참조 감지
          if (cache.has(value)) {
            return '[Circular Reference]';
          }
          cache.add(value);
        }
        
        // Date 객체 처리
        if (value instanceof Date) {
          return value.toISOString();
        }
        
        // 함수나 undefined 등 JSON으로 직렬화할 수 없는 값 처리
        if (typeof value === 'function' || typeof value === 'undefined') {
          return null;
        }
        
        // 객체를 primitive 값으로 변환하는 과정에서 오류 방지
        if (typeof value === 'object' && value !== null) {
          // toString 메서드가 있고 Object.prototype의 toString이 아닌 경우 문자열 변환 시도
          if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
            try {
              const str = value.toString();
              if (typeof str === 'string') {
                return str;
              }
            } catch (e) {
              // toString 호출 중 오류 발생시 기본값 반환
              return '[Object]';
            }
          }
          
          // valueOf 메서드가 있고 Object.prototype의 valueOf가 아닌 경우 primitive 값 반환 시도
          if (typeof value.valueOf === 'function' && value.valueOf !== Object.prototype.valueOf) {
            try {
              const val = value.valueOf();
              if (typeof val !== 'object') {
                return val;
              }
            } catch (e) {
              // valueOf 호출 중 오류 발생시 기본값 반환
              return '[Object]';
            }
          }
          
          // 특수한 타입의 객체 처리 (Symbol, BigInt 등을 문자열로 변환)
          try {
            if (typeof value[Symbol.toPrimitive] === 'function') {
              return String(value[Symbol.toPrimitive]('string'));
            }
          } catch (e) {
            // toPrimitive 변환 실패시 무시
          }
          
          // 키-값 쌍이 있는 객체는 그대로 유지
          if (Object.keys(value).length > 0) {
            return value;
          }
          
          // 그 외의 경우 안전한 문자열로 대체
          return '[Object]';
        }
        
        return value;
      });
    }
    
    // 안전하게 필요한 속성만 추출
    const simplifiedResults = combinedResults.map(item => {
      try {
        return {
          title: item.title || '',
          description: item.description || item.snippet || item.contentSnippet || '',
          source: (item.source || item.domain || '').toString(),
          date: item.normalized_date || '',
          category: (item.category || 'general').toString(),
          is_from_rss: !!item.is_from_rss
        };
      } catch (err) {
        console.log(`⚠️ 항목 변환 중 오류 발생, 기본값 사용: ${err.message}`);
        return {
          title: 'Error processing item',
          description: '',
          source: 'unknown',
          date: '',
          category: 'general',
          is_from_rss: false
        };
      }
    });
    
    const prompt = `
    최근 국제 정치 뉴스 기사들을 분석하여 최신 6가지 주요 이슈나 주제를 추출해주세요. 
    다음 뉴스 기사 목록을 분석하세요. 이 중 RSS 피드에서 가져온 기사(is_from_rss=true)를 우선적으로 고려하세요.
    기사 목록이 많을 수 있으나, 최대한 많은 기사를 분석하여 국제 정치의 핵심 주제를 파악해주세요:
    
    ${safeStringify(simplifiedResults)}
    
    각 주제는 다음 형식의 JSON 구조로 반환해주세요:
    
    {
      "topics": [
        {
          "id": 1,
          "title": "주제 제목 (간결하지만 흥미롭게)",
          "summary": "해당 주제에 대한 1-2문장 요약",
          "icon": "font-awesome 아이콘 클래스 (예: fa-newspaper, fa-globe-asia, fa-handshake 등)",
          "dateOccurred": "YYYY-MM-DD" (사건/이슈가 발생한 날짜, 오늘 또는 최근 3일 이내의 날짜로 설정)
        },
        ...
      ]
    }
    
    반드시 정확한 JSON 형식으로 반환해주세요. 각 주제는 국제 관계, 외교, 국가 간 갈등, 협상, 국제기구 활동 등과 관련되어야 합니다.
    날짜(dateOccurred)는 가장 최근 토픽이 먼저 오도록 정렬해주세요. 오늘 날짜는 ${new Date().toISOString().split('T')[0]}입니다.
    최신성이 중요하므로 모든 주제의 날짜는 오늘 또는 최근 3일 이내로 설정해주세요.
    제목과 요약은 한국어로 작성해주세요.
    각 주제에는 다음 아이콘 중 하나를 선택하여 할당하세요: fa-globe-asia, fa-handshake, fa-balance-scale, fa-landmark, fa-university, fa-flag, fa-users, fa-fighter-jet, fa-chart-line, fa-exclamation-triangle, fa-dove, fa-bolt, fa-fire, fa-atom, fa-newspaper, fa-shield-alt
    `;
    
    const startTime = Date.now();
    const result = await modelContent.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const endTime = Date.now();
    
    console.log(`✓ Gemini API 응답 수신 (${((endTime - startTime) / 1000).toFixed(1)}초 소요)`);
    const textResult = result.response.text();
    
    try {
      // JSON 텍스트 형식 추출 (```json으로 감싸져 있는 경우 처리)
      const jsonText = textResult.includes('```json')
        ? textResult.split('```json')[1].split('```')[0].trim()
        : textResult.includes('```')
          ? textResult.split('```')[1].split('```')[0].trim()
          : textResult;
      
      // JSON 파싱
      console.log(`🔍 주제 정보 JSON 파싱 중...`);
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
      
      console.log(`✅ ${topicsWithIds.length}개의 주제를 시간순으로 정렬했습니다`);
      console.log(`📋 주제 목록: ${topicsWithIds.map(t => `"${t.title}"`).join(', ')}`);
      return topicsWithIds;
    } catch (error) {
      console.error('❌ 주제 추출 중 JSON 파싱 오류:', error);
      console.log('⚠️ 받은 응답:', textResult.substring(0, 200) + '...');
      
      // 기본 주제 생성 (오늘 날짜 기준)
      return generateDefaultTopics();
      }
    } catch (error) {
    console.error('❌ 주제 생성 중 API 오류:', error);
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
          },
          {
            id: 4,
      title: "유럽 연합 에너지 정책 변화",
      summary: "친환경 에너지로의 전환을 위한 유럽 연합의 새로운 정책과 글로벌 영향",
      icon: "fa-leaf",
      dateOccurred: today
          },
          {
            id: 5,
      title: "아프리카 정치 불안정과 군사 쿠데타",
      summary: "서아프리카 지역의 최근 정치적 불안정과 군사 쿠데타 발생에 대한 국제사회의 반응",
      icon: "fa-exclamation-triangle",
      dateOccurred: today
    },
    {
      id: 6,
      title: "글로벌 기후변화 대응 정책",
      summary: "전 세계 국가들의 최신 기후변화 대응 협약과 국제 협력 현황",
      icon: "fa-cloud-sun",
      dateOccurred: today
    },
    {
      id: 7,
      title: "국제 금융 시장 위기 해법",
      summary: "세계 금융 시장의 불안정성 증가와 이에 대한 각국 중앙은행의 대응책",
      icon: "fa-chart-bar",
      dateOccurred: today
    },
    {
      id: 8,
      title: "한반도 외교 정세 변화",
      summary: "남북관계와 주변 강대국들의 한반도 정책 변화에 따른 동북아 정세 분석",
      icon: "fa-flag",
      dateOccurred: today
    },
    {
      id: 9,
      title: "UN 안보리 개혁 논의",
      summary: "유엔 안전보장이사회의 구조적 개혁을 위한 국제사회의 최근 논의 동향",
      icon: "fa-landmark",
      dateOccurred: today
    },
    {
      id: 10,
      title: "글로벌 식량 안보 위기",
      summary: "기후변화와 전쟁으로 인한 국제 식량 공급망 위기와 대응 방안",
      icon: "fa-seedling",
      dateOccurred: today
    }
  ];
}

// API 엔드포인트 - 캐시 삭제
app.post('/api/clear-cache', async (req, res) => {
  try {
    console.log('\n=== 🧹 캐시 삭제 프로세스 시작 ===');
    
    const { clearAll, timestamp, removeArchive } = req.body;
    console.log(`요청 파라미터: clearAll=${clearAll}, removeArchive=${removeArchive}`);
    
    // 아카이브 백업 생성 (삭제 전)
    const today = new Date().toISOString().split('T')[0];
    const backupTime = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const backupPath = path.join(ARCHIVE_DIR, `archive_backup_${backupTime}.json`);
    
    console.log(`📦 아카이브 데이터 백업 생성: ${backupPath}`);
    try {
      if (!fs.existsSync(ARCHIVE_DIR)) {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
      }
      fs.writeFileSync(backupPath, JSON.stringify(archiveData, null, 2));
      console.log(`✅ 아카이브 백업 파일 생성 완료`);
    } catch (backupError) {
      console.error(`❌ 아카이브 백업 중 오류: ${backupError.message}`);
    }
    
    // 캐시 항목 수 계산
    const searchCacheCount = Object.keys(searchCache).length;
    const keywordCacheCount = Object.keys(keywordCache).length;
    const articleCacheCount = Object.keys(articleCache).length;
    const archiveDataCount = Object.keys(archiveData).length;
    
    console.log(`📊 현재 캐시 상태:`);
    console.log(`- 검색 캐시: ${searchCacheCount}개 항목`);
    console.log(`- 키워드 캐시: ${keywordCacheCount}개 항목`);
    console.log(`- 기사 캐시: ${articleCacheCount}개 항목`);
    console.log(`- 아카이브 데이터: ${archiveDataCount}개 항목`);
    
    // 캐시 삭제
    searchCache = {};
    keywordCache = {};
    articleCache = {};
    
    console.log(`✅ 메모리 캐시 삭제 완료 (검색, 키워드, 기사 캐시)`);
    
    // 아카이브 데이터 처리
    let archiveDataCleared = 0;
    
    if (removeArchive) {
      console.log(`🗑️ 아카이브 데이터 삭제 시작...`);
      
      // 오늘 날짜의 데이터만 삭제하거나 전체 삭제 옵션 처리
      if (clearAll) {
        archiveDataCleared = Object.keys(archiveData).length;
        archiveData = {};
        console.log(`✅ 모든 아카이브 데이터 삭제 완료 (${archiveDataCleared}개 항목)`);
      } else {
        // 오늘 데이터만 삭제
        if (archiveData[today]) {
          delete archiveData[today];
          archiveDataCleared = 1;
          console.log(`✅ 오늘(${today})의 아카이브 데이터 삭제 완료`);
        } else {
          console.log(`ℹ️ 오늘(${today})의 아카이브 데이터가 없습니다`);
        }
      }
      
      // 아카이브 데이터 저장
      try {
        saveArchiveData();
        console.log(`✅ 아카이브 데이터 파일 업데이트 완료`);
      } catch (saveError) {
        console.error(`❌ 아카이브 데이터 저장 중 오류: ${saveError.message}`);
      }
      } else {
      console.log(`ℹ️ 아카이브 데이터 삭제가 요청되지 않았습니다`);
    }
    
    console.log('=== 캐시 삭제 프로세스 완료 ===\n');
    
    // 삭제된 항목 통계와 함께 응답
    res.json({
      success: true,
      message: '캐시가 성공적으로 삭제되었습니다.',
      timestamp: Date.now(),
      details: {
        searchCacheCleared: searchCacheCount,
        keywordCacheCleared: keywordCacheCount,
        articleCacheCleared: articleCacheCount,
        archiveDataCleared: archiveDataCleared,
        backupCreated: backupPath
      }
    });
  } catch (error) {
    console.error('❌ 캐시 삭제 중 오류 발생:', error);
    res.status(500).json({ 
      success: false, 
      error: '캐시 삭제 중 오류가 발생했습니다.', 
      message: error.message 
    });
  }
});

// API 엔드포인트 - 유튜브 스크립트 상태 확인
app.get('/api/check-youtube-status/:topicId', (req, res) => {
  try {
    const { topicId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`토픽 ID ${topicId}의 유튜브 스크립트 상태 확인 요청`);
    
    // 아카이브에서 상태 확인
    if (archiveData[today] && 
        archiveData[today].youtubeScripts && 
        archiveData[today].youtubeScripts[topicId]) {
      
      // 스크립트 정보 추출
      const scriptData = archiveData[today].youtubeScripts[topicId];
      const progress = scriptData.progress || 0;
      const status = scriptData.status || "진행 중";
      const completed = scriptData.completed || false;
      
      // 생성 완료된 스크립트 반환
      console.log(`토픽 ID ${topicId}의 유튜브 스크립트 확인 결과: 진행도 ${progress}%, 상태: ${status}`);
      return res.json({
        ...scriptData,
        progress,
        status,
        completed
      });
    }
    
    // 생성 중 또는 생성 전
    console.log(`토픽 ID ${topicId}의 유튜브 스크립트 아직 생성 중 또는 데이터 없음`);
    return res.json({
      completed: false,
      progress: 0,
      status: "대기 중",
      topicId: topicId
    });
  } catch (error) {
    console.error('유튜브 스크립트 상태 확인 중 오류:', error);
    return res.status(500).json({ 
      error: '상태 확인 중 오류가 발생했습니다.',
      completed: false,
      progress: 0,
      status: "오류 발생"
    });
  }
});