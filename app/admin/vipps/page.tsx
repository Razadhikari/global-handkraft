import { Wallet, Package, Clock, CheckCircle2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminStatCard } from "@/components/admin/stat-card";
import { getVippsOverview } from "@/lib/vipps-admin";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "NOK",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  PROCESSING: "bg-sky-50 text-sky-700",
  SHIPPED: "bg-sky-50 text-sky-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${style}`}>{status.toLowerCase()}</span>;
}

export default async function AdminVippsPage() {
  const overview = await getVippsOverview();

  if (!overview.configured) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Vipps" description="Payments and orders paid through Vipps." />
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Vipps is not configured. Set VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY and VIPPS_MERCHANT_SERIAL_NUMBER to accept Vipps payments.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vipps"
        description="Orders paid through Vipps. Vipps settles directly to your bank per your merchant agreement — balances and payouts aren't exposed by this API, so check the Vipps portal for settlement reports."
        actions={
          <a href="https://portal.vippsmobilepay.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Open Vipps Portal
          </a>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total revenue" value={formatMoney(overview.totalRevenue, overview.currency)} icon={Wallet} tone="green" hint={`From ${overview.orderCount} orders`} />
        <AdminStatCard label="Vipps orders" value={overview.orderCount.toString()} icon={Package} tone="neutral" />
        <AdminStatCard label="Paid" value={overview.paidCount.toString()} icon={CheckCircle2} tone="blue" />
        <AdminStatCard label="Awaiting payment" value={overview.pendingCount.toString()} icon={Clock} tone="orange" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recent Vipps orders</h2>
          <p className="mt-0.5 text-sm text-slate-500">Orders paid or in progress through Vipps checkout.</p>
        </div>
        {overview.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-6 py-3 font-semibold">Order</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-6 py-3 text-right font-semibold">Amount</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 font-semibold text-slate-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <p className="text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.customerEmail}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-900">{formatMoney(order.amount, order.currency)}</td>
                    <td className="px-6 py-4"><StatusPill status={order.status} /></td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-slate-500">No Vipps orders yet.</div>
        )}
      </div>
    </div>
  );
}
