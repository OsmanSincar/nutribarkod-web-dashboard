import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, AlertTriangle } from 'lucide-react';
import { loginUser, registerUser } from '../api';
import type { Page } from '../App';

interface AuthProps {
  setIsLoggedIn: (status: boolean) => void;
  setUserId: (id: number) => void;
  setUserFullName: (name: string) => void;
  setUserEmail: (email: string) => void; // <-- YENİ EKLENDİ
  setCurrentPage: (page: Page) => void;
  setPersonalInfo: (info: any) => void;
  setConditions: React.Dispatch<React.SetStateAction<any[]>>;
  setHealthCategories: React.Dispatch<React.SetStateAction<any>>;
}

export default function Auth({ setIsLoggedIn, setUserId, setUserFullName, setUserEmail, setPersonalInfo, setCurrentPage,setConditions, setHealthCategories }: AuthProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  


  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    
    try {
      const response = isLoginView 
        ? await loginUser(authForm.email, authForm.password)
        : await registerUser(authForm.fullName, authForm.email, authForm.password);

      if (response.status === "success") {
        // Eskisini silip bunu yapıştır:
        const fullName = response.full_name || authForm.fullName || 'Kullanıcı';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        setUserId(response.user_id); 
        setUserFullName(fullName);
        setUserEmail(authForm.email);

        setPersonalInfo({
          firstName: firstName,
          lastName: lastName,
          age: response.age || '',
          height: response.height || '',
          weight: response.weight || '',
          gender: response.gender || '',
          goal: response.goal || 'Formu Korumak'
        });


        

        // 👇 YERİNE BU YENİ "ZİNCİRLEME" KODU YAPIŞTIR 👇
        if (response.conditions && response.conditions.length > 0) {
          
          // 1. Backend'den gelen veriyi Profile sayfasının anlayacağı formata çevirip ana depoya gönder
          const formattedConditions = response.conditions.map((c: any) => ({
            id: c.id || Date.now().toString(),
            title: c.title,
            notes: '' 
          }));
          setConditions(formattedConditions);

          // 2. Profile sayfasındaki o şık butonların (Chiplerin) seçili (yeşil) görünmesini sağla!
          setHealthCategories((prev: any) => {
            const newCats = { ...prev };
            Object.keys(newCats).forEach(key => {
              newCats[key] = newCats[key].map((chip: any) => {
                const isMatch = formattedConditions.find((c: any) => c.title === chip.label);
                return isMatch ? { ...chip, selected: true } : chip;
              });
            });
            return newCats;
          });
        }
        setIsLoggedIn(true);
        setCurrentPage('home');
      } else {
        setAuthError(response.message || "Bir hata oluştu.");
      }
    } catch (error) {
      setAuthError("Sunucuya bağlanılamadı.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-12">
      <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-[20px] sm:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <div className="text-center mb-7 sm:mb-8">
          <div className="mx-auto h-16 w-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-4">
            {isLoginView ? <LogIn className="h-8 w-8 text-[#10B981]" /> : <UserPlus className="h-8 w-8 text-[#10B981]" />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{isLoginView ? 'Hoş Geldin!' : 'Aramıza Katıl'}</h2>
        </div>

        {authError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{authError}</p>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-5">
          {!isLoginView && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" required placeholder="Adınız ve Soyadınız" value={authForm.fullName} onChange={e => setAuthForm({...authForm, fullName: e.target.value})} className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" required placeholder="E-Posta Adresiniz" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="password" required placeholder="Şifreniz" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" />
          </div>
          <button type="submit" disabled={isAuthLoading} className="w-full py-4 bg-[#0F172A] text-white rounded-[12px] hover:bg-[#1e293b] font-medium disabled:opacity-50 transition-colors">
            {isAuthLoading ? 'Bekleniyor...' : (isLoginView ? 'Giriş Yap' : 'Kayıt Ol')}
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {isLoginView ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
            <button type="button" onClick={() => { setIsLoginView(!isLoginView); setAuthError(''); }} className="font-semibold text-[#10B981] hover:text-[#059669]">
              {isLoginView ? 'Üye Ol' : 'Giriş Yap'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
