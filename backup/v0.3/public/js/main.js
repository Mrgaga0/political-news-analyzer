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
      },
      {
        id: 6,
        title: "기후변화 대응을 위한 국제 협력",
        summary: "최근 기후변화 대응을 위한 국제 협약과 신기술 도입 노력, 주요 국가들의 탄소중립 정책 진전 상황",
        icon: "fa-cloud-sun"
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
  let gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  
  // 그리드 클래스 적용
  topicsList.className = `grid ${gridClass} gap-6 max-w-7xl mx-auto`;
  
  // 서버에서 이미 날짜순으로 정렬된 주제를 렌더링
  topics.forEach((topic, index) => {
    const topicCard = document.createElement('div');
    topicCard.className = 'topic-card glass shadow-3d bg-white p-7 rounded-2xl cursor-pointer transition-all fade-in';
    // 순차적 애니메이션을 위한 지연 클래스 추가
    topicCard.classList.add(`delay-${(index % 6 + 1) * 100}`);
    topicCard.onclick = () => showReport(topic);
    
    // 날짜 포맷팅
    let dateDisplay = '';
    if (topic.dateOccurred) {
      try {
        const date = new Date(topic.dateOccurred);
        if (!isNaN(date)) {
          dateDisplay = `<div class="text-xs text-gray-500 mb-2">
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
    
    // 각 카드의 색상 그라데이션 배경 결정 (총 6가지 스타일)
    const gradientStyles = [
      'from-blue-50 to-indigo-50 border-l-blue-400',
      'from-purple-50 to-pink-50 border-l-purple-400',
      'from-green-50 to-teal-50 border-l-green-400', 
      'from-yellow-50 to-amber-50 border-l-yellow-400',
      'from-red-50 to-rose-50 border-l-red-400',
      'from-sky-50 to-cyan-50 border-l-sky-400'
    ];
    
    const gradientStyle = gradientStyles[index % gradientStyles.length];
    
    topicCard.innerHTML = `
      <div class="flex items-start tilt-card-content">
        <div class="bg-gradient-to-br ${gradientStyle} p-4 rounded-xl border-l-4">
          <i class="fas ${topic.icon || 'fa-newspaper'} text-xl"></i>
        </div>
        <div class="ml-4 flex-grow">
          <h3 class="text-xl font-semibold mb-2 gradient-text">${topic.title}</h3>
          ${dateDisplay}
          <p class="text-gray-600 shimmer-text">${topic.summary}</p>
          <div class="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-500">더 알아보기</span>
        </div>
        </div>
        <div class="text-gray-300 hover:text-primary transition-colors">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `;
    
    // 마우스 움직임에 따른 효과
    topicCard.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = topicCard.getBoundingClientRect();
      const x = (e.clientX - left) / width;
      const y = (e.clientY - top) / height;
      
      // 움직임에 따른 그림자 효과
      topicCard.style.boxShadow = `
        0 20px 25px -5px rgba(0, 0, 0, 0.05),
        0 10px 10px -5px rgba(0, 0, 0, 0.02),
        ${x * 20 - 10}px ${y * 20 - 10}px 20px rgba(0, 113, 227, 0.07)
      `;
      
      // 약간의 3D 효과
      topicCard.style.transform = `
        scale(1.02) perspective(1000px) 
        rotateX(${(y - 0.5) * 4}deg) 
        rotateY(${(x - 0.5) * -4}deg)
      `;
    });
    
    // 마우스 나갈 때 효과 초기화
    topicCard.addEventListener('mouseleave', () => {
      topicCard.style.boxShadow = '';
      topicCard.style.transform = '';
    });
    
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
      <div class="flex flex-col items-center">
        <div class="spinner mb-6"></div>
        <p class="text-lg mb-2 font-medium text-gray-800">분석 내용을 불러오는 중입니다</p>
        <p class="text-sm text-gray-500">잠시만 기다려주세요...</p>
    </div>
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
        <div class="text-center py-12 glass p-8 rounded-2xl">
          <div class="flex flex-col items-center">
            <div class="spinner mb-6"></div>
            <p class="text-xl mb-4 font-medium">기사를 생성하고 있습니다</p>
            <p class="text-gray-600 mb-6">AI가 최적의 콘텐츠를 준비하는 중입니다. 첫 생성에는 30초~1분 정도 소요될 수 있습니다.</p>
            <button id="refresh-report" class="apple-button">
              <i class="fas fa-sync-alt mr-2"></i>새로고침
            </button>
          </div>
        </div>
      `;
      
      // 새로고침 버튼 이벤트 연결
      document.getElementById('refresh-report').addEventListener('click', () => {
        showReport(topic);
      });
      
    } else if (data.error) {
      // 오류 발생 시
    reportContent.innerHTML = `
        <div class="p-8 glass rounded-2xl border border-red-200">
          <div class="flex items-center mb-4 text-red-600">
            <i class="fas fa-exclamation-circle text-2xl mr-3"></i>
            <h3 class="text-lg font-semibold">오류가 발생했습니다</h3>
          </div>
          <p class="mb-4 text-gray-700">${data.error || '기사를 생성하는 중 오류가 발생했습니다.'}</p>
          <p class="mb-6 text-gray-600">${data.message || '다시 시도해 주세요.'}</p>
          <button id="retry-report" class="apple-button">
            <i class="fas fa-redo mr-2"></i>다시 시도
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
      <div class="p-8 glass rounded-2xl border border-red-200">
        <div class="flex items-center mb-4 text-red-600">
          <i class="fas fa-exclamation-circle text-2xl mr-3"></i>
          <h3 class="text-lg font-semibold">오류가 발생했습니다</h3>
        </div>
        <p class="mb-4 text-gray-700">기사를 불러오는 중 문제가 발생했습니다: ${error.message}</p>
        <button id="retry-report" class="apple-button">
          <i class="fas fa-redo mr-2"></i>다시 시도
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
  
  // 관련 뉴스 컨테이너 생성
  const newsContainer = document.createElement('div');
  newsContainer.className = 'max-h-[500px] overflow-y-auto pr-2';
  
  // 뉴스 항목 수 표시
  const newsCountHeader = document.createElement('div');
  newsCountHeader.className = 'mb-4 font-semibold text-gray-700';
  newsCountHeader.innerHTML = `총 ${newsItems.length}개의 관련 뉴스`;
  relatedNews.appendChild(newsCountHeader);
  
  newsItems.forEach((news, index) => {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item glass bg-white p-4 rounded-lg transition fade-in mb-3';
    newsItem.classList.add(`delay-${(index % 5 + 1) * 100}`);
    
    // URL이 있으면 링크로 만들기
    let titleElement = '';
    if (news.url) {
      titleElement = `<a href="${news.url}" target="_blank" class="font-medium text-gray-800 mb-2 shimmer-text hover:text-blue-600 flex items-center">
        ${news.title}
        <i class="fas fa-external-link-alt text-xs ml-2"></i>
      </a>`;
    } else {
      titleElement = `<h4 class="font-medium text-gray-800 mb-2 shimmer-text">${news.title}</h4>`;
    }
    
    newsItem.innerHTML = `
      ${titleElement}
      <div class="flex justify-between text-sm">
        <span class="text-gray-500 shimmer-text">${news.source}</span>
        <span class="text-gray-400 shimmer-text">${news.time}</span>
      </div>
    `;
    newsContainer.appendChild(newsItem);
  });
  
  // 컨테이너를 관련 뉴스 영역에 추가
  relatedNews.appendChild(newsContainer);
  
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
  let youtubeButton = document.getElementById('generate-youtube-btn');
  
  // 버튼 그룹이 이미 있는지 확인
  let buttonGroup = document.getElementById('article-version-buttons');
  
  if (!buttonGroup) {
    // 버튼 그룹 생성 (버전 토글을 위한 컨테이너)
    buttonGroup = document.createElement('div');
    buttonGroup.id = 'article-version-buttons';
    buttonGroup.className = 'flex justify-end mb-4 space-x-2';
    
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
    // 이미 있으면 내용 초기화
    buttonGroup.innerHTML = '';
  }
  
  // 버전1 버튼 (현재 기사)
  const v1Button = document.createElement('button');
  v1Button.textContent = '원본 기사';
  v1Button.id = 'show-v1-btn';
  v1Button.className = 'px-4 py-2 rounded-full text-sm font-medium transition-all active bg-primary text-white shadow-md';
  v1Button.addEventListener('click', () => {
    showReport(topic); // 원본 기사 다시 불러오기
    
    // 버튼 스타일 변경
    v1Button.classList.add('active', 'bg-primary', 'text-white', 'shadow-md');
    v1Button.classList.remove('bg-gray-200', 'text-gray-600');
    
    if (v2Button) {
      v2Button.classList.remove('active', 'bg-primary', 'text-white', 'shadow-md');
      v2Button.classList.add('bg-gray-200', 'text-gray-600');
    }
    
    if (youtubeButton) {
      youtubeButton.classList.remove('active', 'bg-primary', 'text-white', 'shadow-md');
      youtubeButton.classList.add('bg-gray-200', 'text-gray-600');
    }
  });
  
  // 버전2(MZ) 버튼 생성
  v2Button = document.createElement('button');
  v2Button.textContent = 'MZ 버전';
  v2Button.id = 'generate-v2-btn';
  v2Button.className = 'px-4 py-2 rounded-full text-sm font-medium transition-all bg-gray-200 text-gray-600';
  v2Button.addEventListener('click', () => {
    generateArticleV2(topic);
    
    // 버튼 스타일 변경
    v1Button.classList.remove('active', 'bg-primary', 'text-white', 'shadow-md');
    v1Button.classList.add('bg-gray-200', 'text-gray-600');
    v2Button.classList.add('active', 'bg-primary', 'text-white', 'shadow-md');
    v2Button.classList.remove('bg-gray-200', 'text-gray-600');
    
    if (youtubeButton) {
      youtubeButton.classList.remove('active', 'bg-primary', 'text-white', 'shadow-md');
      youtubeButton.classList.add('bg-gray-200', 'text-gray-600');
    }
  });
  
  // 유튜브 스크립트 버튼 생성
  youtubeButton = document.createElement('button');
  youtubeButton.textContent = '유튜브 스크립트';
  youtubeButton.id = 'generate-youtube-btn';
  youtubeButton.className = 'px-4 py-2 rounded-full text-sm font-medium transition-all bg-gray-200 text-gray-600';
  youtubeButton.addEventListener('click', () => {
    generateArticleYoutube(topic);
    
    // 버튼 스타일 변경
    v1Button.classList.remove('active', 'bg-primary', 'text-white', 'shadow-md');
    v1Button.classList.add('bg-gray-200', 'text-gray-600');
    v2Button.classList.remove('active', 'bg-primary', 'text-white', 'shadow-md');
    v2Button.classList.add('bg-gray-200', 'text-gray-600');
    youtubeButton.classList.add('active', 'bg-primary', 'text-white', 'shadow-md');
    youtubeButton.classList.remove('bg-gray-200', 'text-gray-600');
  });
  
  // 버튼들을 그룹에 추가
  buttonGroup.appendChild(v1Button);
  buttonGroup.appendChild(v2Button);
  buttonGroup.appendChild(youtubeButton);
};

// 버전2 기사 생성 함수
const generateArticleV2 = async (topic) => {
  // 현재 선택된 토픽이 없으면 종료
  if (!topic) return;
  
  // 버튼 상태 업데이트
  const v1Button = document.getElementById('show-v1-btn');
  const v2Button = document.getElementById('generate-v2-btn');
  
  if (v1Button && v2Button) {
    v1Button.classList.remove('active', 'bg-primary', 'text-white', 'shadow-md');
    v1Button.classList.add('bg-gray-200', 'text-gray-600');
    v2Button.classList.add('active', 'bg-primary', 'text-white', 'shadow-md');
    v2Button.classList.remove('bg-gray-200', 'text-gray-600');
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

// 유튜브 스크립트 상태 폴링 함수
function pollYoutubeScriptStatus(topic, maxAttempts = 30, interval = 5000) {
  let attempts = 0;
  
  // 로딩 표시 (새로운 함수 사용)
  showProgress('#report-content', 0, '유튜브 스크립트를 생성하고 있습니다...', {
    maxAttempts: maxAttempts,
    currentAttempt: attempts
  });
  
  const checkStatus = () => {
    attempts++;
    console.log(`유튜브 스크립트 상태 확인 중... (시도 ${attempts}/${maxAttempts})`);
    
    // 서버에 상태 확인 요청
    fetch(`/api/check-youtube-status/${topic.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('상태 확인 응답:', data);
      
      // 진행도 업데이트 (새로운 함수 사용)
      const progress = data.progress !== undefined ? data.progress : 0;
      const status = data.status || '처리 중...';
      
      showProgress('#report-content', progress, status, {
        maxAttempts: maxAttempts,
        currentAttempt: attempts
      });
      
      if (data.completed) {
        // 생성 완료된 경우 내용 표시
        console.log('유튜브 스크립트 생성 완료:', data);
        setTimeout(() => {
          displayArticle(data); // 완성된 스크립트 표시
        }, 1000); // 완료 애니메이션을 보여주기 위해 짧은 지연 추가
      } else if (attempts < maxAttempts) {
        // 아직 생성 중인 경우 재시도
        setTimeout(checkStatus, interval);
      } else {
        // 최대 시도 횟수 초과
        reportContent.innerHTML = `
          <div class="p-4 border border-red-200 bg-red-50 rounded">
            <h3 class="text-lg font-semibold text-red-700">시간 초과</h3>
            <p>유튜브 스크립트 생성이 예상보다 오래 걸리고 있습니다.</p>
            <button id="retry-youtube-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              다시 시도
            </button>
          </div>
        `;
        
        document.getElementById('retry-youtube-report')?.addEventListener('click', () => {
          generateArticleYoutube(topic);
        });
      }
    })
    .catch(error => {
      console.error('유튜브 스크립트 상태 확인 중 오류:', error);
      if (attempts < maxAttempts) {
        setTimeout(checkStatus, interval);
      } else {
        showProgress('#report-content', 0, '오류가 발생했습니다', {
          theme: 'error'
        });
        
        setTimeout(() => {
          reportContent.innerHTML = `
            <div class="p-4 border border-red-200 bg-red-50 rounded">
              <h3 class="text-lg font-semibold text-red-700">오류 발생</h3>
              <p>유튜브 스크립트 상태 확인 중 문제가 발생했습니다.</p>
              <button id="retry-youtube-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                다시 시도
              </button>
            </div>
          `;
          
          document.getElementById('retry-youtube-report')?.addEventListener('click', () => {
            generateArticleYoutube(topic);
          });
        }, 1500);
      }
    });
  };
  
  // 첫 번째 확인 시작
  checkStatus();
}

// 유튜브 스크립트 생성 함수 수정
function generateArticleYoutube(topic) {
  // 현재 선택된 토픽이 없으면 종료
  if (!topic) return;
  
  console.log('유튜브 스크립트 생성 요청 시작:', topic);
  
  // 로딩 상태 표시
  reportContent.innerHTML = `
    <div class="text-center py-12">
      <p class="text-xl mb-4">유튜브 스크립트를 생성하는 중입니다...</p>
      <div class="spinner"></div>
      <p class="mt-4 text-gray-500">영상 스크립트 작성 중... 잠시만 기다려주세요.</p>
    </div>
  `;
  
  // 유튜브 스크립트 생성 API 호출
  fetch('/api/generate-article-youtube', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      topic: topic,
      searchResults: searchResults
    })
  })
  .then(response => {
    console.log('유튜브 API 응답 상태:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('유튜브 API 응답 데이터:', data);
    
    // 응답 처리
    if (data.generatingInProgress) {
      console.log('스크립트 생성 중... 폴링 시작');
      // 폴링 시작
      pollYoutubeScriptStatus(topic);
    } else {
      // 이미 생성된 경우 바로 표시
      console.log('이미 생성된 스크립트 표시');
      displayArticle(data);
    }
  })
  .catch(error => {
    console.error('유튜브 스크립트 요청 오류:', error);
    reportContent.innerHTML = `
      <div class="p-4 border border-red-200 bg-red-50 rounded">
        <h3 class="text-lg font-semibold text-red-700">오류 발생</h3>
        <p>유튜브 스크립트를 불러오는 중 문제가 발생했습니다.</p>
        <button id="retry-youtube-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          다시 시도
        </button>
      </div>
    `;
    
    document.getElementById('retry-youtube-report')?.addEventListener('click', () => {
      generateArticleYoutube(topic);
    });
  });
}

// 기사 내용 표시 함수
function displayArticle(article) {
  // 표시할 내용이 없는 경우 처리
  if (!article || (!article.content && !article.script)) {
    reportContent.innerHTML = `
      <div class="p-4 border border-red-200 bg-red-50 rounded">
        <h3 class="text-lg font-semibold text-red-700">내용 없음</h3>
        <p>표시할 내용이 없습니다. 다시 시도해주세요.</p>
      </div>
    `;
    return;
  }

  console.log('기사 표시:', article);
  
  // 오류 발생 시 처리
  if (article.error || article.hasError) {
    reportContent.innerHTML = `
      <div class="p-4 border border-red-200 bg-red-50 rounded">
        <h3 class="text-lg font-semibold text-red-700">오류 발생</h3>
        <p>${article.error || '내용을 불러오는 중 문제가 발생했습니다.'}</p>
        <button id="retry-report" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          다시 시도
        </button>
      </div>
    `;
    
    // 다시 시도 버튼 이벤트 연결
    document.getElementById('retry-report')?.addEventListener('click', () => {
      const currentTopicElement = document.querySelector('.topic-item.selected');
      if (currentTopicElement) {
        const topicId = currentTopicElement.getAttribute('data-topic-id');
        const topic = topics.find(t => t.id == topicId);
        if (topic) {
          if (article.isVersion2) {
            generateArticleV2(topic);
          } else if (article.title && article.title.includes('유튜브 스크립트')) {
            generateArticleYoutube(topic);
          } else {
            generateArticle(topic);
          }
        }
      }
    });
    
    return;
  }
  
  // 컨텐츠 표시
  const content = article.content || (article.script ? article.script.content : '');
  if (!content) {
    reportContent.innerHTML = `
      <div class="p-4 border border-red-200 bg-red-50 rounded">
        <h3 class="text-lg font-semibold text-red-700">내용 없음</h3>
        <p>표시할 내용이 없습니다. 다시 시도해주세요.</p>
      </div>
    `;
    return;
  }
  
  // 제목 처리
  const isYoutubeScript = article.title && article.title.includes('유튜브 스크립트');
  const articleTitle = article.title || '제목 없음';
  
  // 본문 내용 표시
  reportContent.innerHTML = `
    <article class="prose prose-lg max-w-none">
      <h1 class="text-2xl font-bold mb-4">${articleTitle}</h1>
      <div class="article-content">
        ${content}
      </div>
    </article>
  `;
  
  // 유튜브 스크립트인 경우 추가 UI 요소
  if (isYoutubeScript) {
    // 유튜브 스크립트 컨테이너
    const scriptContainer = document.createElement('div');
    scriptContainer.className = 'mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200';
    scriptContainer.innerHTML = `
      <div class="flex items-center mb-3">
        <i class="fab fa-youtube text-red-600 text-2xl mr-2"></i>
        <h3 class="text-lg font-bold">유튜브 영상 스크립트</h3>
      </div>
      <p class="text-sm text-gray-600 mb-4">이 스크립트는 약 8-10분 분량의 유튜브 영상용으로 작성되었습니다.</p>
      <div class="flex justify-end">
        <button id="copy-script" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded flex items-center">
          <i class="far fa-copy mr-1"></i> 스크립트 복사
        </button>
      </div>
    `;
    
    // 스크립트 컨테이너를 reportContent의 맨 위에 추가
    const articleElement = reportContent.querySelector('article');
    if (articleElement) {
      articleElement.insertBefore(scriptContainer, articleElement.firstChild);
    
      // 복사 버튼 기능 추가
      document.getElementById('copy-script')?.addEventListener('click', () => {
        // HTML 태그를 제외한 텍스트만 복사
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const textOnly = tempDiv.textContent || tempDiv.innerText || '';
        
        navigator.clipboard.writeText(textOnly).then(() => {
          showNotification('스크립트가 클립보드에 복사되었습니다.', 'info');
        }, (err) => {
          console.error('클립보드 복사 실패:', err);
          showNotification('스크립트 복사에 실패했습니다.', 'error');
        });
      });
    }
  }
  
  // 관련 뉴스 표시
  if (article.relatedNews && article.relatedNews.length > 0) {
    const relatedNewsContainer = document.createElement('div');
    relatedNewsContainer.className = 'mt-8 p-4 bg-gray-50 rounded-lg';
    
    const relatedNewsTitle = document.createElement('h3');
    relatedNewsTitle.className = 'text-xl font-semibold mb-3';
    relatedNewsTitle.textContent = '관련 뉴스';
    
    const relatedNewsList = document.createElement('ul');
    relatedNewsList.className = 'space-y-2';
    
    article.relatedNews.slice(0, 5).forEach(news => {
      const listItem = document.createElement('li');
      listItem.className = 'flex items-start';
      
      const icon = document.createElement('i');
      icon.className = 'fas fa-newspaper text-blue-500 mt-1 mr-2';
      
      const newsContent = document.createElement('div');
      newsContent.className = 'flex-1';
      
      const newsTitle = document.createElement('a');
      newsTitle.className = 'font-medium hover:text-blue-600';
      newsTitle.textContent = news.title || '제목 없음';
      if (news.url) {
        newsTitle.href = news.url;
        newsTitle.target = '_blank';
        newsTitle.rel = 'noopener noreferrer';
      }
      
      const newsInfo = document.createElement('p');
      newsInfo.className = 'text-sm text-gray-600';
      newsInfo.textContent = `${news.source || '출처 미상'} · ${news.time || '날짜 불명'}`;
      
      newsContent.appendChild(newsTitle);
      newsContent.appendChild(newsInfo);
      
      listItem.appendChild(icon);
      listItem.appendChild(newsContent);
      
      relatedNewsList.appendChild(listItem);
    });
    
    relatedNewsContainer.appendChild(relatedNewsTitle);
    relatedNewsContainer.appendChild(relatedNewsList);
    
    // 관련 뉴스 컨테이너를 추가
    reportContent.appendChild(relatedNewsContainer);
  }
  
  // 생성 시간 표시
  if (article.generatedAt) {
    const generatedDate = new Date(article.generatedAt);
    const formattedDate = `${generatedDate.toLocaleDateString()} ${generatedDate.toLocaleTimeString()}`;
    
    const generatedInfo = document.createElement('div');
    generatedInfo.className = 'mt-4 text-sm text-gray-500 text-right';
    generatedInfo.textContent = `생성 시간: ${formattedDate}`;
    
    reportContent.appendChild(generatedInfo);
  }
}

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
  
  // 날짜 선택 UI 추가
  addDateSelectionControls();
  
  // 캐시 삭제 버튼 추가
  addClearCacheButton();
});

