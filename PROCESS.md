# PROCESS.md — Gym Program Tracker

Kişisel spor takip uygulaması. Backend yok — Next.js API route'ları + dosya sistemi (JSON + local uploads) ile çalışır.

---

## Teknoloji

- **Next.js 16** — App Router, RSC
- **React 19**
- **Tailwind CSS v4**
- **shadcn/ui** (radix-nova, neutral)
- **jose** — JWT (HTTP-only cookie)
- **bcrypt** — şifre hash
- **pnpm** — paket yöneticisi

---

## Veri Modeli

### `data/users.json`
```json
[
  {
    "id": "uuid",
    "username": "abdullah",
    "password": "bcrypt_hash",
    "role": "admin | user",
    "status": "active | pending | inactive",
    "createdAt": "2026-04-04T00:00:00Z"
  }
]
```

### `data/exercises.json`
```json
[
  {
    "id": "uuid",
    "name": "Bench Press",
    "muscleGroup": "chest",
    "mediaUrl": "/uploads/bench.mp4",
    "mediaType": "video | image",
    "scope": "global | personal",
    "status": "approved | pending | rejected",
    "createdBy": "userId",
    "createdAt": "2026-04-04T00:00:00Z"
  }
]
```

**Kural:** `scope: personal` ise `status` alanı kullanılmaz. `scope: global` ise admin onayı gerekir.

**Kas grupları:** `legs` `forearm` `upperArm` `shoulder` `wrist` `chest` `abs` `back`

### `data/programs.json`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Göğüs & Omuz",
    "exercises": [
      {
        "exerciseId": "uuid",
        "muscleGroup": "chest",
        "targetSets": 4,
        "targetReps": 10,
        "targetWeight": 80
      }
    ],
    "createdAt": "2026-04-04T00:00:00Z"
  }
]
```

> Bir kullanıcı sınırsız program oluşturabilir. "Aktif program" kavramı yok — her güne istediği programı ekler.

### `data/logs.json`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "date": "2026-04-04",
    "programIds": ["uuid1", "uuid2"],
    "exercises": [
      {
        "exerciseId": "uuid",
        "programId": "uuid",
        "completed": true,
        "sets": [
          { "setNumber": 1, "reps": 10, "weight": 80, "done": true },
          { "setNumber": 2, "reps": 8, "weight": 75, "done": false }
        ]
      }
    ],
    "createdAt": "2026-04-04T10:00:00Z"
  }
]
```

> Günde birden fazla program eklenebilir. `programIds` array'i bu yüzden var.

---

## Klasör Yapısı

```
app/
  (auth)/
    login/
      page.tsx
  (app)/
    layout.tsx             # Auth kontrolü — giriş yoksa /login'e yönlendir
    calendar/
      page.tsx             # Takvim ana sayfası
      [date]/
        page.tsx           # Gün detayı
    exercises/
      page.tsx
    programs/
      page.tsx
    feed/
      page.tsx
    progress/
      page.tsx
    admin/
      page.tsx             # Sadece admin rolü erişebilir
api/
  auth/
    login/route.ts
    logout/route.ts
    me/route.ts
  exercises/
    route.ts               # GET (list), POST (create)
    [id]/route.ts          # PUT, DELETE
    [id]/approve/route.ts  # Admin: onayla
    [id]/reject/route.ts   # Admin: reddet
  programs/
    route.ts               # GET, POST
    [id]/route.ts          # PUT, DELETE
  logs/
    route.ts               # GET, POST
    [date]/route.ts        # GET, PUT
  upload/
    route.ts               # POST — medya yükleme
  feed/
    route.ts               # GET — tüm kullanıcıların programları
  users/
    route.ts               # Admin: GET (list)
    [id]/route.ts          # Admin: PUT (status güncelle)
  progress/
    [exerciseId]/route.ts  # GET — kullanıcının o egzersiz gelişimi
components/
  ui/                      # shadcn primitives
  auth/
    LoginForm.tsx
  exercises/
    ExerciseCard.tsx
    ExerciseForm.tsx
    MuscleGroupFilter.tsx
  programs/
    ProgramCard.tsx
    ProgramForm.tsx
    ExerciseSelector.tsx
  calendar/
    CalendarGrid.tsx
    DayCell.tsx
  logs/
    WorkoutLogger.tsx      # Set/rep/kilo giriş arayüzü
    SetRow.tsx
  progress/
    ProgressChart.tsx
    ExerciseTrend.tsx      # +5kg / -2kg / motivasyon mesajı
  feed/
    FeedCard.tsx
  admin/
    PendingExercises.tsx
    UserTable.tsx
  shared/
    Navbar.tsx
    MediaUpload.tsx
lib/
  auth.ts                  # JWT oluştur/doğrula (jose)
  db.ts                    # JSON okuma/yazma yardımcıları
  progress.ts              # Gelişim hesaplama mantığı
  constants.ts             # Kas grupları, roller, statusler
middleware.ts              # Route koruması — cookie kontrolü
data/
  users.json
  exercises.json
  programs.json
  logs.json
public/
  uploads/                 # Yüklenen medya dosyaları
```

---

## Auth Akışı

1. Kullanıcı `/login` sayfasına girer, kullanıcı adı + şifre girer.
2. `POST /api/auth/login` → `users.json`'da ara → bcrypt karşılaştır.
3. Status `active` değilse hata dön (`pending` veya `inactive` mesajı).
4. Başarılıysa JWT üret (payload: `{ id, username, role }`) → HTTP-only cookie'ye yaz.
5. `middleware.ts` her `(app)` route'unda cookie'yi doğrular. Yoksa `/login`'e redirect.
6. Admin route'larında `role === "admin"` kontrolü yapılır.

