let selectedFile = null;

// 파일 선택 이벤트
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.name.endsWith('.java') && !file.name.endsWith('.jsp')) {
            showError('Java 또는 JSP 파일만 업로드 가능합니다.');
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
    if (file && (file.name.endsWith('.java') || file.name.endsWith('.jsp'))) {
        selectedFile = file;
        document.getElementById('fileInput').files = e.dataTransfer.files;
        showFileInfo(file.name);
    } else {
        showError('Java 또는 JSP 파일만 업로드 가능합니다.');
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
            ${analysis.class_count !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">클래스 수</div>
                <div class="stat-value">${analysis.class_count}</div>
            </div>
            ` : ''}
            ${analysis.method_count !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">메서드 수</div>
                <div class="stat-value">${analysis.method_count}</div>
            </div>
            ` : ''}
            ${analysis.scriptlet_count !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">스크립틀릿 수</div>
                <div class="stat-value">${analysis.scriptlet_count}</div>
            </div>
            ` : ''}
            ${analysis.directive_count !== undefined ? `
            <div class="stat-item">
                <div class="stat-label">지시어 수</div>
                <div class="stat-value">${analysis.directive_count}</div>
            </div>
            ` : ''}
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
    const score = data.ai_review.score;
    
    // 점수 및 레벨 표시
    let scoreHtml = '';
    if (score) {
      const scorePercent = Math.round(score.total);
      const levelColors = {
        '신입': '#ff9800',
        '초급': '#2196F3',
        '중급': '#9C27B0',
        '고급': '#4CAF50'
      };
      const levelColor = levelColors[score.level] || '#667eea';
      
      scoreHtml = `
        <div class="score-card" style="background: linear-gradient(135deg, ${levelColor}15 0%, ${levelColor}05 100%); border: 2px solid ${levelColor}; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
            <div>
              <div style="font-size: 0.9em; color: #666; margin-bottom: 8px; font-weight: 500;">코드 품질 점수</div>
              <div style="display: flex; align-items: baseline; gap: 12px;">
                <span style="font-size: 3em; font-weight: 700; color: ${levelColor};">${scorePercent}</span>
                <span style="font-size: 1.5em; color: #999;">/ 100</span>
              </div>
            </div>
            <div style="flex: 1; min-width: 200px;">
              <div style="background: #e9ecef; border-radius: 12px; height: 12px; overflow: hidden; margin-bottom: 12px;">
                <div style="background: linear-gradient(90deg, ${levelColor} 0%, ${levelColor}CC 100%); height: 100%; width: ${scorePercent}%; transition: width 0.5s ease;"></div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.3em; font-weight: 600; color: ${levelColor};">${score.level}</span>
                <span style="color: #666; font-size: 0.95em;">${score.levelDescription}</span>
              </div>
              ${score.nextLevel ? `<div style="margin-top: 8px; color: #999; font-size: 0.9em;">다음 목표: ${score.nextLevel}</div>` : ''}
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <div>
              <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">프레임워크</div>
              <div style="font-size: 1.2em; font-weight: 600; color: #667eea;">${Math.round(score.framework)}점</div>
            </div>
            <div>
              <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">보안</div>
              <div style="font-size: 1.2em; font-weight: 600; color: #f44336;">${Math.round(score.security)}점</div>
            </div>
          </div>
        </div>
      `;
    }
    
    aiReview.innerHTML = `
        <h2>🤖 코드 리뷰</h2>
        ${scoreHtml}
        ${review.explanation ? `
            <div class="review-section" style="border-left-color: #2196F3;">
                <h3>📝 코드 설명</h3>
                <p>${review.explanation}</p>
            </div>
        ` : ''}
        ${review.strengths ? `
            <div class="review-section" style="border-left-color: #4CAF50; background: linear-gradient(135deg, #f1f8f4 0%, #ffffff 100%);">
                <h3>✅ 장점</h3>
                <p>${review.strengths}</p>
            </div>
        ` : ''}
        ${review.improvements ? `
            <div class="review-section" style="border-left-color: #FF9800; background: linear-gradient(135deg, #fff8f0 0%, #ffffff 100%);">
                <h3>🔧 개선점</h3>
                <p>${review.improvements}</p>
            </div>
        ` : ''}
        ${review.suggestions ? `
            <div class="review-section" style="border-left-color: #ff9800;">
                <h3>💡 상세 개선 제안</h3>
                <div class="suggestions-content">${formatSuggestions(review.suggestions)}</div>
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
        ${data.code_fixes && data.code_fixes.length > 0 ? (() => {
            let codeFixesHtml = '<div class="review-section" style="border-left-color: #4caf50; background: #f1f8f4;"><h3>🔧 구체적인 코드 수정 가이드</h3><p style="margin-bottom: 15px;">시큐어 코딩 가이드에 맞게 다음과 같이 수정하세요:</p>';
            data.code_fixes.forEach((fix, idx) => {
                const fixNum = idx + 1;
                const fixName = fix.name || '';
                const fixSeverity = fix.severity || '';
                const fixBefore = fix.before || '';
                const fixAfter = fix.after || '';
                const fixExplanation = fix.explanation || '';
                
                codeFixesHtml += '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #ddd;">';
                codeFixesHtml += '<h4 style="color: #f44336; margin-bottom: 10px;">' + fixNum + '. ' + fixName + ' [' + fixSeverity + ']</h4>';
                
                if (fixBefore) {
                    codeFixesHtml += '<div style="margin-bottom: 15px;"><strong style="color: #f44336;">❌ 현재 코드 (수정 필요):</strong>';
                    codeFixesHtml += '<pre style="background: #ffebee; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 0.9em; margin-top: 5px;">' + escapeHtml(fixBefore) + '</pre></div>';
                }
                
                codeFixesHtml += '<div><strong style="color: #4caf50;">✅ 수정된 코드 (시큐어 코딩 가이드 준수):</strong>';
                codeFixesHtml += '<pre style="background: #e8f5e9; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 0.9em; margin-top: 5px; white-space: pre-wrap;">' + escapeHtml(fixAfter) + '</pre></div>';
                
                if (fixExplanation) {
                    codeFixesHtml += '<div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius: 5px;"><strong>💡 설명:</strong> ' + escapeHtml(fixExplanation) + '</div>';
                }
                
                codeFixesHtml += '</div>';
            });
            codeFixesHtml += '</div>';
            return codeFixesHtml;
        })() : ''}
        ${review.best_practices ? `
            <div class="review-section" style="border-left-color: #9C27B0; background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);">
                <h3>⭐ Best Practice</h3>
                <p>${review.best_practices}</p>
            </div>
        ` : ''}
        ${review.full_review ? `
            <div class="review-section" style="border-left-color: #607D8B;">
                <h3>📄 전체 리뷰</h3>
                <div class="full-review-content">${formatFullReview(review.full_review)}</div>
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

// HTML 이스케이프 함수
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 제안 내용 포맷팅
function formatSuggestions(text) {
    if (!text) return '';
    
    // 마크다운 스타일 코드 블록 처리
    let formatted = escapeHtml(text);
    
    // 코드 블록 처리 (```jsp ... ```)
    formatted = formatted.replace(/```jsp\n([\s\S]*?)```/g, (match, code) => {
        return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 코드 블록 처리 (``` ... ```)
    formatted = formatted.replace(/```\n([\s\S]*?)```/g, (match, code) => {
        return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 인라인 코드 처리 (`...`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 강조 처리 (**...**)
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 제목 처리 (## ...)
    formatted = formatted.replace(/##\s+(.+)/g, '<h4 style="margin-top: 20px; margin-bottom: 10px; color: #667eea; font-size: 1.1em;">$1</h4>');
    
    // 줄바꿈 처리
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return `<p>${formatted}</p>`;
}

// 전체 리뷰 포맷팅
function formatFullReview(text) {
    if (!text) return '';
    
    let formatted = escapeHtml(text);
    
    // 마크다운 헤더 처리
    formatted = formatted.replace(/^#\s+(.+)$/gm, '<h2 style="color: #667eea; margin-top: 24px; margin-bottom: 16px; font-size: 1.4em;">$1</h2>');
    formatted = formatted.replace(/^##\s+(.+)$/gm, '<h3 style="color: #667eea; margin-top: 20px; margin-bottom: 12px; font-size: 1.2em;">$1</h3>');
    formatted = formatted.replace(/^###\s+(.+)$/gm, '<h4 style="color: #667eea; margin-top: 16px; margin-bottom: 8px; font-size: 1.1em;">$1</h4>');
    
    // 코드 블록 처리
    formatted = formatted.replace(/```jsp\n([\s\S]*?)```/g, (match, code) => {
        return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 리스트 처리
    formatted = formatted.replace(/^[\*\-\+]\s+(.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul style="margin: 12px 0; padding-left: 24px;">$1</ul>');
    
    // 줄바꿈 처리
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return `<div class="full-review-text">${formatted}</div>`;
}
