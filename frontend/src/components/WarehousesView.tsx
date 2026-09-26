import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { warehouseApi, locationApi, stockApi } from "../lib/api";
import { Warehouse, MapPin, Plus, Edit2, Trash2, ChevronRight, ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";

export function WarehousesView() {
  const { token } = useAuth();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View state: 'list' | 'detail'
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeWarehouse, setActiveWarehouse] = useState<any | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  
  // Modal states
  const [showWHModal, setShowWHModal] = useState(false);
  const [whForm, setWhForm] = useState({ id: '', name: '', location_address: '' });
  
  const [showLocModal, setShowLocModal] = useState(false);
  const [locForm, setLocForm] = useState({ id: '', name: '', type: 'Rack' });

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockBreakdown, setStockBreakdown] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any | null>(null);

  useEffect(() => {
    if (view === 'list') {
      fetchWarehouses();
    } else if (view === 'detail' && activeWarehouse) {
      fetchLocations(activeWarehouse.id);
    }
  }, [view, activeWarehouse]);

  const fetchWarehouses = async () => {
    setLoading(true);
    const res = await warehouseApi.getAll(token!);
    if (res.success) {
      setWarehouses(res.data?.warehouses || res.warehouses || []);
    } else {
      toast.error(res.message || "Failed to load warehouses");
    }
    setLoading(false);
  };

  const fetchLocations = async (whId: number) => {
    const res = await locationApi.getByWarehouse(whId, token!);
    if (res.success) {
      setLocations(res.data?.locations || res.locations || []);
    } else {
      toast.error(res.message || "Failed to load locations");
    }
  };

  const openWarehouseDetail = (wh: any) => {
    setActiveWarehouse(wh);
    setView('detail');
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.name) return toast.error("Warehouse name is required");
    
    if (whForm.id) {
      const res = await warehouseApi.update(whForm.id, whForm, token!);
      if (res.success) {
        toast.success("Warehouse updated");
        setShowWHModal(false);
        fetchWarehouses();
      } else {
        toast.error(res.message);
      }
    } else {
      const res = await warehouseApi.create(whForm, token!);
      if (res.success) {
        toast.success("Warehouse created");
        setShowWHModal(false);
        fetchWarehouses();
      } else {
        toast.error(res.message);
      }
    }
  };

  const handleDeleteWarehouse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this warehouse?")) return;
    const res = await warehouseApi.delete(id, token!);
    if (res.success) {
      toast.success("Warehouse deleted");
      fetchWarehouses();
    } else {
      toast.error(res.message);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locForm.name) return toast.error("Location name is required");
    
    if (locForm.id) {
      const res = await locationApi.update(locForm.id, locForm, token!);
      if (res.success) {
        toast.success("Location updated");
        setShowLocModal(false);
        fetchLocations(activeWarehouse.id);
      } else {
        toast.error(res.message);
      }
    } else {
      const res = await locationApi.create(activeWarehouse.id, locForm, token!);
      if (res.success) {
        toast.success("Location created");
        setShowLocModal(false);
        fetchLocations(activeWarehouse.id);
      } else {
        toast.error(res.message);
      }
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    const res = await locationApi.delete(id, token!);
    if (res.success) {
      toast.success("Location deleted");
      fetchLocations(activeWarehouse.id);
    } else {
      toast.error(res.message);
    }
  };

  const handleViewStock = async (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    const res = await stockApi.getByWarehouse(warehouse.id, token!);
    if (res.success) {
      setStockBreakdown(res.data?.stock || res.stock || []);
      setShowStockModal(true);
    } else {
      toast.error("Failed to fetch warehouse stock details");
    }
  };

  if (view === 'detail' && activeWarehouse) {
    return (
      <div className="space-y-5 p-4 sm:p-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 hover:bg-panel-strong rounded-md text-muted-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Warehouse className="text-primary w-6 h-6" /> {activeWarehouse.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{activeWarehouse.location_address || 'No address specified'}</p>
          </div>
        </div>

        <section className="rise overflow-hidden rounded-xl bg-panel/50 ring-1 ring-border/60 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between border-b border-border/60 px-4 py-3">
            <h2 className="font-display text-sm font-semibold">Locations & Racks</h2>
            <button onClick={() => { setLocForm({ id: '', name: '', type: 'Rack' }); setShowLocModal(true); }} className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5">
              <Plus className="w-3.5 h-3.5" /> Add Location
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-[13px]">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.length > 0 ? (
                  locations.map(loc => (
                    <tr key={loc.id} className="border-t border-border/40 hover:bg-panel-strong/40">
                      <td className="px-4 py-3 font-medium">{loc.name}</td>
                      <td className="px-4 py-3 text-muted-foreground"><span className="bg-panel-strong px-2 py-1 rounded text-xs">{loc.type}</span></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setLocForm({ id: loc.id, name: loc.name, type: loc.type }); setShowLocModal(true); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteLocation(loc.id)} className="p-1.5 text-muted-foreground hover:text-danger transition-colors ml-2"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No locations added yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showLocModal && (
          <div className="fixed inset-0 z-[80] grid place-items-center bg-overlay p-4" onMouseDown={() => setShowLocModal(false)}>
            <div role="dialog" className="w-full max-w-md rounded-xl bg-popover p-5 text-popover-foreground shadow-panel ring-1 ring-border" onMouseDown={e => e.stopPropagation()}>
              <h2 className="mb-4 font-display text-lg font-semibold">{locForm.id ? 'Edit' : 'Add'} Location</h2>
              <form onSubmit={handleSaveLocation} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Location Name</span>
                  <input value={locForm.name} onChange={e => setLocForm({...locForm, name: e.target.value})} placeholder="e.g. Rack A" className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary" autoFocus />
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Type</span>
                  <select value={locForm.type} onChange={e => setLocForm({...locForm, type: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary">
                    <option>Rack</option>
                    <option>Floor</option>
                    <option>Bin</option>
                    <option>Zone</option>
                  </select>
                </label>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowLocModal(false)} className="h-9 px-4 rounded-lg bg-panel-strong/70 text-sm font-medium hover:bg-panel-strong">Cancel</button>
                  <button type="submit" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-5 p-4 sm:p-5 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Administration</p>
          <h1 className="font-display text-2xl font-semibold">Warehouses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage storage facilities and physical locations</p>
        </div>
        <button onClick={() => { setWhForm({ id: '', name: '', location_address: '' }); setShowWHModal(true); }} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5">
          <Plus className="w-4 h-4" /> Add Warehouse
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-10 text-center text-muted-foreground">Loading warehouses...</div>
        ) : warehouses.length > 0 ? (
          warehouses.map(wh => (
            <div key={wh.id} className="rise group relative flex flex-col rounded-xl bg-panel/50 p-4 ring-1 ring-border/60 backdrop-blur-xl transition-colors hover:bg-panel">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setWhForm({ id: wh.id, name: wh.name, location_address: wh.location_address || '' }); setShowWHModal(true); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteWarehouse(wh.id)} className="p-1.5 text-muted-foreground hover:text-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold">{wh.name}</h3>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <button onClick={() => openWarehouseDetail(wh)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Manage locations <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => handleViewStock(wh)} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-panel-strong px-2 py-1 rounded-md transition-colors" title="View Inventory">
                  <Package className="w-3.5 h-3.5" /> Inventory
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-10 text-center text-muted-foreground">No warehouses found. Click "Add Warehouse" to create one.</div>
        )}
      </div>

      {showWHModal && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-overlay p-4" onMouseDown={() => setShowWHModal(false)}>
          <div role="dialog" className="w-full max-w-md rounded-xl bg-popover p-5 text-popover-foreground shadow-panel ring-1 ring-border" onMouseDown={e => e.stopPropagation()}>
            <h2 className="mb-4 font-display text-lg font-semibold">{whForm.id ? 'Edit' : 'Add'} Warehouse</h2>
            <form onSubmit={handleSaveWarehouse} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Warehouse Name</span>
                <input value={whForm.name} onChange={e => setWhForm({...whForm, name: e.target.value})} placeholder="e.g. Central Main" className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary" autoFocus />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Address / Notes</span>
                <input value={whForm.location_address} onChange={e => setWhForm({...whForm, location_address: e.target.value})} placeholder="e.g. 123 Storage Lane" className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary" />
              </label>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setShowWHModal(false)} className="h-9 px-4 rounded-lg bg-panel-strong/70 text-sm font-medium hover:bg-panel-strong">Cancel</button>
                <button type="submit" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Breakdown Modal */}
      {showStockModal && selectedWarehouse && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-overlay p-4" onMouseDown={() => setShowStockModal(false)}>
          <div role="dialog" className="w-full max-w-2xl rounded-xl bg-popover p-5 text-popover-foreground shadow-panel ring-1 ring-border" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold">{selectedWarehouse.name} - Current Inventory</h2>
                <p className="text-sm text-muted-foreground">{selectedWarehouse.location_address}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-border/50 max-h-[60vh]">
              <table className="w-full text-[13px]">
                <thead className="bg-panel-strong/40 sticky top-0">
                  <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Product Name</th>
                    <th className="px-4 py-2 text-left font-medium">SKU</th>
                    <th className="px-4 py-2 text-left font-medium">Location</th>
                    <th className="px-4 py-2 text-right font-medium">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {stockBreakdown.length > 0 ? (
                    stockBreakdown.map((s, idx) => (
                      <tr key={idx} className="border-t border-border/40">
                        <td className="px-4 py-2.5 font-medium">{s.product_name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground font-mono text-[11px]">{s.sku}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{s.location_name || '-'}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-primary font-medium">{s.quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">This warehouse is completely empty.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setShowStockModal(false)} className="h-9 px-4 rounded-lg bg-panel-strong/70 text-sm font-medium hover:bg-panel-strong">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