// 날짜 선택 컨트롤 UI 추가 함수
function addDateSelectionControls() {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'mb-4 p-3 bg-light rounded shadow-sm';
    
    // 날짜 선택 영역
    const dateSelectionDiv = document.createElement('div');
    dateSelectionDiv.className = 'date-selection d-flex align-items-center';
    
    // 날짜 선택 레이블
    const dateLabel = document.createElement('label');
    dateLabel.htmlFor = 'news-date-picker';
    dateLabel.className = 'me-2 fw-bold';
    dateLabel.textContent = '뉴스 날짜 선택:';
    
    // 날짜 선택 입력
    const datePicker = document.createElement('input');
    datePicker.type = 'date';
    datePicker.id = 'news-date-picker';
    datePicker.className = 'form-control form-control-sm d-inline-block';
    datePicker.style.width = 'auto';
    
    // 오늘 날짜로 기본값 설정
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // 하루 전으로 설정 (오늘 기사가 부족할 수 있음)
    datePicker.value = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    // 날짜 선택 적용 버튼
    const applyDateBtn = document.createElement('button');
    applyDateBtn.type = 'button';
    applyDateBtn.className = 'btn btn-primary ms-2';
    applyDateBtn.textContent = '적용';
    applyDateBtn.onclick = function() {
        const selectedDate = datePicker.value;
        if (!selectedDate) {
            alert('날짜를 선택해주세요.');
            return;
        }
        
        // 선택한 날짜 기반 분석 시작
        analyzeNewsByDate(selectedDate);
    };
    
    // 날짜 선택 영역에 요소 추가
    dateSelectionDiv.appendChild(dateLabel);
    dateSelectionDiv.appendChild(datePicker);
    dateSelectionDiv.appendChild(applyDateBtn);
    
    // 컨테이너에 날짜 선택 영역 추가
    controlsContainer.appendChild(dateSelectionDiv);
    
    // 컨테이너를 애플리케이션 최상단에 추가
    const appContainer = document.querySelector('#app');
    appContainer.insertBefore(controlsContainer, appContainer.firstChild);
}

