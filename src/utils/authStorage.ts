// 더미 인증 데이터 관리 유틸리티
// 백엔드 연동 전까지 localStorage를 사용한 임시 구현

export interface User {
  id: string;
  password: string;
  email: string;
}

export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number;
}

const USERS_KEY = 'ddal_kkak_users';
const VERIFICATION_CODES_KEY = 'ddal_kkak_verification_codes';

// 사용자 데이터 관리
export const authStorage = {
  // 모든 사용자 가져오기
  getUsers(): User[] {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // 사용자 저장
  saveUser(user: User): boolean {
    const users = this.getUsers();

    // 중복 아이디 체크
    if (users.some(u => u.id === user.id)) {
      return false;
    }

    // 중복 이메일 체크
    if (users.some(u => u.email === user.email)) {
      return false;
    }

    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  },

  // 사용자 찾기 (아이디로)
  findUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  // 사용자 찾기 (이메일로)
  findUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.email === email) || null;
  },

  // 로그인 검증
  validateLogin(id: string, password: string): boolean {
    const user = this.findUserById(id);
    return user !== null && user.password === password;
  },

  // 비밀번호 변경
  changePassword(email: string, newPassword: string): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
      return false;
    }

    users[userIndex].password = newPassword;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  },
};

// 인증번호 관리
export const verificationStorage = {
  // 인증번호 생성 및 저장
  generateCode(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 숫자
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5분 후 만료

    const codes = this.getCodes();

    // 기존 코드 제거 (같은 이메일)
    const filteredCodes = codes.filter(c => c.email !== email);
    filteredCodes.push({ email, code, expiresAt });

    localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(filteredCodes));

    console.log(`[인증번호 생성] ${email}: ${code} (5분 후 만료)`);
    return code;
  },

  // 모든 인증번호 가져오기
  getCodes(): VerificationCode[] {
    const data = localStorage.getItem(VERIFICATION_CODES_KEY);
    return data ? JSON.parse(data) : [];
  },

  // 인증번호 검증
  verifyCode(email: string, code: string): boolean {
    const codes = this.getCodes();
    const verification = codes.find(c => c.email === email && c.code === code);

    if (!verification) {
      return false;
    }

    // 만료 시간 확인
    if (Date.now() > verification.expiresAt) {
      // 만료된 코드 삭제
      this.removeCode(email);
      return false;
    }

    return true;
  },

  // 인증번호 삭제
  removeCode(email: string): void {
    const codes = this.getCodes();
    const filteredCodes = codes.filter(c => c.email !== email);
    localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(filteredCodes));
  },

  // 만료된 인증번호 정리
  cleanExpiredCodes(): void {
    const codes = this.getCodes();
    const validCodes = codes.filter(c => Date.now() <= c.expiresAt);
    localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(validCodes));
  },
};

// 초기 더미 데이터 설정 (개발용)
export const initDummyData = () => {
  const users = authStorage.getUsers();

  // 더미 사용자가 없으면 추가
  if (users.length === 0) {
    authStorage.saveUser({
      id: 'testuser',
      password: 'test1234',
      email: 'test@example.com',
    });
    console.log('[더미 데이터] 테스트 사용자 생성: testuser / test1234');
  }
};
