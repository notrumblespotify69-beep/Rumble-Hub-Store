import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Megaphone, Save } from 'lucide-react';
import { db } from '../../firebase';
import SEO from '../../components/SEO';

export default function AdminAnnouncements() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const snap = await getDoc(doc(db, 'settings', 'announcement'));
      if (snap.exists()) {
        const data = snap.data() as any;
        setEnabled(Boolean(data.enabled));
        setMessage(data.message || '');
        setLinkText(data.linkText || '');
        setLinkUrl(data.linkUrl || '');
      }
    };
    fetchAnnouncement();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'announcement'), {
        enabled,
        message,
        linkText,
        linkUrl,
        updatedAt: Date.now()
      }, { merge: true });
      showToast('Announcement saved.');
    } catch (error) {
      console.error(error);
      showToast('Failed to save announcement.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 text-white pb-12">
      <SEO title="Announcements | Rumble Hub Admin" description="Manage storefront announcement banner." />
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg font-medium shadow-lg z-50 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-3">
          <Megaphone className="w-3.5 h-3.5" />
          Settings
        </div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-slate-400 mt-1">Show a small banner above the navbar for sales, updates, and maintenance notices.</p>
      </div>

      <div className="bg-[#161d2b] border border-[#222b3d] rounded-xl p-6 space-y-5">
        <label className="flex items-center justify-between rounded-lg border border-[#222b3d] bg-[#0f172a] px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-white">Banner Enabled</span>
            <span className="text-xs text-slate-500">Turn this off to hide the announcement everywhere.</span>
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            className="h-5 w-5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
          />
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="w-full bg-[#0f172a] border border-[#222b3d] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            placeholder="New update is live. Join our Discord for support."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Link Text</label>
            <input
              value={linkText}
              onChange={e => setLinkText(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#222b3d] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              placeholder="Learn more"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Link URL</label>
            <input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#222b3d] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              placeholder="https://discord.gg/..."
            />
          </div>
        </div>

        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-100">
          <span className="font-semibold">Preview:</span> {message || 'Your announcement message will appear here.'}
          {linkText && linkUrl && <span className="ml-2 underline">{linkText}</span>}
        </div>

        <div className="pt-4 border-t border-[#222b3d] flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}
