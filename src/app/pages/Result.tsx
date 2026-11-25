import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Candy,
  Check,
  Droplets,
  Dumbbell,
  Flame,
  PackageSearch,
  Sparkles,
} from 'lucide-react';

import type { AiResultData, Condition, Page, PersonalInfo } from '../App';

interface ResultProps {
  aiResultData: AiResultData | null;
  conditions: Condition[];
  personalInfo: PersonalInfo;
  setCurrentPage: (page: Page) => void;
}

const scoreByNutriLetter: Record<string, number> = {
  A: 92,
  B: 74,
  C: 56,
  D: 34,
  E: 16,
};

function readString(data: AiResultData, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return fallback;
}

function readOptionalNumber(data: AiResultData, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function readStringArray(data: AiResultData, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value.map(String).filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
}

function isUsefulSourceText(value: string) {
  return (
    value.trim() !== '' &&
    value.trim() !== '?' &&
    !/bilgisi yok|bilinmiyor|bulunmamaktadır/i.test(value)
  );
}

function normalizeForSearch(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeNumberText(value: string) {
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) return value;
  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
}

function extractFirstMatch(source: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) return normalizeNumberText(match[1]);
  }

  return '';
}

function extractNutrientFromText(
  source: string,
  nutrient: 'calories' | 'sugar' | 'protein' | 'fat'
) {
  const compactSource = source.replace(/\s+/g, ' ');

  const patterns = {
    calories: [
      /(?:enerji|energy)[^0-9]{0,80}[0-9]+(?:[.,][0-9]+)?\s*kJ\s*\/\s*([0-9]+(?:[.,][0-9]+)?)\s*kcal/i,
      /(?:enerji|energy)[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)\s*kcal/i,
      /([0-9]+(?:[.,][0-9]+)?)\s*kcal/i,
    ],
    sugar: [
      /(?:şekerler|şeker|sekerler|seker|sugars?|sugar)[^0-9]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*g/i,
    ],
    protein: [
      /(?:protein|proteins?)[^0-9]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*g/i,
    ],
    fat: [
      /(?:^|[\s,.;:])(?:yağ|yag|fat|lipides)[^0-9]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*g/i,
    ],
  };

  return extractFirstMatch(compactSource, patterns[nutrient]);
}

