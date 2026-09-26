import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { stockApi, warehouseApi, productApi, locationApi } from "../lib/api";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, ClipboardCheck, Plus } from "lucide-react";
import { toast } from "sonner";

export function OperationsView({ defaultType = "Receipt" }: { defaultType?: "Receipt" | "Delivery" | "Transfer" | "Adjustment" }) {
  const { token } = useAuth();
  
  const [activeTab, setActiveTab] = useState(defaultType);
  const [loading, setLoading] = useState(false);
  
  // Master data for dropdowns
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [sourceLocations, setSourceLocations] = useState<any[]>([]);
  const [destLocations, setDestLocations] = useState<any[]>([]);

  // Form State
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    sourceWarehouseId: '',
    sourceLocationId: '',
    destWarehouseId: '',
    destLocationId: '',
    reference: ''
  });

  useEffect(() => {
    fetchMasterData();
  }, [token]);

  useEffect(() => {
    if (form.sourceWarehouseId) fetchSourceLocations(form.sourceWarehouseId);
    else setSourceLocations([]);
  }, [form.sourceWarehouseId]);

  useEffect(() => {
    if (form.destWarehouseId) fetchDestLocations(form.destWarehouseId);
    else setDestLocations([]);
  }, [form.destWarehouseId]);

  const fetchMasterData = async () => {
    const [pRes, wRes] = await Promise.all([
      productApi.getAll(token!),
      warehouseApi.getAll(token!)
    ]);
    if (pRes.success) setProducts(pRes.data?.products || pRes.products || []);
    if (wRes.success) setWarehouses(wRes.data?.warehouses || wRes.warehouses || []);
  };

  const fetchSourceLocations = async (wId: string) => {
    const res = await locationApi.getByWarehouse(wId, token!);
    if (res.success) setSourceLocations(res.data?.locations || res.locations || []);
  };

  const fetchDestLocations = async (wId: string) => {
    const res = await locationApi.getByWarehouse(wId, token!);
    if (res.success) setDestLocations(res.data?.locations || res.locations || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.quantity || Number(form.quantity) <= 0) {
      return toast.error("Please select a product and valid quantity");
    }

    setLoading(true);
    let res;

    if (activeTab === 'Adjustment') {
      res = await stockApi.performAdjustment({
        productId: Number(form.productId),
        warehouseId: Number(form.sourceWarehouseId),
        locationId: form.sourceLocationId ? Number(form.sourceLocationId) : undefined,
        difference: Number(form.quantity), // for adjustment this can be negative
        reference: form.reference
      }, token!);
    } else {
      res = await stockApi.performOperation({
        type: activeTab,
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        sourceWarehouseId: form.sourceWarehouseId ? Number(form.sourceWarehouseId) : undefined,
        sourceLocationId: form.sourceLocationId ? Number(form.sourceLocationId) : undefined,
        destWarehouseId: form.destWarehouseId ? Number(form.destWarehouseId) : undefined,
        destLocationId: form.destLocationId ? Number(form.destLocationId) : undefined,
        reference: form.reference
      }, token!);
    }

    setLoading(false);
    if (res.success) {
      toast.success(`${activeTab} successful!`);
      setForm({ ...form, quantity: '', reference: '' }); // reset quantity
    } else {
      toast.error(res.message || "Operation failed");
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-5 max-w-4xl mx-auto">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Operations</p>
        <h1 className="font-display text-2xl font-semibold">Stock Movements</h1>
        <p className="mt-1 text-sm text-muted-foreground">Record incoming, outgoing, and internal inventory movements.</p>
      </div>

      <div className="flex gap-2 border-b border-border/60 pb-2 overflow-x-auto">
        {(["Receipt", "Delivery", "Transfer", "Adjustment"] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => { setActiveTab(tab); setForm({...form, quantity: '', reference: ''}); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === tab 
                ? 'bg-panel-strong text-foreground ring-1 ring-border/50 shadow-sm' 
                : 'text-muted-foreground hover:bg-panel-strong/50 hover:text-foreground'
            }`}
          >
            {tab === 'Receipt' && <ArrowDownLeft className="w-4 h-4 text-primary" />}
            {tab === 'Delivery' && <ArrowUpRight className="w-4 h-4 text-warning" />}
            {tab === 'Transfer' && <ArrowRightLeft className="w-4 h-4 text-accent-foreground" />}
            {tab === 'Adjustment' && <ClipboardCheck className="w-4 h-4 text-danger" />}
            {tab}
          </button>
        ))}
      </div>

      <section className="rise rounded-xl bg-panel/50 ring-1 ring-border/60 backdrop-blur-xl p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-border/40 pb-6">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Product *</span>
              <select required value={form.productId} onChange={e => setForm({...form, productId: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary">
                <option value="">Select Product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {activeTab === 'Adjustment' ? 'Difference (+/-) *' : 'Quantity *'}
              </span>
              <input required type="number" min={activeTab === 'Adjustment' ? undefined : "1"} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder={activeTab === 'Adjustment' ? '-5 or 10' : 'e.g. 50'} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary" />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* SOURCE section - required for Delivery, Transfer, Adjustment */}
            {(activeTab === 'Delivery' || activeTab === 'Transfer' || activeTab === 'Adjustment') && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning"></span> Source
                </h3>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Warehouse *</span>
                  <select required value={form.sourceWarehouseId} onChange={e => setForm({...form, sourceWarehouseId: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary">
                    <option value="">Select Warehouse...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Location (Optional)</span>
                  <select value={form.sourceLocationId} onChange={e => setForm({...form, sourceLocationId: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary">
                    <option value="">Specific location/rack...</option>
                    {sourceLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </label>
              </div>
            )}

            {/* DESTINATION section - required for Receipt, Transfer */}
            {(activeTab === 'Receipt' || activeTab === 'Transfer') && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span> Destination
                </h3>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Warehouse *</span>
                  <select required value={form.destWarehouseId} onChange={e => setForm({...form, destWarehouseId: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary">
                    <option value="">Select Warehouse...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Location (Optional)</span>
                  <select value={form.destLocationId} onChange={e => setForm({...form, destLocationId: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary">
                    <option value="">Specific location/rack...</option>
                    {destLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="border-t border-border/40 pt-6">
            <label className="block max-w-xl">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Reference / Notes (Optional)</span>
              <input value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} placeholder="e.g. PO-10293, Ticket #441" className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary" />
            </label>
          </div>

          <div className="flex justify-end">
            <button disabled={loading} type="submit" className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50">
              {loading ? "Processing..." : (
                <>
                  <Plus className="w-4 h-4" /> Validate {activeTab}
                </>
              )}
            </button>
          </div>

        </form>
      </section>
    </div>
  );
}
