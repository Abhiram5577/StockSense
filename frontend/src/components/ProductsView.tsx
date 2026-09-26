import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../lib/auth-context";
import { productApi, categoryApi, stockApi } from "../lib/api";
import { Boxes, Edit2, Trash2, Plus, Search, Filter, Eye } from "lucide-react";
import { toast } from "sonner";

export function ProductsView() {
  const { token } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ id: '', name: '', sku: '', category_id: '', uom: 'Unit', reorder_level: 0 });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', description: '' });

  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [stockBreakdown, setStockBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      productApi.getAll(token!),
      categoryApi.getAll(token!)
    ]);
    
    if (prodRes.success) setProducts(prodRes.data?.products || prodRes.products || []);
    if (catRes.success) setCategories(catRes.data?.categories || catRes.categories || []);
    
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchCat = categoryFilter === "All" || p.category_id?.toString() === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  // --- Handlers ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) return toast.error("Name and SKU are required");
    
    const payload = {
      ...productForm,
      category_id: productForm.category_id ? Number(productForm.category_id) : null,
      reorder_level: Number(productForm.reorder_level)
    };

    if (productForm.id) {
      const res = await productApi.update(productForm.id, payload, token!);
      if (res.success) {
        toast.success("Product updated");
        setShowProductModal(false);
        fetchData();
      } else toast.error(res.message);
    } else {
      const res = await productApi.create(payload as any, token!);
      if (res.success) {
        toast.success("Product created");
        setShowProductModal(false);
        fetchData();
      } else toast.error(res.message);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const res = await productApi.delete(id, token!);
    if (res.success) {
      toast.success("Product deleted");
      fetchData();
    } else toast.error(res.message);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return toast.error("Category name is required");
    
    if (categoryForm.id) {
      const res = await categoryApi.update(categoryForm.id, categoryForm, token!);
      if (res.success) {
        toast.success("Category updated");
        setShowCategoryModal(false);
        fetchData();
      } else toast.error(res.message);
    } else {
      const res = await categoryApi.create(categoryForm, token!);
      if (res.success) {
        toast.success("Category created");
        setShowCategoryModal(false);
        fetchData();
      } else toast.error(res.message);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const res = await categoryApi.delete(id, token!);
    if (res.success) {
      toast.success("Category deleted");
      fetchData();
    } else toast.error(res.message);
  };

  const handleViewStock = async (product: any) => {
    setSelectedProduct(product);
    const res = await stockApi.getByProduct(product.id, token!);
    if (res.success) {
      setStockBreakdown(res.data?.stock || res.stock || []);
      setShowStockModal(true);
    } else {
      toast.error("Failed to fetch stock details");
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Master Data</p>
          <h1 className="font-display text-2xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your catalog, SKUs, and categories.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex rounded-lg bg-panel-strong/50 p-1 ring-1 ring-border/50">
            <button 
              onClick={() => setActiveTab('products')} 
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'products' ? 'bg-panel shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Products
            </button>
            <button 
              onClick={() => setActiveTab('categories')} 
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'categories' ? 'bg-panel shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Categories
            </button>
          </div>
          
          {activeTab === 'products' ? (
            <button onClick={() => { setProductForm({ id: '', name: '', sku: '', category_id: '', uom: 'Unit', reorder_level: 0 }); setShowProductModal(true); }} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          ) : (
            <button onClick={() => { setCategoryForm({ id: '', name: '', description: '' }); setShowCategoryModal(true); }} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> Add Category
            </button>
          )}
        </div>
      </div>

      <section className="rise overflow-hidden rounded-xl bg-panel/50 ring-1 ring-border/60 backdrop-blur-xl">
        {activeTab === 'products' ? (
          <>
            <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
              <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg bg-panel-strong/70 px-3 ring-1 ring-border/50 max-w-xs">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SKU or product..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </label>
              
              <label className="flex h-8 items-center gap-2 rounded-lg bg-panel-strong/70 px-3 ring-1 ring-border/50 max-w-xs ml-auto">
                <Filter className="size-3.5 shrink-0 text-muted-foreground" />
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-transparent text-sm outline-none text-muted-foreground">
                  <option value="All">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead>
                  <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground border-b border-border/50">
                    <th className="px-4 py-3 text-left font-medium">SKU</th>
                    <th className="py-3 text-left font-medium">Product Name</th>
                    <th className="py-3 text-left font-medium">Category</th>
                    <th className="py-3 text-center font-medium">Reorder Lvl</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Loading products...</td></tr>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <tr key={p.id} className="border-b border-border/40 hover:bg-panel-strong/40 last:border-0">
                        <td className="px-4 py-2.5 font-mono text-xs">{p.sku}</td>
                        <td className="py-2.5 font-medium">{p.name}</td>
                        <td className="py-2.5 text-muted-foreground">
                          {p.category_name ? <span className="bg-panel-strong px-2 py-0.5 rounded text-[11px]">{p.category_name}</span> : '-'}
                        </td>
                        <td className="py-2.5 text-center font-mono text-xs text-muted-foreground">{p.reorder_level} {p.uom}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => handleViewStock(p)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors inline-block" title="View Stock"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setProductForm({ id: p.id, name: p.name, sku: p.sku, category_id: p.category_id || '', uom: p.uom, reorder_level: p.reorder_level }); setShowProductModal(true); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors inline-block ml-1" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-muted-foreground hover:text-danger transition-colors inline-block ml-1" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-[13px]">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground border-b border-border/50">
                  <th className="px-4 py-3 text-left font-medium">Category Name</th>
                  <th className="py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Loading categories...</td></tr>
                ) : categories.length > 0 ? (
                  categories.map(c => (
                    <tr key={c.id} className="border-b border-border/40 hover:bg-panel-strong/40 last:border-0">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="py-3 text-muted-foreground">{c.description || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setCategoryForm({ id: c.id, name: c.name, description: c.description || '' }); setShowCategoryModal(true); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors inline-block"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 text-muted-foreground hover:text-danger transition-colors inline-block ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No categories found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-overlay p-4" onMouseDown={() => setShowProductModal(false)}>
          <div role="dialog" className="w-full max-w-md rounded-xl bg-popover p-5 text-popover-foreground shadow-panel ring-1 ring-border" onMouseDown={e => e.stopPropagation()}>
            <h2 className="mb-4 font-display text-lg font-semibold">{productForm.id ? 'Edit' : 'Add'} Product</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Product Name *</span>
                <input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary" autoFocus />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">SKU *</span>
                <input value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary uppercase" />
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Category</span>
                  <select value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary">
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">UOM</span>
                  <input value={productForm.uom} onChange={e => setProductForm({...productForm, uom: e.target.value})} placeholder="Unit, KG, Box..." className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary" />
                </label>
              </div>
              
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Reorder Level (Alert threshold)</span>
                <input type="number" min="0" value={productForm.reorder_level} onChange={e => setProductForm({...productForm, reorder_level: parseInt(e.target.value) || 0})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary" />
              </label>
              
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="h-9 px-4 rounded-lg bg-panel-strong/70 text-sm font-medium hover:bg-panel-strong">Cancel</button>
                <button type="submit" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-overlay p-4" onMouseDown={() => setShowCategoryModal(false)}>
          <div role="dialog" className="w-full max-w-md rounded-xl bg-popover p-5 text-popover-foreground shadow-panel ring-1 ring-border" onMouseDown={e => e.stopPropagation()}>
            <h2 className="mb-4 font-display text-lg font-semibold">{categoryForm.id ? 'Edit' : 'Add'} Category</h2>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Category Name *</span>
                <input value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary" autoFocus />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Description</span>
                <textarea value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} className="h-20 w-full rounded-lg bg-panel-strong/70 p-3 text-sm outline-none ring-1 ring-border/60 focus:ring-primary resize-none" />
              </label>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="h-9 px-4 rounded-lg bg-panel-strong/70 text-sm font-medium hover:bg-panel-strong">Cancel</button>
                <button type="submit" className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Breakdown Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-overlay p-4" onMouseDown={() => setShowStockModal(false)}>
          <div role="dialog" className="w-full max-w-xl rounded-xl bg-popover p-5 text-popover-foreground shadow-panel ring-1 ring-border" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold">{selectedProduct.name} - Stock Details</h2>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{selectedProduct.sku}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-[13px]">
                <thead className="bg-panel-strong/40">
                  <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Warehouse</th>
                    <th className="px-4 py-2 text-left font-medium">Location</th>
                    <th className="px-4 py-2 text-right font-medium">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {stockBreakdown.length > 0 ? (
                    stockBreakdown.map((s, idx) => (
                      <tr key={idx} className="border-t border-border/40">
                        <td className="px-4 py-2.5 font-medium">{s.warehouse_name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{s.location_name || '-'}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-primary font-medium">{s.quantity} {selectedProduct.uom}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">This product is currently out of stock in all locations.</td></tr>
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
