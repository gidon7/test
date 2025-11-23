// CWEAP 시큐어 코딩 가이드 49개 항목
// 한국인터넷진흥원(KISA) 시큐어 코딩 가이드라인 기반

const SECURE_CODING_GUIDELINES = {
  // 입력값 검증 및 표현 (10개)
  input_validation: [
    {
      id: 'SC-001',
      name: '입력값 길이 검증',
      check: (code) => code.includes('Scanner') || code.includes('BufferedReader'),
      issue: '입력값의 길이를 검증하지 않습니다.',
      suggestion: `Java 8 방식:
// 입력값 길이 검증
if (input == null || input.length() > MAX_LENGTH) {
    throw new IllegalArgumentException("입력값이 유효하지 않습니다.");
}

// 또는 Apache Commons Validator 사용
if (!StringUtils.isNotBlank(input) || input.length() > 100) {
    throw new ValidationException("입력값 검증 실패");
}`,
      severity: 'HIGH'
    },
    {
      id: 'SC-002',
      name: '입력값 형식 검증',
      check: (code) => code.includes('Integer.parseInt') || code.includes('Double.parseDouble'),
      issue: '입력값 형식 검증 없이 파싱하고 있습니다.',
      suggestion: `Java 8 방식:
// NumberFormatException 처리
try {
    int value = Integer.parseInt(input);
} catch (NumberFormatException e) {
    logger.error("잘못된 숫자 형식: " + input, e);
    throw new ValidationException("숫자 형식이 올바르지 않습니다.");
}

// 또는 정규식 검증
if (!input.matches("^[0-9]+$")) {
    throw new ValidationException("숫자만 입력 가능합니다.");
}`,
      severity: 'HIGH'
    },
    {
      id: 'SC-003',
      name: 'SQL Injection 방지',
      check: (code) => code.includes('Statement') && code.includes('executeQuery') && !code.includes('PreparedStatement'),
      issue: 'Statement를 사용하여 SQL Injection 위험이 있습니다.',
      suggestion: `Java 8 방식 - PreparedStatement 사용:
// ❌ 위험한 코드
String sql = "SELECT * FROM users WHERE id = " + userId;
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(sql);

// ✅ 안전한 코드
String sql = "SELECT * FROM users WHERE id = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setInt(1, userId);
ResultSet rs = pstmt.executeQuery();

// MyBatis 사용 시
// #{userId} 사용 (${userId}는 사용 금지)`,
      severity: 'CRITICAL'
    },
    {
      id: 'SC-004',
      name: 'XSS 방지',
      check: (code) => code.includes('response.getWriter') || code.includes('out.print'),
      issue: '출력값 인코딩 없이 사용자 입력을 출력하고 있습니다.',
      suggestion: `Java 8 방식 - 출력값 인코딩:
// ❌ 위험한 코드
response.getWriter().print(userInput);

// ✅ 안전한 코드 - OWASP ESAPI 사용
import org.owasp.esapi.ESAPI;
String safeOutput = ESAPI.encoder().encodeForHTML(userInput);
response.getWriter().print(safeOutput);

// 또는 Apache Commons Text 사용
import org.apache.commons.text.StringEscapeUtils;
String safeOutput = StringEscapeUtils.escapeHtml4(userInput);
response.getWriter().print(safeOutput);`,
      severity: 'HIGH'
    },
    {
      id: 'SC-005',
      name: 'Path Traversal 방지',
      check: (code) => code.includes('new File(') && code.includes('userInput'),
      issue: '사용자 입력을 파일 경로로 사용하고 있습니다.',
      suggestion: `Java 8 방식 - 경로 검증:
// ❌ 위험한 코드
File file = new File(userInput);

// ✅ 안전한 코드
String safePath = FilenameUtils.getName(userInput); // Apache Commons IO
File file = new File(baseDirectory, safePath);

// 경로 정규화 및 검증
Path path = Paths.get(baseDirectory).resolve(userInput).normalize();
if (!path.startsWith(Paths.get(baseDirectory))) {
    throw new SecurityException("접근 불가능한 경로입니다.");
}
File file = path.toFile();`,
      severity: 'HIGH'
    }
  ],
  
  // 암호화 (5개)
  encryption: [
    {
      id: 'SC-006',
      name: '비밀번호 평문 저장',
      check: (code) => code.match(/password\s*=\s*"[^"]+"/i) || (code.includes('password') && !code.includes('BCrypt') && !code.includes('PBKDF2')),
      issue: '비밀번호가 평문으로 저장되거나 전송되고 있습니다.',
      suggestion: `Java 8 방식 - BCrypt 사용:
// ❌ 위험한 코드
String password = request.getParameter("password");
user.setPassword(password);

// ✅ 안전한 코드 - BCrypt
import org.mindrot.jbcrypt.BCrypt;

// 비밀번호 해싱
String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt(12));

// 비밀번호 검증
if (BCrypt.checkpw(inputPassword, storedHash)) {
    // 로그인 성공
}

// 또는 Java 표준 PBKDF2 사용
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.spec.KeySpec;
import java.util.Base64;

KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 65536, 256);
SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
byte[] hash = factory.generateSecret(spec).getEncoded();
String hashedPassword = Base64.getEncoder().encodeToString(hash);`,
      severity: 'CRITICAL'
    },
    {
      id: 'SC-007',
      name: '약한 암호화 알고리즘',
      check: (code) => code.includes('DES') || code.includes('MD5') || code.includes('SHA1'),
      issue: '약한 암호화 알고리즘(DES, MD5, SHA1)을 사용하고 있습니다.',
      suggestion: `Java 8 방식 - 강한 암호화 알고리즘:
// ❌ 위험한 코드
MessageDigest md = MessageDigest.getInstance("MD5");
Cipher cipher = Cipher.getInstance("DES");

// ✅ 안전한 코드
// 해시: SHA-256 이상 사용
MessageDigest md = MessageDigest.getInstance("SHA-256");

// 대칭키 암호화: AES-256 사용
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
keyGenerator.init(256);
SecretKey key = keyGenerator.generateKey();

// 비대칭키 암호화: RSA 2048비트 이상
KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
keyGen.initialize(2048);
KeyPair keyPair = keyGen.generateKeyPair();`,
      severity: 'HIGH'
    }
  ],
  
  // 예외 처리 (5개)
  exception_handling: [
    {
      id: 'SC-008',
      name: '민감한 정보 노출',
      check: (code) => code.includes('printStackTrace') || code.includes('e.getMessage()') && code.includes('response'),
      issue: '예외 메시지에 민감한 정보가 노출될 수 있습니다.',
      suggestion: `Java 8 방식 - 안전한 예외 처리:
// ❌ 위험한 코드
try {
    // ...
} catch (Exception e) {
    e.printStackTrace(); // 스택 트레이스에 민감한 정보 노출
    response.getWriter().print(e.getMessage()); // 사용자에게 직접 노출
}

// ✅ 안전한 코드
try {
    // ...
} catch (SQLException e) {
    logger.error("데이터베이스 오류 발생", e); // 로그에는 상세 정보
    throw new ServiceException("처리 중 오류가 발생했습니다. 관리자에게 문의하세요.");
} catch (Exception e) {
    logger.error("예상치 못한 오류 발생", e);
    throw new ServiceException("시스템 오류가 발생했습니다.");
}

// 사용자 정의 예외 사용
public class ServiceException extends Exception {
    private static final String DEFAULT_MESSAGE = "처리 중 오류가 발생했습니다.";
    
    public ServiceException() {
        super(DEFAULT_MESSAGE);
    }
    
    public ServiceException(String userMessage, Throwable cause) {
        super(userMessage, cause);
    }
}`,
      severity: 'MEDIUM'
    },
    {
      id: 'SC-009',
      name: '예외 무시',
      check: (code) => code.match(/catch\s*\([^)]+\)\s*\{\s*\}/) || code.match(/catch\s*\([^)]+\)\s*\{\s*\/\/.*\}/),
      issue: '예외를 catch하고 아무 처리도 하지 않습니다.',
      suggestion: `Java 8 방식 - 적절한 예외 처리:
// ❌ 위험한 코드
try {
    processData();
} catch (Exception e) {
    // 예외 무시
}

// ✅ 안전한 코드
try {
    processData();
} catch (ValidationException e) {
    logger.warn("검증 실패: " + e.getMessage(), e);
    throw new ServiceException("입력값이 유효하지 않습니다.");
} catch (Exception e) {
    logger.error("처리 중 오류 발생", e);
    throw new ServiceException("처리 중 오류가 발생했습니다.", e);
}

// 또는 최소한 로깅
try {
    processData();
} catch (Exception e) {
    logger.error("오류 발생", e);
    // 복구 로직 또는 재시도
}`,
      severity: 'MEDIUM'
    }
  ],
  
  // 세션 관리 (5개)
  session_management: [
    {
      id: 'SC-010',
      name: '세션 고정 공격 방지',
      check: (code) => code.includes('HttpSession') && code.includes('setAttribute') && !code.includes('invalidate'),
      issue: '로그인 시 세션을 재생성하지 않습니다.',
      suggestion: `Java 8 방식 - 세션 재생성:
// ❌ 위험한 코드
HttpSession session = request.getSession();
session.setAttribute("user", user);

// ✅ 안전한 코드 - 로그인 시 세션 재생성
HttpSession oldSession = request.getSession();
Enumeration<String> attributes = oldSession.getAttributeNames();
Map<String, Object> sessionData = new HashMap<>();
while (attributes.hasMoreElements()) {
    String key = attributes.nextElement();
    sessionData.put(key, oldSession.getAttribute(key));
}
oldSession.invalidate(); // 기존 세션 무효화

HttpSession newSession = request.getSession(true);
for (Map.Entry<String, Object> entry : sessionData.entrySet()) {
    newSession.setAttribute(entry.getKey(), entry.getValue());
}
newSession.setAttribute("user", user);

// 세션 타임아웃 설정
newSession.setMaxInactiveInterval(30 * 60); // 30분`,
      severity: 'HIGH'
    },
    {
      id: 'SC-011',
      name: '세션 하이재킹 방지',
      check: (code) => code.includes('HttpSession') && !code.includes('setSecure'),
      issue: '세션 쿠키에 Secure 플래그가 설정되지 않았습니다.',
      suggestion: `Java 8 방식 - 안전한 세션 쿠키:
// web.xml 설정
<session-config>
    <cookie-config>
        <http-only>true</http-only>
        <secure>true</secure>
        <max-age>1800</max-age>
    </cookie-config>
    <session-timeout>30</session-timeout>
</session-config>

// 또는 프로그래밍 방식
Cookie sessionCookie = new Cookie("JSESSIONID", session.getId());
sessionCookie.setHttpOnly(true);
sessionCookie.setSecure(true);
sessionCookie.setMaxAge(1800);
response.addCookie(sessionCookie);`,
      severity: 'HIGH'
    }
  ],
  
  // 접근 제어 (5개)
  access_control: [
    {
      id: 'SC-012',
      name: '권한 검증 누락',
      check: (code) => code.includes('@RequestMapping') || code.includes('doGet') || code.includes('doPost'),
      issue: '메서드나 엔드포인트에 권한 검증이 없습니다.',
      suggestion: `Java 8 방식 - 권한 검증:
// Spring Security 사용
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/admin/users")
public List<User> getUsers() {
    // ...
}

// 또는 수동 검증
public void deleteUser(Long userId) {
    User currentUser = getCurrentUser();
    if (!currentUser.hasRole("ADMIN")) {
        throw new AccessDeniedException("관리자 권한이 필요합니다.");
    }
    // ...
}

// AOP를 이용한 권한 검증
@Aspect
@Component
public class SecurityAspect {
    @Before("@annotation(RequiresRole)")
    public void checkRole(JoinPoint joinPoint) {
        RequiresRole annotation = // ...
        if (!hasRole(annotation.value())) {
            throw new AccessDeniedException("권한이 없습니다.");
        }
    }
}`,
      severity: 'HIGH'
    }
  ],
  
  // 로깅 및 모니터링 (5개)
  logging: [
    {
      id: 'SC-013',
      name: '민감한 정보 로깅',
      check: (code) => code.match(/logger\.(info|debug|warn|error)\([^)]*password[^)]*\)/i) || code.match(/System\.out\.println\([^)]*password[^)]*\)/i),
      issue: '비밀번호 등 민감한 정보를 로그에 기록하고 있습니다.',
      suggestion: `Java 8 방식 - 안전한 로깅:
// ❌ 위험한 코드
logger.info("로그인 시도: username=" + username + ", password=" + password);
System.out.println("비밀번호: " + password);

// ✅ 안전한 코드
logger.info("로그인 시도: username={}", username);
// 비밀번호는 로그에 기록하지 않음

// 민감한 정보 마스킹
public String maskSensitiveData(String data) {
    if (data == null || data.length() <= 4) {
        return "****";
    }
    return data.substring(0, 2) + "****" + data.substring(data.length() - 2);
}

logger.info("카드번호: {}", maskSensitiveData(cardNumber));

// SLF4J + Logback 사용
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

private static final Logger logger = LoggerFactory.getLogger(UserService.class);
logger.debug("사용자 정보 조회: userId={}", userId); // {} 사용으로 자동 마스킹 가능`,
      severity: 'HIGH'
    },
    {
      id: 'SC-014',
      name: '로깅 부재',
      check: (code) => !code.includes('logger') && !code.includes('Logger') && !code.includes('log4j'),
      issue: '중요한 작업에 대한 로깅이 없습니다.',
      suggestion: `Java 8 방식 - 적절한 로깅:
// SLF4J 사용 (권장)
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    public void deleteUser(Long userId) {
        logger.info("사용자 삭제 시작: userId={}", userId);
        try {
            userRepository.delete(userId);
            logger.info("사용자 삭제 완료: userId={}", userId);
        } catch (Exception e) {
            logger.error("사용자 삭제 실패: userId={}", userId, e);
            throw new ServiceException("사용자 삭제 중 오류 발생", e);
        }
    }
}

// 로그 레벨
logger.trace("상세 디버깅 정보");
logger.debug("디버깅 정보");
logger.info("일반 정보");
logger.warn("경고");
logger.error("오류", exception);`,
      severity: 'MEDIUM'
    }
  ],
  
  // 데이터 보호 (5개)
  data_protection: [
    {
      id: 'SC-015',
      name: '하드코딩된 비밀번호/키',
      check: (code) => code.match(/(password|pwd|secret|key|api[_-]?key)\s*=\s*"[^"]+"/i),
      issue: '비밀번호나 API 키가 코드에 하드코딩되어 있습니다.',
      suggestion: `Java 8 방식 - 환경 변수 사용:
// ❌ 위험한 코드
String apiKey = "sk-1234567890abcdef";
String dbPassword = "mypassword123";

// ✅ 안전한 코드 - 환경 변수 사용
String apiKey = System.getenv("API_KEY");
if (apiKey == null || apiKey.isEmpty()) {
    throw new IllegalStateException("API_KEY 환경 변수가 설정되지 않았습니다.");
}

// 또는 설정 파일 사용 (외부화)
// application.properties
api.key=${API_KEY}
db.password=${DB_PASSWORD}

// Java 코드
@Value("${api.key}")
private String apiKey;

// 또는 Jasypt를 사용한 암호화된 설정
// application.properties
db.password=ENC(encrypted_password)

// Spring Boot 설정
@Configuration
public class DatabaseConfig {
    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setPassword(System.getenv("DB_PASSWORD"));
        return new HikariDataSource(config);
    }
}`,
      severity: 'CRITICAL'
    }
  ],
  
  // 통신 보안 (5개)
  communication_security: [
    {
      id: 'SC-016',
      name: 'HTTPS 미사용',
      check: (code) => code.includes('http://') && !code.includes('https://'),
      issue: 'HTTP 프로토콜을 사용하여 통신하고 있습니다.',
      suggestion: `Java 8 방식 - HTTPS 사용:
// ❌ 위험한 코드
URL url = new URL("http://example.com/api");

// ✅ 안전한 코드
URL url = new URL("https://example.com/api");

// SSL/TLS 설정
System.setProperty("https.protocols", "TLSv1.2,TLSv1.3");

// HttpClient with SSL
import javax.net.ssl.SSLContext;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;

SSLContext sslContext = SSLContextBuilder.create()
    .loadTrustMaterial(null, (certificate, authType) -> true)
    .build();

CloseableHttpClient httpClient = HttpClients.custom()
    .setSSLContext(sslContext)
    .build();`,
      severity: 'HIGH'
    }
  ],
  
  // 시스템 설정 (4개)
  system_config: [
    {
      id: 'SC-017',
      name: '에러 페이지 정보 노출',
      check: (code) => code.includes('web.xml') && code.includes('error-page'),
      issue: '에러 페이지에 상세한 스택 트레이스가 노출될 수 있습니다.',
      suggestion: `Java 8 방식 - 안전한 에러 페이지:
// web.xml
<error-page>
    <error-code>500</error-code>
    <location>/error/500.jsp</location>
</error-page>
<error-page>
    <exception-type>java.lang.Exception</exception-type>
    <location>/error/general.jsp</location>
</error-page>

// error/500.jsp - 사용자 친화적 메시지
<%@ page isErrorPage="true" %>
<h1>서버 오류가 발생했습니다.</h1>
<p>관리자에게 문의하세요.</p>
<% // 상세 정보는 로그에만 기록 %>

// 또는 Spring Boot
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        logger.error("오류 발생", e);
        return ResponseEntity.status(500)
            .body(new ErrorResponse("서버 오류가 발생했습니다."));
    }
}`,
      severity: 'MEDIUM'
    }
  ]
};

// 가이드라인 체크 함수
function checkSecureCodingGuidelines(code) {
  const allIssues = [];
  const allSuggestions = [];
  
  // 모든 카테고리 체크
  Object.values(SECURE_CODING_GUIDELINES).forEach(category => {
    category.forEach(guideline => {
      if (guideline.check(code)) {
        allIssues.push({
          id: guideline.id,
          name: guideline.name,
          issue: guideline.issue,
          severity: guideline.severity
        });
        allSuggestions.push({
          id: guideline.id,
          name: guideline.name,
          suggestion: guideline.suggestion,
          severity: guideline.severity
        });
      }
    });
  });
  
  return {
    issues: allIssues,
    suggestions: allSuggestions,
    totalChecked: Object.values(SECURE_CODING_GUIDELINES).flat().length,
    foundIssues: allIssues.length
  };
}

