import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, Image as ImageIcon, Loader2, ShieldCheck, Upload, X, ZoomIn } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getPortfolioItems, resolveAssetUrl, uploadPortfolioItem } from '../lib/api.js';

const categories = ['Photography', 'Video Edit', 'Direction', 'Story Writing', 'Design', 'Music', 'Theatre'];
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];

export default function PortfolioUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState('idle');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedItem, setUploadedItem] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [error, setError] = useState('');
  const [portfolioError, setPortfolioError] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: categories[0],
    description: '',
    tags: '',
  });

  useEffect(() => {
    let active = true;
    setIsPortfolioLoading(true);
    setPortfolioError('');

    getPortfolioItems()
      .then((items) => {
        if (active) setPortfolio(items || []);
      })
      .catch((err) => {
        if (active) setPortfolioError(err.message || 'Could not load your uploaded work.');
      })
      .finally(() => {
        if (active) setIsPortfolioLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedWork) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedWork(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWork]);

  const previewUrl = useMemo(() => {
    if (selectedFile) return URL.createObjectURL(selectedFile);
    if (uploadedItem?.image_url) return resolveAssetUrl(uploadedItem.image_url);
    return '';
  }, [selectedFile, uploadedItem]);

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === 'dragenter' || event.type === 'dragover');
  };

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files?.[0]) handleFile(event.dataTransfer.files[0]);
  };

  const handleFile = (file) => {
    setError('');
    setUploadedItem(null);

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WEBP, or MP4 file.');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('File exceeds 500 MB limit.');
      return;
    }

    setSelectedFile(file);
    setForm((current) => ({
      ...current,
      title: current.title || file.name.replace(/\.[^/.]+$/, ''),
      category: file.type === 'video/mp4' ? 'Video Edit' : current.category,
    }));
    setUploadState('ready');
  };

  const submitUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Choose a file before uploading.');
      return;
    }

    setError('');
    setUploadState('uploading');

    try {
      const item = await uploadPortfolioItem({ ...form, file: selectedFile });
      setUploadedItem(item);
      setPortfolio((current) => [item, ...current.filter((work) => work.id !== item.id)]);
      setSelectedWork(item);
      setUploadState('complete');
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploadState('ready');
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setUploadedItem(null);
    setError('');
    setUploadState('idle');
    setForm({ title: '', category: categories[0], description: '', tags: '' });
  };

  const isVideo = selectedFile?.type === 'video/mp4' || uploadedItem?.image_url?.includes('.mp4');
  const selectedWorkUrl = selectedWork ? resolveAssetUrl(selectedWork.image_url) : '';
  const selectedWorkIsVideo = String(selectedWork?.image_url || '').includes('.mp4');

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="mb-2 font-display text-3xl font-bold text-slate-900 dark:text-white">Portfolio</h1>
        <p className="max-w-2xl text-slate-500 dark:text-slate-400">Your uploaded work appears first. Add new work below when you are ready to showcase more.</p>
      </div>

      <section className="rounded-[32px] border border-slate-100 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Your Uploaded Work</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Newest uploads stay at the top of your portfolio.</p>
          </div>
          <span className="text-sm font-bold text-slate-400">{portfolio.length} uploads</span>
        </div>

        {isPortfolioLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-8 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your work...
          </div>
        ) : portfolioError ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">{portfolioError}</div>
        ) : portfolio.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => {
              const itemUrl = resolveAssetUrl(item.image_url);
              const itemIsVideo = String(item.image_url || '').includes('.mp4');
              const isSelected = selectedWork?.id === item.id;

              return (
                <article
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedWork(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedWork(item);
                    }
                  }}
                  className={`group cursor-pointer overflow-hidden rounded-[24px] border bg-slate-50 text-left transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-violet-500/20 dark:bg-slate-950 ${
                    isSelected
                      ? 'border-violet-500 ring-4 ring-violet-500/20 dark:border-violet-400'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                    {itemIsVideo ? (
                      <motion.video layoutId={`portfolio-media-${item.id}`} src={itemUrl} muted className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <motion.img layoutId={`portfolio-media-${item.id}`} src={itemUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition-all duration-300 group-hover:bg-slate-950/30 group-hover:opacity-100">
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-800 soft-shadow dark:bg-slate-900 dark:text-white">
                        <ZoomIn className="h-4 w-4" />
                        View Work
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute left-3 top-3 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                        Highlighted
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="mt-1 text-xs font-semibold text-violet-600 dark:text-violet-300">{item.category}</p>
                      </div>
                      {item.verification_status === 'verified' || item.verification_id ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-500" />
                      ) : (
                        <ShieldCheck className="h-5 w-5 shrink-0 text-slate-300" />
                      )}
                    </div>
                    {item.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>}
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{item.views || 0} views</span>
                      <span>{item.verification_id || item.verification_status || 'pending'}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
            <ImageIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <h3 className="font-bold text-slate-900 dark:text-white">No uploaded work yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use the upload option below to add your first portfolio item.</p>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Upload Work</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Add images or MP4 videos to your public portfolio.</p>
        </div>

      <form onSubmit={submitUpload} className="grid gap-6 rounded-[40px] border border-slate-100 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1.1fr_0.9fr] md:p-8">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative min-h-[360px] overflow-hidden rounded-[32px] border-2 border-dashed transition-all duration-300 ${
            dragActive ? 'scale-[1.01] border-violet-600 bg-violet-50 dark:bg-violet-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
          }`}
        >
          {previewUrl ? (
            <div className="h-full">
              {isVideo ? (
                <video src={previewUrl} controls className="h-full min-h-[360px] w-full object-cover" />
              ) : (
                <img src={previewUrl} alt={form.title || 'Portfolio preview'} className="h-full min-h-[360px] w-full object-cover" />
              )}
              <label className="absolute bottom-4 right-4 cursor-pointer rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 soft-shadow hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                Change file
                <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" className="hidden" onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])} />
              </label>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-10 text-center">
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])} />
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-violet-600 soft-shadow dark:bg-slate-900">
                <Upload className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Drag and drop creative assets</h3>
              <p className="mb-6 text-sm text-slate-400">Supports JPEG, PNG, WEBP, and MP4 up to 500MB</p>
              <span className="rounded-2xl bg-violet-600 px-8 py-3 font-bold text-white soft-shadow">Choose from computer</span>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Work Details</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">These details appear in your public portfolio.</p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400">Title</span>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400">Category</span>
            <select name="category" value={form.category} onChange={handleChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400">Description</span>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400">Tags</span>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="cinema, portrait, editing" className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>

          {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

          {uploadState === 'complete' && (
            <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              Uploaded and verified. ID: {uploadedItem?.verification_id || 'TV-VERIFIED'}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={!selectedFile || uploadState === 'uploading'} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 font-bold text-white soft-shadow hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
              {uploadState === 'uploading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              {uploadState === 'uploading' ? 'Uploading...' : uploadState === 'complete' ? 'Upload Complete' : 'Upload Work'}
            </button>
            {(selectedFile || uploadedItem) && (
              <button type="button" onClick={reset} className="rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                Reset
              </button>
            )}
          </div>
        </div>
      </form>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><AlertCircle className="h-5 w-5" /></div>
          <div>
            <h4 className="mb-1 font-bold text-slate-900 dark:text-white">Originality Policy</h4>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">Only upload work you created or have permission to showcase.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600"><ImageIcon className="h-5 w-5" /></div>
          <div>
            <h4 className="mb-1 font-bold text-slate-900 dark:text-white">Quality Standards</h4>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">Use clear images or MP4 videos so recruiters can judge your work properly.</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedWork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
            onClick={() => setSelectedWork(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="grid max-h-[92vh] overflow-y-auto lg:grid-cols-[minmax(0,1.35fr)_390px] lg:items-start">
                <div className="overflow-hidden bg-slate-950 lg:self-start">
                  {selectedWorkIsVideo ? (
                    <motion.video layoutId={`portfolio-media-${selectedWork.id}`} src={selectedWorkUrl} controls autoPlay className="block max-h-[82vh] w-full object-contain" />
                  ) : (
                    <motion.img layoutId={`portfolio-media-${selectedWork.id}`} src={selectedWorkUrl} alt={selectedWork.title} className="block max-h-[82vh] w-full object-contain" />
                  )}
                </div>

              <aside className="flex flex-col gap-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                      <ShieldCheck className="h-4 w-4" />
                      Uploaded Work
                    </span>
                    <h2 className="mt-4 font-display text-2xl font-bold text-slate-900 dark:text-white">{selectedWork.title}</h2>
                    <p className="mt-1 text-sm font-semibold text-violet-600 dark:text-violet-300">{selectedWork.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedWork(null)}
                    className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    aria-label="Close work preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs font-bold uppercase text-slate-400">Views</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{selectedWork.views || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-teal-50 p-4 dark:bg-teal-950/30">
                    <p className="text-xs font-bold uppercase text-teal-500">Status</p>
                    <p className="mt-1 text-sm font-bold capitalize text-teal-700 dark:text-teal-300">{selectedWork.verification_id || selectedWork.verification_status || 'pending'}</p>
                  </div>
                </div>

                {selectedWork.description && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Description</p>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedWork.description}</p>
                  </div>
                )}

                {selectedWork.tags?.length ? (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedWork.tags.map((tag) => (
                        <span key={tag} className="rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-auto rounded-2xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900/60 dark:bg-violet-950/30">
                  <p className="text-sm font-bold text-violet-700 dark:text-violet-200">This item is highlighted from your uploaded portfolio.</p>
                  <p className="mt-1 text-xs leading-5 text-violet-500 dark:text-violet-300">Use this preview to check how the work, title, and details look before sharing your profile.</p>
                </div>
              </aside>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
