import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);
const fmtRp = (n) => `Rp ${fmt(n)}`;
const fmtDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const DB_USERS = {
  "Lucas": { password: "040900", role: "owner" },
  "Budi": { password: "123456", role: "karyawan" }
};

const INIT_MENU = [
  { id: "m1", name: "Nasi Goreng Joglo", category: "Utama", price: 35000, icon: "🍳" },
  { id: "m2", name: "Magelangan Spesial", category: "Utama", price: 30000, icon: "🍜" },
  { id: "m3", name: "Nasi Rendang Rempah", category: "Utama", price: 45000, icon: "🍛" },
  { id: "m4", name: "Ayam Bakar Kampung", category: "Lauk", price: 40000, icon: "🍗" },
  { id: "m5", name: "Soto Ayam Kemangi", category: "Sup", price: 30000, icon: "🍲" },
  { id: "m6", name: "Rawon Daging Sapi", category: "Sup", price: 40000, icon: "🥣" },
  { id: "m7", name: "Burger Sapi Joglo", category: "Fusion", price: 35000, icon: "🍔" },
  { id: "m8", name: "Tempe Mendoan", category: "Camilan", price: 15000, icon: "🫘" },
  { id: "m9", name: "Es Teh Manis", category: "Minuman", price: 8000, icon: "🧋" },
  { id: "m10", name: "Wedang Jahe", category: "Minuman", price: 12000, icon: "☕" }
];

const INIT_STOCK = [
  { id: "s1", name: "Beras", unit: "kg", quantity: 50, minQty: 10 },
  { id: "s2", name: "Mie Kuning", unit: "porsi", quantity: 40, minQty: 10 },
  { id: "s3", name: "Daging Sapi", unit: "kg", quantity: 15, minQty: 3 },
  { id: "s4", name: "Ayam Kampung", unit: "porsi", quantity: 30, minQty: 5 },
  { id: "s5", name: "Roti Burger", unit: "pcs", quantity: 20, minQty: 5 },
  { id: "s6", name: "Tempe", unit: "papan", quantity: 20, minQty: 5 },
  { id: "s7", name: "Telur", unit: "butir", quantity: 60, minQty: 15 },
  { id: "s8", name: "Teh", unit: "pack", quantity: 10, minQty: 2 },
  { id: "s9", name: "Jahe", unit: "kg", quantity: 5, minQty: 1 }
];

