// Cloudflare Workers용 Java 코드 리뷰 시스템

// 코드 분석기 (규칙 기반, API 키 불필요)
class JavaCodeAnalyzer {
  analyze(code, filename) {
    const lines = code.split('\n');
    const issues = [];
    const suggestions = [];
    const strengths = [];
    
    const structure = this.analyzeStructure(code);
    const quality = this.checkCodeQuality(code, lines);
    issues.push(...quality.issues);
    suggestions.push(...quality.suggestions);
    strengths.push(...quality.strengths);
    
    const bestPractices = this.checkBestPractices(code, lines);
    issues.push(...bestPractices.issues);
    suggestions.push(...bestPractices.suggestions);
    
    const performance = this.checkPerformance(code);
    issues.push(...performance.issues);
    suggestions.push(...performance.suggestions);
    
    const security = this.checkSecurity(code);
    issues.push(...security.issues);
    suggestions.push(...security.suggestions);
    
    return {
      explanation: this.generateExplanation(code, filename, structure),
      strengths: strengths.length > 0 ? strengths.join('\n\n') : '코드의 좋은 점을 찾는 중...',
      improvements: issues.length > 0 ? issues.join('\n\n') : '개선할 부분이 없습니다.',
      suggestions: suggestions.length > 0 ? suggestions.join('\n\n') : '추가 제안사항이 없습니다.',
      best_practices: this.generateBestPractices(code, structure),
      full_review: this.generateFullReview(code, filename, structure, issues, suggestions, strengths)
    };
  }
  
