/**
 * DARTView - OpenDART API 유틸리티
 * 오픈다트 API를 통한 재무정보 조회 및 데이터 처리
 */

class DartAPI {
    constructor() {
        // API 설정
        this.baseUrl = 'https://opendart.fss.or.kr/api';
        this.apiKey = '6872f56da8755d35a823cc1d8b4e86c2696e1fa4'; // 실제 API 키로 교체 필요
        
        // 회사코드 데이터
        this.corpCodeData = null;
        
        // 보고서 코드
        this.reportCodes = {
            'annual': '11011',      // 사업보고서
            'quarter1': '11013',    // 1분기보고서
            'quarter2': '11012',    // 반기보고서
            'quarter3': '11014'     // 3분기보고서
        };
        
        // 초기화
        this.init();
    }

    /**
     * 초기화 - 회사코드 데이터 로드
     */
    async init() {
        try {
            await this.loadCorpCodeData();
            console.log('DART API 초기화 완료');
        } catch (error) {
            console.error('DART API 초기화 실패:', error);
        }
    }

    /**
     * CORPCODE.xml을 파싱하여 회사코드 데이터 로드
     */
    async loadCorpCodeData() {
        try {
            // 메모리에 이미 로드된 데이터가 있으면 사용
            if (this.corpCodeData) {
                console.log('이미 로드된 회사코드 데이터 사용');
                return;
            }

            console.log('CORPCODE.xml 파일을 읽어오는 중...');
            
            // XML 파일 읽기
            const response = await fetch('CORPCODE.xml');
            if (!response.ok) {
                throw new Error(`CORPCODE.xml 파일을 읽을 수 없습니다: ${response.status}`);
            }
            
            const xmlText = await response.text();
            
            // XML 파싱
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const corpList = xmlDoc.getElementsByTagName('list');
            
            const corpCodeMap = {};
            let processedCount = 0;
            
            for (let i = 0; i < corpList.length; i++) {
                const corp = corpList[i];
                const corpCode = corp.getElementsByTagName('corp_code')[0]?.textContent;
                const corpName = corp.getElementsByTagName('corp_name')[0]?.textContent;
                const stockCode = corp.getElementsByTagName('stock_code')[0]?.textContent;
                const modifyDate = corp.getElementsByTagName('modify_date')[0]?.textContent;
                
                if (corpCode && corpName) {
                    corpCodeMap[corpName] = {
                        corpCode: corpCode,
                        corpName: corpName,
                        stockCode: stockCode || null,
                        modifyDate: modifyDate
                    };
                    processedCount++;
                }
            }
            
            this.corpCodeData = corpCodeMap;
            
            // localStorage에 저장하지 않고 메모리에만 유지
            // (용량 초과 문제 방지)
            console.log(`회사코드 데이터 로드 완료: ${processedCount}개 회사 (메모리에만 저장)`);
            
        } catch (error) {
            console.error('회사코드 데이터 로드 실패:', error);
            
            // 실패 시 기본 데이터 생성 (주요 회사들만)
            this.corpCodeData = this.createFallbackCorpData();
            console.log('기본 회사 데이터로 대체');
        }
    }

    /**
     * 기본 회사 데이터 생성 (CORPCODE.xml 로드 실패시 사용)
     */
    createFallbackCorpData() {
        return {
            '삼성전자': { corpCode: '00126380', corpName: '삼성전자', stockCode: '005930' },
            'LG전자': { corpCode: '00401731', corpName: 'LG전자', stockCode: '066570' },
            'SK하이닉스': { corpCode: '00164779', corpName: 'SK하이닉스', stockCode: '000660' },
            '현대자동차': { corpCode: '00164742', corpName: '현대자동차', stockCode: '005380' },
            '네이버': { corpCode: '00401062', corpName: 'NAVER', stockCode: '035420' },
            'NAVER': { corpCode: '00401062', corpName: 'NAVER', stockCode: '035420' },
            '카카오': { corpCode: '00401365', corpName: '카카오', stockCode: '035720' },
            'POSCO홀딩스': { corpCode: '00164471', corpName: 'POSCO홀딩스', stockCode: '005490' },
            '한국전력공사': { corpCode: '00104063', corpName: '한국전력공사', stockCode: '015760' },
            'KB금융': { corpCode: '00126170', corpName: 'KB금융', stockCode: '105560' }
        };
    }

