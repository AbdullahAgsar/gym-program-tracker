# CONVERSATION.md — Proje Tasarım Sohbeti

Bu dosya, projenin başlangıç tasarım sürecinde yapılan konuşmaların özetidir.
Yeni bir AI veya session ile devam ederken bağlamı aktarmak için kullanılabilir.

---

## Proje Özeti

**Proje adı:** Gym Program Tracker
**Amaç:** Kişisel spor programını takip etmek, günlük antrenmanları kayıt altına almak ve gelişimi izlemek.
**Backend yok** — Next.js 16 App Router + API route'ları + dosya sistemi (JSON + lokal medya) ile çalışır.

---

## Kararlaştırılan Yapı

### Kimlik Doğrulama
- `users.json` dosyasında kullanıcılar tutulur. Register yok, kullanıcılar manuel eklenir.
- Şifreler bcrypt ile hash'lenir.
- JWT, HTTP-only cookie'ye yazılır (`jose` kütüphanesi).
- Kullanıcı status değerleri: `active`, `pending`, `inactive`. Sadece `active` olanlar giriş yapabilir.
- Roller: `admin` ve `user`.

### Egzersizler
- İki kapsam var: `personal` (sadece sahibi görür) ve `global` (herkes görür).
- Kullanıcı global egzersiz eklemek istediğinde `pending` statüsüyle gönderilir, admin onaylar.
- Admin onaylarsa `approved`, reddederse `rejected` olur.
- Kas grupları: `legs`, `forearm`, `upperArm`, `shoulder`, `wrist`, `chest`, `abs`, `back`
- Egzersizlere video veya fotoğraf yüklenebilir, lokal depolanır (`public/uploads/`).

### Programlar
- Her kullanıcı sınırsız program oluşturabilir.
- "Aktif program" kavramı yok — her güne istediği programları ekler.
- Bir güne birden fazla program eklenebilir (örn. bacak + omuz aynı gün).
- Program içinde egzersizler kas grubuna göre organize edilir.
- Her egzersiz için `targetSets`, `targetReps`, `targetWeight` default olarak tanımlanır ama her seansta güncellenebilir.

### Takvim & Günlük Kayıt
- Ana sayfa aylık takvim görünümü.
- Spora gidilen günler renkli gösterilir.
- Her gün için tamamlanma yüzdesi hesaplanır.
- Bir güne tıklanınca gün detay sayfasına gidilir.
- Gün detayında: o güne program atanır, egzersizler tamamlandı/tamamlanmadı işaretlenir.
- Her egzersiz için set bazlı kayıt: `setNumber`, `reps`, `weight`, `done`.
- `reps` ve `weight` zorunlu değil.
- Kullanıcı birkaç gün ara verdikten sonra geri döndüğünde kaldığı yerden devam edebilir.

### Gelişim Takibi
- Kullanıcı bazlı, egzersiz bazlı gelişim hesaplanır.
- Son iki seanstaki maksimum ağırlık karşılaştırılır.
- Gösterim:
  - `delta > 0` → "+Xkg ↑ — Güçleniyorsun, devam et!"
  - `delta < 0` → "-Xkg ↓ — Geçen seferden biraz düşük, sorun değil."
  - `delta = 0` → "= Aynı ağırlık — Plateau kırma zamanı olabilir."
  - Veri yok → "Henüz karşılaştırılacak yeterli veri yok."
- Sadece `done: true` olan setler hesaba katılır.

### Program Feed
- Tüm kullanıcıların oluşturduğu programlar listelenir.
- Gösterilen bilgi: program adı, kas grupları, egzersiz isimleri, oluşturulma zamanı, kullanıcı adı.
- Kişisel veriler (set/rep/kilo) feed'de gösterilmez.
- Format: "Abdullah 10 dakika önce Göğüs & Omuz programı oluşturdu."

### Admin Paneli
- Onay bekleyen global egzersizleri onaylama/reddetme.
- Kullanıcı listesi ve status güncelleme (`active`, `pending`, `inactive`).
- Sadece `role: admin` olan kullanıcılar erişebilir.

---

## Sayfalar

| Route | Açıklama | Erişim |
|---|---|---|
| `/login` | Giriş ekranı | Herkese açık |
| `/calendar` | Aylık takvim, spora gidilen günler | user + admin |
| `/calendar/[date]` | Gün detayı — program ata, set/rep/kilo gir | user + admin |
| `/exercises` | Global + kişisel hareketler listesi, yeni ekleme | user + admin |
| `/programs` | Kullanıcının programları, oluştur/düzenle | user + admin |
| `/feed` | Topluluk program akışı (yapı gösterimi) | user + admin |
| `/progress` | Kullanıcı bazlı egzersiz gelişim takibi | user + admin |
| `/admin` | Egzersiz onaylama, kullanıcı yönetimi | sadece admin |

---

## Veri Modeli

### `data/users.json`
```json
{
  "id": "uuid",
  "username": "string",
  "password": "bcrypt_hash",
  "role": "admin | user",
  "status": "active | pending | inactive",
  "createdAt": "ISO8601"
}
```

### `data/exercises.json`
```json
{
  "id": "uuid",
  "name": "string",
  "muscleGroup": "legs | forearm | upperArm | shoulder | wrist | chest | abs | back",
  "mediaUrl": "/uploads/filename.ext",
  "mediaType": "video | image",
  "scope": "global | personal",
  "status": "approved | pending | rejected",
  "createdBy": "userId",
  "createdAt": "ISO8601"
}
```

### `data/programs.json`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "string",
  "exercises": [
    {
      "exerciseId": "uuid",
      "muscleGroup": "string",
      "targetSets": 4,
      "targetReps": 10,
      "targetWeight": 80
    }
  ],
  "createdAt": "ISO8601"
}
```

### `data/logs.json`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "date": "YYYY-MM-DD",
  "programIds": ["uuid"],
  "exercises": [
    {
      "exerciseId": "uuid",
      "programId": "uuid",
      "completed": true,
      "sets": [
        { "setNumber": 1, "reps": 10, "weight": 80, "done": true }
      ]
    }
  ],
  "createdAt": "ISO8601"
}
```

---

## Teknik Kararlar

| Konu | Karar |
|---|---|
| Paket yöneticisi | pnpm |
| Auth | JWT (jose) + HTTP-only cookie |
| Şifreleme | bcrypt |
| Veri depolama | JSON dosyaları (`data/`) |
| Medya depolama | `public/uploads/` (lokal) |
| UI kütüphanesi | shadcn/ui (radix-nova, neutral) |
| CSS | Tailwind v4 (`@import` tabanlı, config dosyası yok) |
| Path alias | `@/*` → repo root |
| Register | Şuan yok, ileride eklenebilir |

---

## Açık Kalan Konular

- Register akışı ileride eklenecek.
- Gelişim grafiği (chart) isteğe bağlı olarak Faz 6'da değerlendirilebilir.
- Medya yükleme boyut/format limitleri belirlenmedi.
- Feed'de pagination/infinite scroll gerekliliği tartışılmadı.

---

## Referans Dosyalar

- `PROCESS.md` — Yapılacaklar listesi ve faz planı (buradan kaldığın yerden devam et)
- `CLAUDE.md` — Claude Code için proje kuralları
- `components.json` — shadcn/ui konfigürasyonu
