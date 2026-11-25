import React, { useState } from 'react';
import { Camera, Search, AlertTriangle, X, UploadCloud, Loader2 } from 'lucide-react';

import { analyzeBarcode } from '../api';
import BarcodeScanner from '../components/BarcodeScanner';

// ✅ Düzeltildi: App.tsx'teki tipler import edildi, any/string kaldırıldı
import type { AiResultData, Page } from '../App';

interface HomeProps {
  isLoggedIn: boolean;
  userId: number | null;
  setAiResultData: (data: AiResultData) => void;
  setCurrentPage: (page: Page) => void;
}

export default function Home({ isLoggedIn, userId, setAiResultData, setCurrentPage }: HomeProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // ✅ Düzeltildi: isScanning başta false yapılıyor, tüm dallar finally ile kapatılıyor
  const triggerSearch = async (codeToSearch: string) => {
    if (!isLoggedIn || !userId) {
      setScanError('Ürün analizi yapabilmek için lütfen giriş yapın veya kayıt olun.');
      setCameraActive(false);
      return;
    }

    if (!codeToSearch.trim()) return;

    setIsScanning(true);
    setScanError('');

    try {
      const pythonResponse = await analyzeBarcode(userId, codeToSearch);

      if (pythonResponse && pythonResponse.status === 'success') {
        setAiResultData(pythonResponse);
        setCurrentPage('result');
      } else {
        setScanError(pythonResponse?.message || 'Ürün bulunamadı veya sunucu hatası.');
      }
    } catch {
      setScanError('Sunucuyla iletişim kurulamadı.');
    } finally {
      // ✅ Düzeltildi: Her durumda isScanning kapatılıyor
      setIsScanning(false);
    }
  };

  // ✅ Düzeltildi: await eklendi
  const handleScanSuccess = async (decodedText: string) => {
    setCameraActive(false);
    setBarcode(decodedText);
    await triggerSearch(decodedText);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isLoggedIn || !userId) {
      setScanError('Ürün analizi yapabilmek için lütfen giriş yapın.');
      return;
    }

    setIsScanning(true);
    setScanError('');

    // ✅ Düzeltildi: imageUrl memory leak'i önlemek için dışarıda tanımlandı
    let imageUrl: string | null = null;

    try {
      const imageBitmap = await window.createImageBitmap(file);

      // 1. Native BarcodeDetector (Donanımsal AI)
      if (typeof (window as any).BarcodeDetector !== 'undefined') {
        const BarcodeDetectorAPI = (window as any).BarcodeDetector;
        const detector = new BarcodeDetectorAPI();
        const barcodes = await detector.detect(imageBitmap);

        if (barcodes.length > 0) {
          const detectedCode = barcodes[0].rawValue;
          setBarcode(detectedCode);
          await triggerSearch(detectedCode); // ✅ Düzeltildi: await eklendi
          return;
        }
      }

      // 2. ZXing fallback
      imageUrl = URL.createObjectURL(file);
      const imgElement = new Image();
      imgElement.src = imageUrl;

      // ✅ Düzeltildi: imgElement DOM'a eklendi (bazı tarayıcılarda gerekli)
      imgElement.style.display = 'none';
      document.body.appendChild(imgElement);

      await new Promise<void>((resolve, reject) => {
        imgElement.onload = () => resolve();
        imgElement.onerror = () => reject(new Error('Görsel yüklenemedi'));
      });

      const { BrowserMultiFormatReader, DecodeHintType } = await import('@zxing/library');

      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints);
      const result = await reader.decodeFromImageElement(imgElement);

      if (result) {
        setBarcode(result.getText());
        await triggerSearch(result.getText()); // ✅ Düzeltildi: await eklendi
      }
    } catch {
      // ✅ Düzeltildi: console.error kaldırıldı, kullanıcıya anlamlı mesaj gösteriliyor
      setScanError('Bu fotoğrafta barkod bulunamadı. Lütfen daha net bir görsel seçin.');
      setIsScanning(false);
    } finally {
      // ✅ Düzeltildi: Her durumda memory leak önleniyor ve input sıfırlanıyor
      if (imageUrl) URL.revokeObjectURL(imageUrl);

      // DOM'a eklenen imgElement temizleniyor
      const orphan = document.body.querySelector('img[src^="blob:"]');
      if (orphan) document.body.removeChild(orphan);

      event.target.value = ''; // ✅ Düzeltildi: Hata durumunda da sıfırlanıyor
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-800 mb-1">Barkod Tarayıcı</h1>
        <p className="text-gray-500 text-sm sm:text-base">Kamerayı kullanın, fotoğraf yükleyin veya numarayı girin.</p>
      </div>

      {/* KAMERA VE FOTOĞRAF KARTI */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 sm:p-6 lg:p-8">
        {!cameraActive ? (
          <div className="relative min-h-[320px] sm:aspect-video bg-[#0F172A] rounded-[16px] overflow-hidden flex items-center justify-center">

            {/* ✅ Düzeltildi: Kullanılmayan id="file-reader" div'i kaldırıldı */}

            <div className="flex flex-col items-center gap-5 px-4 text-center w-full">
              {isScanning ? (
                <div className="flex flex-col items-center gap-4 text-[#10B981]">
                  <Loader2 className="w-16 h-16 animate-spin" />
                  <p className="font-medium text-white">Görsel Analiz Ediliyor...</p>
                </div>
              ) : (
                <>
                  <Camera className="w-14 h-14 sm:w-16 sm:h-16 text-gray-500 mb-2" />
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">

                    {/* Canlı Kamera Butonu */}
                    <button
                      onClick={() => setCameraActive(true)}
                      className="w-full sm:w-auto justify-center px-6 py-4 bg-[#10B981] text-white rounded-[12px] hover:bg-[#059669] transition-colors shadow-lg shadow-[#10B981]/25 font-medium flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" /> Kamerayı Aç
                    </button>

                    {/* Fotoğraf Yükle Butonu */}
                    <label className="w-full sm:w-auto justify-center px-6 py-4 bg-white/10 text-white rounded-[12px] hover:bg-white/20 transition-colors cursor-pointer font-medium flex items-center gap-2 border border-white/20">
                      <UploadCloud className="w-5 h-5" /> Fotoğraf Yükle
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>

                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <BarcodeScanner onScanSuccess={handleScanSuccess} />
            <button
              onClick={() => setCameraActive(false)}
              className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10 shadow-lg"
              title="Kamerayı Kapat"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* MANUEL GİRİŞ KARTI */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Barkod no girin..."
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-[12px] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && triggerSearch(barcode)}
            />
          </div>
          <button
            disabled={isScanning}
            onClick={() => triggerSearch(barcode)}
            className="w-full sm:w-auto px-8 py-4 bg-[#0F172A] text-white rounded-[12px] hover:bg-[#1e293b] font-medium disabled:opacity-50"
          >
            {isScanning ? 'Sorgulanıyor...' : 'Sorgula'}
          </button>
        </div>

        {scanError && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-[12px] flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-sm text-red-700 font-medium">{scanError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
