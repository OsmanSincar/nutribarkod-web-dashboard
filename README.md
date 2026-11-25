# NutriBarkod Web Dashboard

NutriBarkod, barkodla ürün analizi ve kullanıcı profili/geçmiş yönetimi için hazırlanmış bir React web arayüzü projesidir. Arayüz tasarımı Figma Make ile oluşturulmuştur.

> Bu depo web arayüzünü içerir. API sunucusu bu depoya dahil değildir; giriş, kayıt, ürün analizi ve kullanıcı verileri için ayrıca çalışan bir backend gerekir.

## Gereksinimler

- Node.js 20 veya üzeri
- npm
- API uç noktalarını sağlayan bir backend (backend özelliklerini kullanmak için)

## Kurulum ve çalıştırma

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell kullanıyorsanız ortam dosyasını `Copy-Item .env.example .env.local` komutuyla kopyalayabilirsiniz. Geliştirme sunucusu terminalde gösterilen yerel adreste açılır.

## Ortam değişkenleri

| Değişken | Açıklama | Varsayılan |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API kök adresi; `/api` ile bitirmeyin | `http://127.0.0.1:8000` |

Örnek: `VITE_API_BASE_URL=https://api.ornek.com`. Vite istemci değişkenleri tarayıcıya aktarılır; buraya gizli anahtar veya parola koymayın. `.env.local` Git dışında tutulur.

## Üretim derlemesi

```bash
npm run build
npm run preview
```

Derleme çıktısı `dist/` klasörüne yazılır. Statik barındırma kullanırken API adresini dağıtım ortamında ayarlayın. Backend tarafında HTTPS, CORS ve kimlik doğrulama ayarları sunucuda yapılandırılmalıdır.

## Teknolojiler

- React, TypeScript ve Vite
- Tailwind CSS ve shadcn/ui tabanlı bileşenler
- ZXing ile barkod tarama

## Katkı ve atıflar

Kullanılan shadcn/ui bileşenleri ve Unsplash görselleri için lisans bilgileri [ATTRIBUTIONS.md](ATTRIBUTIONS.md) dosyasındadır. Proje arayüzü için referans Figma dosyası: [NutriBarkod Web Dashboard Design](https://www.figma.com/design/noGvatBJTVbgsOD1pn6uCm/NutriBarkod-Web-Dashboard-Design).

## Lisans

Bu depoda proje kodu için henüz bir lisans tanımlanmamıştır. Açık kaynak kullanımına izin vermek istiyorsanız depoyu yayımlamadan önce uygun bir lisans ekleyin. Üçüncü taraf bileşenlerin lisansları kendi koşullarına tabidir.
