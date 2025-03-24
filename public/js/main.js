// 메인 JavaScript 파일 - public/js/main.js

// API 엔드포인트
const API_URL = window.location.origin + '/api';

// 전역 변수
let searchResults = []; // 검색 결과 저장
let currentTopics = []; // 현재 분석된 주제들
let archiveList = []; // 아카이브 목록
let selectedTopic = null; // 현재 선택된 토픽 저장

// DOM 요소
const homePage = document.getElementById('homePage');
const reportPage = document.getElementById('reportPage');
const archivePage = document.getElementById('archivePage');
const topicsList = document.getElementById('topicsList');
const loadingState = document.getElementById('loadingState');
const analyzeButton = document.getElementById('analyzeButton');
const reportTitle = document.getElementById('reportTitle');
const reportContent = document.getElementById('reportContent');
const relatedNews = document.getElementById('relatedNews');
const reportDate = document.getElementById('reportDate');
const archivesList = document.getElementById('archivesList');
// searchPage 요소가 없는 경우를 대비하여 선택적으로 초기화
const searchPage = document.getElementById('searchPage') || { classList: { add: () => {} } };

// 현재 날짜 설정
const setCurrentDate = () => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  });
  reportDate.textContent = formattedDate;
};

// 분석 시작 함수
const generateReport = async () => {
  // UI 상태 업데이트
  topicsList.innerHTML = '';
  topicsList.classList.add('hidden');
  loadingState.classList.remove('hidden');
  
  try {
    console.log(`Calling API: ${API_URL}/analyze`);
    
    // API 호출
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response error:', errorText);
      throw new Error('서버 응답 오류: ' + response.status + ' - ' + errorText);
    }
    
    const responseText = await response.text();
    console.log('Raw API response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed API response data:', data);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('응답 데이터 파싱 오류: ' + parseError.message);
    }
    
    if (!data.topics || !Array.isArray(data.topics)) {
      console.error('Invalid topics data:', data);
      throw new Error('서버에서 유효한 주제 데이터를 반환하지 않았습니다');
    }
    
    currentTopics = data.topics;
    
    // 토픽 렌더링
    renderTopics(currentTopics);
  } catch (error) {
    console.error('분석 오류:', error);
    
    // 오류 발생 시 기본 주제 표시
    currentTopics = [
      {
        id: 1,
        title: "러-우 전쟁에 관한 트럼프 행정부의 대처",
        summary: "도널드 트럼프 미국 대통령의 러시아-우크라이나 전쟁 종식을 위한 새로운 중재 노력과 최근 전개 상황에 대한 분석",
        icon: "fa-handshake"
      },
      {
        id: 2,
        title: "이스라엘-하마스 평화 협상의 진전",
        summary: "이집트의 중재로 진행 중인 이스라엘-하마스 간 휴전 협상의 최신 동향과 지역 정세에 미치는 영향",
        icon: "fa-dove"
      },
      {
        id: 3,
        title: "중국-대만 관계 긴장과 미국의 역할",
        summary: "대만 입법부의 예산 삭감 결정 이후 고조되는 양안 관계 긴장과 미국의 전략적 포지셔닝 변화",
        icon: "fa-balance-scale"
      },
      {
        id: 4,
        title: "아프리카 사헬 지역의 정치 불안",
        summary: "말리, 부르키나파소, 니제르의 군사 정권 연합과 지역 안보에 미치는 영향, 테러 단체 활동 증가",
        icon: "fa-exclamation-triangle"
      },
      {
        id: 5,
        title: "글로벌 경제 전망과 인플레이션",
        summary: "2025년 글로벌 경제 성장률 전망과 중앙은행들의 금리 인하 정책, 지역별 경제 상황 분석",
        icon: "fa-chart-line"
      }
    ];
    
    renderTopics(currentTopics);
    
    // 오류 알림
    showNotification('분석 중 오류가 발생했습니다. 기본 주제를 표시합니다.', 'error');
  } finally {
    loadingState.classList.add('hidden');
    topicsList.classList.remove('hidden');
  }
};

