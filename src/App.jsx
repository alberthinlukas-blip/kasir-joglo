import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

// ... (Simpan bagian format fmt, fmtRp, fmtDate, DB_USERS, INIT_MENU, INIT_STOCK, C, dan styles seperti sebelumnya)

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
  const [loaded, setLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 680);
  const [confirmDel, setConfirmDel] = useState(null);

  // Jalur Sinkronisasi Penuh ke Firebase
  useEffect(() => {
    try { const r = localStorage.getItem("jg_auth"); if (r) setAuthUser(JSON.parse(r)); } catch {}
    setLoaded(true);

    const unsubTxns = onSnapshot(collection(db, "txns"), (snap) => setTxns(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => new Date(b.date) - new Date(a.date))));
    const unsubStock = onSnapshot(collection(db, "stock"), (snap) => setStock(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMenu = onSnapshot(collection(db, "menu"), (snap) => setMenu(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubTxns(); unsubStock(); unsubMenu(); };
  }, []);

  // Fungsi Simpan ke Cloud
  const saveMenu = async () => {
    if (!menuForm.name) return;
    if (menuModal === "new") await addDoc(collection(db, "menu"), { ...menuForm, price: Number(menuForm.price) });
    else await updateDoc(doc(db, "menu", menuForm.id), { ...menuForm, price: Number(menuForm.price) });
    setMenuModal(null);
  };

  const saveStock = async () => {
    if (!stockForm.name) return;
    if (stockModal === "new") await addDoc(collection(db, "stock"), { ...stockForm, quantity: Number(stockForm.quantity), minQty: Number(stockForm.minQty) });
    else await updateDoc(doc(db, "stock", stockForm.id), { ...stockForm, quantity: Number(stockForm.quantity), minQty: Number(stockForm.minQty) });
    setStockModal(null);
  };

  const handleDelete = async (type, id) => {
    await deleteDoc(doc(db, type, id));
    setConfirmDel(null);
  };

  const doPayment = async () => {
    await addDoc(collection(db, "txns"), {
      no: `INV${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
      method: payMethod,
      cashier: authUser.username
    });
    setCart([]); setShowPay(false);
  };

  // ... (Sisa fungsi lainnya sama, tinggal panggil fungsi delete/save baru di atas)
  // --- (Pastikan untuk tetap meng-update logic tombol di dalam JSX agar memanggil fungsi async di atas) ---
}