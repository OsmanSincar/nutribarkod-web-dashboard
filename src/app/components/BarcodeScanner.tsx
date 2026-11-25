import React, { useEffect, useRef, useState } from 'react';
import { Loader2, ZapOff } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

// Desteklenen barkod formatları (BarcodeDetector API formatları)
const NATIVE_FORMATS = [
  'ean_13', 'ean_8', 'code_128', 'code_39', 'code_93',
  'qr_code', 'data_matrix', 'upc_a', 'upc_e', 'itf', 'pdf417', 'aztec',
];

export default function BarcodeScanner({ onScanSuccess }: ScannerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<'native' | 'zxing' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;
    startScanner();

    return () => {
      stoppedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []); // onScanSuccess kasıtlı olarak bağımlılıktan çıkarıldı

  async function startScanner() {
    try {
      // 1) Yüksek çözünürlüklü kamera akışı başlat
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // @ts-ignore — tarayıcı desteği varsa sürekli otomatik odak
          focusMode: { ideal: 'continuous' },
          advanced: [{ focusMode: 'continuous' }] as any,
        },
      });

      if (stoppedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoading(false);

      // 2) Önce Native BarcodeDetector API'yi dene
      if (typeof (window as any).BarcodeDetector !== 'undefined') {
        setEngine('native');
        runNativeDetector();
      } else {
        // 3) Fallback: @zxing/browser
        setEngine('zxing');
        runZxingDecoder();
      }

    } catch (err: any) {
      console.error('Kamera başlatılamadı:', err);
      setError('Kamera erişimi reddedildi veya bulunamadı.');
      setIsLoading(false);
    }
  }

  // --- YÖNTEM A: Native BarcodeDetector (Chrome 83+, Edge, Android Chrome) ---
  async function runNativeDetector() {
    const BarcodeDetectorAPI = (window as any).BarcodeDetector;
    const detector = new BarcodeDetectorAPI({ formats: NATIVE_FORMATS });
    const video = videoRef.current!;

    async function tick() {
      if (stoppedRef.current || video.readyState < 2) {
        if (!stoppedRef.current) rafRef.current = requestAnimationFrame(tick);
        return;
      }
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          stoppedRef.current = true;
          streamRef.current?.getTracks().forEach(t => t.stop());
          onScanSuccess(code);
          return;
        }
      } catch (_) {}
      if (!stoppedRef.current) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  // --- YÖNTEM B: @zxing/browser (evrensel fallback) ---
  async function runZxingDecoder() {
    const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = await import('@zxing/library');

    const hints = new Map<any, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39, BarcodeFormat.CODE_93, BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      BarcodeFormat.ITF, BarcodeFormat.PDF_417, BarcodeFormat.AZTEC,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints, 80);
    const video = videoRef.current!;
    if (stoppedRef.current) return;

    // Tarayıcı durana kadar sürekli kontrol eden güvenli döngü
    async function scanLoop() {
      if (stoppedRef.current || video.readyState < 2) {
        if (!stoppedRef.current) rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      try {
        const result = await reader.decodeFromVideoElement(video);
        if (result && !stoppedRef.current) {
          stoppedRef.current = true; 
          streamRef.current?.getTracks().forEach(t => t.stop()); 
          onScanSuccess(result.getText()); 
          return; 
        }
      } catch (err) {
        // Barkod bulunamadığında ZXing hata fırlatır, bunu yutuyoruz ve devam ediyoruz
      }
      if (!stoppedRef.current) rafRef.current = requestAnimationFrame(scanLoop);
    }
    
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  return (
    <div className="relative w-full h-full min-h-[320px] sm:min-h-[350px] flex items-center justify-center bg-[#0F172A] rounded-[16px] overflow-hidden">

      {/* Yükleniyor Ekranı */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white gap-3 bg-[#0F172A]">
          <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
          <p className="text-sm text-gray-400">Kamera başlatılıyor...</p>
        </div>
      )}

      {/* Hata Ekranı */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white gap-3 bg-[#0F172A]">
          <ZapOff className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-400 text-center px-6">{error}</p>
        </div>
      )}

      {/* Video Elementi — kütüphane yerine doğrudan kullanıyoruz */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Tarama Arayüzü */}
      {!isLoading && !error && (
        <>
          {/* Lazer Tarama Çizgisi */}
          <div
            className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20 pointer-events-none"
            style={{ animation: 'scan 2s ease-in-out infinite' }}
          />

          {/* Köşe İşaretleri */}
          <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-[#10B981] rounded-tl-xl z-20 pointer-events-none opacity-80" />
          <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-[#10B981] rounded-tr-xl z-20 pointer-events-none opacity-80" />
          <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-[#10B981] rounded-bl-xl z-20 pointer-events-none opacity-80" />
          <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-[#10B981] rounded-br-xl z-20 pointer-events-none opacity-80" />

          {/* Motor Göstergesi (geliştirme/debug için, istersen kaldırabilirsin) */}
          <div className="absolute top-2 right-2 z-30 pointer-events-none">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-gray-400">
              {engine === 'native' ? '⚡ Native' : '🔍 ZXing'}
            </span>
          </div>

          {/* Etrafı Karartma Efekti */}
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] z-10 pointer-events-none" />
        </>
      )}
    </div>
  );
}
