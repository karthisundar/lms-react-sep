import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Film, Link2, CheckCircle2, Upload, ExternalLink } from 'lucide-react';
import { videoService, sessionMasterService, bucketMasterService } from '@/services';
import type { Bucket, Session, Video, VideoCreateInput, VideoUpdateInput } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner } from '@/components/ui';
import { validateVideoFields } from '@/utils/formValidation';
import { buildVideoUrl } from '@/utils/videoUtils';

interface VideoFormData {
  videoRefId: string;
  title: string;
  filename: string;
  url: string;
  sessionId: string;
  bucketId: string;
}

const emptyForm: VideoFormData = {
  videoRefId: '',
  title: '',
  filename: '',
  url: '',
  sessionId: '',
  bucketId: '',
};

export default function AdminVideosPage() {
  const [rows, setRows] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<VideoFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load sessions and buckets for selection dropdowns and table lookup
  useEffect(() => {
    Promise.all([
      sessionMasterService.getAllSessions({ page: 1, pageSize: 200 }),
      bucketMasterService.getAllBuckets({ page: 1, pageSize: 200 }),
    ])
      .then(([sRes, bRes]) => {
        setSessions(sRes.row || sRes.items || []);
        setBuckets(bRes.row || bRes.items || []);
      })
      .catch(() => {});
  }, []);

  const getSessionName = (sessionId: string) => {
    if (!sessionId) return '—';
    const s = sessions.find((item) => item.sessionRefId === sessionId || item.id === sessionId);
    return s?.sessionName || s?.name || sessionId;
  };

  const getBucketName = (bucketId: string) => {
    if (!bucketId) return '—';
    const b = buckets.find(
      (item) => item.bucketRefId === bucketId || item.id === bucketId || String(item.bucketId) === bucketId
    );
    return b?.bucketName || b?.name || bucketId;
  };

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      setError(null);
      videoService
        .getAllVideos({ page: targetPage, pageSize, search: search || undefined })
        .then((res) => {
          const extractedRows = res.row || res.items || [];
          const extractedTotal = Number(res.totalItem ?? res.total ?? 0);
          const calculatedTotalPages = Math.max(1, Math.ceil(extractedTotal / pageSize));
          const extractedTotalPages = Number(res.totalPage ?? calculatedTotalPages);

          // Edge case: if current page is greater than totalPage and we have pages, navigate to totalPage
          if (targetPage > extractedTotalPages && extractedTotalPages > 0) {
            setPage(extractedTotalPages);
            return;
          }

          setRows(extractedRows);
          setTotal(extractedTotal);
          setTotalPages(extractedTotalPages);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load videos'))
        .finally(() => setLoading(false));
    },
    [page, pageSize, search]
  );

  useEffect(() => {
    const t = setTimeout(() => load(page), 250);
    return () => clearTimeout(t);
  }, [load, page]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    const defaultSessionId = sessions[0]?.sessionRefId || sessions[0]?.id || '';
    const defaultBucketId = buckets[0]?.bucketRefId || buckets[0]?.id || '';
    setForm({
      videoRefId: '',
      title: '',
      filename: '',
      url: '',
      sessionId: defaultSessionId,
      bucketId: defaultBucketId,
    });
    setFormError(null);
    setFieldErrors({});
    setUploadProgress(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const openEdit = (v: Video) => {
    setMode('edit');
    setEditing(v);
    const refId = v.videoRefId || v.id || '';
    setForm({
      videoRefId: refId,
      title: v.title || '',
      filename: v.filename || '',
      url: v.url || '',
      sessionId: v.sessionId || '',
      bucketId: v.bucketId || '',
    });
    setFormError(null);
    setFieldErrors({});
    setUploadProgress(null);
    setSuccessMessage(null);
    setModalOpen(true);

    // Call single record endpoint using videoRefId if available
    if (refId) {
      videoService
        .getVideo(refId)
        .then((fetched) => {
          if (fetched) {
            setForm({
              videoRefId: fetched.videoRefId || refId,
              title: fetched.title ?? v.title,
              filename: fetched.filename ?? v.filename,
              url: fetched.url ?? v.url,
              sessionId: fetched.sessionId ?? v.sessionId,
              bucketId: fetched.bucketId ?? v.bucketId,
            });
          }
        })
        .catch(() => {
          // Keep existing row values on failure
        });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, filename: 'Video file size cannot exceed 500MB.' }));
      return;
    }

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}…`);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const token = localStorage.getItem('access_token') || localStorage.getItem('cc_token') || '';
      const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3100').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/api/video/upload`, {
        method: 'POST',
        headers: token ? { Authorization: token } : {},
        body: formData,
      });

      const data = await res.json();
      const uploadedData = data?.response?.data || data?.data;
      if (!res.ok || !uploadedData) {
        throw new Error(data?.message || data?.response?.message || 'Video upload failed');
      }

      const relativeKey = uploadedData.relativeKey || uploadedData.fileName;
      const cleanFilename = uploadedData.fileName || file.name;

      setForm((prev) => ({
        ...prev,
        filename: cleanFilename,
        url: relativeKey,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));
      setFieldErrors((prev) => ({ ...prev, filename: '' }));
      setUploadProgress(`Uploaded: ${relativeKey}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors = validateVideoFields(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(errors.title || errors.filename || errors.sessionId || errors.bucketId || 'Please correct the highlighted errors.');
      return;
    }

    setSaving(true);
    try {
      const isEditMode = mode === 'edit' && Boolean(form.videoRefId || editing?.videoRefId);
      const targetRefId = isEditMode ? (form.videoRefId || editing?.videoRefId || '') : '';

      // Clean filename / relative key: ensure no full domain is stored for S3/CDN videos
      let cleanUrl = form.url.trim() || form.filename.trim();
      let cleanFilename = form.filename.trim();

      const isExternal = /youtube\.com|youtu\.be|drive\.google\.com|vimeo\.com/i.test(cleanUrl);
      if (!isExternal && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))) {
        try {
          const parsed = new URL(cleanUrl);
          cleanUrl = parsed.pathname.replace(/^\/+/, '');
          if (!cleanFilename || cleanFilename.startsWith('http')) {
            cleanFilename = cleanUrl.split('/').pop() || cleanUrl;
          }
        } catch {}
      }

      const payload: VideoCreateInput | VideoUpdateInput = {
        videoRefId: targetRefId,
        title: form.title.trim(),
        filename: cleanFilename,
        url: cleanUrl,
        sessionId: form.sessionId,
        bucketId: form.bucketId,
      };

      await videoService.createVideo(payload);

      if (isEditMode) {
        setSuccessMessage('Video updated successfully.');
      } else {
        setSuccessMessage('Video created successfully.');
      }

      setModalOpen(false);
      load(page);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetRefId = deleteTarget.videoRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete video: missing videoRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      // Delete API requires videoRefId in payload: { videoRefId }
      await videoService.deleteVideo({ videoRefId: targetRefId });
      setSuccessMessage('Video deleted successfully.');
      setDeleteTarget(null);

      // Edge case: If deleting the only item on current page (and page > 1), move to previous valid page
      if (rows.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        load(page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Video>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{v.title}</p>
            {v.videoRefId && (
              <p className="font-mono text-xs text-gray-400 dark:text-gray-500" title={v.videoRefId}>
                Ref: {v.videoRefId.length > 18 ? `${v.videoRefId.slice(0, 18)}…` : v.videoRefId}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'filename',
      header: 'Filename',
      render: (v) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {v.filename ?? '—'}
        </span>
      ),
    },
    {
      key: 'url',
      header: 'Stored Key / Playback URL',
      render: (v) => {
        const storedKey = v.url || v.filename || '';
        const playbackUrl = buildVideoUrl(storedKey);
        return (
          <div className="space-y-0.5 max-w-xs">
            <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 break-all">
              {storedKey || '—'}
            </span>
            {playbackUrl && (
              <p className="flex items-center gap-1 font-mono text-[11px] text-brand-600 dark:text-brand-400 break-all">
                <Link2 className="h-3 w-3 shrink-0" />
                <a
                  href={playbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline inline-flex items-center gap-0.5"
                  title="Open constructed playback URL"
                >
                  <span>{playbackUrl.length > 45 ? `${playbackUrl.slice(0, 45)}…` : playbackUrl}</span>
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                </a>
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'sessionId',
      header: 'Session',
      render: (v) => (
        <span className="text-gray-700 dark:text-gray-200">
          {getSessionName(v.sessionId)}
        </span>
      ),
    },
    {
      key: 'bucketId',
      header: 'Bucket',
      render: (v) => (
        <span className="text-gray-700 dark:text-gray-200">
          {getBucketName(v.bucketId)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Video Master"
        description="Upload video URLs and map them to sessions."
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Video
          </button>
        }
      />

      {successMessage && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        total={total}
        totalPages={totalPages}
        page={page}
        pageSize={pageSize}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        searchValue={search}
        rowKey={(v) => v.videoRefId || v.id || String(v.videoId)}
        actions={(v) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(v)}
              className="btn-ghost h-8 w-8 p-0 text-brand-600 hover:text-brand-700 dark:text-brand-400"
              title="Edit Video"
              aria-label="Edit Video"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(v)}
              className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600"
              title="Delete Video"
              aria-label="Delete Video"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'edit' ? 'Edit Video' : 'New Video'}
        description={
          mode === 'edit' ? `Editing "${editing?.title || 'Video'}"` : 'Add a video by filename and URL.'
        }
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {mode === 'edit' ? 'Save changes' : 'Create video'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <div>
            <label className="label">
              Video Title <span className="text-red-500">*</span>
            </label>
            <input
              className={`input ${fieldErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' });
              }}
              required
              placeholder="e.g. Intro to TypeScript — Recording"
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.title}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label">
                Stored Filename or Relative Object Key <span className="text-red-500">*</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <input
              className={`input font-mono text-sm ${fieldErrors.filename ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              value={form.url || form.filename}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, url: val, filename: val.split('/').pop() || val });
                if (fieldErrors.filename) setFieldErrors({ ...fieldErrors, filename: '' });
              }}
              required
              placeholder="e.g. lesson-01.mp4, full-stack/module-01/lesson-01.mp4, or YouTube URL"
            />
            {fieldErrors.filename && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.filename}</p>}
            {uploadProgress && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400">
                {uploading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />}
                <span>{uploadProgress}</span>
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Only the filename or relative object key is stored in the database. Full S3/CDN URLs are stripped automatically.
            </p>
          </div>

          {Boolean(form.url || form.filename) && (
            <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-3 dark:border-brand-900/50 dark:bg-brand-950/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-900 dark:text-brand-200">
                <Film className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                <span>Constructed Playback URL Preview:</span>
              </div>
              <p className="mt-1 font-mono text-xs text-brand-700 dark:text-brand-300 break-all">
                {buildVideoUrl(form.url || form.filename)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">
                Session <span className="text-red-500">*</span>
              </label>
              <select
                className={`input ${fieldErrors.sessionId ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                value={form.sessionId}
                onChange={(e) => {
                  setForm({ ...form, sessionId: e.target.value });
                  if (fieldErrors.sessionId) setFieldErrors({ ...fieldErrors, sessionId: '' });
                }}
                required
              >
                <option value="">Select session…</option>
                {sessions.map((s) => {
                  const sId = s.sessionRefId || s.id;
                  return (
                    <option key={sId} value={sId}>
                      {s.sessionName || s.name}
                    </option>
                  );
                })}
              </select>
              {fieldErrors.sessionId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.sessionId}</p>}
            </div>
            <div>
              <label className="label">
                Bucket <span className="text-red-500">*</span>
              </label>
              <select
                className={`input ${fieldErrors.bucketId ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                value={form.bucketId}
                onChange={(e) => {
                  setForm({ ...form, bucketId: e.target.value });
                  if (fieldErrors.bucketId) setFieldErrors({ ...fieldErrors, bucketId: '' });
                }}
                required
              >
                <option value="">Select bucket…</option>
                {buckets.map((b) => {
                  const bId = b.bucketRefId || b.id;
                  return (
                    <option key={bId} value={bId}>
                      {b.bucketName || b.name}
                    </option>
                  );
                })}
              </select>
              {fieldErrors.bucketId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.bucketId}</p>}
            </div>
          </div>

          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete video?"
        description={`This will permanently delete "${deleteTarget?.title}". This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Are you sure you want to delete this video?
        </p>
      </Modal>
    </div>
  );
}
