import React, { useState } from 'react';
import { Lock, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { updatePassword } from '../api';

export default function Password({ userId }: { userId: number | null }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | '', message: string }>({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Yeni şifreler birbiriyle eşleşmiyor!' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Şifreniz en az 6 karakter olmalıdır.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await updatePassword(userId, currentPassword, newPassword);
      if (res.status === 'success') {
        setStatus({ type: 'success', message: 'Şifreniz başarıyla güncellendi!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus({ type: 'error', message: res.message || 'Bir hata oluştu.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Sunucuya bağlanılamadı.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-gray-800 mb-1 text-2xl font-bold">Şifre Değiştir</h1>
        <p className="text-gray-500 text-sm sm:text-base">Hesap güvenliğiniz için şifrenizi güncelleyin</p>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5 sm:p-8">
        {status.message && (
          <div className={`mb-6 p-4 rounded-[12px] flex items-start gap-3 ${status.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-emerald-50 border-l-4 border-emerald-500'}`}>
            {status.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />}
            <p className={`text-sm font-medium ${status.type === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{status.message}</p>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="password" 
              required 
              placeholder="Mevcut Şifreniz" 
              value={currentPassword} 
              onChange={e => setCurrentPassword(e.target.value)} 
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" 
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="password" 
              required 
              placeholder="Yeni Şifre" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="password" 
              required 
              placeholder="Yeni Şifre (Tekrar)" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" 
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword} 
              className="w-full py-4 bg-[#10B981] text-white rounded-[12px] hover:bg-[#059669] font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
