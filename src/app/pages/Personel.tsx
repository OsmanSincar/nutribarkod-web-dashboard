import React from 'react';
import { updatePersonalInfo } from '../api';

interface PersonalInfo { firstName: string; lastName: string; age: string; height: string; weight: string; gender: string; goal: string; }
interface PersonalProps {userId: number | null; personalInfo: PersonalInfo; setPersonalInfo: (info: PersonalInfo) => void; }


export default function Personal({ userId, personalInfo, setPersonalInfo }: PersonalProps) {
  // src/pages/Personal.tsx içine ekle:
  const handleUpdate = async () => {
    if (!userId) return;
    const response = await updatePersonalInfo(userId, personalInfo);
    if (response.status === "success") {
      alert("Bilgileriniz başarıyla kaydedildi!");
    } else {
      alert("Bir hata oluştu.");
    }
  };
  return (

     
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-gray-800 mb-1">Kişisel Bilgiler</h1>
        <p className="text-gray-500 text-sm sm:text-base">Kişisel bilgilerinizi görüntüleyin ve güncelleyin.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 sm:p-8">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">İsim</label>
                <input type="text" value={personalInfo.firstName} onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Soyisim</label>
                <input type="text" value={personalInfo.lastName} onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Yaş</label>
                <input type="number" value={personalInfo.age} onChange={(e) => setPersonalInfo({ ...personalInfo, age: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Boy (cm)</label>
                <input type="number" value={personalInfo.height} onChange={(e) => setPersonalInfo({ ...personalInfo, height: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Kilo (kg)</label>
                <input type="number" value={personalInfo.weight} onChange={(e) => setPersonalInfo({ ...personalInfo, weight: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Cinsiyet</label>
              <select value={personalInfo.gender} onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 bg-white">
                <option>Erkek</option><option>Kadın</option><option>Diğer</option>
              </select>
            </div>

            <button onClick={handleUpdate} className="w-full px-6 py-4 bg-[#10B981] text-white rounded-[12px] hover:bg-[#059669] transition-colors shadow-lg shadow-[#10B981]/25 mt-6">
              Güncelle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