---

## Gelişim Takibi Mantığı (`lib/progress.ts`)

Bir egzersiz için kullanıcının tüm log kayıtlarından:
- Son iki seanstaki maksimum ağırlığı karşılaştır.
- Delta hesapla: `currentMax - previousMax`

```
delta > 0  → "+Xkg ↑ — Güçleniyorsun, devam et!"
delta < 0  → "-Xkg ↓ — Geçen seferden biraz düşük, sorun değil."
delta = 0  → "= Aynı ağırlık — Plateau kırma zamanı olabilir."
veri yok   → "Henüz karşılaştırılacak yeterli veri yok."
```

> Sadece `done: true` olan setler hesaba katılır.

---

## Feed Mantığı

- `GET /api/feed` → tüm kullanıcıların programlarını döner (userId bazlı grupla, username join et)
- Gösterilen bilgi: program adı, kas grupları, egzersiz listesi (isimler), oluşturulma zamanı
- Kişisel veriler (set/rep/kilo) feed'de gösterilmez

---

## Yapılacaklar Listesi

### Faz 1 — Altyapı
- [x] `lib/db.ts` — JSON okuma/yazma helper'ları (readJSON, writeJSON, generateId)
- [x] `lib/constants.ts` — kas grupları, rol ve status sabitleri
- [x] `lib/auth.ts` — JWT üret/doğrula (`jose`), bcrypt helper
- [x] `middleware.ts` — route koruması
- [x] `data/` klasörünü oluştur, boş JSON dosyalarını hazırla
- [x] `data/users.json`'a ilk admin kullanıcıyı ekle (bcrypt hash ile)

### Faz 2 — Auth
- [x] `POST /api/auth/login` route
- [x] `POST /api/auth/logout` route
- [x] `GET /api/auth/me` route
- [x] `/login` sayfası ve `LoginForm` component

### Faz 3 — Egzersizler
- [x] `GET/POST /api/exercises` route
- [x] `PUT/DELETE /api/exercises/[id]` route
- [x] `POST /api/exercises/[id]/approve` (admin)
- [x] `POST /api/exercises/[id]/reject` (admin)
- [x] `POST /api/upload` route — medya yükleme
- [x] `/exercises` sayfası — listeleme, filtreleme (kas grubu), arama
- [x] `ExerciseForm` — yeni egzersiz oluşturma + medya yükleme
- [x] `ExerciseCard` — egzersiz kartı
- [x] `MuscleGroupFilter` — kas grubu filtresi

### Faz 4 — Programlar
- [x] `GET/POST /api/programs` route
- [x] `PUT/DELETE /api/programs/[id]` route
- [x] `/programs` sayfası — kullanıcının programları
- [x] `ProgramForm` — program oluştur/düzenle (egzersiz seç, default set/rep/kilo)
- [x] `ExerciseSelector` — programa egzersiz ekleme arayüzü

### Faz 5 — Takvim & Günlük
- [x] `GET/POST /api/logs` route
- [x] `GET/PUT /api/logs/[date]` route
- [x] `/calendar` sayfası — aylık takvim görünümü
- [x] `CalendarGrid` — spora gidilen günler renkli gösterilsin
- [x] `DayCell` — o güne ait tamamlanma % göster
- [x] `/calendar/[date]` sayfası — gün detayı
- [x] `WorkoutLogger` — o güne program ata, egzersizleri tamamla
- [x] `SetRow` — set bazlı rep/kilo girişi

### Faz 6 — Gelişim Takibi
- [x] `lib/progress.ts` — gelişim hesaplama mantığı
- [x] `GET /api/progress/[exerciseId]` route
- [x] `/progress` sayfası — egzersiz bazlı gelişim listesi
- [x] `ExerciseTrend` — delta gösterimi (+5kg, motivasyon mesajı)
- [ ] `ProgressChart` — ağırlık trendi grafiği (isteğe bağlı, Faz 6 sonrası değerlendirile)

### Faz 7 — Feed
- [x] `GET /api/feed` route
- [x] `/feed` sayfası
- [x] `FeedCard` — program yapısı gösterimi

### Faz 8 — Admin Paneli
- [x] `GET /api/users` route (admin)
- [x] `PUT /api/users/[id]` route — status güncelle
- [x] `/admin` sayfası
- [x] `PendingExercises` — onay bekleyen egzersizler
- [x] `UserTable` — kullanıcı listesi + status güncelleme

### Faz 9 — UI & Polish
- [x] `Navbar` — sayfa navigasyonu, kullanıcı bilgisi, çıkış (desktop + mobile bottom nav)
- [x] Mobil uyumluluk kontrolü
- [x] Boş durum ekranları (veri yoksa ne gösterilsin)
- [x] Hata ve yükleme state'leri

---

## Notlar

- `data/` klasörü `.gitignore`'a eklenebilir (kişisel veri) ya da şablon JSON'lar commit'lenebilir.
- `public/uploads/` `.gitignore`'a ekle.
- `pnpm dlx shadcn@latest add <component>` ile yeni shadcn bileşenleri ekle.
- Her JSON işlemi `lib/db.ts` üzerinden geçmeli — direkt `fs` kullanma.
- Next.js 16 breaking change'leri için `node_modules/next/dist/docs/` oku.