// 캐시 삭제 버튼 추가 함수
function addClearCacheButton() {
    console.log('캐시 삭제 버튼 추가 함수 호출됨');
    
    // 분석 버튼이 존재하는지 확인
    const analyzeButton = document.getElementById('analyzeButton');
    if (!analyzeButton) {
        console.error('분석 버튼을 찾을 수 없어 캐시 삭제 버튼을 추가할 수 없습니다.');
        return;
    }
    
    // 기존 캐시 삭제 버튼이 있는지 확인하고 있으면 제거
    const existingCacheBtn = document.getElementById('clear-cache-btn');
    if (existingCacheBtn) {
        existingCacheBtn.remove();
    }
    
    // 분석 버튼의 클래스를 가져와서 캐시 삭제 버튼에 적용
    let btnClass = analyzeButton.className;
    
    // 캐시 삭제 버튼 생성 - 분석 버튼과 동일한 스타일 적용
    const clearCacheBtn = document.createElement('button');
    clearCacheBtn.type = 'button';
    clearCacheBtn.id = 'clear-cache-btn';
    clearCacheBtn.className = btnClass;
    
    // 붉은 계열 색상으로 변경
    clearCacheBtn.classList.remove('bg-primary', 'hover:bg-primary-light', 'active:bg-primary-dark');
    clearCacheBtn.classList.add('bg-red-500', 'hover:bg-red-400', 'active:bg-red-600');
    
    // 버튼 내용
    clearCacheBtn.innerHTML = '<i class="fas fa-trash-alt me-2"></i>캐시 삭제';
    clearCacheBtn.onclick = clearCache;
    
    // 툴팁 추가
    clearCacheBtn.setAttribute('data-bs-toggle', 'tooltip');
    clearCacheBtn.setAttribute('data-bs-placement', 'bottom');
    clearCacheBtn.setAttribute('title', '저장된 검색 결과와 생성된 기사를 삭제합니다');
    
    // 버튼 배치 방법 확인
    // 1. 분석 버튼의 부모가 flex 컨테이너인지 확인
    const analyzeParent = analyzeButton.parentElement;
    
    // 동일한 컨테이너에 버튼 추가
    analyzeParent.appendChild(clearCacheBtn);
    
    // flex layout 적용
    analyzeParent.style.display = 'flex';
    analyzeParent.style.alignItems = 'center';
    analyzeParent.style.gap = '10px';
    analyzeParent.style.justifyContent = 'center';
    
    // 툴팁 초기화 (Bootstrap이 있을 경우)
    if (typeof bootstrap !== 'undefined') {
        new bootstrap.Tooltip(clearCacheBtn);
    }
    
    console.log('캐시 삭제 버튼이 추가되었습니다');
}

