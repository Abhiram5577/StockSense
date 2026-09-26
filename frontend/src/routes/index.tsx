import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  Boxes,
  ChevronDown,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Search,
  Settings,
  SlidersHorizontal,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { WarehousesView } from "../components/WarehousesView";
import { ProductsView } from "../components/ProductsView";
import { OperationsView } from "../components/OperationsView";
import { LedgerView } from "../components/LedgerView";
import { DashboardView } from "../components/DashboardView";
import { warehouseApi } from "../lib/api";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StockSense — Inventory Control Desk" },
      {
        name: "description",
        content: "Monitor stock levels, warehouse movements, receipts, deliveries, and transfers from one control desk.",
      },
      { property: "og:title", content: "StockSense — Inventory Control Desk" },
      {
        property: "og:description",
        content: "A real-time inventory operations dashboard for warehouse teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StockSenseDashboard,
});

type MovementType = "Receipt" | "Delivery" | "Transfer" | "Adjustment";

const movements: Array<{
  ticket: string;
  type: MovementType;
  sku: string;
  product: string;
  qty: string;
  location: string;
  time: string;
  status: string;
}> = [
  { ticket: "RC-4471", type: "Receipt", sku: "STL-100", product: "Steel Rods", qty: "+120", location: "A2 · Main", time: "08:02", status: "Done" },
  { ticket: "TR-1180", type: "Transfer", sku: "CHR-240", product: "Office Chair", qty: "−40", location: "F1 → A7", time: "07:48", status: "Ready" },
  { ticket: "DL-2290", type: "Delivery", sku: "NGT-012", product: "Neoprene Gasket", qty: "−12", location: "Dock 2", time: "07:30", status: "Waiting" },
  { ticket: "AD-0093", type: "Adjustment", sku: "BRG-088", product: "Ball Bearing 88", qty: "−3", location: "C5 · Main", time: "07:12", status: "Done" },
  { ticket: "RC-4468", type: "Receipt", sku: "GLV-500", product: "Safety Gloves", qty: "+500", location: "B4 · East", time: "06:55", status: "Done" },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Warehouses", icon: Warehouse },
  { label: "Products", icon: Boxes },
  { label: "Receipts", icon: ArrowDownLeft },
  { label: "Deliveries", icon: ArrowUpRight },
  { label: "Transfers", icon: ArrowRightLeft },
  { label: "Adjustments", icon: ClipboardCheck },
  { label: "Move history", icon: History },
];

const bars = ["h-[38%]", "h-[52%]", "h-[44%]", "h-[66%]", "h-[58%]", "h-[72%]", "h-[88%]", "h-[60%]", "h-[70%]", "h-[50%]", "h-[64%]", "h-[78%]", "h-[56%]", "h-[82%]"];

function StockSenseDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, token } = useAuth();

  const [mobileNav, setMobileNav] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | MovementType>("All");
  const [warehouseFilter, setWarehouseFilter] = useState("All warehouses");
  const [action, setAction] = useState<MovementType | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    } else if (isAuthenticated && token) {
      warehouseApi.getAll(token).then(res => {
        if (res.success) setWarehouses(res.data?.warehouses || res.warehouses || []);
      });
    }
  }, [isLoading, isAuthenticated, token, navigate]);

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();
    return movements.filter((movement) => {
      const matchesType = filter === "All" || movement.type === filter;
      const matchesSearch = !query || [movement.ticket, movement.sku, movement.product, movement.location]
        .some((value) => value.toLowerCase().includes(query));
      return matchesType && matchesSearch;
    });
  }, [filter, search]);

  const chooseNav = (label: string) => {
    setActiveNav(label);
    setMobileNav(false);
    if (label !== "Dashboard") setNotice(`${label} workspace selected`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground animate-pulse shadow-panel">
            S
          </span>
          <p className="font-mono text-xs text-muted-foreground">Checking authentication session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased lg:flex">
      {mobileNav && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-overlay lg:hidden" onClick={() => setMobileNav(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border/60 bg-sidebar px-3 py-4 shadow-panel transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="grid size-7 place-items-center rounded-[7px] bg-primary font-display text-sm font-bold text-primary-foreground">S</span>
          <span className="font-display text-[15px] font-semibold">StockSense</span>
          <button aria-label="Close menu" className="ml-auto grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent lg:hidden" onClick={() => setMobileNav(false)}><X className="size-4" /></button>
        </div>
        <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Operations</p>
        <nav className="space-y-1 text-sm">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = activeNav === item.label;
            return (
              <button key={item.label} onClick={() => chooseNav(item.label)} className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${active ? "bg-sidebar-accent font-medium text-foreground ring-1 ring-border/60" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}>
                <Icon className="size-4" /><span>{item.label}</span><span className={`ml-auto font-mono text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>{String(index + 1).padStart(2, "0")}</span>
              </button>
            );
          })}
        </nav>
        <p className="mb-2 mt-5 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Warehouses</p>
        <div className="space-y-1 text-sm">
          {warehouses.length > 0 ? warehouses.map((wh, idx) => {
            const colors = ["bg-primary", "bg-warning", "bg-success", "bg-info"];
            return (
              <WarehouseRow 
                key={wh.id} 
                color={colors[idx % colors.length]} 
                name={wh.name} 
              />
            );
          }) : (
            <p className="px-2 text-xs text-muted-foreground">No warehouses yet</p>
          )}
        </div>
        <div className="mt-auto space-y-1 border-t border-border/60 pt-3">
          <button onClick={() => chooseNav("Settings")} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><Settings className="size-4" />Settings</button>
          <button
            onClick={async () => {
              await logout();
              navigate({ to: "/login" });
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="size-4" />
            Log out
          </button>
          <div className="flex items-center gap-2 px-2 pt-2">
            <span className="grid size-8 place-items-center rounded-full bg-panel-strong font-mono text-[11px] text-primary">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "OP"}
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-medium">{user?.name || "Inventory User"}</p>
              <p className="font-mono text-[10px] text-muted-foreground capitalize">
                {user?.role || "Staff"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border/60 bg-header px-4 backdrop-blur-xl sm:px-5">
          <button aria-label="Open navigation" className="grid size-9 place-items-center rounded-lg bg-panel-strong text-muted-foreground ring-1 ring-border/50 lg:hidden" onClick={() => setMobileNav(true)}><Menu className="size-4" /></button>
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-panel-strong/70 px-3 ring-1 ring-border/50 sm:max-w-80">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU, product, bin…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <kbd className="hidden font-mono text-[10px] text-muted-foreground sm:block">/</kbd>
          </label>
          <button aria-label="Notifications" className="relative grid size-9 place-items-center rounded-lg bg-panel-strong/70 text-muted-foreground ring-1 ring-border/50 hover:text-foreground"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger" /></button>
          <div className="hidden gap-1.5 md:flex">
            <ActionButton primary onClick={() => setAction("Receipt")}><ArrowDownLeft className="size-3.5" />Receipt</ActionButton>
            <ActionButton onClick={() => setAction("Delivery")}>Delivery</ActionButton>
            <ActionButton onClick={() => setAction("Transfer")}>Transfer</ActionButton>
            <ActionButton onClick={() => setAction("Adjustment")}>Adjust</ActionButton>
          </div>
        </header>

        {activeNav === "Warehouses" ? (
          <WarehousesView />
        ) : activeNav === "Products" ? (
          <ProductsView />
        ) : activeNav === "Move history" ? (
          <LedgerView />
        ) : ["Receipts", "Deliveries", "Transfers", "Adjustments"].includes(activeNav) ? (
          <OperationsView key={activeNav} defaultType={activeNav === "Deliveries" ? "Delivery" : activeNav.replace('s', '') as any} />
        ) : (
          <DashboardView setAction={(a) => setActiveNav(a + "s")} />
        )}
      </div>

      <div className="fixed inset-x-4 bottom-4 z-30 flex gap-2 md:hidden">
        <ActionButton primary className="flex-1 justify-center shadow-panel" onClick={() => setAction("Receipt")}><ArrowDownLeft className="size-4" />New receipt</ActionButton>
        <ActionButton className="flex-1 justify-center shadow-panel" onClick={() => setAction("Transfer")}><ArrowRightLeft className="size-4" />Transfer</ActionButton>
      </div>

      {action && <ActionDialog action={action} onClose={() => setAction(null)} onCreate={() => { setNotice(`${action} draft created`); setAction(null); }} />}
      {notice && <button onClick={() => setNotice(null)} className="fixed bottom-20 right-4 z-[70] flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-panel md:bottom-4"><PackageCheck className="size-4" />{notice}<X className="ml-2 size-3" /></button>}
    </div>
  );
}

function ActionButton({ children, primary = false, className = "", onClick }: { children: ReactNode; primary?: boolean; className?: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-transform hover:-translate-y-0.5 ${primary ? "bg-primary text-primary-foreground" : "bg-panel-strong/70 text-foreground ring-1 ring-border/50"} ${className}`}>{children}</button>;
}

function WarehouseRow({ color, name, count, active = false }: { color: string; name: string; count?: string; active?: boolean }) {
  return <button className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left ${active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60"}`}><span className={`size-1.5 rounded-full ${color} ${active ? "dot" : ""}`} />{name}{count && <span className="ml-auto font-mono text-[10px]">{count}</span>}</button>;
}

function Metric({ label, value, detail, tone = "default", className = "" }: { label: string; value: string; detail: string; tone?: "default" | "primary" | "warning"; className?: string }) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : "text-foreground";
  return <div className={`rise rounded-xl bg-panel/50 p-4 ring-1 ring-border/60 backdrop-blur-xl ${className}`}><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={`mt-1 font-display text-2xl font-semibold ${toneClass}`}>{value}</p><p className={`mt-1 text-[11px] ${tone === "warning" ? "text-warning" : "text-muted-foreground"}`}>{detail}</p></div>;
}

function Panel({ title, aside, alert = false, className = "", children }: { title: string; aside: string; alert?: boolean; className?: string; children: ReactNode }) {
  return <section className={`rise rounded-xl bg-panel/50 p-4 ring-1 ring-border/60 backdrop-blur-xl ${className}`}><div className="mb-3 flex items-center gap-2">{alert && <span className="dot size-1.5 rounded-full bg-danger" />}<h2 className="font-display text-sm font-semibold">{title}</h2><span className="ml-auto font-mono text-[10px] text-muted-foreground">{aside}</span></div>{children}</section>;
}

function StockBar({ name, value, width }: { name: string; value: string; width: string }) {
  return <div><div className="mb-1.5 flex justify-between text-[13px]"><span>{name}</span><span className="font-mono text-xs text-muted-foreground">{value}</span></div><div className="h-1.5 rounded-full bg-track"><div className={`h-full rounded-full bg-primary/70 ${width}`} /></div></div>;
}

function LowStock({ name, meta, count, critical = false }: { name: string; meta: string; count: string; critical?: boolean }) {
  return <button className="flex w-full items-center justify-between border-b border-border/40 py-2 text-left last:border-0"><div><p className="text-[13px]">{name}</p><p className="font-mono text-[10px] text-muted-foreground">{meta}</p></div><span className={`font-mono text-xs ${critical ? "text-danger" : "text-warning"}`}>{count}</span></button>;
}

function MovementRow({ ticket, type, sku, product, qty, location, time, status }: (typeof movements)[number]) {
  const typeClass = type === "Receipt" ? "bg-primary/15 text-primary" : type === "Transfer" ? "bg-warning/15 text-warning" : type === "Adjustment" ? "bg-danger/15 text-danger" : "bg-accent text-accent-foreground";
  return <tr className="border-t border-border/40 hover:bg-panel-strong/40"><td className="px-4 py-2.5 font-mono text-xs">{ticket}</td><td className="py-2.5"><span className={`rounded px-1.5 py-1 text-[10px] ${typeClass}`}>{type}</span></td><td className="py-2.5"><p>{product}</p><p className="font-mono text-[10px] text-muted-foreground">{sku}</p></td><td className={`py-2.5 text-right font-mono ${qty.startsWith("+") ? "text-primary" : ""}`}>{qty}</td><td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{location}</td><td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5 text-xs"><span className={`size-1.5 rounded-full ${status === "Done" ? "bg-primary" : status === "Ready" ? "bg-warning" : "bg-muted-foreground"}`} />{status}</span></td><td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{time}</td></tr>;
}

function ActionDialog({ action, onClose, onCreate }: { action: MovementType; onClose: () => void; onCreate: () => void }) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-overlay p-4" onMouseDown={onClose}><div role="dialog" aria-modal="true" aria-label={`Create ${action}`} className="w-full max-w-md rounded-xl bg-popover p-5 text-popover-foreground shadow-panel ring-1 ring-border" onMouseDown={(event) => event.stopPropagation()}><div className="mb-5 flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">New operation</p><h2 className="mt-1 font-display text-xl font-semibold">Create {action.toLowerCase()}</h2></div><button aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-lg bg-panel-strong text-muted-foreground"><X className="size-4" /></button></div><div className="space-y-4"><Field label="Reference" placeholder={`${action.slice(0, 2).toUpperCase()}-AUTO`} /><Field label={action === "Receipt" ? "Supplier" : "Product or SKU"} placeholder={action === "Receipt" ? "Choose supplier" : "Search inventory"} /><div className="grid grid-cols-2 gap-3"><Field label="Quantity" placeholder="0" /><Field label="Location" placeholder="Select bin" /></div></div><div className="mt-6 flex justify-end gap-2"><ActionButton onClick={onClose}>Cancel</ActionButton><ActionButton primary onClick={onCreate}>Create draft</ActionButton></div></div></div>;
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return <label className="block"><span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span><input placeholder={placeholder} className="h-10 w-full rounded-lg bg-panel-strong/70 px-3 text-sm outline-none ring-1 ring-border/60 placeholder:text-muted-foreground focus:ring-primary" /></label>;
}