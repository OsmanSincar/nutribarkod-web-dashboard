import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Check, AlertTriangle, ChevronRight, X, Trash2 } from 'lucide-react';
import { deleteHistoryItem, getHistory } from '../api';
import type { Page } from '../App';

interface HistoryProps {
  userId: number | null;
  setCurrentPage: (page: Page) => void;
  setAiResultData: (data: any) => void;
}

interface HistoryItem {
  id: string;
  productName: string;
  barcode: string;
  aiComment: string;
  ingredients?: string;
  scanDate: string;
  status: 'safe' | 'risky';
  isFavorite: boolean;
  score: number;
  nutriScore: string;
  calories?: string;
  sugar?: string;
  protein?: string;
  fat?: string;
  imageUrl?: string;
  brand?: string;
  missingFields?: string[];
  infoQuality?: string;
}

export default function History({ userId, setAiResultData, setCurrentPage }: HistoryProps) {
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const favoriteStorageKey = userId ? `favoriteProducts:${userId}` : 'favoriteProducts:guest';

  const normalizeNutriScore = (value: unknown) => {
    const score = String(value || '').trim().toUpperCase();
    return ['A', 'B', 'C', 'D', 'E'].includes(score) ? score : '';
  };

  const getFavoriteIds = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(favoriteStorageKey) || '[]') as string[]);
    } catch {
      return new Set<string>();
    }
  };

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    getHistory(userId)
      .then(data => {
        if (data.status === 'success' && Array.isArray(data.history)) {
          const favoriteIds = getFavoriteIds();
          // API'den gelen veriyi bileşenimizin formatına güvenli şekilde dönüştürüyoruz
          setHistoryItems(
            data.history.map((h: any) => ({
              id: String(h.id ?? h.history_id ?? h.barcode),
              productName: h.product_name || h.productName || 'Bilinmeyen Ürün',
              barcode: h.barcode,
              aiComment: h.ai_comment || h.aiComment || '',
              ingredients: h.ingredients || '',
              scanDate: h.scan_date || h.scanDate || '',
              status: h.status || 'risky',
              isFavorite: favoriteIds.has(String(h.id)),
              score: h.score ?? h.nutri_score_value ?? 0,
              nutriScore: normalizeNutriScore(
                h.nutri_score_letter ?? h.nutriScore ?? h.nutriscore_grade
              ),
              calories: h.calories ?? '?',
              sugar: h.sugar ?? '?',
              protein: h.protein ?? '?',
              fat: h.fat ?? '?',
              imageUrl: h.image_url || h.imageUrl || '',
              brand: h.brand || '',
              missingFields: h.missingFields || h.missing_fields || [],
              infoQuality: h.infoQuality || h.info_quality || 'good',
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId]);

  const filteredHistory = historyItems.filter(item => {
    if (historyFilter === 'safe' && item.status !== 'safe') return false;
    if (historyFilter === 'risky' && item.status !== 'risky') return false;
    if (historyFilter === 'favorites' && !item.isFavorite) return false;
    if (
      historySearch &&
      !item.productName.toLowerCase().includes(historySearch.toLowerCase())
    )
      return false;
    return true;
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setHistoryItems(prev => {
      const nextItems = prev.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      );
      localStorage.setItem(
        favoriteStorageKey,
        JSON.stringify(nextItems.filter(item => item.isFavorite).map(item => item.id))
      );
      return nextItems;
    });
  };

  const removeFavoriteId = (id: string) => {
    const favoriteIds = getFavoriteIds();
    favoriteIds.delete(id);
    localStorage.setItem(favoriteStorageKey, JSON.stringify(Array.from(favoriteIds)));
  };

  const handleDeleteClick = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteError(null);
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!userId || !itemToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteHistoryItem(userId, itemToDelete.id);

    if (result.status === 'success') {
      setHistoryItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      removeFavoriteId(itemToDelete.id);
      setItemToDelete(null);
    } else {
      setDeleteError(result.message || 'Geçmiş kaydı silinemedi.');
    }

    setIsDeleting(false);
  };

  const handleItemClick = (item: HistoryItem) => {
    // Result sayfasına aktarılacak verileri EKSİKSİZ gönderiyoruz
    setAiResultData({
      productName: item.productName,
      barcode: item.barcode,
      aiComment: item.aiComment,
      ingredients: item.ingredients || 'Bu ürün için içindekiler bilgisi geçmişe kaydedilmemiş.',
      status: item.status,
      scanDate: item.scanDate,
      score: item.score,
      nutriScore: item.nutriScore,
      calories: item.calories,
      sugar: item.sugar,
      protein: item.protein,
      fat: item.fat,
      imageUrl: item.imageUrl,
      brand: item.brand,
      missingFields: item.missingFields,
      infoQuality: item.infoQuality,
    });
    setCurrentPage('result');
  };

  const getNutriBadgeClass = (item: HistoryItem) => {
    switch (item.nutriScore) {
      case 'A':
        return 'bg-[#10B981]';
      case 'B':
        return 'bg-[#84cc16]';
      case 'C':
        return 'bg-[#fbbf24]';
      case 'D':
        return 'bg-[#f97316]';
      case 'E':
        return 'bg-[#ef4444]';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
        <div className="min-w-0">
          <h1 className="text-gray-800 mb-1">Tarama Geçmişi</h1>
          <p className="text-gray-500 text-sm sm:text-base">Daha önce tarattığınız ürünlerin analiz özetleri.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder="Ürün ara..."
              className="pl-10 pr-9 py-2.5 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 w-full"
            />
            {historySearch && (
              <button
                onClick={() => setHistorySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowFilterMenu(prev => !prev)}
              className="w-full sm:w-auto justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-[12px] hover:bg-gray-200 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" /> Filtrele
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-[12px] shadow-lg z-10 overflow-hidden">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'safe', label: 'Uygun' },
                  { id: 'risky', label: 'Riskli' },
                  { id: 'favorites', label: 'Favoriler' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setHistoryFilter(f.id);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                      historyFilter === f.id
                        ? 'text-[#10B981] font-medium bg-[#10B981]/5'
                        : 'text-gray-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Tümü' },
          { id: 'safe', label: 'Uygun' },
          { id: 'risky', label: 'Riskli' },
          {
            id: 'favorites',
            label: 'Favoriler',
            icon: <Star className="w-4 h-4" />,
          },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setHistoryFilter(f.id)}
            className={`px-5 py-2.5 rounded-full flex items-center gap-2 transition-all whitespace-nowrap flex-shrink-0 ${
              historyFilter === f.id
                ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/25'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#10B981]'
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {!isLoading && userId && (
        <p className="text-sm text-gray-400">
          {filteredHistory.length} ürün bulundu
        </p>
      )}

      <div className="max-w-5xl space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-[16px] p-12 text-center text-gray-400">
            Yükleniyor...
          </div>
        ) : !userId ? (
          <div className="bg-white rounded-[16px] p-12 text-center text-gray-400">
            Geçmişi görmek için giriş yapmalısınız.
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-[16px] p-12 text-center text-gray-400">
            {historySearch
              ? `"${historySearch}" için sonuç bulunamadı.`
              : 'Henüz tarama yapılmamış.'}
          </div>
        ) : (
          filteredHistory.map(item => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="bg-white rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-4 sm:p-5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-[12px] flex items-center justify-center flex-shrink-0 relative overflow-visible">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-contain rounded-[12px] bg-white p-1 border border-gray-100"
                    />
                  ) : (
                    <span className="text-4xl">🛒</span>
                  )}
                  {item.nutriScore && (
                    <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${getNutriBadgeClass(item)}`}>
                      {item.nutriScore}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-gray-800 font-medium break-words">{item.productName}</h3>

                    <button
                      onClick={e => toggleFavorite(item.id, e)}
                      className="p-1 rounded-full hover:bg-amber-50 transition-colors"
                      title={item.isFavorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          item.isFavorite
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300 hover:text-amber-400'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">Tarandı: {item.scanDate}</p>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-1">{item.aiComment}</p>
                </div>
                <div className="flex-shrink-0 w-full sm:w-auto">
                  {item.status === 'safe' ? (
                    <div className="px-4 py-2 bg-[#10B981]/10 border-2 border-[#10B981] text-[#10B981] rounded-[12px] flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Uygun</span>
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-red-50 border-2 border-red-500 text-red-600 rounded-[12px] flex items-center justify-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Riskli</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={e => handleDeleteClick(item, e)}
                  className="w-full sm:w-10 h-10 flex items-center justify-center rounded-[12px] text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                  title="Geçmişten sil"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <ChevronRight className="hidden sm:block w-5 h-5 text-gray-400 group-hover:text-[#10B981] flex-shrink-0 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-900/20 backdrop-blur-sm" onClick={() => !isDeleting && setItemToDelete(null)} />
          <div className="relative bg-white rounded-[20px] sm:rounded-[24px] shadow-2xl w-full max-w-md p-5 sm:p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="mb-6">
              <h2 className="text-gray-800 text-xl mb-2">Geçmişten silinsin mi?</h2>
              <p className="text-gray-600">
                <span className="font-semibold">{itemToDelete.productName}</span> kaydını silmek istediğinize emin misiniz?
              </p>
              {deleteError && (
                <p className="mt-3 text-sm text-red-600">{deleteError}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-[12px] hover:bg-gray-200 disabled:opacity-60"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-[12px] hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