// 메시지 표시 함수 개선
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        // 메시지 컨테이너가 없으면 생성
        const newContainer = document.createElement('div');
        newContainer.id = 'message-container';
        newContainer.className = 'mt-3';
        
        const appContainer = document.querySelector('#app');
        const topicsContainer = document.querySelector('#topics-container');
        
        if (topicsContainer) {
            appContainer.insertBefore(newContainer, topicsContainer);
        } else {
            appContainer.appendChild(newContainer);
        }
    }
    
    // 기존 메시지 제거
    document.getElementById('message-container').innerHTML = '';
    
    // 새 메시지 추가
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type} alert-dismissible fade show`;
    messageDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.getElementById('message-container').appendChild(messageDiv);
    
    // 일정 시간 후 자동으로 사라지게 설정
    setTimeout(() => {
        try {
            const alert = new bootstrap.Alert(messageDiv);
            alert.close();
        } catch (e) {
            messageDiv.remove();
        }
    }, 5000);
}

// 날짜 기반 뉴스 분석 함수
function analyzeNewsByDate(selectedDate) {
    // 로딩 상태 표시
    showLoading('선택한 날짜의 뉴스를 분석 중입니다...');
    
    // 날짜 기반 분석 API 호출
    fetch('/api/analyze-by-date', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetDate: selectedDate })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || '날짜 기반 분석 중 오류가 발생했습니다.');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('날짜 기반 분석 결과:', data);
        
        // 검색 시작 버튼 상태 변경
        const searchBtn = document.getElementById('search-btn');
        searchBtn.disabled = false;
        searchBtn.textContent = '분석 시작';
        
        // 로딩 상태 숨김
        hideLoading();
        
        // 결과가 없으면 안내 메시지 표시
        if (!data.topics || data.topics.length === 0) {
            showMessage('선택한 날짜에 대한 분석 결과가 없습니다. 다른 날짜를 선택해보세요.');
            return;
        }
        
        // 주제 표시
        showTopics(data.topics, selectedDate);
        
        // 분석이 완료되었음을 안내
        showMessage(`${new Date(selectedDate).toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        })} 기준 뉴스 분석이 완료되었습니다.`, 'success');
    })
    .catch(error => {
        console.error('날짜 기반 분석 오류:', error);
        
        // 검색 시작 버튼 상태 변경
        const searchBtn = document.getElementById('search-btn');
        searchBtn.disabled = false;
        searchBtn.textContent = '분석 시작';
        
        // 로딩 상태 숨김
        hideLoading();
        
        // 오류 메시지 표시
        showMessage(error.message || '날짜 기반 분석 중 오류가 발생했습니다.', 'danger');
    });
}

// 캐시 삭제 함수
async function clearCache() {
    console.log('캐시 삭제 함수 호출됨');
    
    // 애플 스타일 로딩 인디케이터 스타일 추가
    if (!document.getElementById('apple-loader-style')) {
        const style = document.createElement('style');
        style.id = 'apple-loader-style';
        style.textContent = `
            .apple-loader {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                animation: apple-spin 1s linear infinite;
                display: inline-block;
                vertical-align: middle;
                margin-right: 8px;
            }
            
            @keyframes apple-spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 캐시 삭제 버튼
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    const analyzeButton = document.getElementById('analyzeButton');
    
    // 확인 모달 생성
    const modalHtml = `
        <div class="modal fade" id="clearCacheModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">캐시 삭제 확인</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>정말로 모든 캐시를 삭제하시겠습니까?</p>
                        <p class="text-danger"><small>이 작업은 되돌릴 수 없으며, 저장된 모든 검색 결과와 생성된 기사가 삭제됩니다.</small></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                        <button type="button" class="btn btn-danger" id="confirmClearCache">삭제</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달이 있다면 제거
    const existingModal = document.getElementById('clearCacheModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 모달 인스턴스 생성 (Bootstrap이 있을 경우)
    let modal;
    if (typeof bootstrap !== 'undefined') {
        modal = new bootstrap.Modal(document.getElementById('clearCacheModal'));
        modal.show();
    } else {
        // Bootstrap이 없는 경우 간단한 확인 대화상자 사용
        if (!confirm('정말로 모든 캐시를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            return;
        }
        executeClearCache();
        return;
    }
    
    // 확인 버튼 이벤트 리스너
    document.getElementById('confirmClearCache').onclick = () => {
        modal.hide();
        executeClearCache();
    };
    
    // 캐시 삭제 실행 함수
    async function executeClearCache() {
        try {
            // 버튼 상태 업데이트
            clearCacheBtn.disabled = true;
            analyzeButton.disabled = true;
            
            // 애플 스타일 로딩 인디케이터로 변경
            const originalText = clearCacheBtn.innerHTML;
            clearCacheBtn.innerHTML = '<span class="apple-loader"></span>캐시 삭제 중...';
            
            // 캐시 삭제 API 호출
            const response = await fetch('/api/clear-cache', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    clearAll: true, 
                    timestamp: Date.now(),
                    removeArchive: true // 아카이브 데이터도 삭제하도록 명시적 파라미터 추가
                })
            });
            
            console.log('캐시 삭제 API 응답:', response.status);
            
            if (!response.ok) {
                throw new Error('캐시 삭제 요청 실패: ' + response.status);
            }
            
            const data = await response.json();
            console.log('캐시 삭제 결과:', data);
            
            // 상세 정보 로깅
            if (data.details) {
                console.log('삭제된 캐시 항목:', {
                    검색캐시: data.details.searchCacheCleared + '개',
                    키워드캐시: data.details.keywordCacheCleared + '개',
                    기사캐시: data.details.articleCacheCleared + '개',
                    아카이브: data.details.archiveDataCleared + '개 항목'
                });
            }
            
            // 성공 알림 표시
            showNotification('모든 캐시와 아카이브 데이터가 성공적으로 삭제되었습니다.', 'success');
            
            // 더 상세한 정보를 보여주는 메시지
            showMessage(`
                <strong>캐시 삭제 완료!</strong><br>
                - 검색 캐시: ${data.details?.searchCacheCleared || 0}개 항목 삭제<br>
                - 키워드 캐시: ${data.details?.keywordCacheCleared || 0}개 항목 삭제<br>
                - 기사 캐시: ${data.details?.articleCacheCleared || 0}개 항목 삭제<br>
                - 아카이브 데이터: ${data.details?.archiveDataCleared || 0}개 항목 삭제<br>
                <small class="text-muted">백업이 자동으로 생성되었습니다.</small>
            `, 'success');
            
            // 2초 후 페이지 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('캐시 삭제 오류:', error);
            
            // 버튼 상태 복원
            clearCacheBtn.disabled = false;
            analyzeButton.disabled = false;
            clearCacheBtn.innerHTML = '<i class="fas fa-trash-alt me-2"></i>캐시 삭제';
            
            // 오류 알림 표시
            showNotification('캐시 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
            
            // 더 상세한 오류 메시지
            showMessage(`
                <strong>캐시 삭제 실패</strong><br>
                오류 메시지: ${error.message}<br>
                <small>다시 시도하거나 서버 로그를 확인해주세요.</small>
            `, 'danger');
        }
    }
}

// 애플 스타일 로딩 인디케이터 추가
function addAppleStyleLoadingIndicator() {
    // 로딩 인디케이터용 스타일 추가
    if (!document.getElementById('apple-loader-style')) {
        const style = document.createElement('style');
        style.id = 'apple-loader-style';
        style.textContent = `
            .apple-loader {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                animation: apple-spin 1s linear infinite;
                display: inline-block;
                vertical-align: middle;
                margin-right: 8px;
            }
            
            @keyframes apple-spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// 진행 상태 표시 함수