  analyzeStructure(code) {
    const classes = code.match(/\bclass\s+(\w+)/g) || [];
    const methods = code.match(/\b(public|private|protected|static)\s+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)/g) || [];
    const imports = code.match(/^import\s+[\w.*]+;/gm) || [];
    return {
      classCount: classes.length,
      methodCount: methods.length,
      importCount: imports.length,
      hasMainMethod: code.includes('public static void main'),
      hasPackage: code.includes('package '),
      hasComments: code.includes('//') || code.includes('/*')
    };
  }
  
  checkCodeQuality(code, lines) {
    const issues = [], suggestions = [], strengths = [];
    const longMethods = this.findLongMethods(code);
    if (longMethods.length > 0) {
      issues.push(`⚠️ 긴 메서드: ${longMethods.length}개의 메서드가 50줄을 초과합니다. 작은 단위로 분리하세요.`);
      suggestions.push(`💡 긴 메서드는 여러 개의 작은 메서드로 분리하면 가독성이 향상됩니다.`);
    }
    const magicNumbers = code.match(/\b\d{2,}\b/g);
    if (magicNumbers && magicNumbers.length > 5) {
      issues.push(`⚠️ 매직 넘버: 숫자 리터럴이 많이 사용됩니다. 상수로 정의하세요.`);
      suggestions.push(`💡 예: private static final int MAX_SIZE = 100;`);
    }
    const commentRatio = lines.filter(l => l.trim().startsWith('//') || l.includes('/*')).length / lines.length;
    if (commentRatio < 0.1) {
      issues.push(`⚠️ 주석 부족: 코드에 주석이 적습니다.`);
    } else if (commentRatio > 0.3) {
      strengths.push(`✅ 좋은 주석 비율: 적절한 주석이 있습니다.`);
    }
    const badNames = code.match(/\b(a|b|c|temp|tmp|data|obj)\b/g);
    if (badNames && badNames.length > 10) {
      issues.push(`⚠️ 의미 없는 변수명: 일부 변수명이 불명확합니다.`);
      suggestions.push(`💡 변수명은 의도를 명확히 표현하세요. 예: 'data' → 'userData'`);
    }
    return { issues, suggestions, strengths };
  }
  
  checkBestPractices(code, lines) {
    const issues = [], suggestions = [];
    if (!code.match(/\bprivate\s+\w+/)) {
      issues.push(`⚠️ 접근 제어자: 모든 필드가 public일 수 있습니다. private을 사용하세요.`);
      suggestions.push(`💡 클래스 필드는 private으로 선언하고 getter/setter를 제공하세요.`);
    }
    if (code.includes('throws') && !code.includes('try')) {
      issues.push(`⚠️ 예외 처리: throws만 사용하고 try-catch가 없습니다.`);
      suggestions.push(`💡 예외가 발생할 수 있는 코드는 try-catch로 감싸세요.`);
    }
    if (code.includes('str.equals(')) {
      issues.push(`⚠️ NullPointerException 위험: "value".equals(variable) 패턴을 사용하세요.`);
      suggestions.push(`💡 예: "value".equals(variable) 형태로 사용하면 null 안전합니다.`);
    }
    if ((code.includes('new FileInputStream') || code.includes('new BufferedReader')) && !code.includes('try-with-resources') && !code.includes('finally')) {
      issues.push(`⚠️ 리소스 관리: try-with-resources를 사용하세요.`);
      suggestions.push(`💡 try (FileInputStream fis = new FileInputStream(file)) { ... } 형태로 사용하세요.`);
    }
    return { issues, suggestions };
  }
  
  checkPerformance(code) {
    const issues = [], suggestions = [];
    if (code.match(/"[^"]*"\s*\+\s*"[^"]*"/g) && code.match(/"[^"]*"\s*\+\s*"[^"]*"/g).length > 3) {
      issues.push(`⚠️ 성능: 문자열 연결 시 + 연산자를 반복 사용하고 있습니다.`);
      suggestions.push(`💡 StringBuilder나 String.join()을 사용하세요.`);
    }
    if (code.match(/new\s+String\s*\(/g)) {
      issues.push(`⚠️ 불필요한 객체 생성: new String() 사용을 피하세요.`);
    }
    return { issues, suggestions };
  }
  
  checkSecurity(code) {
    const issues = [], suggestions = [];
    if (code.includes('Statement') && code.includes('executeQuery') && !code.includes('PreparedStatement')) {
      issues.push(`⚠️ 보안: Statement 대신 PreparedStatement를 사용하세요.`);
      suggestions.push(`💡 PreparedStatement를 사용하면 SQL Injection을 방지할 수 있습니다.`);
    }
    if (code.match(/password\s*=\s*"[^"]+"/i) || code.match(/api[_-]?key\s*=\s*"[^"]+"/i)) {
      issues.push(`⚠️ 보안: 비밀번호나 API 키가 하드코딩되어 있습니다.`);
      suggestions.push(`💡 환경 변수나 설정 파일을 사용하세요.`);
    }
    return { issues, suggestions };
  }
  
  findLongMethods(code) {
    const methods = [];
    const lines = code.split('\n');
    let inMethod = false, methodStart = 0, braceCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/\b(public|private|protected)\s+[\w<>\[\]]+\s+\w+\s*\(/)) {
        inMethod = true; methodStart = i; braceCount = 0;
      }
      if (inMethod) {
        braceCount += (lines[i].match(/{/g) || []).length;
        braceCount -= (lines[i].match(/}/g) || []).length;
        if (braceCount === 0 && lines[i].includes('}')) {
          if (i - methodStart > 50) methods.push({ start: methodStart, end: i });
          inMethod = false;
        }
      }
    }
    return methods;
  }
  
  generateExplanation(code, filename, structure) {
    let exp = `이 코드는 ${filename} 파일입니다.\n\n`;
    if (structure.classCount > 0) exp += `• ${structure.classCount}개의 클래스가 정의되어 있습니다.\n`;
    if (structure.methodCount > 0) exp += `• ${structure.methodCount}개의 메서드가 포함되어 있습니다.\n`;
    if (structure.hasMainMethod) exp += `• main 메서드가 있어 실행 가능한 프로그램입니다.\n`;
    if (structure.importCount > 0) exp += `• ${structure.importCount}개의 import 문이 사용되었습니다.\n`;
    if (code.includes('Scanner') || code.includes('BufferedReader')) exp += `\n• 사용자 입력을 받는 기능이 있습니다.`;
    if (code.includes('System.out.println')) exp += `\n• 콘솔에 출력하는 기능이 있습니다.`;
    if (code.includes('if') && code.includes('else')) exp += `\n• 조건문을 사용하여 분기 처리를 하고 있습니다.`;
    if (code.includes('for') || code.includes('while')) exp += `\n• 반복문을 사용하여 반복 작업을 수행합니다.`;
    return exp;
  }
  
  generateBestPractices(code, structure) {
    const practices = [];
    practices.push(`✅ 패키지 사용: ${structure.hasPackage ? '패키지가 선언되어 있습니다.' : '패키지 선언을 추가하는 것을 권장합니다.'}`);
    practices.push(`✅ 접근 제어자: 적절한 접근 제어자(private, protected, public)를 사용하세요.`);
    practices.push(`✅ 네이밍: 변수와 메서드명은 camelCase, 클래스명은 PascalCase를 사용하세요.`);
    practices.push(`✅ 주석: 복잡한 로직에는 JavaDoc 주석을 추가하세요.`);
    practices.push(`✅ 예외 처리: 예외가 발생할 수 있는 코드는 적절히 처리하세요.`);
    practices.push(`✅ 리소스 관리: 파일이나 스트림은 try-with-resources로 관리하세요.`);
    return practices.join('\n\n');
  }
  
  generateFullReview(code, filename, structure, issues, suggestions, strengths) {
    let review = `# ${filename} 코드 리뷰\n\n## 코드 구조\n- 클래스 수: ${structure.classCount}\n- 메서드 수: ${structure.methodCount}\n- Import 수: ${structure.importCount}\n\n`;
    if (strengths.length > 0) review += `## 장점\n${strengths.join('\n\n')}\n\n`;
    if (issues.length > 0) review += `## 개선 필요 사항\n${issues.join('\n\n')}\n\n`;
    if (suggestions.length > 0) review += `## 개선 제안\n${suggestions.join('\n\n')}\n\n`;
    review += `## Best Practices\n${this.generateBestPractices(code, structure)}`;
    return review;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 요청 처리
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    // 루트 경로 - HTML 반환
    if (url.pathname === '/' && method === 'GET') {
      const html = getHTML();
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // API 엔드포인트
    if (url.pathname === '/api/review' && method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
          return new Response(
            JSON.stringify({ error: '파일이 없습니다.' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        if (!file.name.endsWith('.java')) {
          return new Response(
            JSON.stringify({ error: 'Java 파일만 업로드 가능합니다.' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        // 파일 내용 읽기
        const codeContent = await file.text();

        // 기본 코드 분석
        const basicAnalysis = analyzeCodeStructure(codeContent);

        // 코드 리뷰 (규칙 기반, API 키 불필요)
        const analyzer = new JavaCodeAnalyzer();
        const aiReview = analyzer.analyze(codeContent, file.name);

        return new Response(
          JSON.stringify({
            success: true,
            filename: file.name,
            basic_analysis: basicAnalysis,
            ai_review: aiReview,
            api_key_configured: true, // 규칙 기반 분석이므로 항상 true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

// 기본 코드 구조 분석
function analyzeCodeStructure(code) {
  const lines = code.split('\n');
  const totalLines = lines.length;
  const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//'));

  // 클래스 개수
  const classCount = (code.match(/\bclass\s+\w+/g) || []).length;

  // 메서드 개수
  const methodCount = (code.match(/\b(public|private|protected)\s+\w+\s+\w+\s*\([^)]*\)\s*\{/g) || []).length;

  // 주석 비율
  const commentLines = lines.filter(line => line.trim().startsWith('//') || line.includes('/*')).length;
  const commentRatio = totalLines > 0 ? (commentLines / totalLines * 100) : 0;

  // 복잡도 추정
  const complexity = Math.abs(code.split('{').length - code.split('}').length);

  return {
    total_lines: totalLines,
    code_lines: codeLines.length,
    class_count: classCount,
    method_count: methodCount,
    comment_ratio: Math.round(commentRatio * 100) / 100,
    estimated_complexity: complexity,
  };
}

// 이 함수는 더 이상 사용되지 않습니다 (규칙 기반 분석으로 대체됨)

// 섹션 추출
function extractSection(text, startKeyword, endKeyword) {
  if (!text.includes(startKeyword)) {
    return '';
  }

  const startIdx = text.indexOf(startKeyword);
  if (endKeyword) {
    const endIdx = text.indexOf(endKeyword, startIdx);
    if (endIdx === -1) {
      return text.substring(startIdx).trim();
    }
    return text.substring(startIdx, endIdx).trim();
  }

  return text.substring(startIdx).trim();
}

// HTML 생성
function getHTML() {
  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px}.container{max-width:1200px;margin:0 auto;background:white;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:40px}header{text-align:center;margin-bottom:40px}header h1{color:#333;font-size:2.5em;margin-bottom:10px}.subtitle{color:#666;font-size:1.1em}.upload-section{margin-bottom:40px}.upload-box{max-width:600px;margin:0 auto}.upload-area{border:3px dashed #667eea;border-radius:15px;padding:60px 20px;text-align:center;cursor:pointer;transition:all 0.3s;background:#f8f9fa}.upload-area:hover{background:#e9ecef;border-color:#764ba2;transform:translateY(-2px)}.upload-icon{font-size:4em;margin-bottom:20px}.upload-text{font-size:1.2em;color:#333;margin-bottom:10px;font-weight:bold}.upload-hint{font-size:0.9em;color:#666}.file-info{display:flex;align-items:center;justify-content:space-between;background:#e3f2fd;padding:15px 20px;border-radius:10px;margin-top:20px;max-width:600px;margin-left:auto;margin-right:auto}.clear-btn{background:#f44336;color:white;border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:1.2em;transition:transform 0.2s}.clear-btn:hover{transform:scale(1.1)}.loading{text-align:center;padding:40px}.spinner{border:4px solid #f3f3f3;border-top:4px solid #667eea;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:0 auto 20px}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.results-section{margin-top:40px}.basic-analysis{background:#f8f9fa;border-radius:15px;padding:30px;margin-bottom:30px}.basic-analysis h2{color:#333;margin-bottom:20px;font-size:1.5em}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}.stat-item{background:white;padding:20px;border-radius:10px;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.1)}.stat-label{color:#666;font-size:0.9em;margin-bottom:10px}.stat-value{color:#667eea;font-size:2em;font-weight:bold}.ai-review{background:#f8f9fa;border-radius:15px;padding:30px}.ai-review h2{color:#333;margin-bottom:20px;font-size:1.5em}.review-section{background:white;padding:20px;border-radius:10px;margin-bottom:20px;border-left:4px solid #667eea}.review-section h3{color:#667eea;margin-bottom:15px;font-size:1.2em}.review-section p{color:#555;line-height:1.8;white-space:pre-wrap}.error-message{background:#fee;color:#c33;padding:15px;border-radius:10px;margin-top:20px;text-align:center}@media (max-width:768px){.container{padding:20px}header h1{font-size:1.8em}.stats-grid{grid-template-columns:1fr}}`;

  const js = `let selectedFile=null;document.getElementById('fileInput').addEventListener('change',function(e){const file=e.target.files[0];if(file){if(!file.name.endsWith('.java')){showError('Java 파일만 업로드 가능합니다.');return}selectedFile=file;showFileInfo(file.name)}});const uploadArea=document.querySelector('.upload-area');uploadArea.addEventListener('dragover',(e)=>{e.preventDefault();uploadArea.style.background='#e9ecef'});uploadArea.addEventListener('dragleave',()=>{uploadArea.style.background='#f8f9fa'});uploadArea.addEventListener('drop',(e)=>{e.preventDefault();uploadArea.style.background='#f8f9fa';const file=e.dataTransfer.files[0];if(file&&file.name.endsWith('.java')){selectedFile=file;document.getElementById('fileInput').files=e.dataTransfer.files;showFileInfo(file.name)}else{showError('Java 파일만 업로드 가능합니다.')}});function showFileInfo(fileName){document.getElementById('fileName').textContent=fileName;document.getElementById('fileInfo').style.display='flex';document.getElementById('uploadBox').style.display='none';setTimeout(()=>{reviewCode()},500)}function clearFile(){selectedFile=null;document.getElementById('fileInput').value='';document.getElementById('fileInfo').style.display='none';document.getElementById('uploadBox').style.display='block';document.getElementById('resultsSection').style.display='none';document.getElementById('errorMessage').style.display='none'}async function reviewCode(){if(!selectedFile){showError('파일을 선택해주세요.');return}const loading=document.getElementById('loading'),resultsSection=document.getElementById('resultsSection'),errorMessage=document.getElementById('errorMessage');loading.style.display='block';resultsSection.style.display='none';errorMessage.style.display='none';try{const formData=new FormData();formData.append('file',selectedFile);const response=await fetch('/api/review',{method:'POST',body:formData}),data=await response.json();if(!response.ok){throw new Error(data.error||'리뷰 중 오류가 발생했습니다.')}if(data.success){displayResults(data)}else{showError(data.error||'리뷰 중 오류가 발생했습니다.')}}catch(error){showError(error.message)}finally{loading.style.display='none'}}function displayResults(data){const resultsSection=document.getElementById('resultsSection'),basicAnalysis=document.getElementById('basicAnalysis'),aiReview=document.getElementById('aiReview');const analysis=data.basic_analysis;basicAnalysis.innerHTML='<h2>📊 코드 분석</h2><div class="stats-grid"><div class="stat-item"><div class="stat-label">총 라인 수</div><div class="stat-value">'+analysis.total_lines+'</div></div><div class="stat-item"><div class="stat-label">코드 라인</div><div class="stat-value">'+analysis.code_lines+'</div></div><div class="stat-item"><div class="stat-label">클래스 수</div><div class="stat-value">'+analysis.class_count+'</div></div><div class="stat-item"><div class="stat-label">메서드 수</div><div class="stat-value">'+analysis.method_count+'</div></div><div class="stat-item"><div class="stat-label">주석 비율</div><div class="stat-value">'+analysis.comment_ratio+'%</div></div><div class="stat-item"><div class="stat-label">복잡도</div><div class="stat-value">'+analysis.estimated_complexity+'</div></div></div>';const review=data.ai_review;aiReview.innerHTML='<h2>🤖 코드 리뷰</h2>'+(review.explanation?'<div class="review-section"><h3>📝 코드 설명</h3><p>'+review.explanation+'</p></div>':'')+(review.strengths?'<div class="review-section"><h3>✅ 장점</h3><p>'+review.strengths+'</p></div>':'')+(review.improvements?'<div class="review-section"><h3>🔧 개선점</h3><p>'+review.improvements+'</p></div>':'')+(review.suggestions?'<div class="review-section"><h3>💡 개선 제안</h3><p>'+review.suggestions+'</p></div>':'')+(review.best_practices?'<div class="review-section"><h3>⭐ Best Practice</h3><p>'+review.best_practices+'</p></div>':'')+(review.full_review?'<div class="review-section"><h3>📄 전체 리뷰</h3><p>'+review.full_review+'</p></div>':'');resultsSection.style.display='block'}function showError(message){const errorMessage=document.getElementById('errorMessage');errorMessage.textContent=message;errorMessage.style.display='block'}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Java 코드 리뷰 시스템</title>
    <style>${css}</style>
</head>
<body>
    <div class="container">
        <header>
            <h1>☕ Java 코드 리뷰 시스템</h1>
            <p class="subtitle">AI 기반 코드 분석 및 개선 제안</p>
        </header>
        <div class="upload-section">
            <div class="upload-box" id="uploadBox">
                <input type="file" id="fileInput" accept=".java" style="display: none;">
                <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                    <div class="upload-icon">📁</div>
                    <p class="upload-text">Java 파일을 클릭하거나 드래그하여 업로드</p>
                    <p class="upload-hint">.java 파일만 지원됩니다</p>
                </div>
            </div>
            <div class="file-info" id="fileInfo" style="display: none;">
                <span id="fileName"></span>
                <button onclick="clearFile()" class="clear-btn">✕</button>
            </div>
        </div>
        <div class="loading" id="loading" style="display: none;">
            <div class="spinner"></div>
            <p>코드를 분석하는 중...</p>
        </div>
        <div class="results-section" id="resultsSection" style="display: none;">
            <div class="basic-analysis" id="basicAnalysis"></div>
            <div class="ai-review" id="aiReview"></div>
        </div>
        <div class="error-message" id="errorMessage" style="display: none;"></div>
    </div>
    <script>${js}</script>
</body>
</html>`;
}

