import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, Package, ShoppingBag, MessageCircle, Settings,
  Plus, Search, Bell, ChevronDown, MoreHorizontal, Edit2, Trash2,
  TrendingUp, TrendingDown, Eye, Check, X, Upload, Star,
  Truck, Clock, CheckCircle2, Sparkles, Send, Image,
  LogOut, Menu, ChevronRight, Filter, Download, RefreshCw,
  AlertCircle, BarChart2, Users, DollarSign, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { collection, onSnapshot, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";


// ─── TYPES ────────────────────────────────────────────────────────────────────

type Page = "dashboard" | "products" | "orders" | "chat" | "settings" | "logout";
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  colors: string[];
  description: string;
  rating: number;
  reviews: number;
  active: boolean;
  createdAt: string;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  date: string;
  address: string;
  phone: string;
}

interface Message {
  id: string;
  customer: string;
  avatar: string;
  preview: string;
  unread: number;
  time: string;
  messages: { text: string; sender: "customer" | "admin"; time: string }[];
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const seedProducts: Product[] = [
  { id: "p1", name: "Chunky Knit Tote Bag", category: "Bags", price: 45, stock: 12, image: "https://images.unsplash.com/photo-1686285961015-12886f9b3bf5?w=300&h=300&fit=crop&auto=format", colors: ["Natural", "Dusty Rose", "Sage"], description: "Handcrafted chunky crochet tote bag.", rating: 4.9, reviews: 48, active: true, createdAt: "2026-06-01" },
  { id: "p2", name: "Crochet Flower Bouquet", category: "Decor", price: 28, stock: 8, image: "https://images.unsplash.com/photo-1700171518313-5dd219beaaa6?w=300&h=300&fit=crop&auto=format", colors: ["Multicolor", "Pastel", "Bold"], description: "Forever-blooming hand-crocheted flower bouquet.", rating: 5.0, reviews: 32, active: true, createdAt: "2026-06-10" },
  { id: "p3", name: "Granny Square Blanket", category: "Home", price: 85, stock: 5, image: "https://images.unsplash.com/photo-1728393287642-13bee7126ae8?w=300&h=300&fit=crop&auto=format", colors: ["Cream", "Grey", "Terracotta"], description: "Generously sized crochet throw blanket.", rating: 4.8, reviews: 61, active: true, createdAt: "2026-05-20" },
  { id: "p4", name: "Market Basket Bag", category: "Bags", price: 52, stock: 3, image: "https://images.unsplash.com/photo-1594638963668-52eb9798e8ca?w=300&h=300&fit=crop&auto=format", colors: ["Natural", "Tan", "White"], description: "Sturdy handwoven market basket.", rating: 4.7, reviews: 29, active: true, createdAt: "2026-06-15" },
  { id: "p5", name: "Chunky Knit Sweater", category: "Clothing", price: 120, stock: 7, image: "https://images.unsplash.com/photo-1641642231157-0849081598a2?w=300&h=300&fit=crop&auto=format", colors: ["Oat", "Charcoal", "Clay"], description: "Luxuriously soft hand-crocheted oversized sweater.", rating: 4.9, reviews: 22, active: true, createdAt: "2026-06-03" },
  { id: "p6", name: "Mini Plant Pot Covers", category: "Home", price: 14, stock: 22, image: "https://images.unsplash.com/photo-1659520709425-31b547254b59?w=300&h=300&fit=crop&auto=format", colors: ["Terracotta", "Sage", "Cream"], description: "Set of 3 crocheted pot covers.", rating: 4.5, reviews: 41, active: true, createdAt: "2026-06-18" },
  { id: "p7", name: "Crochet Pink Shoulder Bag", category: "Bags", price: 58, stock: 0, image: "https://images.unsplash.com/photo-1686285961020-4c46c9f3f7a6?w=300&h=300&fit=crop&auto=format", colors: ["Blush", "White", "Beige"], description: "Charming hand-crocheted shoulder bag.", rating: 4.8, reviews: 19, active: false, createdAt: "2026-06-20" },
  { id: "p8", name: "Colorful Yarn Bundle", category: "Supplies", price: 18, stock: 30, image: "https://images.unsplash.com/photo-1595341595379-cf1cb694ea1f?w=300&h=300&fit=crop&auto=format", colors: ["Autumn", "Ocean", "Garden"], description: "Premium hand-dyed yarn bundle, 5 skeins.", rating: 4.6, reviews: 14, active: true, createdAt: "2026-05-28" },
];

const seedOrders: Order[] = [
  { id: "ORD-2901", customer: "Liya Haile", email: "liya@email.com", items: [{ name: "Chunky Knit Tote Bag", qty: 1, price: 45 }, { name: "Mini Plant Pot Covers", qty: 2, price: 14 }], total: 73, status: "pending", date: "Jul 1, 2026", address: "45 Bole Road, Addis Ababa", phone: "+251 911 234567" },
  { id: "ORD-2900", customer: "Sara Bekele", email: "sara@email.com", items: [{ name: "Chunky Knit Sweater", qty: 1, price: 120 }], total: 120, status: "processing", date: "Jun 30, 2026", address: "12 Kazanchis Street, Addis Ababa", phone: "+251 912 345678" },
  { id: "ORD-2899", customer: "Tigist Alemu", email: "tigist@email.com", items: [{ name: "Granny Square Blanket", qty: 1, price: 85 }], total: 85, status: "shipped", date: "Jun 28, 2026", address: "88 Piassa Square, Addis Ababa", phone: "+251 913 456789" },
  { id: "ORD-2898", customer: "Meron Tadesse", email: "meron@email.com", items: [{ name: "Crochet Flower Bouquet", qty: 2, price: 28 }], total: 56, status: "delivered", date: "Jun 25, 2026", address: "3 Arat Kilo Ave, Addis Ababa", phone: "+251 914 567890" },
  { id: "ORD-2897", customer: "Hana Girma", email: "hana@email.com", items: [{ name: "Market Basket Bag", qty: 1, price: 52 }, { name: "Colorful Yarn Bundle", qty: 1, price: 18 }], total: 70, status: "delivered", date: "Jun 22, 2026", address: "21 CMC Road, Addis Ababa", phone: "+251 915 678901" },
  { id: "ORD-2896", customer: "Bethel Wondmu", email: "bethel@email.com", items: [{ name: "Crochet Pink Shoulder Bag", qty: 1, price: 58 }], total: 58, status: "cancelled", date: "Jun 20, 2026", address: "7 Meskel Square, Addis Ababa", phone: "+251 916 789012" },
];

const seedMessages: Message[] = [
  { id: "m1", customer: "Liya Haile", avatar: "LH", preview: "Is my order still on time?", unread: 2, time: "10:32 AM", messages: [{ text: "Hi! I placed an order yesterday. Is it still on time?", sender: "customer", time: "10:30 AM" }, { text: "Is my order still on time?", sender: "customer", time: "10:32 AM" }] },
  { id: "m2", customer: "Sara Bekele", avatar: "SB", preview: "Can I get a custom size for the sweater?", unread: 1, time: "9:14 AM", messages: [{ text: "Hello! I love the chunky sweater. Can I order a custom size?", sender: "customer", time: "9:14 AM" }] },
  { id: "m3", customer: "Tigist Alemu", avatar: "TA", preview: "Thank you so much, it arrived!", unread: 0, time: "Yesterday", messages: [{ text: "My blanket just arrived! It is absolutely beautiful 🥰", sender: "customer", time: "Yesterday 3:00 PM" }, { text: "So glad you love it! Thank you for your order! 🧶", sender: "admin", time: "Yesterday 3:15 PM" }, { text: "Thank you so much, it arrived!", sender: "customer", time: "Yesterday 3:20 PM" }] },
  { id: "m4", customer: "Meron Tadesse", avatar: "MT", preview: "Do you ship internationally?", unread: 0, time: "Jun 29", messages: [{ text: "Do you ship internationally? I have a friend in Germany who wants one.", sender: "customer", time: "Jun 29" }, { text: "We currently ship within Ethiopia, but international shipping is coming soon!", sender: "admin", time: "Jun 29" }] },
];

const salesData = [
  { month: "Feb", sales: 420 }, { month: "Mar", sales: 680 }, { month: "Apr", sales: 540 },
  { month: "May", sales: 890 }, { month: "Jun", sales: 1120 }, { month: "Jul", sales: 760 },
];
const categoryData = [
  { name: "Bags", value: 38, color: "#8c4b2f" },
  { name: "Clothing", value: 22, color: "#5c7a5a" },
  { name: "Home", value: 20, color: "#d4956a" },
  { name: "Decor", value: 12, color: "#b8956a" },
  { name: "Supplies", value: 8, color: "#c8b8a8" },
];

const statusMeta: Record<OrderStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", icon: <Clock size={12} /> },
  processing: { label: "Processing", bg: "bg-blue-50", text: "text-blue-700", icon: <Sparkles size={12} /> },
  shipped: { label: "Shipped", bg: "bg-purple-50", text: "text-purple-700", icon: <Truck size={12} /> },
  delivered: { label: "Delivered", bg: "bg-green-50", text: "text-green-700", icon: <CheckCircle2 size={12} /> },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-600", icon: <X size={12} /> },
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const totalUnread = messages.reduce((s, m) => s + m.unread, 0);