function showProgress(container, progress, status, options = {}) {
  const {
    showIcon = true,
    theme = 'default',
    maxAttempts = 0,
    currentAttempt = 0
  } = options;
  
  // 적절한 테마 클래스 결정
  let themeClass = '';
  let iconHTML = '';
  
  if (progress < 30) {
    themeClass = 'ae-light';
    iconHTML = '<i class="fas fa-sync fa-spin progress-icon"></i>';
  } else if (progress < 70) {
    themeClass = 'ae-warning';
    iconHTML = '<i class="fas fa-cog fa-spin progress-icon"></i>';
  } else if (progress < 100) {
    themeClass = 'ae-success';
    iconHTML = '<i class="fas fa-spinner fa-spin progress-icon"></i>';
  } else {
    themeClass = 'ae-success progress-complete';
    iconHTML = '<i class="fas fa-check progress-icon"></i>';
  }
  
  // 오류 상태인 경우
  if (status && status.toLowerCase().includes('오류')) {
    themeClass = 'ae-error';
    iconHTML = '<i class="fas fa-exclamation-triangle progress-icon"></i>';
  }
  
  const element = document.querySelector(container);
  if (!element) return;
  
  // 최대 시도 횟수 정보 표시
  let attemptsInfo = '';
  if (maxAttempts > 0) {
    attemptsInfo = `<p class="text-gray-500 mt-2">진행 중... (시도: ${currentAttempt}/${maxAttempts})</p>`;
  }
  
  element.innerHTML = `
    <div class="text-center py-8">
      <p class="text-xl mb-4">${status || '처리 중...'}</p>
      <div class="progress-container mb-4">
        <div class="progress-bar ${themeClass}" style="width: ${progress}%;">
          ${showIcon ? iconHTML : ''}${progress}%
        </div>
      </div>
      <p class="status-message">${status || '진행 중...'}</p>
      ${attemptsInfo}
    </div>
  `;
}