    /**
     * 회사명으로 회사코드 검색
     */
    findCorpCode(companyName) {
        console.log('findCorpCode 호출됨 - 검색어:', companyName);
        console.log('corpCodeData 상태:', this.corpCodeData ? '로드됨' : '로드되지 않음');
        
        if (!this.corpCodeData) {
            console.error('회사코드 데이터가 로드되지 않았습니다.');
            throw new Error('회사코드 데이터가 로드되지 않았습니다.');
        }

        console.log('전체 회사 데이터 개수:', Object.keys(this.corpCodeData).length);

        // 정확한 이름 매치
        if (this.corpCodeData[companyName]) {
            console.log('정확한 매치 발견:', this.corpCodeData[companyName]);
            return this.corpCodeData[companyName];
        }

        // 부분 매치 시도
        const searchName = companyName.trim().toLowerCase();
        console.log('부분 매치 시도 - 검색어:', searchName);
        
        const matchedCompanies = [];
        for (const [name, data] of Object.entries(this.corpCodeData)) {
            if (name.toLowerCase().includes(searchName) || 
                searchName.includes(name.toLowerCase())) {
                matchedCompanies.push({ name, data });
            }
        }
        
        console.log('부분 매치 결과:', matchedCompanies);
        
        if (matchedCompanies.length > 0) {
            console.log('첫 번째 매치 반환:', matchedCompanies[0].data);
            return matchedCompanies[0].data;
        }

        console.log('검색 결과 없음');
        return null;
    }

    /**
     * 회사명 자동완성 검색
     */
    searchCompanies(query, limit = 10) {
        console.log('searchCompanies 호출됨 - 검색어:', query, '제한:', limit);
        
        if (!this.corpCodeData || !query) {
            console.log('corpCodeData 또는 query가 없음');
            return [];
        }
        
        const searchQuery = query.trim().toLowerCase();
        const results = [];
        
        console.log('실제 검색 시작 - 변환된 검색어:', searchQuery);
        
        for (const [name, data] of Object.entries(this.corpCodeData)) {
            if (name.toLowerCase().includes(searchQuery)) {
                results.push({
                    name: name,
                    ...data
                });
                
                if (results.length >= limit) break;
            }
        }
        
        console.log('자동완성 검색 결과:', results);
        return results;
    }

    /**
     * 단일회사 주요계정 조회
     */
    async getFinancialStatement(corpCode, businessYear, reportCode = '11011') {
        try {
            const url = new URL(`${this.baseUrl}/fnlttSinglAcnt.json`);
            url.searchParams.append('crtfc_key', this.apiKey);
            url.searchParams.append('corp_code', corpCode);
            url.searchParams.append('bsns_year', businessYear);
            url.searchParams.append('reprt_code', reportCode);

            console.log('API 요청 URL:', url.toString());

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors', // CORS 명시적 설정
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP 오류: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            // API 응답 상태 확인
            if (data.status !== '000') {
                throw new Error(this.getErrorMessage(data.status, data.message));
            }

            console.log('API 응답 성공:', data);
            return this.parseFinancialData(data.list);
            
        } catch (error) {
            console.error('재무정보 조회 실패:', error);
            
            // CORS 에러인지 확인
            if (error.message.includes('CORS') || error.message.includes('fetch')) {
                throw new Error(
                    'CORS 정책으로 인해 OpenDART API에 직접 접근할 수 없습니다.\n' +
                    '이는 브라우저 보안 정책에 의한 것으로, 실제 서비스에서는 백엔드 서버를 통해 API를 호출해야 합니다.\n' +
                    '지금은 데모 데이터로 기능을 체험해보세요.'
                );
            }
            
            throw error;
        }
    }

