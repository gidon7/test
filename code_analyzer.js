// 규칙 기반 Java 코드 분석기 (OpenAI API 없이 작동)

class JavaCodeAnalyzer {
  analyze(code, filename) {
    const lines = code.split('\n');
    const issues = [];
    const suggestions = [];
    const strengths = [];
    
    // 1. 코드 구조 분석
    const structure = this.analyzeStructure(code);
    
    // 2. 코드 품질 체크
    const quality = this.checkCodeQuality(code, lines);
    issues.push(...quality.issues);
    suggestions.push(...quality.suggestions);
    strengths.push(...quality.strengths);
    
    // 3. Best Practice 체크
    const bestPractices = this.checkBestPractices(code, lines);
    issues.push(...bestPractices.issues);
    suggestions.push(...bestPractices.suggestions);
    
    // 4. 성능 체크
    const performance = this.checkPerformance(code);
    issues.push(...performance.issues);
    suggestions.push(...performance.suggestions);
    
    // 5. 보안 체크
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
    const lines = code.split('\n');
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
    const issues = [];
    const suggestions = [];
    const strengths = [];
    
    // 긴 메서드 체크
    const longMethods = this.findLongMethods(code);
    if (longMethods.length > 0) {
      issues.push(`⚠️ 긴 메서드 발견: ${longMethods.length}개의 메서드가 50줄을 초과합니다. 메서드를 작은 단위로 분리하는 것을 고려하세요.`);
      suggestions.push(`💡 긴 메서드는 여러 개의 작은 메서드로 분리하면 가독성과 유지보수성이 향상됩니다.`);
    }
    
    // 매직 넘버 체크
    const magicNumbers = code.match(/\b\d{2,}\b/g);
    if (magicNumbers && magicNumbers.length > 5) {
      issues.push(`⚠️ 매직 넘버 사용: 숫자 리터럴이 많이 사용되고 있습니다. 상수로 정의하는 것을 권장합니다.`);
      suggestions.push(`💡 예: private static final int MAX_SIZE = 100;`);
    }
    
    // 주석 체크
    const commentRatio = lines.filter(l => l.trim().startsWith('//') || l.includes('/*')).length / lines.length;
    if (commentRatio < 0.1) {
      issues.push(`⚠️ 주석 부족: 코드에 주석이 적습니다. 복잡한 로직에는 설명을 추가하세요.`);
    } else if (commentRatio > 0.3) {
      strengths.push(`✅ 좋은 주석 비율: 코드에 적절한 주석이 있습니다.`);
    }
    
    // 네이밍 체크
    const badNames = code.match(/\b(a|b|c|temp|tmp|data|obj)\b/g);
    if (badNames && badNames.length > 10) {
      issues.push(`⚠️ 의미 없는 변수명: 일부 변수명이 너무 짧거나 의미가 불명확합니다.`);
      suggestions.push(`💡 변수명은 의도를 명확히 표현해야 합니다. 예: 'data' → 'userData', 'temp' → 'currentUser'`);
    }
    
    // 중복 코드 체크
    const duplicatePatterns = this.findDuplicatePatterns(code);
    if (duplicatePatterns.length > 0) {
      issues.push(`⚠️ 중복 코드 패턴 발견: 유사한 코드 블록이 반복됩니다. 메서드 추출을 고려하세요.`);
      suggestions.push(`💡 중복 코드는 메서드나 유틸리티 클래스로 추출하면 재사용성이 높아집니다.`);
    }
    
    return { issues, suggestions, strengths };
  }
  
  checkBestPractices(code, lines) {
    const issues = [];
    const suggestions = [];
    
    // 접근 제어자 체크
    if (!code.match(/\bprivate\s+\w+/)) {
      issues.push(`⚠️ 접근 제어자: 모든 필드가 public일 수 있습니다. 캡슐화를 위해 private을 사용하세요.`);
      suggestions.push(`💡 클래스 필드는 기본적으로 private으로 선언하고, 필요시 getter/setter를 제공하세요.`);
    }
    
    // 예외 처리 체크
    if (code.includes('throws') && !code.includes('try')) {
      issues.push(`⚠️ 예외 처리: throws만 사용하고 try-catch가 없습니다. 적절한 예외 처리를 추가하세요.`);
      suggestions.push(`💡 예외가 발생할 수 있는 코드는 try-catch 블록으로 감싸서 처리하세요.`);
    }
    
    // null 체크
    if (code.includes('== null') || code.includes('!= null')) {
      strengths.push(`✅ null 체크: null 체크를 수행하고 있습니다.`);
    } else if (code.includes('.get(') || code.includes('[')) {
      suggestions.push(`💡 배열이나 컬렉션 접근 시 null 체크를 추가하는 것을 권장합니다.`);
    }
    
    // equals 메서드 체크
    if (code.includes('.equals(') && code.includes('str.equals(')) {
      issues.push(`⚠️ NullPointerException 위험: 문자열.equals() 대신 상수.equals(문자열) 패턴을 사용하세요.`);
      suggestions.push(`💡 예: "value".equals(variable) 형태로 사용하면 null 안전합니다.`);
    }
    
    // 리소스 관리 체크
    if (code.includes('new FileInputStream') || code.includes('new BufferedReader')) {
      if (!code.includes('try-with-resources') && !code.includes('finally')) {
        issues.push(`⚠️ 리소스 관리: 파일이나 스트림을 사용할 때 try-with-resources를 사용하세요.`);
        suggestions.push(`💡 try (FileInputStream fis = new FileInputStream(file)) { ... } 형태로 사용하면 자동으로 리소스가 닫힙니다.`);
      }
    }
    
    return { issues, suggestions };
  }
  