// 검색 시작 시 진행 상태 표시하는 함수
function showSearchProgress() {
  const container = document.getElementById('app');
  
  // 기존 콘텐츠를 보존하면서 진행 상태 컨테이너 추가
  const progressContainer = document.createElement('div');
  progressContainer.id = 'search-progress-container';
  progressContainer.className = 'my-8';
  
  // 기존 주제 컨테이너 앞에 삽입
  const topicsContainer = document.getElementById('topics-container');
  if (topicsContainer) {
    container.insertBefore(progressContainer, topicsContainer);
  } else {
    container.appendChild(progressContainer);
  }
  
  // 초기 진행 상태 표시
  updateSearchProgress(5, '검색어 생성 중...');
  
  // 단계적으로 진행 상태 업데이트 (가상의 진행 상태)
  setTimeout(() => updateSearchProgress(15, 'RSS 피드 가져오는 중...'), 1000);
  setTimeout(() => updateSearchProgress(30, '외부 데이터 수집 중...'), 3000);
  setTimeout(() => updateSearchProgress(50, '주제 생성 준비 중...'), 5000);
  setTimeout(() => updateSearchProgress(70, '주제 분석 중...'), 7000);
  setTimeout(() => updateSearchProgress(90, '최종 결과 준비 중...'), 9000);
}