// 주제 렌더링 함수
const renderTopics = (topics) => {
  topicsList.innerHTML = '';
  
  // 주제 수에 따라 그리드 레이아웃 조정
  const topicsCount = topics.length;
  let gridClass = 'grid-cols-1 md:grid-cols-2';
  
  // 토픽 수가 10개 이상이면 그리드 열 수 조정
  if (topicsCount >= 10) {
    gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  }
  
  // 그리드 클래스 적용
  topicsList.className = `grid ${gridClass} gap-4 max-w-7xl mx-auto`;
  
  // 서버에서 이미 날짜순으로 정렬된 주제를 렌더링
  topics.forEach((topic, index) => {
    const topicCard = document.createElement('div');
    topicCard.className = 'topic-card tilt-card glass bg-white p-6 rounded-xl shadow-md hover:shadow-lg cursor-pointer transition-all fade-in';
    // 순차적 애니메이션을 위한 지연 클래스 추가
    topicCard.classList.add(`delay-${(index % 5 + 1) * 100}`);
    topicCard.onclick = () => showReport(topic);
    
    // 날짜 포맷팅
    let dateDisplay = '';
    if (topic.dateOccurred) {
      try {
        const date = new Date(topic.dateOccurred);
        if (!isNaN(date)) {
          dateDisplay = `<div class="text-xs text-gray-500 mb-1">
            <i class="far fa-calendar-alt mr-1"></i>
            ${date.toLocaleDateString('ko-KR', {
              year: 'numeric', 
              month: 'short', 
              day: 'numeric'
            })}
          </div>`;
        }
      } catch (e) {
        console.warn('날짜 변환 오류:', e);
      }
    }
    
    topicCard.innerHTML = `
      <div class="flex items-start tilt-card-content">
        <div class="bg-blue-100 text-blue-600 p-3 rounded-lg">
          <i class="fas ${topic.icon || 'fa-newspaper'} text-xl"></i>
        </div>
        <div class="ml-4 flex-grow">
          <h3 class="text-xl font-bold mb-2 gradient-text">${topic.id}. ${topic.title}</h3>
          ${dateDisplay}
          <p class="text-gray-600 shimmer-text">${topic.summary}</p>
        </div>
        <div class="text-blue-600">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `;
    topicsList.appendChild(topicCard);
  });
  
  // 모든 요소 등장 애니메이션 트리거
  setTimeout(() => {
    document.querySelectorAll('.fade-in').forEach(element => {
      element.classList.add('active');
    });
  }, 100);
};

// 보고서 페이지 표시 함수
const showReport = async (topic) => {
  // 현재 선택된 토픽 저장
  selectedTopic = topic;
  
  // 모든 페이지 숨기기
  homePage.classList.add('hidden');
  reportPage.classList.remove('hidden');
  archivePage.classList.add('hidden');
  searchPage.classList.add('hidden');
  
  // 로딩 상태 표시
  reportContent.innerHTML = `
    <div class="text-center py-12">
      <p class="text-xl mb-4">분석 내용을 불러오는 중입니다...</p>
      <div class="spinner"></div>
    </div>
  `;
  
  // 헤더 업데이트
  reportTitle.textContent = topic.title;
  
  // 날짜 형식화
  const date = new Date(topic.dateOccurred || new Date());
  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(date);
  
  reportDate.textContent = formattedDate;
  
  // 버전2 버튼 초기 상태는 숨김
  // 아카이브에서 기사를 불러온 후에만 표시
  const existingBtn = document.getElementById('generate-v2-btn');
  if (existingBtn) {
    existingBtn.classList.add('hidden');
  }
  
  // 기사 생성 API 호출
  fetch('/api/generate-article', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      topic: topic,
      searchResults: searchResults
    })
  })
  .then(response => response.json())
  .then(data => {
    // 기사 내용 표시
    if (data.generatingInProgress) {
      // 아직 생성 중인 경우
      reportContent.innerHTML = `
        <div class="text-center py-8">
          <p class="text-xl mb-4">기사를 생성하고 있습니다. 잠시만 기다려주세요...</p>
          <div class="spinner"></div>
          <p class="mt-4 text-gray-500">첫 생성에는 30초~1분 정도 소요될 수 있습니다.</p>
          <button id="refresh-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            새로고침
          </button>
        </div>
      `;
      
      // 새로고침 버튼 이벤트 연결
      document.getElementById('refresh-report').addEventListener('click', () => {
        showReport(topic);
      });
      
    } else if (data.error) {
      // 오류 발생 시
      reportContent.innerHTML = `
        <div class="p-4 border border-red-200 bg-red-50 rounded">
          <h3 class="text-lg font-semibold text-red-700">오류 발생</h3>
          <p>${data.error || '기사를 생성하는 중 오류가 발생했습니다.'}</p>
          <p>${data.message || ''}</p>
          <button id="retry-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            다시 시도
          </button>
        </div>
      `;
      
      // 다시 시도 버튼 이벤트 연결
      document.getElementById('retry-report').addEventListener('click', () => {
        showReport(topic);
      });
      
    } else {
      // 성공적으로 기사를 불러온 경우
      displayArticle(data);
      
      // 버전2 버튼 표시 (기사 불러오기 성공 시에만)
      showVersion2Button(topic);
    }
  })
  .catch(error => {
    console.error('기사 불러오기 오류:', error);
    reportContent.innerHTML = `
      <div class="p-4 border border-red-200 bg-red-50 rounded">
        <h3 class="text-lg font-semibold text-red-700">오류 발생</h3>
        <p>기사를 불러오는 중 문제가 발생했습니다: ${error.message}</p>
        <button id="retry-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          다시 시도
        </button>
      </div>
    `;
    
    // 다시 시도 버튼 이벤트 연결
    document.getElementById('retry-report').addEventListener('click', () => {
      showReport(topic);
    });
  });
};

