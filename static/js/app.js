let selectedFile = null;

// 파일 선택 이벤트
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.name.endsWith('.java')) {
            showError('Java 파일만 업로드 가능합니다.');
            return;
        }
        selectedFile = file;
        showFileInfo(file.name);
    }
});

// 드래그 앤 드롭
const uploadArea = document.querySelector('.upload-area');
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.background = '#e9ecef';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.background = '#f8f9fa';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.background = '#f8f9fa';
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.java')) {
        selectedFile = file;
        document.getElementById('fileInput').files = e.dataTransfer.files;
        showFileInfo(file.name);
    } else {
        showError('Java 파일만 업로드 가능합니다.');
    }
});

// 파일 정보 표시
function showFileInfo(fileName) {
    document.getElementById('fileName').textContent = fileName;
    document.getElementById('fileInfo').style.display = 'flex';
    document.getElementById('uploadBox').style.display = 'none';
    
    // 자동으로 리뷰 시작
    setTimeout(() => {
        reviewCode();
    }, 500);
}

// 파일 초기화
function clearFile() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('uploadBox').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}

// 코드 리뷰
async function reviewCode() {
    if (!selectedFile) {
        showError('파일을 선택해주세요.');
        return;
    }

    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');
    const errorMessage = document.getElementById('errorMessage');

    loading.style.display = 'block';
    resultsSection.style.display = 'none';
    errorMessage.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('/api/review', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || '리뷰 중 오류가 발생했습니다.');
        }

        if (data.success) {
            displayResults(data);
        } else {
            showError(data.error || '리뷰 중 오류가 발생했습니다.');
        }

    } catch (error) {
        showError(error.message);
    } finally {
        loading.style.display = 'none';
    }
}

// 결과 표시
function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    const basicAnalysis = document.getElementById('basicAnalysis');
    const aiReview = document.getElementById('aiReview');

    // 기본 분석 표시
    const analysis = data.basic_analysis;
    basicAnalysis.innerHTML = `
        <h2>📊 코드 분석</h2>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-label">총 라인 수</div>
                <div class="stat-value">${analysis.total_lines}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">코드 라인</div>
                <div class="stat-value">${analysis.code_lines}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">클래스 수</div>
                <div class="stat-value">${analysis.class_count}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">메서드 수</div>
                <div class="stat-value">${analysis.method_count}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">주석 비율</div>
                <div class="stat-value">${analysis.comment_ratio}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">복잡도</div>
                <div class="stat-value">${analysis.estimated_complexity}</div>
            </div>
        </div>
    `;

    // AI 리뷰 표시
    const review = data.ai_review;
    const hasApiKey = data.api_key_configured !== false;
    
    aiReview.innerHTML = `
        <h2>🤖 AI 코드 리뷰 ${!hasApiKey ? '<span style="color: #f44336; font-size: 0.6em;">(API 키 미설정)</span>' : ''}</h2>
        ${!hasApiKey ? `
            <div class="review-section" style="border-left-color: #f44336; background: #fff3cd;">
                <h3>⚠️ OpenAI API 키 설정 필요</h3>
                <p style="color: #856404;">
                    AI 코드 리뷰 기능을 사용하려면 OpenAI API 키를 설정해야 합니다.<br><br>
                    <strong>설정 방법:</strong><br>
                    1. Cloudflare Dashboard 접속<br>
                    2. Workers & Pages → 해당 Worker 선택<br>
                    3. Settings → Variables → Secrets<br>
                    4. "Add secret" 클릭<br>
                    5. Name: <code>OPENAI_API_KEY</code><br>
                    6. Value: API 키 입력<br><br>
                    또는 Wrangler CLI 사용:<br>
                    <code>wrangler secret put OPENAI_API_KEY</code>
                </p>
            </div>
        ` : ''}
        ${review.explanation ? `
            <div class="review-section">
                <h3>📝 코드 설명</h3>
                <p>${review.explanation}</p>
            </div>
        ` : ''}
        ${review.strengths ? `
            <div class="review-section">
                <h3>✅ 장점</h3>
                <p>${review.strengths}</p>
            </div>
        ` : ''}
        ${review.improvements ? `
            <div class="review-section">
                <h3>🔧 개선점</h3>
                <p>${review.improvements}</p>
            </div>
        ` : ''}
        ${review.suggestions ? `
            <div class="review-section">
                <h3>💡 개선 제안</h3>
                <p>${review.suggestions}</p>
            </div>
        ` : ''}
        ${review.best_practices ? `
            <div class="review-section">
                <h3>⭐ Best Practice</h3>
                <p>${review.best_practices}</p>
            </div>
        ` : ''}
        ${review.full_review ? `
            <div class="review-section">
                <h3>📄 전체 리뷰</h3>
                <p>${review.full_review}</p>
            </div>
        ` : ''}
    `;

    resultsSection.style.display = 'block';
}

// 에러 표시
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}