// 검색 진행 상태 업데이트 함수
function updateSearchProgress(progress, status) {
  showProgress('#search-progress-container', progress, status);
}

// 검색 진행 상태 숨기기 함수
function hideSearchProgress() {
  const progressContainer = document.getElementById('search-progress-container');
  if (progressContainer) {
    // 완료 상태로 표시 후 페이드아웃
    showProgress('#search-progress-container', 100, '분석 완료!');
    
    // 2초 후 제거
    setTimeout(() => {
      progressContainer.style.transition = 'opacity 0.5s ease';
      progressContainer.style.opacity = '0';
      setTimeout(() => {
        progressContainer.remove();
      }, 500);
    }, 2000);
  }
}

// 검색 버튼 클릭 이벤트 핸들러
document.getElementById('search-btn')?.addEventListener('click', function() {
  // 버튼 상태 변경
  this.disabled = true;
  this.textContent = '분석 중...';
  
  // 검색 진행 상태 표시
  showSearchProgress();
  
  // 날짜 선택 유무에 따라 처리 (날짜 선택기가 있는 경우)
  const datePicker = document.getElementById('date-picker');
  if (datePicker && datePicker.value) {
    analyzeNewsByDate(datePicker.value);
    return;
  }
  
  // 일반 뉴스 분석 시작
  fetch('/api/analyze-news', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || '분석 중 오류가 발생했습니다.');
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('분석 결과:', data);
    
    // 검색 시작 버튼 상태 변경
    const searchBtn = document.getElementById('search-btn');
    searchBtn.disabled = false;
    searchBtn.textContent = '분석 시작';
    
    // 진행 상태 표시 숨기기
    hideSearchProgress();
    
    // 로딩 상태 숨김
    hideLoading();
    
    // 결과가 없으면 안내 메시지 표시
    if (!data.topics || data.topics.length === 0) {
      showMessage('분석 결과가 없습니다. 다시 시도해보세요.');
      return;
    }
    
    // 주제 표시
    showTopics(data.topics);
    
    // 분석이 완료되었음을 안내
    showMessage('최신 뉴스 분석이 완료되었습니다.', 'success');
  })
  .catch(error => {
    console.error('분석 오류:', error);
    
    // 검색 시작 버튼 상태 변경
    const searchBtn = document.getElementById('search-btn');
    searchBtn.disabled = false;
    searchBtn.textContent = '분석 시작';
    
    // 진행 상태 표시 숨기기
    hideSearchProgress();
    
    // 로딩 상태 숨김
    hideLoading();
    
    // 오류 메시지 표시
    showMessage(error.message || '분석 중 오류가 발생했습니다.', 'danger');
  });
});