// 관련 뉴스 렌더링 함수
const renderRelatedNews = (newsItems) => {
  relatedNews.innerHTML = '';
  
  newsItems.forEach((news, index) => {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item glass bg-white p-4 rounded-lg transition fade-in';
    newsItem.classList.add(`delay-${(index % 3 + 1) * 100}`);
    newsItem.innerHTML = `
      <h4 class="font-medium text-gray-800 mb-2 shimmer-text">${news.title}</h4>
      <div class="flex justify-between text-sm">
        <span class="text-gray-500 shimmer-text">${news.source}</span>
        <span class="text-gray-400 shimmer-text">${news.time}</span>
      </div>
    `;
    relatedNews.appendChild(newsItem);
  });
  
  // 관련 뉴스 페이드인 애니메이션 활성화
  setTimeout(() => {
    relatedNews.querySelectorAll('.fade-in').forEach(element => {
      element.classList.add('active');
    });
  }, 100);
};

// 아카이브 목록 로드 함수
const loadArchives = async () => {
  try {
    const response = await fetch(`${API_URL}/archives`);
    if (!response.ok) {
      throw new Error('아카이브 목록을 불러오는 중 오류가 발생했습니다.');
    }
    
    archiveList = await response.json();
    renderArchiveList();
  } catch (error) {
    console.error('아카이브 로드 오류:', error);
    showNotification('아카이브 목록을 불러오는 중 오류가 발생했습니다.', 'error');
  }
};

// 아카이브 목록 렌더링 함수
const renderArchiveList = () => {
  if (!archivesList) return;
  
  archivesList.innerHTML = '';
  
  if (archiveList.length === 0) {
    archivesList.innerHTML = '<p class="text-center text-gray-500 my-8 shimmer-text">저장된 아카이브가 없습니다.</p>';
    return;
  }
  
  archiveList.forEach((archive, index) => {
    const archiveItem = document.createElement('div');
    archiveItem.className = 'glass tilt-card bg-white p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-all fade-in';
    archiveItem.classList.add(`delay-${(index % 5 + 1) * 100}`);
    archiveItem.onclick = () => loadArchiveData(archive.date);
    archiveItem.innerHTML = `
      <div class="flex items-center justify-between tilt-card-content">
        <div>
          <h3 class="font-bold text-lg text-gray-800 gradient-text">${archive.formattedDate}</h3>
          <p class="text-gray-600 shimmer-text">주제 ${archive.topics}개, 기사 ${archive.articles}개</p>
        </div>
        <div class="text-blue-600">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `;
    archivesList.appendChild(archiveItem);
  });
  
  // 아카이브 목록 페이드인 애니메이션 활성화
  setTimeout(() => {
    archivesList.querySelectorAll('.fade-in').forEach(element => {
      element.classList.add('active');
    });
  }, 100);
};

