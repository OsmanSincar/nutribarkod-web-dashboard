import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Password from './pages/Password';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Result from './pages/Result';
import Personal from './pages/Personel';
import History from './pages/History';
import Account from './pages/Account';

// ✅ Page tipi tanımlandı ve her yerde kullanılıyor
export type Page =
  | 'home'
  | 'profile'
  | 'history'
  | 'settings'
  | 'account'
  | 'password'
  | 'personal'
  | 'result'
  | 'auth';

// ✅ any yerine interface'ler
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  age: string;
  height: string;
  weight: string;
  gender: string;
  goal: string;
}

export interface Condition {
  id: string;
  title: string;
  notes: string;
}

export interface HealthItem {
  id: string;
  label: string;
  selected: boolean;
}

export interface HealthCategories {
  allergies: HealthItem[];
  diet: HealthItem[];
  religious: HealthItem[];
  medical: HealthItem[];
}

export interface AiResultData {
  [key: string]: unknown;
}

// ─── Yardımcı: localStorage'dan güvenli okuma ───────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === 'null' || raw === 'undefined') return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function lsGetString(key: string, fallback = ''): string {
  const val = localStorage.getItem(key);
  if (!val || val === 'null' || val === 'undefined') return fallback;
  return val;
}

function lsGetUserId(): number | null {
  const raw = localStorage.getItem('userId');
  if (!raw || raw === 'null' || raw === 'undefined') return null;
  const parsed = Number(raw);
  return isNaN(parsed) ? null : parsed; // ✅ NaN tuzağı önlendi
}

// ─── Varsayılan değerler ─────────────────────────────────────────────────────

const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  firstName: '',
  lastName: '',
  age: '',
  height: '',
  weight: '',
  gender: '',
  goal: '',
};

const DEFAULT_CONDITIONS: Condition[] = []; // ✅ Hard-coded örnek veri kaldırıldı

const DEFAULT_HEALTH_CATEGORIES: HealthCategories = {
  allergies: [
    { id: 'a1', label: 'Fıstık Alerjisi', selected: false },   // ✅ selected: false
    { id: 'a2', label: 'Gluten İntoleransı', selected: false },
    { id: 'a3', label: 'Laktoz İntoleransı', selected: false },
  ],
  diet: [
    { id: 'd1', label: 'Vegan', selected: false },
    { id: 'd2', label: 'Vejetaryen', selected: false },
  ],
  religious: [
    { id: 'r1', label: 'Helal', selected: false },
  ],
  medical: [
    { id: 'm1', label: 'Diyabet', selected: false },
  ],
};

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export default function App() {

  // ✅ localStorage'dan güvenli başlangıç değerleri
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => localStorage.getItem('isLoggedIn') === 'true'
  );
  const [userId, setUserId] = useState<number | null>(lsGetUserId);
  const [userFullName, setUserFullName] = useState<string>(
    () => lsGetString('userFullName')
  );
  const [userEmail, setUserEmail] = useState<string>(
    () => lsGetString('userEmail')
  );
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(
    () => lsGet<PersonalInfo>('personalInfo', DEFAULT_PERSONAL_INFO)
  );
  const [conditions, setConditions] = useState<Condition[]>(
    () => lsGet<Condition[]>('conditions', DEFAULT_CONDITIONS)
  );
  const [healthCategories, setHealthCategories] = useState<HealthCategories>(
    () => lsGet<HealthCategories>('healthCategories', DEFAULT_HEALTH_CATEGORIES)
  );

  const [aiResultData, setAiResultData] = useState<AiResultData | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');// ✅ Page tipi
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // ─── State → localStorage senkronizasyonu ───────────────────────────────

  useEffect(() => {
    localStorage.setItem('isLoggedIn', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    // ✅ null'ı string olarak yazmak yerine key'i siliyoruz
    if (userId === null) {
      localStorage.removeItem('userId');
    } else {
      localStorage.setItem('userId', String(userId));
    }
  }, [userId]);

  useEffect(() => {
    localStorage.setItem('userFullName', userFullName);
  }, [userFullName]);

  useEffect(() => {
    localStorage.setItem('userEmail', userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('personalInfo', JSON.stringify(personalInfo));
  }, [personalInfo]);

  useEffect(() => {
    localStorage.setItem('conditions', JSON.stringify(conditions));
  }, [conditions]);

  useEffect(() => {
    localStorage.setItem('healthCategories', JSON.stringify(healthCategories));
  }, [healthCategories]);

  // ─── Çıkış ──────────────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('personalInfo');
    localStorage.removeItem('conditions');
    localStorage.removeItem('healthCategories');

    setIsLoggedIn(false);
    setUserId(null);
    setUserFullName('');
    setUserEmail('');
    setPersonalInfo(DEFAULT_PERSONAL_INFO);
    setConditions(DEFAULT_CONDITIONS);
    setHealthCategories(DEFAULT_HEALTH_CATEGORIES);
    setAiResultData(null);
    setCurrentPage('home');
  }, []);

  // ─── Sayfa render ────────────────────────────────────────────────────────

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home
            isLoggedIn={isLoggedIn}
            userId={userId}
            setAiResultData={setAiResultData}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'auth':
        return (
          <Auth
            setIsLoggedIn={setIsLoggedIn}
            setUserId={setUserId}
            setUserFullName={setUserFullName}
            setUserEmail={setUserEmail}
            setPersonalInfo={setPersonalInfo}
            setCurrentPage={setCurrentPage}
            setConditions={setConditions}
            setHealthCategories={setHealthCategories}
          />
        );
      case 'profile':
        return (
          <Profile
            userId={userId}
            conditions={conditions}
            setConditions={setConditions}
            healthCategories={healthCategories}
            setHealthCategories={setHealthCategories}
          />
        );
      case 'result':
        return (
          <Result
            aiResultData={aiResultData}
            conditions={conditions}
            personalInfo={personalInfo}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'personal':
        return (
          <Personal
            userId={userId}
            personalInfo={personalInfo}
            setPersonalInfo={setPersonalInfo}
          />
        );
      case 'history':
        return (
          <History
            userId={userId}
            setAiResultData={setAiResultData}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'account':
        return (
          <Account
            userFullName={userFullName}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
          />
        );
      case 'password':
        return <Password userId={userId} />;
      default:
        return (
          <Home
            isLoggedIn={isLoggedIn}
            userId={userId}
            setAiResultData={setAiResultData}
            setCurrentPage={setCurrentPage}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] flex-col md:flex-row">
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative min-w-0">
        <div className="max-w-[1100px] mx-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
