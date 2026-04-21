import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { ArrowUpRight, Copy, Link as LinkIcon, Wallet } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';

export default function Affiliate() {
  const { user, profile, loading } = useAuth();
  const [customCode, setCustomCode] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [commissionPercent, setCommissionPercent] = useState(20);
  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    if (!user || !profile) return;
    setCustomCode(profile.affiliateCode || profile.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || user.uid);

    const fetchData = async () => {
      const [historySnap, discountsSnap] = await Promise.all([
        getDocs(query(collection(db, 'affiliate_history'), where('affiliateId', '==', user.uid))),
        getDoc(doc(db, 'settings', 'discounts'))
      ]);
      const rows = historySnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      rows.sort((a, b) => b.date - a.date);
      setHistory(rows);
      if (discountsSnap.exists()) {
        setCommissionPercent(Number((discountsSnap.data() as any).affiliateCommissionPercent ?? 20));
      }
    };
    fetchData();
  }, [user?.uid, profile?.affiliateCode]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading...</div>;
  if (!user || !profile) return <Navigate to="/" replace />;

  const affiliateLink = `${window.location.origin}/?a=${customCode}`;
  const totalEarned = history.reduce((sum, item) => sum + Number(item.earned || 0), 0);
  const totalSales = history.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(affiliateLink);
    showToast('Affiliate link copied.');
  };

  const handleSave = async () => {
    if (!customCode.trim()) return showToast('Code cannot be empty.');
    const existing = await getDocs(query(collection(db, 'users'), where('affiliateCode', '==', customCode)));
    if (!existing.empty && existing.docs[0].id !== user.uid) {
      showToast('This code is already taken.');
      return;
    }
    await updateDoc(doc(db, 'users', user.uid), { affiliateCode: customCode });
    showToast('Affiliate code saved.');
  };

  return (
    <div className="w-full min-h-screen">
      <SEO title="Affiliate | Rumble Hub" description="Track affiliate rewards and share your Rumble Hub link." />
      <Navbar />
      {toast && <div className="fixed bottom-4 right-4 z-[100] rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-xl">{toast}</div>}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-3">
            <LinkIcon className="w-3.5 h-3.5" />
            Affiliate Panel
          </div>
          <h1 className="text-3xl font-bold text-white">Your Affiliate Dashboard</h1>
          <p className="mt-2 text-zinc-400">Share your link, track referred sales, and receive rewards directly to your balance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-zinc-800 bg-[#11141D] p-6">
            <div className="text-sm text-zinc-400">Commission</div>
            <div className="mt-2 text-3xl font-bold text-white">{commissionPercent}%</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#11141D] p-6">
            <div className="text-sm text-zinc-400">Total Earned</div>
            <div className="mt-2 text-3xl font-bold text-emerald-400">${totalEarned.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#11141D] p-6">
            <div className="text-sm text-zinc-400">Referred Sales</div>
            <div className="mt-2 text-3xl font-bold text-white">${totalSales.toFixed(2)}</div>
          </div>
        </div>

        <section className="rounded-xl border border-zinc-800 bg-[#11141D] p-6 mb-6">
          <div className="text-sm font-semibold text-white mb-3">Your Link</div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 break-all">
              {window.location.origin}/?a=
              <input
                value={customCode}
                onChange={e => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                className="bg-transparent text-white outline-none"
              />
            </div>
            <button onClick={handleSave} className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Save</button>
            <button onClick={handleCopy} className="rounded-lg border border-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 flex items-center justify-center gap-2">
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-[#11141D] overflow-hidden">
          <div className="border-b border-zinc-800 p-5 flex items-center gap-2 font-semibold text-white">
            <Wallet className="w-4 h-4 text-indigo-400" />
            Reward History
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No referred purchases yet.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {history.map(item => (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{item.referredUserEmail || 'Customer'}</div>
                    <div className="text-xs text-zinc-500">{new Date(item.date).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-zinc-400">Order ${Number(item.amount || 0).toFixed(2)}</div>
                    <div className="font-bold text-emerald-400">+${Number(item.earned || 0).toFixed(2)}</div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