  checkPerformance(code) {
    const issues = [];
    const suggestions = [];
    
    // String concatenation 체크
    if (code.match(/"[^"]*"\s*\+\s*"[^"]*"/g) && code.match(/"[^"]*"\s*\+\s*"[^"]*"/g).length > 3) {
      issues.push(`⚠️ 성능: 문자열 연결 시 + 연산자를 반복 사용하고 있습니다.`);
      suggestions.push(`💡 StringBuilder나 String.join()을 사용하면 성능이 향상됩니다.`);
    }
    
    // 반복문 체크
    if (code.includes('for (') && code.includes('.size()')) {
      const forLoops = code.match(/for\s*\([^)]*\.size\(\)/g);
      if (forLoops && forLoops.length > 0) {
        suggestions.push(`💡 반복문에서 .size()를 매번 호출하지 말고 변수에 저장하세요.`);
      }
    }
    
    // 불필요한 객체 생성
    if (code.match(/new\s+String\s*\(/g)) {
      issues.push(`⚠️ 불필요한 객체 생성: new String() 사용을 피하세요.`);
      suggestions.push(`💡 문자열 리터럴을 직접 사용하거나 String.valueOf()를 사용하세요.`);
    }
    
    return { issues, suggestions };
  }
  
  checkSecurity(code) {
    const issues = [];
    const suggestions = [];
    
    // SQL Injection 체크
    if (code.includes('Statement') && code.includes('executeQuery') && !code.includes('PreparedStatement')) {
      issues.push(`⚠️ 보안: Statement 대신 PreparedStatement를 사용하세요.`);
      suggestions.push(`💡 PreparedStatement를 사용하면 SQL Injection 공격을 방지할 수 있습니다.`);
    }
    
    // 하드코딩된 비밀번호/키
    if (code.match(/password\s*=\s*"[^"]+"/i) || code.match(/api[_-]?key\s*=\s*"[^"]+"/i)) {
      issues.push(`⚠️ 보안: 비밀번호나 API 키가 코드에 하드코딩되어 있습니다.`);
      suggestions.push(`💡 환경 변수나 설정 파일을 사용하여 민감한 정보를 관리하세요.`);
    }
    
    return { issues, suggestions };
  }
  
  findLongMethods(code) {
    const methods = [];
    const lines = code.split('\n');
    let inMethod = false;
    let methodStart = 0;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/\b(public|private|protected)\s+[\w<>\[\]]+\s+\w+\s*\(/)) {
        inMethod = true;
        methodStart = i;
        braceCount = 0;
      }
      if (inMethod) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        if (braceCount === 0 && line.includes('}')) {
          if (i - methodStart > 50) {
            methods.push({ start: methodStart, end: i, length: i - methodStart });
          }
          inMethod = false;
        }
      }
    }
    return methods;
  }
  
  findDuplicatePatterns(code) {
    // 간단한 중복 패턴 검사
    const patterns = [];
    const lines = code.split('\n');
    const lineMap = new Map();
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.length > 20) {
        if (lineMap.has(trimmed)) {
          patterns.push(i);
        } else {
          lineMap.set(trimmed, i);
        }
      }
    }
    return patterns;
  }
  
  generateExplanation(code, filename, structure) {
    let explanation = `이 코드는 ${filename} 파일입니다.\n\n`;
    
    if (structure.classCount > 0) {
      explanation += `• ${structure.classCount}개의 클래스가 정의되어 있습니다.\n`;
    }
    if (structure.methodCount > 0) {
      explanation += `• ${structure.methodCount}개의 메서드가 포함되어 있습니다.\n`;
    }
    if (structure.hasMainMethod) {
      explanation += `• main 메서드가 있어 실행 가능한 프로그램입니다.\n`;
    }
    if (structure.importCount > 0) {
      explanation += `• ${structure.importCount}개의 import 문이 사용되었습니다.\n`;
    }
    
    // 주요 기능 추론
    if (code.includes('Scanner') || code.includes('BufferedReader')) {
      explanation += `\n• 사용자 입력을 받는 기능이 있습니다.`;
    }
    if (code.includes('System.out.println')) {
      explanation += `\n• 콘솔에 출력하는 기능이 있습니다.`;
    }
    if (code.includes('if') && code.includes('else')) {
      explanation += `\n• 조건문을 사용하여 분기 처리를 하고 있습니다.`;
    }
    if (code.includes('for') || code.includes('while')) {
      explanation += `\n• 반복문을 사용하여 반복 작업을 수행합니다.`;
    }
    
    return explanation;
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
    let review = `# ${filename} 코드 리뷰\n\n`;
    
    review += `## 코드 구조\n`;
    review += `- 클래스 수: ${structure.classCount}\n`;
    review += `- 메서드 수: ${structure.methodCount}\n`;
    review += `- Import 수: ${structure.importCount}\n\n`;
    
    if (strengths.length > 0) {
      review += `## 장점\n${strengths.join('\n\n')}\n\n`;
    }
    
    if (issues.length > 0) {
      review += `## 개선 필요 사항\n${issues.join('\n\n')}\n\n`;
    }
    
    if (suggestions.length > 0) {
      review += `## 개선 제안\n${suggestions.join('\n\n')}\n\n`;
    }
    
    review += `## Best Practices\n${this.generateBestPractices(code, structure)}`;
    
    return review;
  }
}

// 전역으로 사용 가능하도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JavaCodeAnalyzer;
}


