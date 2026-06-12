# CarRent Backend — مصر

Car rental marketplace API built with NestJS + PostgreSQL + Redis.

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL via Prisma ORM
- **Cache / Locks**: Redis (ioredis)
- **Auth**: JWT + OTP (SMS via Vonage)
- **Payments**: Paymob / Fawry
- **Push**: Firebase FCM
- **Storage**: Cloudflare R2 (صور العربيات)
- **Docs**: Swagger at `/api/docs`

## Setup

```bash
# 1. تثبيت الـ dependencies
npm install

# 2. إنشاء ملف .env
cp .env.example .env
# عدل القيم في .env

# 3. إنشاء قاعدة البيانات
npx prisma migrate dev --name init
npx prisma generate

# 4. تشغيل السيرفر
npm run start:dev
```

## Project Structure

```
src/
├── auth/               # OTP login + JWT
├── users/              # customer profile
├── owners/             # معارض management
├── cars/               # car CRUD + availability
├── bookings/           # core booking logic + slot locking
├── payments/           # Paymob integration
├── handovers/          # photo upload + digital signature
├── reviews/            # ratings
├── notifications/      # Firebase FCM + DB storage
└── common/
    ├── guards/         # JwtAuthGuard
    ├── decorators/
    ├── filters/        # global exception filter
    ├── pipes/
    └── utils/
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/send-otp` | إرسال OTP |
| POST | `/api/v1/auth/verify-otp` | تحقق + JWT |
| GET | `/api/v1/cars` | browse + filter |
| POST | `/api/v1/bookings` | إنشاء حجز |
| GET | `/api/v1/bookings/my` | حجوزاتي |
| GET | `/api/v1/bookings/owner` | طلبات الـ owner |
| PATCH | `/api/v1/bookings/:id/respond` | قبول / رفض |

Swagger docs: `http://localhost:3000/api/docs`

## Key Design Decisions

### Slot Locking with Redis
لما العميل يبدأ الـ checkout، بنعمل atomic lock لمدة 10 دقايق:
```
Redis SET slot:{carId}:{start}:{end} {userId} EX 600 NX
```
ده بيمنع double-booking في الـ race conditions.

### Commission Calculation
```
subtotal = pricePerDay × totalDays
commission = subtotal × owner.commissionRate  (default 13%)
ownerPayout = subtotal - commission + deliveryFee
```

### Booking State Machine
```
PENDING_PAYMENT → PENDING_OWNER_APPROVAL → CONFIRMED → IN_DELIVERY → ACTIVE → COMPLETED
                                         ↘ REJECTED
```
