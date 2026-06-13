import { PrismaClient, BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── System Settings ──
  await prisma.systemSetting.upsert({
    where: { key: 'driver_option_enabled' },
    update: {},
    create: { key: 'driver_option_enabled', value: 'true' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'driver_fee_per_day' },
    update: {},
    create: { key: 'driver_fee_per_day', value: '150' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'delivery_home_fee' },
    update: {},
    create: { key: 'delivery_home_fee', value: '200' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'commission_rate_short_term' },
    update: {},
    create: { key: 'commission_rate_short_term', value: '0.05' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'commission_rate_long_term' },
    update: {},
    create: { key: 'commission_rate_long_term', value: '0.03' },
  });

  // ── Users ──
  const user1 = await prisma.user.upsert({
    where: { phone: '+201011111111' },
    update: {},
    create: {
      phone: '+201011111111',
      name: 'أحمد محمد',
      email: 'ahmed@test.com',
      verifiedAt: new Date(),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { phone: '+201022222222' },
    update: {},
    create: {
      phone: '+201022222222',
      name: 'سارة علي',
      email: 'sara@test.com',
      verifiedAt: new Date(),
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { phone: '+201033333333' },
    update: {},
    create: {
      phone: '+201033333333',
      name: 'محمود حسن',
      email: 'mahmoud@nile-cars.com',
      verifiedAt: new Date(),
    },
  });

  // ── Owner ──
  const owner = await prisma.owner.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
      businessName: 'معرض النيل للسيارات',
      commercialReg: 'CR-2024-001',
      address: '15 شارع التحرير، القاهرة',
      commissionRate: 0.13,
      isVerified: true,
      subscriptionTier: 'PRO',
    },
  });

  // ── Cars ──
  const car1 = await prisma.car.create({
    data: {
      ownerId: owner.id,
      make: 'Toyota',
      model: 'Corolla',
      year: 2023,
      licensePlate: 'أ ب ج 1234',
      color: 'أبيض',
      transmission: 'automatic',
      seats: 5,
      pricePerDay: 450,
      pricePerWeek: 400,
      pricePerMonth: 350,
      features: ['AC', 'بلوتوث', 'كاميرا خلفية', 'USB'],
      imageUrls: ['https://example.com/corolla1.jpg'],
      status: 'AVAILABLE',
    },
  });

  const car2 = await prisma.car.create({
    data: {
      ownerId: owner.id,
      make: 'Hyundai',
      model: 'Elantra',
      year: 2022,
      licensePlate: 'د هـ و 5678',
      color: 'رمادي',
      transmission: 'automatic',
      seats: 5,
      pricePerDay: 380,
      pricePerWeek: 340,
      pricePerMonth: 300,
      features: ['AC', 'بلوتوث', 'GPS'],
      imageUrls: ['https://example.com/elantra1.jpg'],
      status: 'AVAILABLE',
    },
  });

  const car3 = await prisma.car.create({
    data: {
      ownerId: owner.id,
      make: 'Kia',
      model: 'Sportage',
      year: 2024,
      licensePlate: 'ز ح ط 9012',
      color: 'أسود',
      transmission: 'automatic',
      seats: 5,
      pricePerDay: 650,
      pricePerWeek: 600,
      pricePerMonth: 550,
      features: ['AC', 'بلوتوث', 'GPS', 'فتحة سقف', 'مقاعد جلد'],
      imageUrls: ['https://example.com/sportage1.jpg'],
      status: 'AVAILABLE',
    },
  });

  // ── Completed Booking with Review ──
  const booking1 = await prisma.booking.create({
    data: {
      carId: car1.id,
      userId: user1.id,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-03'),
      totalDays: 2,
      subtotal: 900,
      deliveryFee: 75,
      deposit: 1000,
      platformCommission: 117,
      ownerPayout: 858,
      status: BookingStatus.COMPLETED,
      deliveryAddress: '10 شارع الجمهورية، مدينة نصر',
      deliveryLat: 30.0626,
      deliveryLng: 31.3219,
      confirmedAt: new Date('2025-06-01'),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      gatewayRef: 'PAY-001-TEST',
      method: PaymentMethod.PAYMOB,
      amount: 975,
      status: PaymentStatus.SUCCESS,
      paidAt: new Date('2025-06-01'),
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      reviewerId: user1.id,
      revieweeId: ownerUser.id,
      targetType: 'CAR',
      rating: 5,
      comment: 'عربية ممتازة ونظيفة جداً، التوصيل كان في الموعد',
    },
  });

  // ── Pending Booking ──
  await prisma.booking.create({
    data: {
      carId: car2.id,
      userId: user2.id,
      startDate: new Date('2025-07-10'),
      endDate: new Date('2025-07-13'),
      totalDays: 3,
      subtotal: 1140,
      deliveryFee: 75,
      deposit: 800,
      platformCommission: 148.2,
      ownerPayout: 1066.8,
      status: BookingStatus.PENDING_OWNER_APPROVAL,
      deliveryAddress: '5 شارع الهرم، الجيزة',
      deliveryLat: 29.9933,
      deliveryLng: 31.1531,
    },
  });

  console.log('Seed complete!');
  console.log(`Users: ${user1.phone}, ${user2.phone}, ${ownerUser.phone}`);
  console.log(`Cars: ${car1.make} ${car1.model}, ${car2.make} ${car2.model}, ${car3.make} ${car3.model}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
