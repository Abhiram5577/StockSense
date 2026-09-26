import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { stockApi } from "../lib/api";
import { History, Search, Filter } from "lucide-react";
import { toast } from "sonner";

export function LedgerView() {
  const { token } = useAuth();
  
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    fetchLedger();
  }, [token]);

  const fetchLedger = async () => {
    setLoading(true);
    const res = await stockApi.getLedger(token!);
    if (res.success) {
      setLedger(res.data?.ledger || res.ledger || []);
    } else {
      toast.error(res.message || "Failed to load ledger");
    }
    setLoading(false);
  };

  const filteredLedger = ledger.filter(item => {
    const matchSearch = item.product_name?.toLowerCase().includes(search.toLowerCase()) || 
                        item.sku?.toLowerCase().includes(search.toLowerCase()) ||
                        item.reference?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || item.movement_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5 p-4 sm:p-5 max-w-6xl mx-auto">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Reporting</p>
        <h1 className="font-display text-2xl font-semibold">Stock Ledger</h1>
        <p className="mt-1 text-sm text-muted-foreground">Immutable history of all inventory movements.</p>
      </div>

      <section className="rise overflow-hidden rounded-xl bg-panel/50 ring-1 ring-border/60 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
          <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg bg-panel-strong/70 px-3 ring-1 ring-border/50 max-w-xs">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, SKU or ref..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </label>
          
          <label className="flex h-8 items-center gap-2 rounded-lg bg-panel-strong/70 px-3 ring-1 ring-border/50 max-w-xs ml-auto">
            <Filter className="size-3.5 shrink-0 text-muted-foreground" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-transparent text-sm outline-none text-muted-foreground">
              <option value="All">All Movements</option>
              <option value="Receipt">Receipts</option>
              <option value="Delivery">Deliveries</option>
              <option value="Transfer">Transfers</option>
              <option value="Adjustment">Adjustments</option>
            </select>
          </label>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-[13px]">
            <thead>
              <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground border-b border-border/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="py-3 text-left font-medium">Type</th>
                <th className="py-3 text-left font-medium">Product / SKU</th>
                <th className="py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Destination</th>
                <th className="px-4 py-3 text-left font-medium">Ref / User</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading ledger...</td></tr>
              ) : filteredLedger.length > 0 ? (
                filteredLedger.map(l => (
                  <tr key={l.id} className="border-b border-border/40 hover:bg-panel-strong/40 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5">
                      <span className={`rounded px-1.5 py-1 text-[10px] font-medium
                        ${l.movement_type === "Receipt" ? "bg-primary/15 text-primary" : 
                          l.movement_type === "Transfer" ? "bg-warning/15 text-warning" : 
                          l.movement_type === "Adjustment" ? "bg-danger/15 text-danger" : 
                          "bg-accent text-accent-foreground"}`}
                      >
                        {l.movement_type}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <p className="font-medium text-foreground">{l.product_name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{l.sku}</p>
                    </td>
                    <td className={`py-2.5 text-right font-mono font-medium ${l.quantity > 0 ? "text-primary" : l.quantity < 0 ? "text-danger" : ""}`}>
                      {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {l.source_warehouse ? (
                        <>
                          <span className="block text-foreground">{l.source_warehouse}</span>
                          {l.source_location && <span className="block text-muted-foreground text-[10px]">{l.source_location}</span>}
                        </>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {l.dest_warehouse ? (
                        <>
                          <span className="block text-foreground">{l.dest_warehouse}</span>
                          {l.dest_location && <span className="block text-muted-foreground text-[10px]">{l.dest_location}</span>}
                        </>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-mono text-xs">{l.reference || '-'}</p>
                      <p className="text-[10px] text-muted-foreground">{l.user_name || 'System'}</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No movements found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