const C = {
  bg: "#F7EDD8", surface: "#FFFDF5", surfaceAlt: "#FFF8EC", border: "#E0C89A", borderLight: "#EDD9AC",
  primary: "#4A2000", primaryMid: "#5C2E00", accent: "#C8860A", accentLight: "#FFD98A", text: "#2C1810",
  textMid: "#5C3A1E", textLight: "#A07850", textMuted: "#C4956A", green: "#4A7C59", greenBg: "#EAF5EE",
  red: "#C0392B", redBg: "#FDEDEC", blue: "#2471A3", blueBg: "#E8F4FD", purple: "#8E44AD", purpleBg: "#F4ECF7",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.bg};font-family:'Source Serif 4',Georgia,serif;color:${C.text}}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-track{background:${C.bg}}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
  .card{background:${C.surface};border-radius:14px;box-shadow:0 2px 12px rgba(74,32,0,.08);border:1px solid ${C.borderLight}}
  .btn{transition:all .18s;cursor:pointer;border:none;font-family:inherit}
  .btn:hover{filter:brightness(1.07);transform:translateY(-1px)}
  .btn:active{transform:translateY(0) scale(.98)}
  .nav-tab{transition:all .18s;cursor:pointer;border:none;font-family:'Source Serif 4',serif;white-space:nowrap}
  .menu-tile{transition:all .2s;cursor:pointer}
  .menu-tile:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(74,32,0,.14)!important}
  .pill{cursor:pointer;transition:all .15s;border:none;font-family:inherit}
  .pill:hover{opacity:.85}
  .inp{width:100%;padding:.55rem .85rem;border:1.5px solid ${C.border};border-radius:9px;font-family:inherit;font-size:.9rem;background:#FFFBF3;color:${C.text};outline:none;transition:border .15s}
  .inp:focus{border-color:${C.accent}}
  .overlay{position:fixed;inset:0;background:rgba(44,24,16,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px)}
  .modal{background:${C.surface};border-radius:18px;padding:1.5rem;width:100%;max-width:430px;box-shadow:0 28px 72px rgba(74,32,0,.28)}
  
  .print-only { display: none; }
  @media print {
    body { background: white !important; margin: 0; padding: 0; }
    body * { visibility: hidden; }
    .print-only { display: block !important; position: absolute; left: 0; top: 0; width: 300px; font-size: 14px; }
    .print-only, .print-only * { visibility: visible; color: black !important; font-family: monospace !important; }
    .garis-putus { border-bottom: 2px dashed #000 !important; margin: 10px 0 !important; }
    .print-flex { display: flex !important; justify-content: space-between !important; }
  }
`;

export default function RestaurantJoglo() {
  const [authUser, setAuthUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  
  const [tab, setTab] = useState("kasir");
  const [menu, setMenu] = useState([]);
  const [stock, setStock] = useState([]);
  const [txns, setTxns] = useState([]);
  const [cart, setCart] = useState([]);
  const [catFilter, setCatFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [showPay, setShowPay] = useState(false);
  const [payMethod, setPayMethod] = useState("Tunai");
  const [cashIn, setCashIn] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [menuModal, setMenuModal] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [menuForm, setMenuForm] = useState({});
  const [stockForm, setStockForm] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 680);
  const [confirmDel, setConfirmDel] = useState(null);

  // Filter Tanggal Laporan
  const [repStart, setRepStart] = useState("");
  const [repEnd, setRepEnd] = useState("");

  const NAV_TABS = [
    { key: "kasir", icon: "🧾", label: "Kasir", roles: ["owner", "karyawan"] },
    { key: "menu", icon: "📋", label: "Menu", roles: ["owner"] },
    { key: "laporan", icon: "📊", label: "Laporan", roles: ["owner"] },
    { key: "stok", icon: "📦", label: "Stok", roles: ["owner", "karyawan"] },
  ];

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 680);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    try { const r = localStorage.getItem("jg_auth"); if (r) setAuthUser(JSON.parse(r)); } catch {}

    const unsubTxns = onSnapshot(collection(db, "txns"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // PENGAMANAN DATA: Pastikan date valid
      const validData = data.filter(d => d && d.date);
      validData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTxns(validData);
    });

    const unsubMenu = onSnapshot(collection(db, "menu"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenu(data.length > 0 ? data : INIT_MENU); 
    });

    const unsubStock = onSnapshot(collection(db, "stock"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStock(data.length > 0 ? data : INIT_STOCK); 
    });

    return () => { unsubTxns(); unsubMenu(); unsubStock(); };
  }, []);

  useEffect(() => { 
    if(authUser) localStorage.setItem("jg_auth", JSON.stringify(authUser)); 
    else localStorage.removeItem("jg_auth"); 
  }, [authUser]);

  const doLogin = (e) => {
    e.preventDefault();
    const user = DB_USERS[loginForm.username];
    if (user && user.password === loginForm.password) {
      setAuthUser({ username: loginForm.username, role: user.role });
      setTab("kasir");
      setLoginForm({ username: "", password: "" });
    } else {
      alert("Username atau Password salah!");
    }
  };

  const doLogout = () => { if (window.confirm("Yakin ingin logout dari mesin kasir?")) setAuthUser(null); };

  const addToCart = useCallback((item) => {
    setCart((p) => {
      const ex = p.find((c) => c.id === item.id);
      return ex ? p.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c)) : [...p, { ...item, qty: 1 }];
    });
  }, []);

  const decCart = useCallback((id) => {
    setCart((p) => {
      const ex = p.find((c) => c.id === id);
      return ex?.qty === 1 ? p.filter((c) => c.id !== id) : p.map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c));
    });
  }, []);

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartQty = cart.reduce((s, c) => s + c.qty, 0);

  const doPayment = async () => {
    if (!cart.length) return;
    const tx = {
      no: `INV${String(txns.length + 1).padStart(4, "0")}`,
      date: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
      method: payMethod,
      cash: payMethod === "Tunai" ? Number(cashIn) : cartTotal,
      change: payMethod === "Tunai" ? Number(cashIn) - cartTotal : 0,
      cashier: authUser.username,
    };
    
    try {
      await addDoc(collection(db, "txns"), tx);

      for (const cartItem of cart) {
        const menuName = (cartItem.name || "").toLowerCase();
        let recipe = null;
        
        if (menuName.includes("nasi goreng")) {
          recipe = [{ stockKeyword: "beras", qty: 0.25 }, { stockKeyword: "telur", qty: 1 }];
        } else if (menuName.includes("magelangan")) {
          recipe = [{ stockKeyword: "beras", qty: 0.15 }, { stockKeyword: "mie", qty: 1 }, { stockKeyword: "telur", qty: 1 }];
        } else if (menuName.includes("rendang")) {
          recipe = [{ stockKeyword: "beras", qty: 0.2 }, { stockKeyword: "daging sapi", qty: 0.2 }];
        } else if (menuName.includes("ayam")) {
          recipe = [{ stockKeyword: "ayam", qty: 1 }];
        } else if (menuName.includes("soto")) {
          recipe = [{ stockKeyword: "beras", qty: 0.15 }, { stockKeyword: "ayam", qty: 0.5 }];
        } else if (menuName.includes("rawon")) {
          recipe = [{ stockKeyword: "beras", qty: 0.15 }, { stockKeyword: "daging sapi", qty: 0.15 }];
        } else if (menuName.includes("burger")) {
          recipe = [{ stockKeyword: "roti", qty: 1 }, { stockKeyword: "daging sapi", qty: 0.1 }];
        } else if (menuName.includes("mendoan")) {
          recipe = [{ stockKeyword: "tempe", qty: 0.5 }];
        } else if (menuName.includes("teh")) {
          recipe = [{ stockKeyword: "teh", qty: 0.05 }];
        } else if (menuName.includes("jahe")) {
          recipe = [{ stockKeyword: "jahe", qty: 0.1 }];
        }

        if (recipe) {
          for (const ing of recipe) {
            const stockTarget = stock.find(s => (s.name || "").toLowerCase().includes(ing.stockKeyword));
            if (stockTarget) {
              const deduction = ing.qty * cartItem.qty;
              const newQty = (stockTarget.quantity || 0) - deduction;
              await updateDoc(doc(db, "stock", stockTarget.id), {
                quantity: Number(newQty.toFixed(2)) 
              });
            }
          }
        }
      }

      setReceipt(tx);
      setCart([]);
      setShowPay(false);
      setShowCart(false);
      setCashIn("");
    } catch (e) {
      alert("Gagal memproses pembayaran. Pastikan internet aktif!");
      console.error(e);
    }
  };

  const handlePrintAndClose = () => {
    window.onafterprint = () => {
      setReceipt(null);
      window.onafterprint = null;
    };
    window.print();
  };

  const payOk = payMethod !== "Tunai" || Number(cashIn) >= cartTotal;

  const resetDatabase = async () => {
    if (!window.confirm("Beneran mau hapus semua Menu & Stok lama dan ganti dengan data khusus Resto Joglo?")) return;
    try {
      for (const m of menu) await deleteDoc(doc(db, "menu", m.id));
      for (const s of stock) await deleteDoc(doc(db, "stock", s.id));
      for (const m of INIT_MENU) await addDoc(collection(db, "menu"), { name: m.name, category: m.category, price: m.price, icon: m.icon });
      for (const s of INIT_STOCK) await addDoc(collection(db, "stock"), { name: s.name, unit: s.unit, quantity: s.quantity, minQty: s.minQty });
      alert("Selesai! Database berhasil di-reset. Menu dan Stok Joglo sudah aktif.");
    } catch (e) {
      alert("Gagal mereset database. Cek koneksi internet.");
    }
  };

  const openMenuEdit = (item) => {
    setMenuForm(item ? { ...item } : { name: "", category: "", price: "", icon: "🍽️" });
    setMenuModal(item ? "edit" : "new");
  };

  const saveMenu = async () => {
    if (!menuForm.name || !menuForm.price) return;
    const itemData = { name: menuForm.name, category: menuForm.category || "Umum", price: Number(menuForm.price), icon: menuForm.icon || "🍽️" };
    try {
      if (menuModal === "new") await addDoc(collection(db, "menu"), itemData);
      else await updateDoc(doc(db, "menu", menuForm.id), itemData);
      setMenuModal(null);
    } catch (e) { alert("Gagal menyimpan menu ke Cloud!"); }
  };

  const openStockEdit = (item) => {
    setStockForm(item ? { ...item } : { name: "", unit: "", quantity: "", minQty: "" });
    setStockModal(item ? "edit" : "new");
  };

  const saveStock = async () => {
    if (!stockForm.name) return;
    const itemData = { name: stockForm.name, unit: stockForm.unit || "pcs", quantity: Number(stockForm.quantity), minQty: Number(stockForm.minQty) };
    try {
      if (stockModal === "new") await addDoc(collection(db, "stock"), itemData);
      else await updateDoc(doc(db, "stock", stockForm.id), itemData);
      setStockModal(null);
    } catch (e) { alert("Gagal menyimpan stok ke Cloud!"); }
  };

  const handleDelete = async (type, id) => {
    try {
      await deleteDoc(doc(db, type, id));
      setConfirmDel(null);
    } catch (e) { alert("Gagal menghapus data dari Cloud!"); }
  };

  // --- LOGIKA FILTER & REPORTING (DENGAN PENGAMANAN DATA) ---
  const categories = ["Semua", ...new Set(menu.map((m) => m.category || "Umum"))];
  const filteredMenu = menu.filter((m) => {
    const mc = catFilter === "Semua" || (m.category || "Umum") === catFilter;
    const mq = (m.name || "").toLowerCase().includes(search.toLowerCase());
    return mc && mq;
  });

  const filteredTxns = txns.filter(t => {
    if (!t || !t.date) return false;
    if (repStart && new Date(t.date) < new Date(repStart + "T00:00:00")) return false;
    if (repEnd && new Date(t.date) > new Date(repEnd + "T23:59:59")) return false;
    return true;
  });

  const totalFilteredRev = filteredTxns.reduce((s, t) => s + (t.total || 0), 0);
  const avgFilteredTx = filteredTxns.length ? Math.round(totalFilteredRev / filteredTxns.length) : 0;

  const breakdown = filteredTxns.reduce((acc, t) => {
    const mthd = t.method || "Tunai";
    acc[mthd] = (acc[mthd] || 0) + (t.total || 0);
    return acc;
  }, { Tunai: 0, QRIS: 0, Kartu: 0 });

  const itemSales = {};
  filteredTxns.forEach(tx => {
    if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach(item => {
        const itemName = item.name || "Menu Tak Bernama";
        if(!itemSales[itemName]) itemSales[itemName] = { qty: 0, rev: 0, icon: item.icon || "🍽️" };
        itemSales[itemName].qty += (item.qty || 1);
        itemSales[itemName].rev += ((item.qty || 1) * (item.price || 0));
      });
    }
  });

  const bestSellers = Object.entries(itemSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a,b) => b.qty - a.qty)
    .slice(0, 5);

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dt = txns.filter((t) => t.date && new Date(t.date).toDateString() === d.toDateString());
    return {
      hari: d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
      pendapatan: dt.reduce((s, t) => s + (t.total || 0), 0),
    };
  });

  const lowStock = stock.filter((s) => (s.quantity || 0) <= (s.minQty || 0));

  const exportToCSV = () => {
    if (filteredTxns.length === 0) return alert("Belum ada transaksi di rentang tanggal ini.");
    const headers = ["Nomor Invoice", "Tanggal", "Rincian Pesanan", "Metode", "Kasir", "Total (Rp)"];
    const rows = filteredTxns.map(t => [
      t.no || "-",
      t.date ? new Date(t.date).toLocaleString('id-ID').replace(/,/g, '') : "-",
      Array.isArray(t.items) ? t.items.map(i => `${i.name || "Menu"} (x${i.qty || 1})`).join(" | ") : "-",
      t.method || "Tunai",
      t.cashier || "System",
      t.total || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Penjualan_Joglo.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CartPanel = ({ asModal = false }) => (
    <div className={asModal ? "" : "card"} style={{
      background: C.surface, borderRadius: asModal ? 18 : 14, padding: "1rem",
      display: "flex", flexDirection: "column", height: asModal ? "auto" : "calc(100vh - 128px)",
      maxHeight: asModal ? "85vh" : "calc(100vh - 128px)",
      position: asModal ? "relative" : "sticky", top: asModal ? "auto" : 112,
      overflow: asModal ? "hidden" : "visible",
    }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", color: C.primary, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        🧾 Pesanan
        {cartQty > 0 && <span style={{ background: C.accent, color: "white", borderRadius: 99, fontSize: ".68rem", fontWeight: 700, padding: "1px 7px" }}>{cartQty} item</span>}
      </div>

      {cart.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: ".85rem", textAlign: "center", gap: ".5rem", padding: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem" }}>🍽️</div>
          Pilih menu untuk<br />memulai pesanan
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: ".45rem", marginBottom: ".75rem" }}>
            {cart.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".5rem .6rem", background: C.surfaceAlt, borderRadius: 9 }}>
                <span style={{ fontSize: "1.2rem" }}>{c.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: ".72rem", color: C.accent }}>{fmtRp(c.price)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
                  <button className="btn" onClick={() => decCart(c.id)}
                    style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${C.accent}`, background: "white", color: C.accent, fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, paddingBottom: 1 }}>−</button>
                  <span style={{ fontSize: ".85rem", fontWeight: 700, minWidth: 16, textAlign: "center" }}>{c.qty}</span>
                  <button className="btn" onClick={() => addToCart(c)}
                    style={{ width: 22, height: 22, borderRadius: "50%", background: C.accent, border: "none", color: "white", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, paddingBottom: 1 }}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1.5px dashed ${C.border}`, paddingTop: ".75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".75rem", alignItems: "center" }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: ".9rem", color: C.primary }}>Total</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 700, color: C.accent }}>{fmtRp(cartTotal)}</span>
            </div>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn" onClick={() => { setCart([]); setShowCart(false); }}
                style={{ flex: 1, padding: ".55rem", background: "#F0E0C0", color: C.primaryMid, borderRadius: 9, fontSize: ".78rem" }}>
                🗑️ Batal
              </button>
              <button className="btn" onClick={() => { setShowPay(true); setShowCart(false); }}
                style={{ flex: 2, padding: ".55rem", background: C.accent, color: "white", borderRadius: 9, fontFamily: "'Playfair Display',serif", fontSize: ".88rem", fontWeight: 700 }}>
                💳 Bayar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (!authUser) {
    return (
      <div style={{ fontFamily: "'Source Serif 4',Georgia,serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <style>{styles}</style>
        <div className="card" style={{ width: "100%", maxWidth: 360, padding: "2.5rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏛️</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: C.primary, marginBottom: ".2rem", fontWeight: 700 }}>Resto Joglo Alberthin</div>
          <div style={{ fontSize: ".85rem", color: C.textLight, marginBottom: "2.5rem" }}>Sistem Keamanan Mesin Kasir</div>
          
          <form onSubmit={doLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
            <div>
              <label style={{ fontSize: ".75rem", fontWeight: 600, color: C.primaryMid, marginBottom: ".3rem", display: "block" }}>Username Kasir</label>
              <input required className="inp" placeholder="Ketik Lucas atau Budi..." value={loginForm.username} onChange={(e) => setLoginForm(p => ({...p, username: e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize: ".75rem", fontWeight: 600, color: C.primaryMid, marginBottom: ".3rem", display: "block" }}>Password / PIN</label>
              <input required className="inp" type="password" placeholder="••••••" value={loginForm.password} onChange={(e) => setLoginForm(p => ({...p, password: e.target.value}))} />
            </div>
            <button type="submit" className="btn" style={{ background: C.accent, color: "white", padding: ".85rem", borderRadius: 9, fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", fontWeight: 700, marginTop: "1rem" }}>
              Buka Mesin Kasir
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Source Serif 4',Georgia,serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{styles}</style>

      <header className="no-print" style={{ background: C.primary, padding: ".7rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 20px rgba(0,0,0,.3)" }}>
        <div style={{ fontSize: "1.5rem" }}>🏛️</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", color: C.accentLight, fontSize: "1.05rem", fontWeight: 700, letterSpacing: ".04em" }}>Resto Joglo Alberthin</div>
          <div style={{ color: "#C4956A", fontSize: ".65rem", letterSpacing: ".1em" }}>SISTEM KASIR PRO</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: ".6rem" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginRight: ".75rem", borderRight: `1px solid ${C.primaryMid}`, paddingRight: "1.25rem" }}>
            <div style={{ textAlign: "right", display: isMobile ? "none" : "block" }}>
              <div style={{ fontSize: ".8rem", fontWeight: 700, color: C.surface }}>{authUser.username}</div>
              <div style={{ fontSize: ".6rem", color: C.accentLight, fontWeight: 600 }}>{authUser.role.toUpperCase()}</div>
            </div>
            <button className="btn" onClick={doLogout} style={{ background: C.red, color: "white", borderRadius: 8, padding: ".35rem .7rem", fontSize: ".75rem", fontWeight: 600 }}>
              Logout
            </button>
          </div>

          {lowStock.length > 0 && (
            <button className="btn" onClick={() => setTab("stok")}
              style={{ background: C.red, color: "white", borderRadius: 99, padding: ".28rem .65rem", fontSize: ".72rem", display: "flex", alignItems: "center", gap: ".3rem" }}>
              ⚠️ {lowStock.length} stok menipis
            </button>
          )}
          {!isMobile && (
            <div style={{ color: "#C4956A", fontSize: ".75rem" }}>
              {new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          )}
        </div>
      </header>

      <nav className="no-print" style={{ background: C.primaryMid, padding: ".45rem 1rem", display: "flex", gap: ".4rem", overflowX: "auto", position: "sticky", top: 55, zIndex: 49, boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
        {NAV_TABS.filter(n => n.roles.includes(authUser.role)).map((n) => (
          <button key={n.key} className="nav-tab" onClick={() => setTab(n.key)}
            style={{ background: tab === n.key ? C.accent : "transparent", color: tab === n.key ? "white" : "#C4956A", borderRadius: 8, padding: ".42rem .95rem", fontSize: ".83rem", display: "flex", alignItems: "center", gap: ".4rem", fontWeight: tab === n.key ? 600 : 400, transition: "all .18s" }}>
            {n.icon} {n.label}
            {n.key === "kasir" && cartQty > 0 && <span style={{ background: C.accentLight, color: C.primary, borderRadius: 99, fontSize: ".62rem", fontWeight: 700, padding: "1px 6px" }}>{cartQty}</span>}
            {n.key === "stok" && lowStock.length > 0 && <span style={{ background: C.red, color: "white", borderRadius: 99, fontSize: ".62rem", fontWeight: 700, padding: "1px 6px" }}>{lowStock.length}</span>}
          </button>
        ))}
      </nav>

      <main style={{ padding: "1rem", maxWidth: 1200, margin: "0 auto" }}>
        
        {/* TAB KASIR */}
        {tab === "kasir" && (
          <div className="no-print" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 310px", gap: "1rem", alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: ".75rem" }}>
                <input className="inp" placeholder="🔍 Cari menu…" value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 140, maxWidth: 240 }} />
                <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
                  {categories.map((c) => (
                    <button key={c} className="pill" onClick={() => setCatFilter(c)}
                      style={{ padding: ".3rem .7rem", borderRadius: 99, fontSize: ".75rem", background: catFilter === c ? C.accent : "#E8D5B7", color: catFilter === c ? "white" : C.primaryMid, fontWeight: catFilter === c ? 600 : 400 }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: ".6rem" }}>
                {filteredMenu.map((item) => {
                  const inCart = cart.find((c) => c.id === item.id);
                  return (
                    <div key={item.id} className="menu-tile card" onClick={() => addToCart(item)}
                      style={{ padding: ".85rem .7rem", position: "relative", background: inCart ? "#FFF3DC" : C.surface, border: `1px solid ${inCart ? C.accent : C.borderLight}` }}>
                      {inCart && (
                        <span style={{ position: "absolute", top: 6, right: 6, background: C.accent, color: "white", borderRadius: 99, fontSize: ".62rem", fontWeight: 700, padding: "1px 6px" }}>{inCart.qty}</span>
                      )}
                      <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: ".4rem" }}>{item.icon}</div>
                      <div style={{ fontSize: ".78rem", fontWeight: 600, color: C.text, lineHeight: 1.3, marginBottom: ".25rem", textAlign: "center" }}>{item.name}</div>
                      <div style={{ fontSize: ".72rem", color: C.accent, fontWeight: 700, textAlign: "center" }}>{fmtRp(item.price)}</div>
                      <div style={{ fontSize: ".62rem", color: C.textMuted, textAlign: "center" }}>{item.category}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!isMobile && <CartPanel />}

            {isMobile && cartQty > 0 && (
              <button className="btn" onClick={() => setShowCart(true)}
                style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", background: C.accent, color: "white", borderRadius: 99, padding: ".65rem 1.2rem", fontFamily: "'Playfair Display',serif", fontSize: ".9rem", fontWeight: 700, zIndex: 90, boxShadow: "0 4px 20px rgba(200,134,10,.45)", display: "flex", alignItems: "center", gap: ".5rem" }}>
                🧾 Keranjang · {cartQty}
                <span style={{ fontWeight: 400, fontSize: ".78rem" }}>{fmtRp(cartTotal)}</span>
              </button>
            )}
          </div>
        )}

        {/* TAB MENU */}
        {tab === "menu" && authUser.role === "owner" && (
          <div className="no-print">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: C.primary }}>📋 Manajemen Menu</div>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button className="btn" onClick={resetDatabase}
                  style={{ background: C.red, color: "white", borderRadius: 9, padding: ".48rem 1rem", fontSize: ".82rem", display: "flex", alignItems: "center", gap: ".4rem" }}>
                  🔄 Reset Menu Joglo
                </button>
                <button className="btn" onClick={() => openMenuEdit(null)}
                  style={{ background: C.accent, color: "white", borderRadius: 9, padding: ".48rem 1rem", fontSize: ".82rem", display: "flex", alignItems: "center", gap: ".4rem" }}>
                  + Tambah Menu
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gap: ".55rem" }}>
              {menu.map((item) => (
                <div key={item.id} className="card" style={{ padding: ".8rem 1rem", display: "flex", alignItems: "center", gap: ".75rem" }}>
                  <span style={{ fontSize: "1.7rem" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: ".88rem", color: C.text }}>{item.name}</div>
                    <div style={{ display: "flex", gap: ".5rem", marginTop: ".2rem", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: ".7rem", background: "#F0E0C0", color: C.primaryMid, borderRadius: 99, padding: "1px 8px" }}>{item.category}</span>
                      <span style={{ fontSize: ".8rem", color: C.accent, fontWeight: 700 }}>{fmtRp(item.price)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: ".4rem" }}>
                    <button className="btn" onClick={() => openMenuEdit(item)}
                      style={{ padding: ".38rem .65rem", background: C.blueBg, color: C.blue, borderRadius: 7, fontSize: ".75rem" }}>✏️ Edit</button>
                    <button className="btn" onClick={() => setConfirmDel({ type: "menu", id: item.id, name: item.name })}
                      style={{ padding: ".38rem .65rem", background: C.redBg, color: C.red, borderRadius: 7, fontSize: ".75rem" }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB LAPORAN */}
        {tab === "laporan" && authUser.role === "owner" && (
          <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            <div className="card" style={{ padding: "1rem", background: C.surfaceAlt }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: ".9rem", color: C.primary, fontWeight: 600 }}>Filter Laporan:</span>
                  <input type="date" className="inp" style={{ width: "auto", padding: ".4rem .6rem" }} value={repStart} onChange={(e) => setRepStart(e.target.value)} />
                  <span style={{ fontSize: ".8rem", color: C.textLight }}>s.d</span>
                  <input type="date" className="inp" style={{ width: "auto", padding: ".4rem .6rem" }} value={repEnd} onChange={(e) => setRepEnd(e.target.value)} />
                  {(repStart || repEnd) && (
                    <button className="btn" onClick={() => { setRepStart(""); setRepEnd(""); }} style={{ fontSize: ".75rem", padding: ".4rem .6rem", background: C.redBg, color: C.red, borderRadius: 7 }}>Clear</button>
                  )}
                </div>
                <button className="btn" onClick={exportToCSV}
                  style={{ background: C.green, color: "white", padding: ".5rem 1rem", borderRadius: 8, fontSize: ".8rem", fontWeight: 700, display: "flex", gap: ".4rem", alignItems: "center" }}>
                  📥 Download Data (CSV)
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: ".75rem" }}>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: ".4rem" }}>💰</div>
                <div style={{ fontSize: ".7rem", color: C.textLight, marginBottom: ".15rem" }}>Total Pendapatan (Sesuai Filter)</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: C.accent }}>{fmtRp(totalFilteredRev)}</div>
                <div style={{ fontSize: ".7rem", color: C.textMuted, marginTop: ".2rem" }}>{filteredTxns.length} transaksi</div>
              </div>

              <div className="card" style={{ padding: "1.25rem", gridColumn: "span 2" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: ".95rem", color: C.primary, marginBottom: ".75rem" }}>🧾 Rekap Metode Pembayaran</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: ".75rem", color: C.textLight }}>💵 Uang Tunai</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: C.green }}>{fmtRp(breakdown.Tunai)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: C.textLight }}>📱 QRIS (Transfer)</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: C.blue }}>{fmtRp(breakdown.QRIS)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: C.textLight }}>💳 Kartu EDC</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: C.purple }}>{fmtRp(breakdown.Kartu)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1.2fr", gap: "1rem" }}>
              
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: ".9rem", color: C.primary, marginBottom: "1rem" }}>📈 Grafik Omzet 7 Hari Terakhir</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="hari" tick={{ fontSize: 10, fill: C.textLight, fontFamily: "'Source Serif 4',serif" }} />
                    <YAxis tick={{ fontSize: 9, fill: C.textLight }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v) => [fmtRp(v), "Pendapatan"]} contentStyle={{ background: C.surface, borderRadius: 8, fontSize: ".78rem" }} />
                    <Bar dataKey="pendapatan" fill={C.accent} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: ".9rem", color: C.primary, marginBottom: ".75rem" }}>🏆 Top 5 Menu Terlaris</div>
                {bestSellers.length === 0 ? (
                   <div style={{ color: C.textMuted, fontSize: ".8rem", textAlign: "center", padding: "1rem" }}>Belum ada data penjualan.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                    {bestSellers.map((item, idx) => (
                      <div key={item.name} style={{ display: "flex", alignItems: "center", gap: ".6rem", paddingBottom: ".4rem", borderBottom: `1px dashed ${C.borderLight}` }}>
                        <span style={{ fontSize: "1.1rem", background: "#FFF3DC", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : item.icon}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: ".8rem", fontWeight: 600, color: C.text }}>{item.name}</div>
                          <div style={{ fontSize: ".7rem", color: C.accent }}>{fmtRp(item.rev)}</div>
                        </div>
                        <div style={{ fontSize: ".85rem", fontWeight: 700, color: C.green }}>{item.qty} porsi</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: ".9rem", color: C.primary, marginBottom: ".75rem" }}>🧾 Riwayat Transaksi (Sesuai Filter)</div>
              {filteredTxns.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textMuted, padding: "1.5rem", fontSize: ".85rem" }}>Belum ada transaksi di rentang tanggal ini.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: ".45rem" }}>
                  {filteredTxns.slice(0, 30).map((tx) => {
                    const mCol = { Tunai: [C.greenBg, C.green], QRIS: [C.blueBg, C.blue], Kartu: [C.purpleBg, C.purple] }[tx.method] || [C.surfaceAlt, C.textLight];
                    return (
                      <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".55rem .7rem", background: C.surfaceAlt, borderRadius: 9 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: ".8rem", color: C.text }}>{tx.no}</div>
                          <div style={{ fontSize: ".7rem", color: C.textLight }}>{fmtDate(tx.date)}</div>
                          <div style={{ fontSize: ".68rem", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {Array.isArray(tx.items) ? tx.items.map((i) => i.name).join(", ") : "Pesanan tidak diketahui"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, fontSize: ".88rem", color: C.accent }}>{fmtRp(tx.total)}</div>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: ".3rem", marginTop: ".2rem", alignItems: "center" }}>
                             <span style={{ fontSize: ".62rem", background: mCol[0], color: mCol[1], borderRadius: 99, padding: "1px 7px" }}>{tx.method || "Tunai"}</span>
                             <span style={{ fontSize: ".62rem", color: C.primaryMid }}>Kasir: {tx.cashier || "-"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB STOK */}
        {tab === "stok" && (
          <div className="no-print">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: C.primary }}>📦 Informasi Stok Bahan</div>
              {authUser.role === "owner" && (
                <button className="btn" onClick={() => openStockEdit(null)}
                  style={{ background: C.accent, color: "white", borderRadius: 9, padding: ".48rem 1rem", fontSize: ".82rem" }}>
                  + Tambah Bahan
                </button>
              )}
            </div>

            {lowStock.length > 0 && (
              <div style={{ background: C.redBg, border: `1.5px solid #F1948A`, borderRadius: 10, padding: ".7rem .9rem", marginBottom: ".75rem", display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: ".83rem", color: C.red }}>Stok Menipis — segera laporkan!</div>
                  <div style={{ fontSize: ".78rem", color: C.red, marginTop: ".1rem" }}>{lowStock.map((s) => s.name).join(" · ")}</div>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: ".55rem" }}>
              {stock.map((item) => {
                const isLow = (item.quantity || 0) <= (item.minQty || 0);
                const pct = Math.min(100, Math.round(((item.quantity || 0) / Math.max((item.minQty || 1) * 3, (item.quantity || 1))) * 100));
                return (
                  <div key={item.id} className="card" style={{ padding: ".85rem 1rem", border: `1px solid ${isLow ? "#F1948A" : C.borderLight}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: ".88rem", color: C.text }}>{item.name}</span>
                          {isLow && <span style={{ fontSize: ".62rem", background: C.redBg, color: C.red, borderRadius: 99, padding: "1px 7px" }}>⚠️ Menipis</span>}
                        </div>
                        <div style={{ display: "flex", gap: "1rem", marginTop: ".2rem", alignItems: "center" }}>
                          <span style={{ fontSize: ".85rem", fontWeight: 700, color: isLow ? C.red : C.green }}>{item.quantity || 0} {item.unit}</span>
                          <span style={{ fontSize: ".7rem", color: C.textLight }}>Min: {item.minQty || 0} {item.unit}</span>
                        </div>
                        <div style={{ marginTop: ".45rem", height: 5, background: "#E8D5B7", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: isLow ? C.red : C.green, borderRadius: 99, transition: "width .3s" }} />
                        </div>
                      </div>
                      
                      {authUser.role === "owner" && (
                        <div style={{ display: "flex", gap: ".4rem" }}>
                          <button className="btn" onClick={() => openStockEdit(item)}
                            style={{ padding: ".38rem .65rem", background: C.blueBg, color: C.blue, borderRadius: 7, fontSize: ".75rem" }}>✏️ Edit</button>
                          <button className="btn" onClick={() => setConfirmDel({ type: "stock", id: item.id, name: item.name })}
                            style={{ padding: ".38rem .65rem", background: C.redBg, color: C.red, borderRadius: 7, fontSize: ".75rem" }}>🗑️</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ═══ MODALS & POP-UPS ═══ */}
      {isMobile && showCart && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowCart(false)}>
          <div style={{ background: C.surface, borderRadius: 18, padding: "1.25rem", width: "100%", maxWidth: 400, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem" }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", color: C.primary }}>🧾 Pesanan</span>
              <button className="btn" onClick={() => setShowCart(false)} style={{ background: "#F0E0C0", color: C.primaryMid, borderRadius: 99, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>×</button>
            </div>
            <CartPanel asModal />
          </div>
        </div>
      )}

      {showPay && (
        <div className="overlay no-print" onClick={(e) => e.target === e.currentTarget && setShowPay(false)}>
          <div className="modal">
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: C.primary, marginBottom: "1rem" }}>💳 Pembayaran</div>

            <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: ".75rem", marginBottom: "1rem", fontSize: ".8rem" }}>
              {cart.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".2rem", color: C.textMid }}>
                  <span>{c.icon} {c.name} ×{c.qty}</span>
                  <span style={{ fontWeight: 600 }}>{fmtRp(c.price * c.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px dashed ${C.border}`, marginTop: ".5rem", paddingTop: ".5rem", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span style={{ fontFamily: "'Playfair Display',serif" }}>Total</span>
                <span style={{ color: C.accent, fontSize: "1rem" }}>{fmtRp(cartTotal)}</span>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: ".8rem", color: C.primaryMid, marginBottom: ".45rem", fontWeight: 600 }}>Metode Pembayaran</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".4rem" }}>
                {[["Tunai", "💵"], ["QRIS", "📱"], ["Kartu", "💳"]].map(([m, ic]) => (
                  <button key={m} className="btn" onClick={() => setPayMethod(m)}
                    style={{ padding: ".55rem", border: `2px solid ${payMethod === m ? C.accent : C.border}`, borderRadius: 9, background: payMethod === m ? "#FFF3DC" : "white", color: payMethod === m ? C.accent : C.primaryMid, fontSize: ".8rem", fontWeight: payMethod === m ? 600 : 400 }}>
                    {ic} {m}
                  </button>
                ))}
              </div>
            </div>

            {payMethod === "Tunai" && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: ".8rem", color: C.primaryMid, marginBottom: ".4rem", fontWeight: 600 }}>Uang Diterima</div>
                <input className="inp" type="number" placeholder="Masukkan jumlah uang" value={cashIn} onChange={(e) => setCashIn(e.target.value)} />
                {cashIn && Number(cashIn) >= cartTotal && (
                  <div style={{ marginTop: ".4rem", fontSize: ".85rem", color: C.green, fontWeight: 600 }}>
                    Kembalian: {fmtRp(Number(cashIn) - cartTotal)}
                  </div>
                )}
                <div style={{ display: "flex", gap: ".35rem", marginTop: ".5rem", flexWrap: "wrap" }}>
                  {[...new Set([cartTotal, 50000, 100000, 200000])].sort((a, b) => a - b).map((v) => (
                    <button key={v} className="btn" onClick={() => setCashIn(String(v))}
                      style={{ padding: ".28rem .55rem", background: "#F0E0C0", color: C.primaryMid, borderRadius: 7, fontSize: ".72rem" }}>
                      {v === cartTotal ? "Pas · " : ""}{fmtRp(v)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {payMethod !== "Tunai" && (
              <div style={{ background: C.blueBg, borderRadius: 9, padding: ".65rem", marginBottom: "1rem", fontSize: ".8rem", color: C.blue, textAlign: "center" }}>
                {payMethod === "QRIS" ? "📱 Tunjukkan QR Code kepada pelanggan" : "💳 Proses kartu di mesin EDC"}
              </div>
            )}

            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn" onClick={() => setShowPay(false)}
                style={{ flex: 1, padding: ".65rem", background: "#F0E0C0", color: C.primaryMid, borderRadius: 10 }}>Batal</button>
              <button className="btn" onClick={doPayment} disabled={!payOk}
                style={{ flex: 2, padding: ".65rem", background: payOk ? C.green : "#B0C4B0", color: "white", borderRadius: 10, fontFamily: "'Playfair Display',serif", fontSize: ".9rem", fontWeight: 700, cursor: payOk ? "pointer" : "not-allowed" }}>
                ✅ Proses Bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <>
          <div className="overlay no-print" onClick={(e) => e.target === e.currentTarget && setReceipt(null)}>
            <div className="modal" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: ".5rem" }}>✅</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.15rem", color: C.green, marginBottom: ".25rem" }}>Pembayaran Berhasil!</div>
              <div style={{ fontSize: ".75rem", color: C.textMuted, marginBottom: "1rem" }}>{receipt.no} · {fmtDate(receipt.date)}</div>

              <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: ".75rem", marginBottom: "1rem", textAlign: "left" }}>
                {receipt.items.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".8rem", marginBottom: ".2rem", color: C.textMid }}>
                    <span>{c.icon} {c.name} ×{c.qty}</span>
                    <span>{fmtRp(c.price * c.qty)}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px dashed ${C.border}`, marginTop: ".5rem", paddingTop: ".5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: ".88rem" }}>
                    <span>Total</span><span style={{ color: C.accent }}>{fmtRp(receipt.total)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", color: C.textLight, marginTop: ".2rem" }}>
                    <span>Bayar ({receipt.method})</span><span>{fmtRp(receipt.cash)}</span>
                  </div>
                  {receipt.method === "Tunai" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", color: C.green, fontWeight: 600 }}>
                      <span>Kembalian</span><span>{fmtRp(receipt.change)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ fontSize: ".75rem", color: C.textMuted, marginBottom: "1rem", fontStyle: "italic" }}>
                Terima kasih telah berkunjung ke Resto Joglo Alberthin 🏛️
              </div>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button className="btn" onClick={() => setReceipt(null)}
                  style={{ flex: 1, padding: ".65rem", background: "#F0E0C0", color: C.primaryMid, borderRadius: 10, fontWeight: 600 }}>
                  Tutup
                </button>
                <button className="btn" onClick={handlePrintAndClose}
                  style={{ flex: 2, padding: ".65rem", background: C.accent, color: "white", borderRadius: 10, fontFamily: "'Playfair Display',serif", fontSize: ".9rem", fontWeight: 700 }}>
                  🖨️ Cetak & Tutup
                </button>
              </div>
            </div>
          </div>

          <div className="print-only">
            <div style={{ textAlign: "center" }}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Resto Joglo Alberthin</h2>
              <p style={{ margin: 0, fontSize: "12px" }}>Jl. Kenangan No. 1, Yogyakarta</p>
            </div>
            <div className="garis-putus"></div>
            <p style={{ margin: 0 }}>
              Waktu: {fmtDate(receipt.date)}<br />
              No. Inv: {receipt.no}<br />
              Kasir: {authUser.username}
            </p>
            <div className="garis-putus"></div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", paddingBottom: "5px" }}>Item</th>
                  <th style={{ textAlign: "right", paddingBottom: "5px" }}>Qty</th>
                  <th style={{ textAlign: "right", paddingBottom: "5px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: "4px 0" }}>{c.name}</td>
                    <td style={{ textAlign: "right", padding: "4px 0" }}>{c.qty}</td>
                    <td style={{ textAlign: "right", padding: "4px 0" }}>{fmtRp(c.price * c.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="garis-putus"></div>
            <div className="print-flex" style={{ fontWeight: "bold", fontSize: "16px" }}>
              <span>TOTAL BAYAR:</span>
              <span>{fmtRp(receipt.total)}</span>
            </div>
            <div className="garis-putus"></div>
            <div className="print-flex">
              <span>{receipt.method}:</span>
              <span>{fmtRp(receipt.cash)}</span>
            </div>
            {receipt.method === "Tunai" && (
              <div className="print-flex">
                <span>Kembalian:</span>
                <span>{fmtRp(receipt.change)}</span>
              </div>
            )}
            <p style={{ textAlign: "center", marginTop: "15px" }}>
              Harga sudah termasuk Pajak<br />
              Terima Kasih!
            </p>
          </div>
        </>
      )}

      {/* Menu Edit Modal */}
      {menuModal && authUser.role === "owner" && (
        <div className="overlay no-print" onClick={(e) => e.target === e.currentTarget && setMenuModal(null)}>
          <div className="modal">
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", color: C.primary, marginBottom: "1rem" }}>
              {menuModal === "new" ? "+ Tambah Menu Baru" : "✏️ Edit Menu"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              <div>
                <label style={{ fontSize: ".78rem", color: C.primaryMid, fontWeight: 600, display: "block", marginBottom: ".3rem" }}>Nama Menu *</label>
                <input className="inp" placeholder="Contoh: Nasi Goreng Spesial" value={menuForm.name || ""} onChange={(e) => setMenuForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
                <div>
                  <label style={{ fontSize: ".78rem", color: C.primaryMid, fontWeight: 600, display: "block", marginBottom: ".3rem" }}>Kategori</label>
                  <input className="inp" placeholder="Nasi / Lauk / Minuman" value={menuForm.category || ""} onChange={(e) => setMenuForm((p) => ({ ...p, category: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: ".78rem", color: C.primaryMid, fontWeight: 600, display: "block", marginBottom: ".3rem" }}>Ikon Emoji</label>
                  <input className="inp" placeholder="🍽️" value={menuForm.icon || ""} onChange={(e) => setMenuForm((p) => ({ ...p, icon: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: ".78rem", color: C.primaryMid, fontWeight: 600, display: "block", marginBottom: ".3rem" }}>Harga (Rp) *</label>
                <input className="inp" type="number" placeholder="25000" value={menuForm.price || ""} onChange={(e) => setMenuForm((p) => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: ".5rem", marginTop: "1.25rem" }}>
              <button className="btn" onClick={() => setMenuModal(null)} style={{ flex: 1, padding: ".6rem", background: "#F0E0C0", color: C.primaryMid, borderRadius: 10 }}>Batal</button>
              <button className="btn" onClick={saveMenu} style={{ flex: 2, padding: ".6rem", background: C.accent, color: "white", borderRadius: 10, fontFamily: "'Playfair Display',serif", fontSize: ".88rem", fontWeight: 700 }}>
                {menuModal === "new" ? "+ Tambahkan" : "✅ Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Edit Modal */}
      {stockModal && authUser.role === "owner" && (
        <div className="overlay no-print" onClick={(e) => e.target === e.currentTarget && setStockModal(null)}>
          <div className="modal">
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", color: C.primary, marginBottom: "1rem" }}>
              {stockModal === "new" ? "+ Tambah Bahan Baru" : "✏️ Edit Stok"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              <div>
                <label style={{ fontSize: ".78rem", color: C.primaryMid, fontWeight: 600, display: "block", marginBottom: ".3rem" }}>Nama Bahan *</label>
                <input className="inp" placeholder="Beras, Ayam, dll." value={stockForm.name || ""} onChange={(e) => setStockForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
                <div>
                  <label style={{ fontSize: ".78rem", color: C.primaryMid, fontWeight: 600, display: "block", marginBottom: ".3rem" }}>Satuan</label>
                  <input className="inp" placeholder="kg / liter / pack" value={stockForm.unit || ""} onChange={(e) => setStockForm((p) => ({ ...p, unit: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: ".78rem", color: C.primaryMid, fontWeight: 600, display: "block", marginBottom: ".3rem" }}>Jumlah Stok</label>
                  <input className="inp" type="number" placeholder="50" value={stockForm.quantity || ""} onChange={(e) => setStockForm((p) => ({ ...p, quantity: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: ".78rem", color: C.primaryMid, fontWeight: 600, display: "block", marginBottom: ".3rem" }}>Stok Minimum (batas alert)</label>
                <input className="inp" type="number" placeholder="10" value={stockForm.minQty || ""} onChange={(e) => setStockForm((p) => ({ ...p, minQty: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: ".5rem", marginTop: "1.25rem" }}>
              <button className="btn" onClick={() => setStockModal(null)} style={{ flex: 1, padding: ".6rem", background: "#F0E0C0", color: C.primaryMid, borderRadius: 10 }}>Batal</button>
              <button className="btn" onClick={saveStock} style={{ flex: 2, padding: ".6rem", background: C.accent, color: "white", borderRadius: 10, fontFamily: "'Playfair Display',serif", fontSize: ".88rem", fontWeight: 700 }}>
                {stockModal === "new" ? "+ Tambahkan" : "✅ Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <div className="overlay no-print" onClick={(e) => e.target === e.currentTarget && setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🗑️</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", color: C.primary, marginBottom: ".5rem" }}>Hapus data ini?</div>
            <div style={{ fontSize: ".85rem", color: C.textMid, marginBottom: "1.25rem" }}>
              <strong>{confirmDel.name}</strong> akan dihapus permanen.
            </div>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button className="btn" onClick={() => setConfirmDel(null)} style={{ flex: 1, padding: ".6rem", background: "#F0E0C0", color: C.primaryMid, borderRadius: 10 }}>Batal</button>
              <button className="btn" onClick={() => handleDelete(confirmDel.type, confirmDel.id)}
                style={{ flex: 1, padding: ".6rem", background: C.red, color: "white", borderRadius: 10, fontFamily: "'Playfair Display',serif", fontWeight: 700 }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}