// 특정 날짜의 아카이브 데이터 로드 함수
const loadArchiveData = async (date) => {
  try {
    // UI 상태 업데이트
    topicsList.innerHTML = '';
    topicsList.classList.add('hidden');
    loadingState.classList.remove('hidden');
    archivePage.classList.add('hidden');
    homePage.classList.remove('hidden');
    
    const response = await fetch(`${API_URL}/archives/${date}`);
    if (!response.ok) {
      throw new Error('아카이브 데이터를 불러오는 중 오류가 발생했습니다.');
    }
    
    const data = await response.json();
    currentTopics = data.topics;
    
    // 토픽 렌더링
    renderTopics(currentTopics);
    
    // 알림 표시
    showNotification(`${data.formattedDate} 아카이브를 불러왔습니다.`, 'info');
  } catch (error) {
    console.error('아카이브 데이터 로드 오류:', error);
    showNotification('아카이브 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
  } finally {
    loadingState.classList.add('hidden');
    topicsList.classList.remove('hidden');
  }
};

// 아카이브 페이지 표시 함수
const showArchivePage = async () => {
  homePage.classList.add('hidden');
  reportPage.classList.add('hidden');
  archivePage.classList.remove('hidden');
  
  // 아카이브 목록 로드
  await loadArchives();
  
  // 아카이브 페이지의 페이드인 애니메이션 활성화
  document.querySelectorAll('#archivePage .fade-in').forEach(element => {
    element.classList.add('active');
  });
};

// 홈페이지로 돌아가기 함수
const showHomePage = () => {
  reportPage.classList.add('hidden');
  archivePage.classList.add('hidden');
  homePage.classList.remove('hidden');
  
  // 홈 페이지의 페이드인 애니메이션 활성화
  document.querySelectorAll('#homePage .fade-in').forEach(element => {
    element.classList.add('active');
  });
};

// 알림 표시 함수
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  
  // 타입에 따른 스타일
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse shimmer-text glass`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // 3초 후 자동으로 제거
  setTimeout(() => {
    notification.classList.add('opacity-0', 'transition-opacity');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
};

// 기사 내용에 shimmer-text 클래스 적용하는 함수
const applyShimmerToContent = () => {
  // 기사 내용 내부의 텍스트 요소들에 shimmer-text 클래스 추가
  const elements = reportContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, a');
  elements.forEach(element => {
    if (!element.classList.contains('shimmer-text')) {
      element.classList.add('shimmer-text');
    }
  });
  
  // 제목 요소에 그라데이션 효과 추가
  const headings = reportContent.querySelectorAll('h1, h2, h3');
  headings.forEach(heading => {
    heading.classList.add('gradient-text');
  });
  
  // 출처 링크에 클래스 추가
  const sourceLinks = reportContent.querySelectorAll('.mt-8 ul li a');
  sourceLinks.forEach(link => {
    link.classList.add('shimmer-text');
    link.parentElement.classList.add('sources-list');
  });
  
  // 이미지에 틸트 효과 추가
  const images = reportContent.querySelectorAll('img');
  images.forEach(img => {
    if (!img.parentNode.classList.contains('tilt-card')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'tilt-card my-4';
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      img.className += ' tilt-card-content rounded-lg shadow-lg';
    }
  });
  
  // 인용문에 글래스 효과 추가
  const blockquotes = reportContent.querySelectorAll('blockquote');
  blockquotes.forEach(quote => {
    quote.className += ' glass p-4 my-4 rounded-lg italic';
  });
  
  // 3D 틸트 효과 초기화
  initTiltEffect();
};

// 3D 틸트 효과 초기화 함수
const initTiltEffect = () => {
  const cards = document.querySelectorAll('.tilt-card');
  
  cards.forEach(card => {
    // 이미 이벤트가 등록되어 있으면 무시
    if (card.dataset.tiltInitialized) return;
    
    card.dataset.tiltInitialized = 'true';
    
    card.addEventListener('mousemove', e => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const angleY = -(e.clientX - cardCenterX) / 15;
      const angleX = (e.clientY - cardCenterY) / 15;
      
      card.style.transform = `perspective(1000px) rotateY(${angleY}deg) rotateX(${angleX}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
    });
  });
};

