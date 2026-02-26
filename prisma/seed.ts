import { PrismaClient, Role, SubscriptionStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const superAdminPassword = await hashPassword("admin123");
  const gymOwnerPassword = await hashPassword("owner123");

  let superAdmin = await prisma.user.findFirst({ where: { email: "admin@fitdesk.com" } });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@fitdesk.com",
        password: superAdminPassword,
        role: Role.SUPER_ADMIN,
      },
    });
  }
  console.log("Super Admin:", superAdmin.email);

  let planBasic = await prisma.subscriptionPlan.findFirst({ where: { name: "Basic" } });
  if (!planBasic) {
    planBasic = await prisma.subscriptionPlan.create({
      data: {
        name: "Basic",
        price: 999,
        durationInDays: 30,
        features: ["Up to 50 clients", "Basic reports"],
      },
    });
  }

  let planPro = await prisma.subscriptionPlan.findFirst({ where: { name: "Pro" } });
  if (!planPro) {
    planPro = await prisma.subscriptionPlan.create({
      data: {
        name: "Pro",
        price: 2499,
        durationInDays: 30,
        features: ["Unlimited clients", "AI Insights", "XLSX export", "Priority support"],
      },
    });
  }
  console.log("Plans created:", planBasic.name, planPro.name);

  let gymOwner = await prisma.user.findFirst({ where: { email: "owner@gym.com" } });
  if (!gymOwner) {
    gymOwner = await prisma.user.create({
      data: {
        name: "Gym Owner",
        email: "owner@gym.com",
        password: gymOwnerPassword,
        role: Role.GYM_OWNER,
      },
    });
  }

  let gym = await prisma.gym.findFirst({
    where: { ownerId: gymOwner.id },
  });
  if (!gym) {
    gym = await prisma.gym.create({
      data: {
        name: "Demo Gym",
        ownerId: gymOwner.id,
        subscriptionPlanId: planPro.id,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
  }

  await prisma.user.update({
    where: { id: gymOwner.id },
    data: { gymId: gym.id },
  });
  console.log("Gym Owner:", gymOwner.email, "Gym:", gym.name);

  const clients = [
    { fullName: "Alice Kumar", phone: "+919876543210", subscriptionStatus: SubscriptionStatus.ACTIVE },
    { fullName: "Bob Singh", phone: "+919876543211", subscriptionStatus: SubscriptionStatus.ACTIVE },
    { fullName: "Carol Reddy", phone: "+919876543212", subscriptionStatus: SubscriptionStatus.EXPIRED },
  ];

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const existingClients = await prisma.client.count({ where: { gymId: gym.id } });
  if (existingClients === 0) {
    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      const client = await prisma.client.create({
        data: {
          gymId: gym.id,
          fullName: c.fullName,
          phone: c.phone,
          email: `${c.fullName.toLowerCase().replace(" ", ".")}@example.com`,
          joinDate: lastMonth,
          subscriptionStartDate: lastMonth,
          subscriptionEndDate: c.subscriptionStatus === SubscriptionStatus.ACTIVE ? nextMonth : lastMonth,
          subscriptionStatus: c.subscriptionStatus,
          totalAmount: 2000,
          amountPaid: i === 0 ? 1000 : 2000,
        },
      });
      if (i === 0) {
        await prisma.payment.create({
          data: {
            clientId: client.id,
            amount: 1000,
            paymentDate: lastMonth,
            paymentMethod: "Cash",
          },
        });
      }
    }
  }
  console.log("Demo clients and payments created.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
