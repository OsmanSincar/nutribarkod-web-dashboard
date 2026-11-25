import React, { useState } from 'react';
import { Check, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { syncConditionsToBackend } from '../api';


interface HealthCondition { id: string; title: string; notes: string; }
interface CategoryChip { id: string; label: string; selected: boolean; }
interface HealthCategories { allergies: CategoryChip[]; diet: CategoryChip[]; religious: CategoryChip[]; medical: CategoryChip[]; }

interface ProfileProps {
  userId: number | null; // ← YENİ
  conditions: HealthCondition[];
  setConditions: React.Dispatch<React.SetStateAction<HealthCondition[]>>;
  healthCategories: HealthCategories;
  setHealthCategories: React.Dispatch<React.SetStateAction<HealthCategories>>;
}

// Backend'e conditions'ları sync eden yardımcı fonksiyon


export default function Profile({ userId, conditions, setConditions, healthCategories, setHealthCategories }: ProfileProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<keyof HealthCategories>('allergies');
  const [customCondition, setCustomCondition] = useState({ name: '', notes: '' });
  const [selectedChipToAdd, setSelectedChipToAdd] = useState<{ category: keyof HealthCategories; chipId: string; label: string } | null>(null);
  const [conditionToDelete, setConditionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [addNote, setAddNote] = useState('');

  const handleChipClick = (category: keyof HealthCategories, chipId: string, label: string) => {
    const chip = healthCategories[category].find(c => c.id === chipId);
    if (chip?.selected) {
      const condition = conditions.find(c => c.title === label);
      if (condition) { setConditionToDelete({ id: condition.id, title: condition.title }); setDeleteModalOpen(true); }
    } else {
      setSelectedChipToAdd({ category, chipId, label });
      setAddNote(''); setAddModalOpen(true);
    }
  };

  const handleConfirmAdd = () => {
    if (selectedChipToAdd) {
      setHealthCategories(prev => ({ ...prev, [selectedChipToAdd.category]: prev[selectedChipToAdd.category].map(chip => chip.id === selectedChipToAdd.chipId ? { ...chip, selected: true } : chip) }));
      const newConditions = [...conditions, { id: Date.now().toString(), title: selectedChipToAdd.label, notes: addNote }];
      setConditions(newConditions);
      syncConditionsToBackend(userId, newConditions); // ← SYNC
      setAddModalOpen(false); setSelectedChipToAdd(null); setAddNote('');
    }
  };

  const handleConfirmDelete = () => {
    if (conditionToDelete) {
      const newConditions = conditions.filter(c => c.id !== conditionToDelete.id);
      setConditions(newConditions);
      syncConditionsToBackend(userId, newConditions); // ← SYNC
      Object.keys(healthCategories).forEach((category) => {
        setHealthCategories(prev => ({ ...prev, [category as keyof HealthCategories]: prev[category as keyof HealthCategories].map(chip => chip.label === conditionToDelete.title ? { ...chip, selected: false } : chip) }));
      });
      setDeleteModalOpen(false); setConditionToDelete(null);
    }
  };

  const openCustomModal = (category: keyof HealthCategories) => { setCurrentCategory(category); setCustomCondition({ name: '', notes: '' }); setAddModalOpen(true); };

  const handleAddCustomCondition = () => {
    if (customCondition.name.trim()) {
      const newChip: CategoryChip = { id: `custom-${Date.now()}`, label: customCondition.name, selected: true };
      setHealthCategories(prev => ({ ...prev, [currentCategory]: [...prev[currentCategory], newChip] }));
      const newConditions = [...conditions, { id: Date.now().toString(), title: customCondition.name, notes: customCondition.notes }];
      setConditions(newConditions);
      syncConditionsToBackend(userId, newConditions); // ← SYNC
      setCustomCondition({ name: '', notes: '' }); setAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-6"><h1 className="text-gray-800 mb-1">Hastalık & Hassasiyet Seçimi</h1><p className="text-gray-500 text-sm sm:text-base">Aşağıdaki kategorilerden durumlarınızı seçin.</p></div>
        <div className="max-w-5xl mx-auto space-y-6">
          {[
            { id: 'allergies', icon: '🥜', title: 'Alerjiler & İntoleranslar', key: 'allergies' as keyof HealthCategories },
            { id: 'diet', icon: '🥗', title: 'Diyet & Yaşam Tarzı', key: 'diet' as keyof HealthCategories },
            { id: 'religious', icon: '🕌', title: 'Dini & Özel Hassasiyetler', key: 'religious' as keyof HealthCategories },
            { id: 'medical', icon: '⚕️', title: 'Tıbbi Durumlar', key: 'medical' as keyof HealthCategories }
          ].map((cat) => (
            <div key={cat.id} className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 sm:p-6">
              <h3 className="text-gray-800 mb-4 flex items-center gap-2"><span className="text-2xl">{cat.icon}</span> <span>{cat.title}</span></h3>
              <div className="flex flex-wrap gap-3">
                {healthCategories[cat.key].map((chip) => (
                  <button key={chip.id} onClick={() => handleChipClick(cat.key, chip.id, chip.label)} className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${chip.selected ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-gray-200 text-gray-700 hover:border-[#10B981]'}`}>
                    {chip.selected && <Check className="w-4 h-4" />}{chip.label}
                  </button>
                ))}
                <button onClick={() => openCustomModal(cat.key)} className="px-4 py-2 rounded-full border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#10B981] hover:text-[#10B981] flex items-center gap-2"><Plus className="w-4 h-4" /> Özel Ekle</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t-4 border-gray-100 pt-8">
        <div className="mb-6"><h1 className="text-gray-800 mb-1">Aktif Sağlık Profiliniz</h1><p className="text-gray-500 text-sm sm:text-base">Profilinize eklediğiniz durumlar ve notlarınız.</p></div>
        <div className="max-w-5xl mx-auto space-y-4">
          {conditions.length === 0 ? (
            <div className="bg-white rounded-[20px] sm:rounded-[24px] p-8 sm:p-12 text-center"><p className="text-gray-400">Henüz aktif bir durum eklemediniz.</p></div>
          ) : (
            conditions.map((condition) => (
              <div key={condition.id} className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 sm:p-6 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-gray-800 mb-2">{condition.title}</h4>
                  {condition.notes && <p className="text-gray-600 text-sm">{condition.notes}</p>}
                </div>
                <button onClick={() => { setConditionToDelete({ id: condition.id, title: condition.title }); setDeleteModalOpen(true); }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))
          )}
        </div>
      </div>

      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          <div className="relative bg-white rounded-[20px] sm:rounded-[24px] shadow-2xl w-full max-w-md p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setAddModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            <div className="mb-6"><h2 className="text-gray-800 text-xl mb-2">{selectedChipToAdd ? `Profile Ekle: ${selectedChipToAdd.label}` : 'Özel Durum Ekle'}</h2></div>
            <div className="space-y-4">
              {!selectedChipToAdd && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Durum Adı</label>
                  <input type="text" value={customCondition.name} onChange={(e) => setCustomCondition({ ...customCondition, name: e.target.value })} placeholder="Örn: Spesifik bir alerji" className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20" />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Yapay Zeka İçin Özel Notunuz (Opsiyonel)</label>
                <textarea value={selectedChipToAdd ? addNote : customCondition.notes} onChange={(e) => selectedChipToAdd ? setAddNote(e.target.value) : setCustomCondition({ ...customCondition, notes: e.target.value })} placeholder="Örn: Eser miktarda içeriyorsa uyar..." rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 resize-none" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button onClick={() => setAddModalOpen(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-[12px] hover:bg-gray-200">Vazgeç</button>
              <button onClick={selectedChipToAdd ? handleConfirmAdd : handleAddCustomCondition} className="flex-1 px-6 py-3 bg-[#10B981] text-white rounded-[12px] hover:bg-[#059669]">Profile Ekle</button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && conditionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-900/20 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-[20px] sm:rounded-[24px] shadow-2xl w-full max-w-md p-5 sm:p-8 text-center">
            <div className="flex justify-center mb-4"><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-600" /></div></div>
            <div className="mb-6"><h2 className="text-gray-800 text-xl mb-2">Emin misiniz?</h2><p className="text-gray-600"><span className="font-semibold">{conditionToDelete.title}</span> durumunu silmek istediğinize emin misiniz?</p></div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-[12px] hover:bg-gray-200">Vazgeç</button>
              <button onClick={handleConfirmDelete} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-[12px] hover:bg-red-700">Evet, Çıkar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