  useEffect(() => {

    const unsub = onSnapshot(collection(db, "products"), snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    const ordUnsub = onSnapshot(collection(db, "orders"), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });
    const msgUnsub = onSnapshot(collection(db, "messages"), snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });


    return (() => {
      unsub();
      ordUnsub();
      msgUnsub();
    });
  }, []);

  /* useEffect(() => {
    const ordUnsub = onSnapshot(collection(db, "orders"), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });

    return ordUnsub;
  }, []); */



  /*  useEffect(() => {
     const msgUnsub = onSnapshot(collection(db, "messages"), snap => {
       setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
     });
     return msgUnsub;
   }, []); */
  function addMessage() {

    addDoc(collection(db, "messages"), seedMessages[0]);
    addDoc(collection(db, "messages"), seedMessages[1]);
    addDoc(collection(db, "messages"), seedMessages[2]);
    addDoc(collection(db, "messages"), seedMessages[3]);
    addDoc(collection(db, "messages"), seedMessages[4]);
    alert("Messages added successfully");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <Sidebar
        page={page}
        setPage={(p) => { setPage(p); setSidebarOpen(false); }}
        open={sidebarOpen}
        pendingCount={pendingCount}
        totalUnread={totalUnread}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar page={page} onMenuClick={() => setSidebarOpen(true)} totalUnread={totalUnread} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ scrollbarWidth: "none" }}>
          {page === "dashboard" && (
            <DashboardPage
              products={products}
              orders={orders}
              totalRevenue={totalRevenue}
              pendingCount={pendingCount}
              onViewOrders={() => setPage("orders")}
            />
            /* <>

              <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={addMessage}>messages</button></>
         */  )}
          {page === "products" && (
            <ProductsPage products={products} setProducts={setProducts} />
          )}
          {page === "orders" && (
            <OrdersPage orders={orders} setOrders={setOrders} />
          )}
          {page === "chat" && (
            <ChatPage messages={messages} setMessages={setMessages} />
          )}
          {page === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({ page, setPage, open, pendingCount, totalUnread }: {
  page: Page; setPage: (p: Page) => void;
  open: boolean; pendingCount: number; totalUnread: number;
}) {
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { id: "products", label: "Products", icon: Package, badge: 0 },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: pendingCount },
    { id: "chat", label: "Messages", icon: MessageCircle, badge: totalUnread },
    { id: "settings", label: "Settings", icon: Settings, badge: 0 },
    { id: "logout", label: "Logout", icon: LogOut, badge: 0 },
  ] as const;

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      style={{ width: 240, background: "var(--card)", borderRight: "1px solid var(--border)", minHeight: "100vh" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "var(--primary)" }}>
          🧶
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
            Hasi Crochet
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "var(--muted-foreground)" }}>
          Menu
        </p>
        {nav.map(({ id, label, icon: Icon, badge }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={active
                ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                : { color: "var(--muted-foreground)" }
              }
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className="flex-1 text-left">{label}</span>
              {badge > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={active
                    ? { background: "rgba(255,255,255,0.25)", color: "var(--primary-foreground)" }
                    : { background: "var(--primary)", color: "var(--primary-foreground)" }
                  }
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
            H
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>Hasi Admin</p>
            <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>admin@hasicrochet.com</p>
          </div>
          <LogOut size={14} style={{ color: "var(--muted-foreground)" }} />
        </div>
      </div>
    </aside>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────

function TopBar({ page, onMenuClick, totalUnread }: { page: Page; onMenuClick: () => void; totalUnread: number }) {
  const titles: Record<Page, string> = {
    dashboard: "Dashboard", products: "Products", orders: "Orders", chat: "Messages", settings: "Settings",
    logout: "Logout"
  };
  return (
    <header
      className="flex items-center gap-3 px-4 md:px-6 py-3 shrink-0"
      style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
    >
      <button className="lg:hidden p-1.5 rounded-lg" style={{ background: "var(--secondary)" }} onClick={onMenuClick}>
        <Menu size={18} style={{ color: "var(--foreground)" }} />
      </button>
      <div className="flex-1">
        <h1 className="text-base font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
          {titles[page]}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-xl" style={{ background: "var(--secondary)" }}>
          <Bell size={17} style={{ color: "var(--muted-foreground)" }} />
          {totalUnread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
          )}
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          H
        </div>
      </div>
    </header>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardPage({ products, orders, totalRevenue, pendingCount, onViewOrders }: {
  products: Product[]; orders: Order[]; totalRevenue: number; pendingCount: number; onViewOrders: () => void;
}) {
  const activeProducts = products.filter(p => p.active).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 5).length;

  const stats = [
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, sub: "+12% this month", icon: DollarSign, up: true },
    { label: "Orders", value: orders.length, sub: `${pendingCount} pending`, icon: ShoppingBag, up: true },
    { label: "Active Products", value: activeProducts, sub: `${lowStock} low stock`, icon: Package, up: false },
    { label: "Customers", value: 142, sub: "+8 this week", icon: Users, up: true },
  ];

  const recent = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, up }) => (
          <div key={label} className="p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--secondary)" }}>
                <Icon size={18} style={{ color: "var(--primary)" }} />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: up ? "#16a34a" : "#dc2626" }}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              </div>
            </div>
            <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
              {value}
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--muted-foreground)" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
              Revenue Overview
            </p>
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
              6 months
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8c4b2f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8c4b2f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Area type="monotone" dataKey="sales" stroke="#8c4b2f" strokeWidth={2.5} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="p-5 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
            Sales by Category
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span style={{ color: "var(--muted-foreground)" }}>{c.name}</span>
                </div>
                <span className="font-medium" style={{ color: "var(--foreground)" }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
            Recent Orders
          </p>
          <button
            onClick={onViewOrders}
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: "var(--primary)" }}
          >
            View all <ChevronRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Order", "Customer", "Items", "Total", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => {
                const { label, bg, text, icon } = statusMeta[o.status];
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-xs" style={{ color: "var(--primary)" }}>{o.id}</td>
                    <td className="px-5 py-3 text-xs font-medium" style={{ color: "var(--foreground)" }}>{o.customer}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{o.items.length} item{o.items.length !== 1 ? "s" : ""}</td>
                    <td className="px-5 py-3 text-xs font-semibold" style={{ color: "var(--foreground)" }}>${o.total}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
                        {icon}{label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{o.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low stock alert */}
      {products.filter(p => p.stock < 5).length > 0 && (
        <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: "#fef9f0", border: "1px solid #f59e0b33" }}>
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92400e" }}>Low Stock Alert</p>
            <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>
              {products.filter(p => p.stock < 5 && p.stock > 0).map(p => p.name).join(", ")} {products.filter(p => p.stock === 0).length > 0 && `· Out of stock: ${products.filter(p => p.stock === 0).map(p => p.name).join(", ")}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

function ProductsPage({ products, setProducts }: { products: Product[]; setProducts: (p: Product[]) => void }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modal, setModal] = useState<null | "add" | Product>(null);

  const cats = ["All", "Bags", "Clothing", "Home", "Decor", "Supplies"];
  const filtered = products.filter(p => {
    const mCat = catFilter === "All" || p.category === catFilter;
    const mSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return mCat && mSearch;
  });

  function deleteProduct(id: string) {
    setProducts(products.filter(p => p.id !== id));
  }
  async function toggleActive(id: string) {
    const product = products.filter(p => p.id === id)
    const data = product[0]
    await updateDoc(doc(db, "products", id), { active: !data.active });
    //setProducts(products.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }
  function saveProducts(data: Partial<Product>) {
    if (modal === "add") {
      setProducts([...products, { ...data, id: `p${Date.now()}`, rating: 0, reviews: 0, active: true, createdAt: new Date().toISOString().split("T")[0] } as Product]);
    } else if (modal && typeof modal === "object") {
      setProducts(products.map(p => p.id === modal.id ? { ...p, ...data } : p));
    }
    setModal(null);
  }
  async function saveProduct(data: Partial<Product>) {
    if (modal === "add") {
      await addDoc(collection(db, "products"), data);
    } else if (modal && typeof modal === "object") {
      if (data.id) {
        await setDoc(doc(db, "products", data.id), data, { merge: true });
      } else {
        alert("Product ID is required to update a product.");
      }
    }
    setModal(null);
  }


  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Search size={15} style={{ color: "var(--muted-foreground)" }} />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--foreground)" }} />
        </div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={catFilter === c ? { background: "var(--primary)", color: "var(--primary-foreground)" } : { background: "var(--card)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setModal("add")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="relative" style={{ height: 180 }}>
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
              {!p.active && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white">Inactive</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button onClick={() => setModal(p)} className="p-1.5 rounded-lg bg-white/90 hover:bg-white transition-colors">
                  <Edit2 size={13} style={{ color: "var(--foreground)" }} />
                </button>
                <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg bg-white/90 hover:bg-white transition-colors">
                  <Trash2 size={13} style={{ color: "#dc2626" }} />
                </button>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(255,255,255,0.9)", color: "var(--foreground)" }}>
                  {p.category}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-semibold leading-snug flex-1 pr-2" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>{p.name}</p>
                <p className="text-sm font-bold shrink-0" style={{ color: "var(--primary)" }}>${p.price}</p>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star size={11} fill="#f59e0b" style={{ color: "#f59e0b" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.rating} ({p.reviews})</span>
                </div>
                <span className="text-xs font-medium" style={{ color: p.stock === 0 ? "#dc2626" : p.stock < 5 ? "#d97706" : "var(--accent)" }}>
                  {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {p.colors.slice(0, 3).map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{c}</span>
                  ))}
                </div>
                <button onClick={() => toggleActive(p.id)}
                  className="text-xs font-medium px-2.5 py-1 rounded-full transition-all"
                  style={p.active ? { background: "#dcfce7", color: "#16a34a" } : { background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  {p.active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product modal */}
      {modal !== null && (
        <ProductModal
          product={modal === "add" ? null : modal}
          onSave={saveProduct}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onSave, onClose }: { product: Product | null; onSave: (d: Partial<Product>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    id: product?.id ?? "",
    name: product?.name ?? "",
    category: product?.category ?? "Bags",
    price: product?.price ?? 0,
    stock: product?.stock ?? 0,
    description: product?.description ?? "",
    image: product?.image ?? "",
    colors: product?.colors.join(", ") ?? "",
  });

  const cats = ["Bags", "Clothing", "Home", "Decor", "Accessories", "Supplies"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: "var(--card)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-base font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
            {product ? "Edit Product" : "Add New Product"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: "var(--secondary)" }}>
            <X size={16} style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4" style={{ scrollbarWidth: "none" }}>
          {/* Image preview */}
          {form.image && (
            <img src={form.image} alt="preview" className="w-full h-40 object-cover rounded-2xl" />
          )}
          <Field label="Product Name">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Chunky Knit Tote Bag" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)" }} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Price ($)">
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)" }} />
            </Field>
          </div>
          <Field label="Stock Quantity">
            <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Image URL">
            <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
              placeholder="https://images.unsplash.com/..." className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Colors (comma-separated)">
            <input value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })}
              placeholder="Natural, Dusty Rose, Sage" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Describe this handmade item..."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "var(--secondary)", color: "var(--foreground)" }} />
          </Field>
        </div>
        <div className="px-6 py-4 flex gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...form, colors: form.colors.split(",").map(s => s.trim()) })}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            {product ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      {children}
    </div>
  );
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

function OrdersPage({ orders, setOrders }: { orders: Order[]; setOrders: (o: Order[]) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const statuses: ("all" | OrderStatus)[] = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];
  const filtered = orders.filter(o => {
    const mStatus = statusFilter === "all" || o.status === statusFilter;
    const mSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    return mStatus && mSearch;
  });

  function updateStatus(id: string, status: OrderStatus) {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Search size={15} style={{ color: "var(--muted-foreground)" }} />
          <input type="text" placeholder="Search by name or order ID..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--foreground)" }} />
        </div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {statuses.map(s => {
            const label = s === "all" ? "All" : statusMeta[s].label;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all"
                style={statusFilter === s ? { background: "var(--primary)", color: "var(--primary-foreground)" } : { background: "var(--card)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Table */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Order", "Customer", "Total", "Status", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const { label, bg, text, icon } = statusMeta[o.status];
                  return (
                    <tr key={o.id}
                      onClick={() => setSelected(o)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--border)", background: selected?.id === o.id ? "var(--secondary)" : undefined }}>
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: "var(--primary)" }}>{o.id}</td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--foreground)" }}>{o.customer}</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground)" }}>${o.total}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>{icon}{label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{o.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Eye size={32} style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Select an order to view details</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>{selected.id}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{selected.date}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta[selected.status].bg} ${statusMeta[selected.status].text}`}>
                  {statusMeta[selected.status].icon}{statusMeta[selected.status].label}
                </span>
              </div>

              <div className="space-y-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <p><span className="font-medium" style={{ color: "var(--foreground)" }}>{selected.customer}</span></p>
                <p>{selected.email}</p>
                <p>{selected.phone}</p>
                <p>{selected.address}</p>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Items</p>
                <div className="space-y-1.5">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span style={{ color: "var(--muted-foreground)" }}>{item.name} × {item.qty}</span>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-1" style={{ borderTop: "1px solid var(--border)", color: "var(--foreground)" }}>
                    <span>Total</span><span style={{ color: "var(--primary)" }}>${selected.total}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Update Status</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["pending", "processing", "shipped", "delivered", "cancelled"] as OrderStatus[]).map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 justify-center transition-all ${statusMeta[s].bg} ${statusMeta[s].text} ${selected.status === s ? "ring-2 ring-offset-1" : "opacity-70 hover:opacity-100"}`}
                      style={selected.status === s ? { outlineColor: "var(--primary)" } : {}}>
                      {statusMeta[s].icon}{statusMeta[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────

function ChatPage({ messages, setMessages }: { messages: Message[]; setMessages: (m: Message[]) => void }) {
  const [active, setActive] = useState<Message | null>(messages[0] ?? null);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active]);

  function send() {
    if (!input.trim() || !active) return;
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const updated = messages.map(m => m.id === active.id
      ? { ...m, messages: [...m.messages, { text: input, sender: "admin" as const, time: now }], unread: 0, preview: input, time: now }
      : m
    );
    setMessages(updated);
    setActive(updated.find(m => m.id === active.id) ?? null);
    setInput("");
  }

  function markRead(id: string) {
    const updated = messages.map(m => m.id === id ? { ...m, unread: 0 } : m);
    setMessages(updated);
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Conversation list */}
      <div className="w-72 shrink-0 rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--secondary)" }}>
            <Search size={14} style={{ color: "var(--muted-foreground)" }} />
            <input placeholder="Search conversations..." className="flex-1 bg-transparent outline-none text-xs" style={{ color: "var(--foreground)" }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {messages.map(m => (
            <button key={m.id} onClick={() => { setActive(m); markRead(m.id); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ borderBottom: "1px solid var(--border)", background: active?.id === m.id ? "var(--secondary)" : undefined }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                {m.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{m.customer}</p>
                  <p className="text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>{m.time}</p>
                </div>
                <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{m.preview}</p>
              </div>
              {m.unread > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {m.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <MessageCircle size={40} style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                {active.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{active.customer}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Customer</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ scrollbarWidth: "none" }}>
              {active.messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.sender === "admin" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.sender === "customer" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 self-end" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                      {active.avatar}
                    </div>
                  )}
                  <div className="max-w-[70%]">
                    <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={msg.sender === "admin"
                        ? { background: "var(--primary)", color: "var(--primary-foreground)", borderBottomRightRadius: 4 }
                        : { background: "var(--secondary)", color: "var(--foreground)", borderBottomLeftRadius: 4 }}>
                      {msg.text}
                    </div>
                    <p className={`text-xs mt-1 ${msg.sender === "admin" ? "text-right" : "text-left"}`} style={{ color: "var(--muted-foreground)" }}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "var(--secondary)" }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Reply to customer..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--foreground)" }} />
              </div>
              <button onClick={send} disabled={!input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ background: input.trim() ? "var(--primary)" : "var(--muted)", color: input.trim() ? "var(--primary-foreground)" : "var(--muted-foreground)" }}>
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    storeName: "Hasi Crochet Hand Made",
    email: "admin@hasicrochet.com",
    phone: "+251 911 234 567",
    address: "Bole Road, Addis Ababa, Ethiopia",
    currency: "USD",
    shippingFee: "4.99",
    freeShippingThreshold: "60",
    instagramHandle: "@hasicrochet",
    telegramHandle: "@hasicrochet_support",
    fbPixelId: "",
    firestoreProjectId: "hasi-crochet-prod",
    vercelProjectId: "",
  });

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const sections = [
    {
      title: "Store Information",
      fields: [
        { key: "storeName", label: "Store Name", type: "text" },
        { key: "email", label: "Contact Email", type: "email" },
        { key: "phone", label: "Phone Number", type: "tel" },
        { key: "address", label: "Address", type: "text" },
      ],
    },
    {
      title: "Pricing & Shipping",
      fields: [
        { key: "currency", label: "Currency", type: "text" },
        { key: "shippingFee", label: "Default Shipping Fee ($)", type: "number" },
        { key: "freeShippingThreshold", label: "Free Shipping Above ($)", type: "number" },
      ],
    },
    {
      title: "Social & Marketing",
      fields: [
        { key: "instagramHandle", label: "Instagram Handle", type: "text" },
        { key: "telegramHandle", label: "Telegram Handle", type: "text" },
        { key: "fbPixelId", label: "Facebook Pixel ID", type: "text" },
      ],
    },
    {
      title: "Integrations",
      fields: [
        { key: "firestoreProjectId", label: "Firebase Project ID", type: "text" },
        { key: "vercelProjectId", label: "Vercel Project ID", type: "text" },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {sections.map(section => (
        <div key={section.title} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
              {section.title}
            </p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {section.fields.map(({ key, label, type }) => (
              <Field key={key} label={label}>
                <input type={type} value={(form as Record<string, string>)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--secondary)", color: "var(--foreground)" }} />
              </Field>
            ))}
          </div>
        </div>
      ))}

      {/* Deploy info */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "#fef9f0", border: "1px solid #f59e0b33" }}>
        <p className="text-sm font-semibold" style={{ color: "#92400e", fontFamily: "'Playfair Display', serif" }}>
          🚀 Vercel Deployment
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#b45309" }}>
          This admin panel is ready to deploy on Vercel. Set the following environment variables in your Vercel project settings:
        </p>
        {["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_STORAGE_BUCKET", "VITE_FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_APP_ID"].map(v => (
          <code key={v} className="block text-xs px-3 py-1.5 rounded-lg font-mono" style={{ background: "rgba(146,64,14,0.1)", color: "#92400e" }}>
            {v}
          </code>
        ))}
      </div>

      <button onClick={save}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
        style={{ background: saved ? "#16a34a" : "var(--primary)", color: "var(--primary-foreground)" }}>
        {saved ? <><Check size={16} /> Saved!</> : "Save Settings"}
      </button>
    </div>
  );
}
