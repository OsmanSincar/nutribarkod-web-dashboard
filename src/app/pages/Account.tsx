import React, { useState } from 'react';

interface AccountProps { 
  userFullName: string; 
  userEmail: string; 
  setUserEmail: (email: string) => void; 
}

export default function Account({ userFullName, userEmail, setUserEmail }: AccountProps) {
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = () => {
    setSaveMessage('Bilgileriniz güncellendi.');
    window.setTimeout(() => setSaveMessage(''), 2200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-800 mb-1">Hesap Bilgileri</h1>
        <p className="text-gray-500 text-sm sm:text-base">Kullanıcı adı ve e-posta bilgilerinizi yönetin.</p>
      </div>
      <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 sm:p-6">
        <div className="space-y-6 max-w-md">
          {/* Gerçek İsim Gösterimi */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {userFullName ? userFullName.charAt(0).toUpperCase() : "Ü"}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 break-words">{userFullName || "Aktif Kullanıcı"}</h2>
              <p className="text-sm text-gray-500">NutriBarkod Üyesi</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">E-posta</label>
            <input 
              type="email" 
              value={userEmail} 
              onChange={(e) => setUserEmail(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all" 
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-[#10B981] text-white rounded-[12px] hover:bg-[#059669] transition-colors shadow-lg shadow-[#10B981]/25"
          >
            Bilgileri Güncelle
          </button>

          {saveMessage && (
            <p className="text-sm text-[#059669] font-medium text-center">
              {saveMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
