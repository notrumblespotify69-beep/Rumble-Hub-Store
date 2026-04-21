import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { BookOpen, Check, Image as ImageIcon, Search, Save, Trash2 } from 'lucide-react';
import { db } from '../../firebase';
import SEO from '../../components/SEO';
import ImageCropper from '../../components/ImageCropper';

const defaultInstructionImage = { url: '', width: 70, x: 50, y: 0 };

export default function AdminInstructions() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [instructionImage, setInstructionImage] = useState(defaultInstructionImage);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const selectedProduct = products.find(product => product.id === selectedId);
  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(product => product.title?.toLowerCase().includes(needle));
  }, [products, search]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, 'products'));
      const list: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(list);
      if (list[0]) {
        setSelectedId(list[0].id);
        setInstructions(list[0].instructions || '');
        setInstructionImage({ ...defaultInstructionImage, ...(list[0].instructionImage || {}) });
      }
    };
    fetchProducts();
  }, []);

  const handleSelectProduct = (product: any) => {
    setSelectedId(product.id);
    setInstructions(product.instructions || '');
    setInstructionImage({ ...defaultInstructionImage, ...(product.instructionImage || {}) });
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        instructions,
        instructionImage,
        updatedAt: Date.now()
      });
      setProducts(products.map(product => (
        product.id === selectedProduct.id ? { ...product, instructions, instructionImage } : product
      )));
      showToast('Instructions saved.');
    } catch (error) {
      console.error(error);
      showToast('Failed to save instructions.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <SEO title="Product Instructions | Rumble Hub Admin" description="Manage delivery instructions for every product." />
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg font-medium shadow-lg z-50 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Products
          </div>
          <h2 className="text-2xl font-bold text-white">Instructions</h2>
          <p className="text-sm text-slate-400 mt-1">Pick a product and write the delivery guide shown after purchase.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!selectedProduct || isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSaving ? <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : <Save className="w-4 h-4" />}
          Save Instructions
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 h-fit">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Select Product</label>
          <div className="relative mt-3 mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product"
              className="w-full bg-[#0f172a] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredProducts.map(product => {
              const isSelected = product.id === selectedId;
              return (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 bg-[#0f172a] hover:border-slate-700'
                  }`}
                >
                  {product.image && <img src={product.image} alt={product.title} className="w-12 h-12 rounded-lg object-cover bg-slate-900" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{product.title}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      {product.instructions ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Instructions added
                        </>
                      ) : (
                        'No instructions yet'
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredProducts.length === 0 && <div className="text-sm text-slate-500 italic">No products found.</div>}
          </div>
        </aside>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-white">Delivery Instructions</label>
              {selectedProduct && <span className="text-xs text-slate-500">{selectedProduct.title}</span>}
            </div>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="min-h-[520px] w-full resize-y rounded-lg border border-slate-800 bg-[#0f172a] p-4 font-mono text-sm text-white outline-none transition-colors focus:border-indigo-500"
              placeholder="Setup guide, Discord steps, redemption notes, links..."
            />
            <p className="mt-3 text-xs text-slate-500">Line breaks are preserved exactly as written. This text is also included in the downloadable .txt file.</p>

            <div className="mt-6 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  Instruction Image
                </div>
                {instructionImage.url && (
                  <button
                    onClick={() => setInstructionImage(defaultInstructionImage)}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <ImageCropper
                currentImage={instructionImage.url}
                onImageCropped={url => setInstructionImage(current => ({ ...current, url }))}
                aspectRatio={16 / 9}
              />
              {instructionImage.url && (
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <label className="text-xs font-medium text-slate-400">
                    Size: {instructionImage.width}%
                    <input
                      type="range"
                      min="25"
                      max="100"
                      value={instructionImage.width}
                      onChange={e => setInstructionImage(current => ({ ...current, width: Number(e.target.value) }))}
                      className="mt-2 w-full accent-indigo-500"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-400">
                    Horizontal Position: {instructionImage.x}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={instructionImage.x}
                      onChange={e => setInstructionImage(current => ({ ...current, x: Number(e.target.value) }))}
                      className="mt-2 w-full accent-indigo-500"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-400">
                    Top Spacing: {instructionImage.y}px
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={instructionImage.y}
                      onChange={e => setInstructionImage(current => ({ ...current, y: Number(e.target.value) }))}
                      className="mt-2 w-full accent-indigo-500"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5">
            <div className="mb-3 text-sm font-semibold text-white">Customer Preview</div>
            <div className="min-h-[520px] rounded-lg border border-slate-800 bg-[#0f172a] p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-4">Instructions</div>
              <div className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-300">
                {instructions || 'No special instructions were added for this product.'}
              </div>
              {instructionImage.url && (
                <div
                  className="relative mt-5 min-h-[120px]"
                  style={{ paddingTop: `${instructionImage.y}px` }}
                >
                  <img
                    src={instructionImage.url}
                    alt="Instruction"
                    className="cursor-move rounded-lg border border-slate-800 object-contain"
                    onPointerMove={e => {
                      if (e.buttons !== 1) return;
                      const parent = e.currentTarget.parentElement;
                      if (!parent) return;
                      const rect = parent.getBoundingClientRect();
                      const nextX = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
                      const nextY = Math.min(80, Math.max(0, e.clientY - rect.top));
                      setInstructionImage(current => ({ ...current, x: Math.round(nextX), y: Math.round(nextY) }));
                    }}
                    onPointerDown={e => e.currentTarget.setPointerCapture(e.pointerId)}
                    style={{
                      width: `${instructionImage.width}%`,
                      marginLeft: `${instructionImage.x}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
