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
    const secureCoding = data.ai_review.secure_coding;
    
    aiReview.innerHTML = `
        <h2>🤖 코드 리뷰</h2>
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
                <h3>💡 상세 개선 제안 (Java 8 최적화)</h3>
                <div style="white-space: pre-wrap; font-family: 'Courier New', monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">${review.suggestions}</div>
            </div>
        ` : ''}
        ${secureCoding ? `
            <div class="review-section" style="border-left-color: #f44336;">
                <h3>🔒 시큐어 코딩 체크 (CWEAP 가이드)</h3>
                <div style="margin-bottom: 15px;">
                    <strong>체크 항목:</strong> ${secureCoding.total_checked}개<br>
                    <strong>발견된 이슈:</strong> ${secureCoding.found_issues}개<br>
                    <strong>준수율:</strong> ${secureCoding.compliance_rate}%
                </div>
                ${secureCoding.issues && secureCoding.issues.length > 0 ? `
                    <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px;">
                        <strong>보안 이슈:</strong>
                        <ul style="margin-top: 10px;">
                            ${secureCoding.issues.map(issue => `
                                <li>
                                    <strong>[${issue.severity}]</strong> ${issue.name}: ${issue.issue}
                                    ${issue.lines && issue.lines.length > 0 ? `<br><small style="color: #666;">문제 라인: ${issue.lines.map(l => l.line).join(', ')}</small>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : '<p style="color: green;">✅ 보안 이슈가 발견되지 않았습니다.</p>'}
            </div>
        ` : ''}
        ${data.code_fixes && data.code_fixes.length > 0 ? `
            <div class="review-section" style="border-left-color: #4caf50; background: #f1f8f4;">
                <h3>🔧 구체적인 코드 수정 가이드</h3>
                <p style="margin-bottom: 15px;">시큐어 코딩 가이드에 맞게 다음과 같이 수정하세요:</p>
                ${data.code_fixes.map((fix, idx) => `
                    <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ddd;">
                        <h4 style="color: #f44336; margin-bottom: 10px;">
                            ${idx + 1}. ${fix.name} [${fix.severity}]
                        </h4>
                        ${fix.before ? `
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #f44336;">❌ 현재 코드 (수정 필요):</strong>
                                <pre style="background: #ffebee; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 0.9em; margin-top: 5px;">${fix.before}</pre>
                            </div>
                        ` : ''}
                        <div>
                            <strong style="color: #4caf50;">✅ 수정된 코드 (시큐어 코딩 가이드 준수):</strong>
                            <pre style="background: #e8f5e9; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 0.9em; margin-top: 5px; white-space: pre-wrap;">${fix.after}</pre>
                        </div>
                        ${fix.explanation ? `
                            <div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius: 5px;">
                                <strong>💡 설명:</strong> ${fix.explanation}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
        ${review.best_practices ? `
            <div class="review-section">
                <h3>⭐ Java 8 Best Practice</h3>
                <p>${review.best_practices}</p>
            </div>
        ` : ''}
        ${review.full_review ? `
            <div class="review-section">
                <h3>📄 전체 리뷰</h3>
                <div style="white-space: pre-wrap; font-family: 'Courier New', monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; max-height: 500px; overflow-y: auto;">${review.full_review}</div>
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