// 버전2 버튼 표시 함수
const showVersion2Button = (topic) => {
  // 이미 버튼이 있는지 확인
  let v2Button = document.getElementById('generate-v2-btn');
  
  // 버튼이 없으면 생성
  if (!v2Button) {
    // 버튼 그룹 생성 (버전 토글을 위한 컨테이너)
    const buttonGroup = document.createElement('div');
    buttonGroup.id = 'article-version-buttons';
    buttonGroup.className = 'flex justify-end mb-4 space-x-2';
    
    // 버전1 버튼 (현재 기사)
    const v1Button = document.createElement('button');
    v1Button.textContent = '원본 기사';
    v1Button.id = 'show-v1-btn';
    v1Button.className = 'px-3 py-1 bg-blue-500 text-white text-sm rounded active';
    v1Button.addEventListener('click', () => {
      showReport(topic); // 원본 기사 다시 불러오기
      
      // 버튼 스타일 변경
      v1Button.classList.add('active', 'bg-blue-500');
      v1Button.classList.remove('bg-gray-300');
      v2Button.classList.remove('active', 'bg-blue-500');
      v2Button.classList.add('bg-gray-300');
    });
    
    // 버전2 버튼 생성
    v2Button = document.createElement('button');
    v2Button.textContent = 'MZ 버전';
    v2Button.id = 'generate-v2-btn';
    v2Button.className = 'px-3 py-1 bg-gray-300 text-gray-800 text-sm rounded';
    v2Button.addEventListener('click', () => generateArticleV2(topic));
    
    // 버튼들을 그룹에 추가
    buttonGroup.appendChild(v1Button);
    buttonGroup.appendChild(v2Button);
    
    // 리포트 헤더 영역 아래에 버튼 그룹 추가
    const reportHeader = document.querySelector('.report-header');
    if (reportHeader) {
      reportHeader.after(buttonGroup);
    } else {
      // reportHeader를 찾을 수 없는 경우 reportContent 위에 삽입
      const reportContentElement = document.getElementById('reportContent');
      if (reportContentElement) {
        reportContentElement.parentNode.insertBefore(buttonGroup, reportContentElement);
      }
    }
  } else {
    // 이미 있는 경우 표시 상태로 변경
    v2Button.classList.remove('hidden');
  }
};

// 버전2 기사 생성 함수
const generateArticleV2 = async (topic) => {
  // 현재 선택된 토픽이 없으면 종료
  if (!topic) return;
  
  // 버튼 상태 업데이트
  const v1Button = document.getElementById('show-v1-btn');
  const v2Button = document.getElementById('generate-v2-btn');
  
  if (v1Button && v2Button) {
    v1Button.classList.remove('active', 'bg-blue-500');
    v1Button.classList.add('bg-gray-300');
    v2Button.classList.add('active', 'bg-blue-500');
    v2Button.classList.remove('bg-gray-300');
  }
  
  // 로딩 상태 표시
  reportContent.innerHTML = `
    <div class="text-center py-12">
      <p class="text-xl mb-4">MZ 버전 기사를 불러오는 중이에요~ 😎</p>
      <div class="spinner"></div>
      <p class="mt-4 text-gray-500">MZ 스타일로 변환 중... 🔥</p>
    </div>
  `;
  
  // 버전2 기사 생성 API 호출
  fetch('/api/generate-article-v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      topic: topic,
      searchResults: searchResults
    })
  })
  .then(response => response.json())
  .then(data => {
    // 기사 내용 표시
    if (data.generatingInProgress) {
      // 아직 생성 중인 경우
      reportContent.innerHTML = `
        <div class="text-center py-8">
          <p class="text-xl mb-4">MZ 버전 기사를 만들고 있어요~ 잠시만 기다려주세요! 🙏</p>
          <div class="spinner"></div>
          <p class="mt-4 text-gray-500">첫 생성에는 30초~1분 정도 걸릴 수 있어요... ⏱️</p>
          <button id="refresh-v2-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            새로고침 🔄
          </button>
        </div>
      `;
      
      // 새로고침 버튼 이벤트 연결
      document.getElementById('refresh-v2-report').addEventListener('click', () => {
        generateArticleV2(topic);
      });
      
    } else if (data.error) {
      // 오류 발생 시
      reportContent.innerHTML = `
        <div class="p-4 border border-red-200 bg-red-50 rounded">
          <h3 class="text-lg font-semibold text-red-700">이런! 오류가 발생했어요 😱</h3>
          <p>${data.error || 'MZ 버전 기사를 생성하는 중 문제가 생겼어요.'}</p>
          <p>${data.message || ''}</p>
          <button id="retry-v2-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            다시 시도해볼게요 🔄
          </button>
        </div>
      `;
      
      // 다시 시도 버튼 이벤트 연결
      document.getElementById('retry-v2-report').addEventListener('click', () => {
        generateArticleV2(topic);
      });
      
    } else {
      // 성공적으로 기사를 불러온 경우
      displayArticle(data);
    }
  })
  .catch(error => {
    console.error('MZ 버전 기사 불러오기 오류:', error);
    reportContent.innerHTML = `
      <div class="p-4 border border-red-200 bg-red-50 rounded">
        <h3 class="text-lg font-semibold text-red-700">앗! 오류 발생 😓</h3>
        <p>MZ 버전 기사를 불러오는 중 문제가 생겼어요: ${error.message}</p>
        <button id="retry-v2-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          한 번 더 시도해볼게요 🙏
        </button>
      </div>
    `;
    
    // 다시 시도 버튼 이벤트 연결
    document.getElementById('retry-v2-report').addEventListener('click', () => {
      generateArticleV2(topic);
    });
  });
};

