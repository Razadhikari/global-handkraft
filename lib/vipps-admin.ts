import { prisma } from "@/lib/prisma";

export type VippsOrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: string;
  paymentId: string | null;
  createdAt: string;
};

export type VippsOverview = {
  configured: boolean;
  totalRevenue: number;
  currency: string;
  orderCount: number;
  paidCount: number;
  pendingCount: number;
  orders: VippsOrderSummary[];
};

export async function getVippsOverview(limit = 50): Promise<VippsOverview> {
  const configured = Boolean(
    process.env.VIPPS_CLIENT_ID &&
      process.env.VIPPS_CLIENT_SECRET &&
      process.env.VIPPS_SUBSCRIPTION_KEY &&
      process.env.VIPPS_MERCHANT_SERIAL_NUMBER
  );

  const orders = await prisma.order.findMany({
    where: { paymentMethod: "VIPPS" },
    include: { address: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const paidCount = orders.length - pendingCount;

  return {
    configured,
    totalRevenue,
    currency: orders[0]?.currency ?? "NOK",
    orderCount: orders.length,
    paidCount,
    pendingCount,
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.address?.fullName ?? "—",
      customerEmail: o.address?.email ?? "—",
      amount: o.total,
      currency: o.currency,
      status: o.status,
      paymentId: o.paymentId,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}
