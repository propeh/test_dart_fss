/**
 * DARTView - 메인 애플리케이션
 * 재무제표 시각화 웹 애플리케이션의 메인 로직
 */

class DartViewApp {
    constructor() {
        this.currentFinancialData = null;
        this.charts = {};
        
        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        this.setupEventListeners();
        
        // CORPCODE.xml 로딩 상태 표시
        this.showAlert('회사 데이터를 로딩중입니다...', 'info');
        
        // DART API 초기화 대기 (최대 30초)
        let retryCount = 0;
        const maxRetries = 30;
        
        while (retryCount < maxRetries) {
            if (window.dartAPI && window.dartAPI.corpCodeData) {
                this.hideAlert();
                this.showAlert(`회사 데이터 로딩 완료! ${Object.keys(window.dartAPI.corpCodeData).length}개 회사 검색 가능`, 'success');
                setTimeout(() => this.hideAlert(), 3000);
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
            
            if (retryCount === 10) {
                this.showAlert('회사 데이터 로딩 중... 잠시만 기다려주세요.', 'warning');
            }
            
            if (retryCount === maxRetries) {
                this.showAlert('회사 데이터 로딩에 시간이 오래 걸리고 있습니다. 새로고침을 시도해보세요.', 'danger');
                break;
            }
        }
        
        this.showApiKeyPrompt();
        console.log('DartView 애플리케이션 초기화 완료');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 검색 폼 이벤트
        const searchForm = document.getElementById('searchForm');
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // 회사명 입력 자동완성
        const companyNameInput = document.getElementById('companyName');
        companyNameInput.addEventListener('input', (e) => {
            this.handleCompanyNameInput(e.target.value);
        });

        // 엔터키 처리
        companyNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSearch();
            }
        });
    }

    /**
     * API 키 입력 프롬프트
     */
    showApiKeyPrompt() {
        if (!window.dartAPI.isValidApiKey()) {
            const apiKey = prompt(
                'OpenDART API 키를 입력해주세요.\n' +
                'API 키는 https://opendart.fss.or.kr 에서 발급받을 수 있습니다.',
                ''
            );
            
            if (apiKey && apiKey.length === 40) {
                window.dartAPI.setApiKey(apiKey);
                this.showAlert('API 키가 설정되었습니다.', 'success');
            } else if (apiKey) {
                this.showAlert('올바른 API 키를 입력해주세요. (40자리)', 'warning');
                setTimeout(() => this.showApiKeyPrompt(), 1000);
            } else {
                this.showAlert('API 키가 필요합니다. 데모 데이터로 진행합니다.', 'info');
            }
        }
    }

    /**
     * 회사명 입력 자동완성 처리
     */
    handleCompanyNameInput(value) {
        // 간단한 디바운싱
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (value.length >= 2) {
                this.showCompanySuggestions(value);
            } else {
                this.hideCompanySuggestions();
            }
        }, 300);
    }

    /**
     * 회사명 자동완성 목록 표시
     */
    showCompanySuggestions(query) {
        try {
            const suggestions = window.dartAPI.searchCompanies(query, 5);
            
            let suggestionsList = document.getElementById('companySuggestions');
            if (!suggestionsList) {
                suggestionsList = document.createElement('div');
                suggestionsList.id = 'companySuggestions';
                suggestionsList.className = 'list-group position-absolute w-100';
                suggestionsList.style.zIndex = '1000';
                suggestionsList.style.maxHeight = '200px';
                suggestionsList.style.overflowY = 'auto';
                
                const companyNameInput = document.getElementById('companyName');
                companyNameInput.parentNode.appendChild(suggestionsList);
                companyNameInput.parentNode.style.position = 'relative';
            }

            suggestionsList.innerHTML = '';
            
            suggestions.forEach(company => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'list-group-item list-group-item-action';
                item.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <span><strong>${company.name}</strong></span>
                        <small class="text-muted">${company.stockCode || '비상장'}</small>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    document.getElementById('companyName').value = company.name;
                    this.hideCompanySuggestions();
                });
                
                suggestionsList.appendChild(item);
            });
            
        } catch (error) {
            console.warn('자동완성 검색 실패:', error);
        }
    }

    /**
     * 회사명 자동완성 목록 숨김
     */
    hideCompanySuggestions() {
        const suggestionsList = document.getElementById('companySuggestions');
        if (suggestionsList) {
            suggestionsList.remove();
        }
    }

    /**
     * 검색 처리
     */
    async handleSearch() {
        const companyName = document.getElementById('companyName').value.trim();
        let businessYear = document.getElementById('businessYear').value;

        if (!companyName) {
            this.showAlert('회사명을 입력해주세요.', 'warning');
            return;
        }

        // 연도가 선택되지 않은 경우 최신 연도로 설정
        if (!businessYear) {
            businessYear = '2023'; // 기본값으로 2023년 설정
            document.getElementById('businessYear').value = businessYear;
            this.showAlert(`연도가 선택되지 않아 ${businessYear}년으로 자동 설정했습니다.`, 'info');
        }

        this.hideCompanySuggestions();
        this.showLoading(true);
        this.hideAlert();

        try {
            // 회사코드 찾기
            const companyInfo = window.dartAPI.findCorpCode(companyName);
            if (!companyInfo) {
                throw new Error(`"${companyName}"에 해당하는 회사를 찾을 수 없습니다.`);
            }

            console.log('검색된 회사 정보:', companyInfo);

            // API 키 확인
            if (!window.dartAPI.isValidApiKey()) {
                // 데모 데이터 표시
                this.showDemoData(companyName, businessYear);
                return;
            }

            // 재무정보 조회
            try {
                const financialData = await window.dartAPI.getFinancialStatement(
                    companyInfo.corpCode,
                    businessYear,
                    '11011' // 사업보고서
                );

                if (!financialData) {
                    throw new Error('재무정보를 가져올 수 없습니다.');
                }

                this.currentFinancialData = financialData;
                this.displayResults(companyInfo, financialData);
                
            } catch (apiError) {
                console.warn('API 호출 실패, 데모 데이터로 대체:', apiError);
                
                // CORS 에러나 API 호출 실패시 데모 데이터 표시
                this.showDemoData(companyName, businessYear);
                
                if (apiError.message.includes('CORS')) {
                    this.showAlert(
                        'CORS 정책으로 인해 실제 API 호출이 제한됩니다. 데모 데이터로 기능을 체험해보세요.', 
                        'warning'
                    );
                } else {
                    this.showAlert(
                        `API 오류: ${apiError.message}\n데모 데이터로 기능을 체험해보세요.`, 
                        'warning'
                    );
                }
            }
            
        } catch (error) {
            console.error('검색 오류:', error);
            this.showAlert(error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 데모 데이터 표시 (API 키가 없을 때)
     */
    showDemoData(companyName, businessYear) {
        // 실제 검색된 회사 정보 가져오기
        const actualCompanyInfo = window.dartAPI.findCorpCode(companyName);
        
        const demoData = this.generateDemoData(companyName, businessYear);
        const companyInfo = {
            corpName: companyName,
            corpCode: actualCompanyInfo ? actualCompanyInfo.corpCode : '00000000',
            stockCode: actualCompanyInfo ? actualCompanyInfo.stockCode : null
        };
        
        this.currentFinancialData = demoData;
        this.displayResults(companyInfo, demoData);
        this.showAlert('데모 데이터입니다. 실제 데이터를 보려면 API 키를 등록해주세요.', 'info');
    }

    /**
     * 데모 데이터 생성
     */
    generateDemoData(companyName, year) {
        const baseAmount = Math.floor(Math.random() * 1000000000000); // 1조원 기준
        
        return {
            companyInfo: {
                corpCode: '00000000',
                stockCode: '000000',
                businessYear: year
            },
            consolidated: {
                '자산총계': {
                    accountName: '자산총계',
                    currentAmount: baseAmount,
                    previousAmount: baseAmount * 0.9,
                    currency: 'KRW',
                    fsName: '연결재무제표',
                    sjName: '재무상태표',
                    order: 1
                },
                '부채총계': {
                    accountName: '부채총계',
                    currentAmount: baseAmount * 0.4,
                    previousAmount: baseAmount * 0.42,
                    currency: 'KRW',
                    fsName: '연결재무제표',
                    sjName: '재무상태표',
                    order: 2
                },
                '자본총계': {
                    accountName: '자본총계',
                    currentAmount: baseAmount * 0.6,
                    previousAmount: baseAmount * 0.48,
                    currency: 'KRW',
                    fsName: '연결재무제표',
                    sjName: '재무상태표',
                    order: 3
                },
                '매출액': {
                    accountName: '매출액',
                    currentAmount: baseAmount * 0.8,
                    previousAmount: baseAmount * 0.75,
                    currency: 'KRW',
                    fsName: '연결재무제표',
                    sjName: '손익계산서',
                    order: 4
                },
                '영업이익': {
                    accountName: '영업이익',
                    currentAmount: baseAmount * 0.1,
                    previousAmount: baseAmount * 0.08,
                    currency: 'KRW',
                    fsName: '연결재무제표',
                    sjName: '손익계산서',
                    order: 5
                },
                '당기순이익': {
                    accountName: '당기순이익',
                    currentAmount: baseAmount * 0.08,
                    previousAmount: baseAmount * 0.06,
                    currency: 'KRW',
                    fsName: '연결재무제표',
                    sjName: '손익계산서',
                    order: 6
                }
            },
            individual: {}
        };
    }

    /**
     * 검색 결과 표시
     */
    displayResults(companyInfo, financialData) {
        this.showResultSection(true);
        this.displayCompanyInfo(companyInfo, financialData);
        this.displayKeyMetrics(financialData);
        this.displayCharts(financialData);
        this.displayFinancialTable(financialData);
    }

    /**
     * 회사 정보 표시
     */
    displayCompanyInfo(companyInfo, financialData) {
        const companyDetails = document.getElementById('companyDetails');
        const businessYear = financialData.companyInfo.businessYear;
        
        companyDetails.innerHTML = `
            <div class="company-info">
                <div class="row">
                    <div class="col-md-8">
                        <h4 class="mb-2">${companyInfo.corpName || companyInfo.name}</h4>
                        <p class="mb-1">
                            <span class="badge bg-primary me-2">회사코드: ${companyInfo.corpCode}</span>
                            ${companyInfo.stockCode ? `<span class="badge bg-success me-2">종목코드: ${companyInfo.stockCode}</span>` : '<span class="badge bg-secondary me-2">비상장</span>'}
                            <span class="badge bg-info">사업연도: ${businessYear}</span>
                        </p>
                        <p class="text-muted mb-0">
                            <i class="fas fa-calendar me-1"></i>
                            ${new Date().toLocaleDateString()} 기준 조회
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-outline-primary btn-sm" onclick="app.exportData()">
                            <i class="fas fa-download me-1"></i>데이터 내보내기
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 주요 재무지표 표시
     */
    displayKeyMetrics(financialData) {
        const metrics = window.dartAPI.extractKeyMetrics(financialData);
        
        if (!metrics) {
            this.showAlert('재무지표를 추출할 수 없습니다.', 'warning');
            return;
        }

        // 각 지표 업데이트
        document.getElementById('totalAssets').textContent = 
            window.dartAPI.formatAmount(metrics.totalAssets);
        document.getElementById('totalLiabilities').textContent = 
            window.dartAPI.formatAmount(metrics.totalLiabilities);
        document.getElementById('totalEquity').textContent = 
            window.dartAPI.formatAmount(metrics.totalEquity);
        document.getElementById('totalRevenue').textContent = 
            window.dartAPI.formatAmount(metrics.revenue);
    }

    /**
     * 차트 표시
     */
    displayCharts(financialData) {
        const metrics = window.dartAPI.extractKeyMetrics(financialData);
        
        if (!metrics) return;

        // 기존 차트 제거
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });

        // 재무상태표 파이 차트
        this.createBalanceSheetChart(metrics);
        
        // 주요 재무지표 막대 차트
        this.createFinancialMetricsChart(metrics);
    }

    /**
     * 재무상태표 파이 차트 생성
     */
    createBalanceSheetChart(metrics) {
        const ctx = document.getElementById('balanceSheetChart').getContext('2d');
        
        this.charts.balanceSheet = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['자산', '부채', '자본'],
                datasets: [{
                    data: [
                        metrics.totalAssets,
                        metrics.totalLiabilities,
                        metrics.totalEquity
                    ],
                    backgroundColor: [
                        '#A8E6CF', // 파스텔 민트그린 (자산)
                        '#FFB3BA', // 파스텔 핑크 (부채)
                        '#B3D9FF'  // 파스텔 스카이블루 (자본)
                    ],
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBackgroundColor: [
                        '#98D982', // 호버시 조금 더 진한 톤
                        '#FF9AA2',
                        '#9AC8FF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12,
                                family: "'Segoe UI', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: '#ddd',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${window.dartAPI.formatAmount(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 주요 재무지표 막대 차트 생성
     */
    createFinancialMetricsChart(metrics) {
        const ctx = document.getElementById('financialMetricsChart').getContext('2d');
        
        this.charts.financialMetrics = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['매출액', '영업이익', '당기순이익'],
                datasets: [
                    {
                        label: '당기',
                        data: [
                            metrics.revenue / 1000000, // 백만원 단위로 변환
                            metrics.operatingIncome / 1000000,
                            metrics.netIncome / 1000000
                        ],
                        backgroundColor: '#C8A8E9', // 파스텔 라벤더
                        borderColor: '#B794D6',
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: '#B794D6'
                    },
                    {
                        label: '전기',
                        data: [
                            metrics.previousRevenue / 1000000,
                            0, // 영업이익 전기 데이터 (필요시 추가)
                            metrics.previousNetIncome / 1000000
                        ],
                        backgroundColor: '#D4C5E8', // 연한 파스텔 라벤더
                        borderColor: '#C8A8E9',
                        borderWidth: 2,
                        borderRadius: 6,
                        hoverBackgroundColor: '#C8A8E9'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12,
                                family: "'Segoe UI', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: '#ddd',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}백만원`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '금액 (백만원)',
                            color: '#666',
                            font: {
                                size: 12,
                                weight: 'normal'
                            }
                        },
                        ticks: {
                            color: '#666',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        grid: {
                            color: '#f0f0f0',
                            lineWidth: 1
                        }
                    },
                    x: {
                        ticks: {
                            color: '#666',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 재무제표 테이블 표시
     */
    displayFinancialTable(financialData) {
        const tableBody = document.querySelector('#financialTable tbody');
        tableBody.innerHTML = '';

        // 연결재무제표 우선, 없으면 개별재무제표
        const data = Object.keys(financialData.consolidated).length > 0 
            ? financialData.consolidated 
            : financialData.individual;

        // 계정과목 정렬
        const sortedAccounts = Object.values(data).sort((a, b) => a.order - b.order);

        sortedAccounts.forEach(account => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <strong>${account.accountName}</strong>
                    <br>
                    <small class="text-muted">${account.fsName} - ${account.sjName}</small>
                </td>
                <td class="text-end number-format">
                    ${window.dartAPI.formatAmount(account.currentAmount)}
                    ${account.previousAmount ? `<br><small class="text-muted">전기: ${window.dartAPI.formatAmount(account.previousAmount)}</small>` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * 데이터 내보내기
     */
    exportData() {
        if (!this.currentFinancialData) {
            this.showAlert('내보낼 데이터가 없습니다.', 'warning');
            return;
        }

        try {
            const dataStr = JSON.stringify(this.currentFinancialData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `financial_data_${Date.now()}.json`;
            link.click();
            
            this.showAlert('데이터가 다운로드되었습니다.', 'success');
        } catch (error) {
            this.showAlert('데이터 내보내기에 실패했습니다.', 'danger');
        }
    }

    /**
     * 로딩 상태 표시/숨김
     */
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = show ? 'block' : 'none';
    }

    /**
     * 결과 섹션 표시/숨김
     */
    showResultSection(show) {
        const resultSection = document.getElementById('resultSection');
        resultSection.style.display = show ? 'block' : 'none';
        
        if (show) {
            resultSection.classList.add('fade-in');
        }
    }

    /**
     * 알림 메시지 표시
     */
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.innerHTML = alertHtml;
        
        // 5초 후 자동 숨김
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => {
                    alertContainer.innerHTML = '';
                }, 150);
            }
        }, 5000);
    }

    /**
     * 알림 메시지 숨김
     */
    hideAlert() {
        document.getElementById('alertContainer').innerHTML = '';
    }

    /**
     * 알림 타입별 아이콘 반환
     */
    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// 애플리케이션 인스턴스 생성
let app;

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    app = new DartViewApp();
});

// 디버깅 함수 (전역)
function debugCorpData() {
    console.log('=== 회사 데이터 디버깅 ===');
    
    if (!window.dartAPI) {
        console.error('dartAPI 인스턴스가 없습니다.');
        alert('dartAPI 인스턴스가 없습니다.');
        return;
    }
    
    if (!window.dartAPI.corpCodeData) {
        console.error('corpCodeData가 로드되지 않았습니다.');
        alert('회사 데이터가 아직 로드되지 않았습니다.\n잠시 후 다시 시도해주세요.');
        return;
    }
    
    const companyCount = Object.keys(window.dartAPI.corpCodeData).length;
    console.log('로드된 회사 수:', companyCount);
    
    // 샘플 회사들 확인
    const sampleCompanies = ['삼성전자', 'LG전자', 'SK하이닉스', '현대자동차', '네이버'];
    const foundCompanies = [];
    const notFoundCompanies = [];
    
    sampleCompanies.forEach(company => {
        if (window.dartAPI.corpCodeData[company]) {
            foundCompanies.push(company);
        } else {
            notFoundCompanies.push(company);
        }
    });
    
    console.log('찾은 샘플 회사들:', foundCompanies);
    console.log('못 찾은 샘플 회사들:', notFoundCompanies);
    
    // 첫 번째 회사 몇 개 출력
    const firstCompanies = Object.keys(window.dartAPI.corpCodeData).slice(0, 5);
    console.log('데이터에 있는 첫 5개 회사:', firstCompanies);
    
    // 검색 테스트
    const testSearch = window.dartAPI.searchCompanies('삼성', 3);
    console.log('삼성 검색 결과:', testSearch);
    
    alert(`
회사 데이터 상태:
- 총 ${companyCount}개 회사 로드됨
- 샘플 회사 찾기: ${foundCompanies.length}/${sampleCompanies.length}개 성공
- 찾은 회사: ${foundCompanies.join(', ')}
- 못 찾은 회사: ${notFoundCompanies.join(', ')}

자세한 정보는 개발자 도구 콘솔을 확인하세요.
    `);
} 