    /**
     * 재무데이터 파싱 및 구조화
     */
    parseFinancialData(rawData) {
        if (!rawData || !Array.isArray(rawData)) {
            return null;
        }

        const result = {
            companyInfo: {
                corpCode: rawData[0]?.corp_code || '',
                stockCode: rawData[0]?.stock_code || '',
                businessYear: rawData[0]?.bsns_year || ''
            },
            balanceSheet: {},
            incomeStatement: {},
            consolidated: {},
            individual: {}
        };

        rawData.forEach(item => {
            const key = this.normalizeAccountName(item.account_nm);
            const isConsolidated = item.fs_div === 'CFS';
            const isBalanceSheet = item.sj_div === 'BS';
            
            const parsedItem = {
                accountName: item.account_nm,
                fsDiv: item.fs_div,
                fsName: item.fs_nm,
                sjDiv: item.sj_div,
                sjName: item.sj_nm,
                currentAmount: this.parseAmount(item.thstrm_amount),
                currentPeriod: item.thstrm_nm,
                currentDate: item.thstrm_dt,
                previousAmount: this.parseAmount(item.frmtrm_amount),
                previousPeriod: item.frmtrm_nm,
                previousDate: item.frmtrm_dt,
                beforePreviousAmount: this.parseAmount(item.bfefrmtrm_amount),
                order: parseInt(item.ord),
                currency: item.currency
            };

            // 연결/개별 구분
            if (isConsolidated) {
                result.consolidated[key] = parsedItem;
            } else {
                result.individual[key] = parsedItem;
            }

            // 재무상태표/손익계산서 구분
            if (isBalanceSheet) {
                result.balanceSheet[key] = parsedItem;
            } else {
                result.incomeStatement[key] = parsedItem;
            }
        });

        return result;
    }

    /**
     * 계정명 정규화
     */
    normalizeAccountName(accountName) {
        return accountName.replace(/\s+/g, '').toLowerCase();
    }

    /**
     * 금액 문자열을 숫자로 변환
     */
    parseAmount(amountStr) {
        if (!amountStr || amountStr === '-') return 0;
        return parseInt(amountStr.replace(/,/g, '')) || 0;
    }

    /**
     * 금액을 포맷팅 (백만원 단위)
     */
    formatAmount(amount, unit = '백만원') {
        if (!amount || amount === 0) return '0';
        
        const millions = Math.round(amount / 1000000);
        return millions.toLocaleString() + ` ${unit}`;
    }

    /**
     * 주요 재무지표 추출
     */
    extractKeyMetrics(financialData) {
        if (!financialData) return null;

        // 연결재무제표 우선, 없으면 개별재무제표 사용
        const data = Object.keys(financialData.consolidated).length > 0 
            ? financialData.consolidated 
            : financialData.individual;

        return {
            totalAssets: data['자산총계']?.currentAmount || 0,
            totalLiabilities: data['부채총계']?.currentAmount || 0,
            totalEquity: data['자본총계']?.currentAmount || 0,
            revenue: data['매출액']?.currentAmount || 0,
            operatingIncome: data['영업이익']?.currentAmount || 0,
            netIncome: data['당기순이익']?.currentAmount || data['당기순이익(손실)']?.currentAmount || 0,
            
            // 전년도 데이터
            previousTotalAssets: data['자산총계']?.previousAmount || 0,
            previousRevenue: data['매출액']?.previousAmount || 0,
            previousNetIncome: data['당기순이익']?.previousAmount || data['당기순이익(손실)']?.previousAmount || 0
        };
    }

    /**
     * API 에러 메시지 변환
     */
    getErrorMessage(status, message) {
        const errorMessages = {
            '010': '등록되지 않은 API 키입니다.',
            '011': '사용할 수 없는 API 키입니다.',
            '012': '접근할 수 없는 IP입니다.',
            '013': '조회된 데이터가 없습니다.',
            '014': '파일이 존재하지 않습니다.',
            '020': '요청 제한을 초과하였습니다.',
            '021': '조회 가능한 회사 개수가 초과하였습니다.',
            '100': '부적절한 필드 값입니다.',
            '101': '부적절한 접근입니다.',
            '800': '시스템 점검 중입니다.',
            '900': '정의되지 않은 오류가 발생하였습니다.',
            '901': '사용자 계정의 개인정보 보유기간이 만료되었습니다.'
        };

        return errorMessages[status] || message || '알 수 없는 오류가 발생했습니다.';
    }

    /**
     * API 키 설정
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * API 키 유효성 검사
     */
    isValidApiKey() {
        return this.apiKey && this.apiKey.length === 40 && this.apiKey !== 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    }
}

// 전역 인스턴스 생성
window.dartAPI = new DartAPI(); 