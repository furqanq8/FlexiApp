import { PrismaClient, FleetOwnership, DriverType, RentalMode, TripStatus, InvoiceStatus, InvoiceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flexiapp.local' },
    update: {},
    create: {
      email: 'admin@flexiapp.local',
      name: 'Admin User',
      password,
      role: 'admin'
    }
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: 'Ace Suppliers',
      contact: 'Jane Doe',
      email: 'ace@example.com'
    }
  });

  const customer = await prisma.customer.create({
    data: {
      name: 'Contoso Logistics',
      email: 'ops@contoso.com',
      phone: '+1-555-0100',
      address: '100 Main Street'
    }
  });

  const fleet = await prisma.fleet.create({
    data: {
      fleetCode: 'FL-1001',
      serial: 'SN12345',
      type: 'Truck',
      ownership: FleetOwnership.RENT_IN,
      supplierId: supplier.id
    }
  });

  const driver = await prisma.driver.create({
    data: {
      name: 'Alex Rider',
      phone: '+1-555-0200',
      type: DriverType.OUR_DRIVER
    }
  });

  const trip = await prisma.trip.create({
    data: {
      reference: 'TRIP-0001',
      description: 'Monthly rental for Contoso',
      rentalMode: RentalMode.MONTHLY,
      rate: 5000,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: TripStatus.COMPLETED,
      fleetId: fleet.id,
      driverId: driver.id,
      customerId: customer.id,
      supplierId: supplier.id
    }
  });

  const customerInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-CUS-0001',
      type: InvoiceType.CUSTOMER,
      status: InvoiceStatus.PENDING,
      amount: 5000,
      tripId: trip.id,
      customerId: customer.id,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30))
    }
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-SUP-0001',
      type: InvoiceType.SUPPLIER,
      status: InvoiceStatus.PENDING,
      amount: 3500,
      tripId: trip.id,
      supplierId: supplier.id,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30))
    }
  });

  await prisma.payment.create({
    data: {
      invoiceId: customerInvoice.id,
      amount: 2500,
      note: 'Initial payment'
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'seed',
      entity: 'system',
      entityId: 'seed',
      metadata: { message: 'Initial seed data created' }
    }
  });

  console.log('Seed data created');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