function formatNutrientValue(
  value: string,
  unit: string,
  sourceText: string,
  nutrient: 'calories' | 'sugar' | 'protein' | 'fat'
) {
  if (isUsefulSourceText(value)) {
    const hasUnit = new RegExp(`\\b${unit}\\b`, 'i').test(value);
    return hasUnit ? value : `${value} ${unit}`;
  }

  const extractedValue = extractNutrientFromText(sourceText, nutrient);
  if (extractedValue) return `${extractedValue} ${unit}`;

  return 'Bilgi yok';
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeNutriScore(value: string) {
  const score = value.trim().toUpperCase();
  return scoreByNutriLetter[score] !== undefined ? score : '';
}

function getStatusState(data: AiResultData, aiComment: string) {
  const explicitStatus = normalizeForSearch(
    readString(data, ['riskStatus', 'risk_status', 'status'])
  );

  if (['risky', 'riskli', 'danger', 'dangerous'].includes(explicitStatus)) {
    return 'risky';
  }

  if (['safe', 'uygun', 'guvenli', 'guvenlidir'].includes(explicitStatus)) {
    return 'safe';
  }

  const normalizedComment = normalizeForSearch(aiComment);
  if (
    /riskli|uyari|tehlikeli|sakincali|uygun degil|guvenli degil|tuketimi onerilmez|tuketilmez|onermem|dikkatli/.test(
      normalizedComment
    )
  ) {
    return 'risky';
  }

  if (/profil icin uygun|uygun|guvenli|tuketilebilir/.test(normalizedComment)) {
    return 'safe';
  }

  return 'unknown';
}

function formatAiComment(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export default function Result({
  aiResultData,
  conditions,
  personalInfo,
  setCurrentPage,
}: ResultProps) {
  if (!aiResultData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl text-gray-800">Analiz sonucu bulunamadı.</h2>
        <button
          onClick={() => setCurrentPage('home')}
          className="mt-4 px-6 py-2 bg-[#10B981] text-white rounded-lg"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  const productName = readString(
    aiResultData,
    ['productName', 'product_name'],
    'Bilinmeyen Ürün'
  );
  const aiComment = readString(
    aiResultData,
    ['aiComment', 'ai_comment'],
    'Yorum bulunamadı.'
  );
  const ingredients = readString(
    aiResultData,
    ['ingredients'],
    'Bu ürün için içindekiler bilgisi bulunmamaktadır.'
  );
  const categories = readString(aiResultData, ['categories']);
  const allergens = readString(aiResultData, ['allergens']);
  const traces = readString(aiResultData, ['traces']);
  const labels = readString(aiResultData, ['labels']);
  const additives = readString(aiResultData, ['additives']);
  const imageUrl = readString(aiResultData, ['imageUrl', 'image_url']);
  const brand = readString(aiResultData, ['brand'], 'Bilinmeyen Marka');
  const missingFields = readStringArray(aiResultData, [
    'missingFields',
    'missing_fields',
  ]);
  const ingredientsMissing =
    !isUsefulSourceText(ingredients) ||
    missingFields.some((field) => field.toLowerCase() === 'içindekiler');
  const infoQuality = readString(
    aiResultData,
    ['infoQuality', 'info_quality'],
    ingredientsMissing ? 'limited' : missingFields.length > 0 ? 'partial' : 'good'
  );
  const nutriScore = normalizeNutriScore(
    readString(aiResultData, ['nutriScore', 'nutri_score_letter'])
  );
  const statusState = getStatusState(aiResultData, aiComment);
  const statusIsRisky = statusState === 'risky';
  const rawScore = readOptionalNumber(aiResultData, ['score', 'nutri_score_value']);
  const displayScore =
    scoreByNutriLetter[nutriScore] ??
    (rawScore !== null && rawScore > 0 ? clampScore(rawScore) : null) ??
    (statusState === 'risky' ? 18 : statusState === 'safe' ? 82 : null);
  const rotationAngle = (((displayScore ?? 0) / 100) * 180);

  const activeProfileItems = [
    ...conditions.map((condition) => condition.title),
    ...(personalInfo.goal ? [`Hedef: ${personalInfo.goal}`] : []),
  ];

  const getScoreColor = () => {
    const score = displayScore ?? 0;
    if (score < 20) return '#ef4444';
    if (score < 40) return '#f97316';
    if (score < 60) return '#fbbf24';
    if (score < 80) return '#84cc16';
    return '#10B981';
  };

  const getOpacity = (maxThreshold: number) =>
    (displayScore ?? 0) >= maxThreshold - 20 ? 1 : 0.16;

  const infoQualityText = {
    good: 'Kaynak verisi yeterli',
    partial: 'Bazı ürün bilgileri eksik',
    limited: 'İçindekiler bilgisi eksik',
  }[infoQuality] || 'Bazı ürün bilgileri eksik';

  const productFacts = [
    { label: 'Kategori', value: categories },
    { label: 'Bildirilen alerjenler', value: allergens },
    { label: 'İz içerebilir', value: traces },
    { label: 'Etiketler', value: labels },
    { label: 'Katkılar', value: additives },
  ].filter((item) => isUsefulSourceText(item.value));

  const nutrientSourceText = [ingredients, labels, aiComment].join(' ');

  const nutrients = [
    {
      label: 'Kalori',
      value: formatNutrientValue(
        readString(aiResultData, ['calories'], '?'),
        'kcal',
        nutrientSourceText,
        'calories'
      ),
      icon: Flame,
      tone: 'bg-orange-50 text-orange-600 border-orange-100',
    },
    {
      label: 'Şeker',
      value: formatNutrientValue(
        readString(aiResultData, ['sugar'], '?'),
        'g',
        nutrientSourceText,
        'sugar'
      ),
      icon: Candy,
      tone: 'bg-red-50 text-red-600 border-red-100',
    },
    {
      label: 'Protein',
      value: formatNutrientValue(
        readString(aiResultData, ['protein'], '?'),
        'g',
        nutrientSourceText,
        'protein'
      ),
      icon: Dumbbell,
      tone: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      label: 'Yağ',
      value: formatNutrientValue(
        readString(aiResultData, ['fat'], '?'),
        'g',
        nutrientSourceText,
        'fat'
      ),
      icon: Droplets,
      tone: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-800 mb-1">Ürün Analiz Sonucu</h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Yapay zeka ve profiliniz tabanlı detaylı inceleme
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5 sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[220px_1fr_240px] lg:items-center">
            <div className="flex justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={productName}
                  className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-[16px] shadow-md bg-white p-3 border border-gray-100"
                />
              ) : (
                <div className="w-44 h-44 sm:w-52 sm:h-52 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-[16px] flex flex-col items-center justify-center shadow-md text-gray-500">
                  <PackageSearch className="w-12 h-12 mb-3 text-[#10B981]" />
                  <span className="text-sm font-medium">Resim Yok</span>
                </div>
              )}
            </div>

            <div className="min-w-0 text-center lg:text-left">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                  statusState === 'risky'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : statusState === 'safe'
                      ? 'bg-[#10B981]/10 text-[#059669] border border-[#10B981]/20'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {statusState === 'risky' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : statusState === 'safe' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <PackageSearch className="w-4 h-4" />
                )}
                {statusState === 'risky'
                  ? 'Dikkat Gerektirir'
                  : statusState === 'safe'
                    ? 'Profil İçin Uygun'
                    : 'Değerlendirme Yok'}
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-800 mb-2 break-words">
                {productName}
              </h2>
              <p className="text-gray-500 mb-5">{brand}</p>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {activeProfileItems.slice(0, 3).map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
                {activeProfileItems.length > 3 && (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    +{activeProfileItems.length - 3} daha
                  </span>
                )}
                {activeProfileItems.length === 0 && (
                  <span className="text-xs text-gray-400">Profil boş</span>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              {displayScore === null ? (
                <div className="w-[210px] h-[140px] rounded-[16px] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center text-gray-500">
                  <PackageSearch className="w-8 h-8 mb-2 text-gray-400" />
                  <span className="text-sm font-medium">Skor bilgisi yok</span>
                </div>
              ) : (
                <div className="relative w-[210px] h-[140px]">
                  <svg width="210" height="126" viewBox="0 0 210 126">
                    <path
                      d="M 25 105 A 80 80 0 0 1 57 50"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeOpacity={getOpacity(20)}
                    />
                    <path
                      d="M 57 50 A 80 80 0 0 1 89 25"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeOpacity={getOpacity(40)}
                    />
                    <path
                      d="M 89 25 A 80 80 0 0 1 121 25"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeOpacity={getOpacity(60)}
                    />
                    <path
                      d="M 121 25 A 80 80 0 0 1 153 50"
                      fill="none"
                      stroke="#84cc16"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeOpacity={getOpacity(80)}
                    />
                    <path
                      d="M 153 50 A 80 80 0 0 1 185 105"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeOpacity={getOpacity(100)}
                    />

                    <g transform={`rotate(${rotationAngle}, 105, 105)`}>
                      <line
                        x1="105"
                        y1="105"
                        x2="45"
                        y2="105"
                        stroke="#0F172A"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </g>
                    <circle cx="105" cy="105" r="8" fill="#0F172A" />
                  </svg>

                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                    <div
                      className="text-3xl font-bold"
                      style={{ color: getScoreColor() }}
                    >
                      {displayScore}
                    </div>
                    <div className="text-sm text-gray-500">/ 100</div>
                    {nutriScore && (
                      <div className="text-xs font-semibold text-gray-500 mt-1">
                        Nutri-Score: {nutriScore}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {infoQuality !== 'good' && (
          <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4 sm:p-5 flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">{infoQualityText}</h3>
              <p className="text-sm leading-relaxed text-amber-800">
                Bu barkod kaynağında
                {' '}
                {missingFields.length > 0
                  ? missingFields.join(', ')
                  : 'bazı alanlar'}
                {' '}
                bulunamadı. Yorum eldeki bilgilerle oluşturuldu; özellikle alerji
                veya hassasiyet varsa ambalaj üzerindeki etiketi de kontrol edin.
              </p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-5 sm:p-6 lg:p-8 border-2 border-[#10B981]/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#10B981] rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-800 text-xl font-semibold mb-4">
                Kişisel Diyetisyen Yorumu
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {formatAiComment(aiComment)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-6">
            <h3 className="text-gray-800 font-semibold mb-4">
              Besin Değerleri (100g İçin)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nutrients.map(({ label, value, icon: Icon, tone }) => (
                <div
                  key={label}
                  className={`p-4 rounded-[16px] border text-center ${tone}`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-xs font-medium mb-1">{label}</div>
                  <div className="font-bold text-gray-800">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-6">
            <h3 className="text-gray-800 font-semibold mb-4">
              İçindekiler Listesi
            </h3>
            {ingredientsMissing ? (
              <div className="rounded-[14px] bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600 leading-relaxed">
                Bu ürünün içindekiler bilgisi barkod kaynağında bulunamadı.
                Analiz, ürün adı, kategori, alerjen ve besin değerleri gibi
                mevcut alanlar üzerinden sınırlı şekilde hazırlanmıştır.
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {ingredients}
              </p>
            )}

            {productFacts.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                {productFacts.map((item) => (
                  <div key={item.label}>
                    <div className="text-xs font-semibold text-gray-500 mb-1">
                      {item.label}
                    </div>
                    <div className="text-sm text-gray-700">{item.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setCurrentPage('home')}
            className="px-8 py-3 bg-gray-100 text-gray-700 font-medium rounded-[12px] hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Yeni Tarama Yap
          </button>
        </div>
      </div>
    </div>
  );
}