// 기사 내용 표시 함수
const displayArticle = (articleData) => {
  // 기사 내용 설정
  reportContent.innerHTML = articleData.content;
  
  // 기사 제목 업데이트 (v2 버전인 경우 변경될 수 있음)
  if (articleData.title && articleData.isVersion2) {
    reportTitle.textContent = articleData.title;
  }
  
  // 관련 뉴스 표시
  const relatedNewsSection = document.createElement('div');
  relatedNewsSection.className = 'mt-6 p-4 bg-gray-50 rounded';
  
  if (articleData.relatedNews && articleData.relatedNews.length > 0) {
    relatedNewsSection.innerHTML = `
      <h3 class="text-lg font-bold mb-2">관련 뉴스</h3>
      <ul class="list-disc pl-5">
        ${articleData.relatedNews.map(news => `
          <li class="mb-1">
            <span class="font-medium">${news.title}</span>
            <span class="text-sm text-gray-500"> - ${news.source}, ${news.time}</span>
          </li>
        `).join('')}
      </ul>
    `;
  } else {
    relatedNewsSection.innerHTML = `
      <h3 class="text-lg font-bold mb-2">관련 뉴스</h3>
      <p class="text-gray-500">관련 뉴스가 없습니다.</p>
    `;
  }
  
  // 생성 시간 표시
  if (articleData.generatedAt) {
    const generatedDate = new Date(articleData.generatedAt);
    const formattedGeneratedDate = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(generatedDate);
    
    const generatedAtDiv = document.createElement('div');
    generatedAtDiv.className = 'text-right text-sm text-gray-500 mt-2';
    generatedAtDiv.textContent = `생성 시간: ${formattedGeneratedDate}`;
    
    relatedNewsSection.appendChild(generatedAtDiv);
  }
  
  // 버전 정보 표시 (v2인 경우)
  if (articleData.isVersion2) {
    const versionBadge = document.createElement('div');
    versionBadge.className = 'inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2';
    versionBadge.textContent = 'MZ 버전';
    reportTitle.appendChild(versionBadge);
  }
  
  // 관련 뉴스 섹션을 기사 내용 아래에 추가
  reportContent.appendChild(relatedNewsSection);
  
  // 콘텐츠에 shimmer 효과 적용
  try {
    applyShimmerToContent();
  } catch (error) {
    console.warn('shimmer 효과 적용 중 오류:', error);
  }
  
  // 콘솔에 로그 출력하여 디버깅
  console.log('기사가 표시되었습니다:', {
    contentLength: articleData.content.length,
    hasRelatedNews: articleData.relatedNews && articleData.relatedNews.length > 0,
    title: articleData.title || reportTitle.textContent
  });
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 현재 날짜 설정
  setCurrentDate();
  
  // 분석 버튼 이벤트 리스너
  analyzeButton.addEventListener('click', generateReport);
  
  // 아카이브 링크 이벤트 리스너
  const archiveLink = document.querySelector('a[href="#archive"]');
  if (archiveLink) {
    archiveLink.addEventListener('click', (e) => {
      e.preventDefault();
      showArchivePage();
    });
  }
  
  // 초기 애니메이션 활성화
  document.querySelectorAll('.fade-in').forEach(element => {
    element.classList.add('active');
  });
  
  // 스크롤 이벤트 리스너 등록
  window.addEventListener('scroll', () => {
    const fadeElements = document.querySelectorAll('.fade-in:not(.active)');
    const triggerBottom = window.innerHeight * 0.8;
    
    fadeElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < triggerBottom) {
        element.classList.add('active');
      }
    });
  });
  
  // 초기 3D 틸트 효과 초기화
  initTiltEffect();
});