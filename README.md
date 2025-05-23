# DARTView - 재무제표 시각화 사이트

📊 오픈다트(OpenDART) API를 활용한 기업 재무정보 조회 및 시각화 웹 애플리케이션

## 🎯 프로젝트 개요

DARTView는 금융감독원의 전자공시시스템(DART) API를 이용하여 상장기업의 재무제표 정보를 간편하게 검색하고, 직관적인 차트와 표로 시각화하는 웹 서비스입니다.

### 주요 특징

- 🔍 **회사명 검색**: 한글 회사명으로 간편하게 검색
- 📈 **시각적 차트**: Chart.js를 활용한 재무상태표 및 손익계산서 차트
- 📱 **반응형 디자인**: 모바일과 데스크톱 모두 지원
- 💾 **데이터 내보내기**: JSON 형태로 재무정보 다운로드 가능
- 🚀 **빠른 로딩**: 회사코드 데이터 캐싱으로 빠른 검색 지원

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **API**: OpenDART REST API

## 📁 프로젝트 구조

```
dartview/
├── index.html              # 메인 HTML 페이지
├── style.css               # 커스텀 CSS 스타일
├── app.js                  # 메인 애플리케이션 로직
├── utils/
│   └── dart-api.js        # DART API 유틸리티
├── CORPCODE.xml           # 회사코드 데이터 (OpenDART 제공)
└── README.md              # 프로젝트 설명서
```

## 🚀 설치 및 실행

### 1. 프로젝트 다운로드
```bash
git clone <repository-url>
cd dartview
```

### 2. CORPCODE.xml 파일 준비
- OpenDART에서 제공하는 CORPCODE.xml 파일을 프로젝트 루트에 배치
- 파일 다운로드: https://opendart.fss.or.kr/disclosureinfo/fnltt/dwld/main.do

### 3. 웹 서버 실행
HTTP 서버를 통해 실행해야 합니다 (CORS 정책으로 인해 file:// 프로토콜로는 동작하지 않음)

#### Python 사용 시:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js 사용 시:
```bash
npx http-server
```

#### Live Server (VS Code Extension) 사용 시:
VS Code에서 Live Server 확장프로그램 설치 후 index.html을 열고 "Go Live" 클릭

### 4. 브라우저에서 접속
```
http://localhost:8000
```

## 🔑 API 키 설정

### OpenDART API 키 발급
1. [OpenDART 홈페이지](https://opendart.fss.or.kr) 접속
2. 회원가입 및 로그인
3. API 키 발급 신청
4. 발급받은 40자리 API 키를 애플리케이션에 입력

### API 키 입력 방법
- 애플리케이션 실행 시 자동으로 API 키 입력 프롬프트가 표시됩니다
- API 키 없이도 데모 데이터로 기능 체험 가능

## 💡 사용법

### 1. 기본 검색
1. 회사명 입력란에 검색하고자 하는 회사명 입력 (예: "삼성전자", "LG전자")
2. 사업연도 선택 (2019~2023년)
3. "조회" 버튼 클릭

### 2. 자동완성 기능
- 회사명을 입력하면 자동으로 관련 회사 목록이 표시됩니다
- 목록에서 원하는 회사를 클릭하여 선택 가능

### 3. 결과 확인
검색 결과는 다음과 같이 표시됩니다:
- **회사 정보**: 회사명, 회사코드, 종목코드, 사업연도
- **재무 요약**: 총 자산, 총 부채, 총 자본, 매출액 카드
- **차트 시각화**: 
  - 재무상태표 구성 (파이 차트)
  - 주요 재무지표 (막대 차트)
- **상세 재무제표**: 모든 계정과목의 상세 정보 테이블

### 4. 데이터 내보내기
- 검색 결과 상단의 "데이터 내보내기" 버튼 클릭
- JSON 형태로 재무데이터 다운로드

## 📊 지원 데이터

### 재무제표 유형
- **재무상태표 (BS)**: 자산, 부채, 자본 정보
- **손익계산서 (IS)**: 매출, 비용, 이익 정보

### 데이터 구분
- **연결재무제표 (CFS)**: 자회사 포함 연결 기준
- **개별재무제표 (OFS)**: 개별 회사 기준

### 보고서 유형
- 사업보고서 (연간 보고서)
- 분기/반기 보고서 지원 예정

## 🎨 UI 특징

### 디자인 요소
- **모던 카드 UI**: 깔끔한 카드 기반 레이아웃
- **그라데이션 효과**: 시각적 아름다움을 위한 그라데이션 적용
- **호버 효과**: 인터랙티브한 사용자 경험
- **반응형 그리드**: 다양한 화면 크기 지원

### 색상 체계
- **Primary**: 파란색 (#0d6efd) - 주요 액션
- **Success**: 초록색 (#198754) - 자산 관련
- **Danger**: 빨간색 (#dc3545) - 부채 관련
- **Warning**: 노란색 (#ffc107) - 매출 관련

## 🔧 커스터마이징

### API 엔드포인트 변경
`utils/dart-api.js` 파일에서 `baseUrl` 수정:
```javascript
this.baseUrl = 'https://opendart.fss.or.kr/api';
```

### 차트 스타일 변경
`app.js` 파일의 차트 설정 부분에서 색상, 스타일 등 수정 가능:
```javascript
backgroundColor: ['#28a745', '#dc3545', '#007bff']
```

### UI 테마 변경
`style.css` 파일에서 CSS 변수를 통한 테마 변경:
```css
:root {
    --primary-color: #0d6efd;
    --success-color: #198754;
    /* ... */
}
```

## 🐛 문제 해결

### 자주 발생하는 문제

1. **CORS 오류**
   - 해결: HTTP 서버를 통해 실행 (file:// 프로토콜 사용 금지)

2. **회사코드 데이터 로드 실패**
   - 해결: CORPCODE.xml 파일이 프로젝트 루트에 있는지 확인

3. **API 응답 오류**
   - 해결: API 키 유효성 확인, 요청 제한 확인

4. **차트가 표시되지 않음**
   - 해결: Chart.js 라이브러리 로드 확인, 브라우저 콘솔 에러 확인

## 📝 라이선스

이 프로젝트는 교육 및 연습 목적으로 제작되었습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 연락처

프로젝트 관련 문의: [이메일 주소]

## 🙏 감사의 말

- **금융감독원**: OpenDART API 제공
- **Bootstrap**: UI 프레임워크
- **Chart.js**: 차트 라이브러리
- **Font Awesome**: 아이콘 제공

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요! 