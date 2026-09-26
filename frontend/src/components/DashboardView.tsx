import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { stockApi, warehouseApi, productApi } from "../lib/api";
import { ArrowDownLeft, ArrowRightLeft, Boxes, Warehouse, ChevronDown } from "lucide-react";

export function DashboardView({ setAction }: { setAction: (a: string) => void }) {
  const { token } = useAuth();
  
  const [stats, setStats] = useState({
    productsInStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalQuantity: 0
  });

  const [ledger, setLedger] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    const [summaryRes, ledgerRes] = await Promise.all([
      stockApi.getSummary(token!),
      stockApi.getLedger(token!)
    ]);

    if (summaryRes.success && summaryRes.data?.summary) {
      const summaries = summaryRes.data.summary;
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;
      let totalQty = 0;
      let lowItems: any[] = [];

      summaries.forEach((s: any) => {
        const qty = Number(s.total_quantity) || 0;
        const reorder = Number(s.reorder_level) || 0;
        
        totalQty += qty;
        
        if (qty > 0) inStock++;
        if (qty === 0) outOfStock++;
        else if (qty <= reorder) {
          lowStock++;
          lowItems.push(s);
        }
      });

      setStats({ productsInStock: inStock, lowStockCount: lowStock, outOfStockCount: outOfStock, totalQuantity: totalQty });
      setLowStockItems(lowItems.slice(0, 5)); // show up to 5
    }

    if (ledgerRes.success && ledgerRes.data?.ledger) {
      setLedger(ledgerRes.data.ledger.slice(0, 8)); // latest 8 movements
    }
  };

  return (
    <main className="space-y-5 p-4 sm:p-5 max-w-7xl mx-auto">
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Live operations</p>
          <h1 className="font-display text-2xl font-semibold">Control desk</h1>
          <p className="mt-1 text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-md bg-panel-strong/70 px-2.5 py-2 font-mono text-[11px] text-muted-foreground ring-1 ring-border/50">
            <Warehouse className="size-3.5" />
            <select className="appearance-none bg-transparent outline-none">
              <option>All warehouses</option>
            </select>
            <ChevronDown className="size-3" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Products Types in stock" value={stats.productsInStock.toString()} detail={`Total volume: ${stats.totalQuantity}`} tone="primary" />
        <Metric label="Low Stock Items" value={stats.lowStockCount.toString()} detail="Needs reordering" tone="warning" />
        <Metric label="Out of Stock" value={stats.outOfStockCount.toString()} detail="Critical" tone="warning" />
        <Metric label="Recent Movements" value={ledger.length.toString()} detail="Last 24h" />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Recent Inventory Movements" aside="live ledger">
          <div className="overflow-x-auto mt-2">
            <table className="w-full min-w-[500px] text-[13px]">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="py-2 text-left font-medium">Type</th>
                  <th className="py-2 text-left font-medium">Product</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="px-4 py-2 text-left font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l: any) => (
                  <tr key={l.id} className="border-t border-border/40 hover:bg-panel-strong/40">
                    <td className="py-2.5">
                      <span className={`rounded px-1.5 py-1 text-[10px] ${l.movement_type === "Receipt" ? "bg-primary/15 text-primary" : l.movement_type === "Transfer" ? "bg-warning/15 text-warning" : l.movement_type === "Adjustment" ? "bg-danger/15 text-danger" : "bg-accent text-accent-foreground"}`}>
                        {l.movement_type}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <p>{l.product_name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{l.sku}</p>
                    </td>
                    <td className={`py-2.5 text-right font-mono ${l.quantity > 0 ? "text-primary" : ""}`}>
                      {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {ledger.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No recent movements.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
        
        <Panel title="Low-stock attention" aside={`${stats.lowStockCount} items`} alert={stats.lowStockCount > 0}>
          <div className="space-y-1 mt-2">
            {lowStockItems.map((item: any) => (
              <div key={item.product_id} className="flex w-full items-center justify-between border-b border-border/40 py-2 last:border-0">
                <div>
                  <p className="text-[13px]">{item.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{item.sku}</p>
                </div>
                <span className={`font-mono text-xs text-warning`}>{item.total_quantity} / {item.reorder_level}</span>
              </div>
            ))}
            {lowStockItems.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">All stock levels are optimal.</p>}
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Metric({ label, value, detail, tone = "default", className = "" }: { label: string; value: string; detail: string; tone?: "default" | "primary" | "warning"; className?: string }) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : "text-foreground";
  return <div className={`rise rounded-xl bg-panel/50 p-4 ring-1 ring-border/60 backdrop-blur-xl ${className}`}><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={`mt-1 font-display text-2xl font-semibold ${toneClass}`}>{value}</p><p className={`mt-1 text-[11px] ${tone === "warning" ? "text-warning" : "text-muted-foreground"}`}>{detail}</p></div>;
}

function Panel({ title, aside, alert = false, className = "", children }: { title: string; aside: string; alert?: boolean; className?: string; children: React.ReactNode }) {
  return <section className={`rise rounded-xl bg-panel/50 p-4 ring-1 ring-border/60 backdrop-blur-xl ${className}`}><div className="mb-3 flex items-center gap-2">{alert && <span className="dot size-1.5 rounded-full bg-danger" />}<h2 className="font-display text-sm font-semibold">{title}</h2><span className="ml-auto font-mono text-[10px] text-muted-foreground">{aside}</span></div>{children}</section>;
}
