import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, GraduationCap, CheckCircle2, Eye, Layers, Film, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { lessonMasterService, moduleMasterService, videoMasterService } from '@/services';
import type { Lesson, LessonCreateInput, LessonUpdateInput, LessonStatus, Module, Video } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner, StatusBadge } from '@/components/ui';

interface LessonFormData {
  lessonRefId: string;
  moduleRefId: string;
  lessonName: string;
  description: string;
  videoRefId: string;
  notes: string;
  displayOrder: number;
  status: LessonStatus;
}

const emptyForm: LessonFormData = {
  lessonRefId: '',
  moduleRefId: '',
  lessonName: '',
  description: '',
  videoRefId: '',
  notes: '',
  displayOrder: 1,
  status: 'draft',
};

export default function AdminLessonsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Role-based protection: non-admin users must not access Lesson Master
  if (user && user.role !== 'admin') {
    return <Navigate to="/sessions" replace />;
  }

  const [rows, setRows] = useState<Lesson[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reference data for dropdowns and label resolution
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);

  // Create / Edit modal state
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState<LessonFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // View details modal state
  const [viewingTarget, setViewingTarget] = useState<Lesson | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load modules for dropdown selection
  useEffect(() => {
    setModulesLoading(true);
    moduleMasterService
      .getAllModules({ pageSize: 100 })
      .then((res) => {
        const list = res.row || res.items || [];
        setModules(list);
      })
      .catch(() => {
        // Non-blocking error
      })
      .finally(() => setModulesLoading(false));
  }, []);

  // Load videos for dropdown selection
  useEffect(() => {
    setVideosLoading(true);
    videoMasterService
      .getAllVideos({ pageSize: 100 })
      .then((res) => {
        const list = res.row || res.items || [];
        setVideos(list);
      })
      .catch(() => {
        // Non-blocking error
      })
      .finally(() => setVideosLoading(false));
  }, []);

  const getModuleName = useCallback(
    (moduleRefId?: string): string => {
      if (!moduleRefId) return '—';
      const found = modules.find((m) => m.moduleRefId === moduleRefId || m.id === moduleRefId);
      return found ? found.moduleName || found.name : moduleRefId;
    },
    [modules]
  );

  const getVideoTitle = useCallback(
    (videoRefId?: string | null): string => {
      if (!videoRefId) return '—';
      const found = videos.find((v) => v.videoRefId === videoRefId || v.id === videoRefId);
      return found ? found.title || found.name || 'Attached Video' : videoRefId;
    },
    [videos]
  );

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      setError(null);
      lessonMasterService
        .getAllLessons({
          page: targetPage,
          pageSize,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          moduleRefId: moduleFilter !== 'all' ? moduleFilter : undefined,
        })
        .then((res) => {
          const extractedRows = res.row || res.items || [];
          const extractedTotal = Number(res.totalItem ?? res.total ?? 0);
          const calculatedTotalPages = Math.max(1, Math.ceil(extractedTotal / pageSize));
          const extractedTotalPages = Number(res.totalPage ?? calculatedTotalPages);

          if (targetPage > extractedTotalPages && extractedTotalPages > 0) {
            setPage(extractedTotalPages);
            return;
          }

          setRows(extractedRows);
          setTotal(extractedTotal);
          setTotalPages(extractedTotalPages);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load lessons'))
        .finally(() => setLoading(false));
    },
    [page, pageSize, search, statusFilter, moduleFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => load(page), 250);
    return () => clearTimeout(t);
  }, [load, page]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setForm({
      lessonRefId: '',
      moduleRefId: moduleFilter !== 'all' ? moduleFilter : modules[0]?.moduleRefId || '',
      lessonName: '',
      description: '',
      videoRefId: '',
      notes: '',
      displayOrder: rows.length + 1,
      status: 'draft',
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setMode('edit');
    setEditing(lesson);
    setForm({
      lessonRefId: lesson.lessonRefId || lesson.id || '',
      moduleRefId: lesson.moduleRefId || '',
      lessonName: lesson.lessonName || lesson.name || '',
      description: lesson.description || '',
      videoRefId: lesson.videoRefId || '',
      notes: lesson.notes || '',
      displayOrder: lesson.displayOrder ?? 1,
      status: lesson.status || 'draft',
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);

    const refId = lesson.lessonRefId || lesson.id;
    if (refId) {
      lessonMasterService
        .getLesson(refId)
        .then((fetched) => {
          if (fetched) {
            setForm({
              lessonRefId: fetched.lessonRefId || refId,
              moduleRefId: fetched.moduleRefId || lesson.moduleRefId || '',
              lessonName: fetched.lessonName || fetched.name || lesson.lessonName || '',
              description: fetched.description || '',
              videoRefId: fetched.videoRefId || '',
              notes: fetched.notes || '',
              displayOrder: fetched.displayOrder ?? lesson.displayOrder ?? 1,
              status: fetched.status || lesson.status || 'draft',
            });
          }
        })
        .catch(() => {
          // Keep existing values on failure
        });
    }
  };

  const openView = (lesson: Lesson) => {
    setViewingTarget(lesson);
    const refId = lesson.lessonRefId || lesson.id;
    if (refId) {
      lessonMasterService
        .getLesson(refId)
        .then((fetched) => {
          if (fetched) setViewingTarget(fetched);
        })
        .catch(() => {});
    }
  };

  const validateForm = (): string | null => {
    if (!form.moduleRefId.trim()) {
      return 'Module is required. Please select a module.';
    }
    const trimmedName = form.lessonName.trim();
    if (!trimmedName) {
      return 'Lesson Name is required and cannot be empty.';
    }
    const order = Number(form.displayOrder);
    if (isNaN(order) || order < 1) {
      return 'Display Order must be a positive number greater than 0.';
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationErr = validateForm();
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    setSaving(true);
    try {
      const isEditMode = mode === 'edit' && Boolean(form.lessonRefId || editing?.lessonRefId);
      const targetRefId = isEditMode ? (form.lessonRefId || editing?.lessonRefId || '') : '';

      const payload: LessonCreateInput | LessonUpdateInput = {
        lessonRefId: targetRefId || undefined,
        moduleRefId: form.moduleRefId.trim(),
        lessonName: form.lessonName.trim(),
        description: form.description.trim(),
        videoRefId: form.videoRefId.trim() || null,
        notes: form.notes.trim(),
        displayOrder: Number(form.displayOrder) || 1,
        status: form.status,
      };

      await lessonMasterService.createLesson(payload);

      if (isEditMode) {
        setSuccessMessage(`Lesson "${form.lessonName.trim()}" updated successfully.`);
      } else {
        setSuccessMessage(`Lesson "${form.lessonName.trim()}" created successfully.`);
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
    const targetRefId = deleteTarget.lessonRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete lesson: missing lessonRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await lessonMasterService.deleteLesson({ lessonRefId: targetRefId });
      setSuccessMessage(`Lesson "${deleteTarget.lessonName || deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);

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

  const columns: Column<Lesson>[] = [
    {
      key: 'lessonCode',
      header: 'Lesson Code',
      render: (l) => (
        <span className="inline-flex items-center text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded">
          {l.lessonCode || `LSN-${l.lessonId || '—'}`}
        </span>
      ),
    },
    {
      key: 'lessonName',
      header: 'Lesson Name',
      render: (l) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{l.lessonName || l.name}</p>
            {l.lessonRefId && (
              <p className="font-mono text-xs text-gray-400 dark:text-gray-500" title={l.lessonRefId}>
                Ref: {l.lessonRefId.length > 18 ? `${l.lessonRefId.slice(0, 18)}…` : l.lessonRefId}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'moduleRefId',
      header: 'Module',
      render: (l) => {
        const moduleName = l.moduleName || getModuleName(l.moduleRefId);
        return (
          <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300 font-medium">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[160px]" title={moduleName}>
              {moduleName}
            </span>
          </div>
        );
      },
    },
    {
      key: 'videoRefId',
      header: 'Video',
      render: (l) => {
        if (!l.videoRefId) {
          return <span className="text-gray-400 dark:text-gray-500 text-xs italic">No Video</span>;
        }
        const title = l.videoTitle || getVideoTitle(l.videoRefId);
        return (
          <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 font-medium">
            <Film className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[140px]" title={title}>
              {title}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (l) => (
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={l.description || undefined}>
          {l.description ? l.description : <span className="text-gray-400 dark:text-gray-500 italic">—</span>}
        </p>
      ),
    },
    {
      key: 'displayOrder',
      header: 'Order',
      render: (l) => (
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
          {l.displayOrder ?? 1}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => <StatusBadge status={l.status || 'draft'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lesson Master"
        description="Create, view, and organize curriculum lessons linked to modules and videos."
        action={
          <button onClick={openCreate} className="btn-primary" id="create-lesson-btn">
            <Plus className="h-4 w-4" /> Add Lesson
          </button>
        }
      />

      {successMessage && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 underline hover:text-emerald-800 dark:text-emerald-400"
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

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="lesson-status-filter">
              Status:
            </label>
            <select
              id="lesson-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input w-36 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Module filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="lesson-module-filter">
              Module:
            </label>
            <select
              id="lesson-module-filter"
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="input max-w-xs py-1 text-sm"
              disabled={modulesLoading}
            >
              <option value="all">All Modules</option>
              {modules.map((m) => (
                <option key={m.moduleRefId || m.id} value={m.moduleRefId || m.id}>
                  {m.moduleName || m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
        pageSizeOptions={[10, 20, 50, 100]}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        searchValue={search}
        rowKey={(l) => l.lessonRefId || l.id || String(l.lessonId)}
        emptyMessage="No lessons found."
        actions={(l) => {
          const refId = l.lessonRefId || l.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openView(l)}
                className="btn-ghost h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                title="View Lesson Details"
                aria-label="View Lesson Details"
                id={`view-lesson-${refId}`}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEdit(l)}
                className="btn-ghost h-8 w-8 p-0"
                title="Edit Lesson"
                aria-label="Edit Lesson"
                id={`edit-lesson-${refId}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  navigate(
                    `/admin/lesson-notes?lessonId=${l.lessonId ?? ''}&lessonRefId=${l.lessonRefId ?? ''}`
                  )
                }
                className="btn-ghost h-8 w-8 p-0 text-amber-600 hover:text-amber-700 dark:text-amber-400"
                title="Manage Lesson Notes"
                aria-label="Manage Lesson Notes"
                id={`notes-lesson-${refId}`}
              >
                <FileText className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(l)}
                className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600"
                title="Delete Lesson"
                aria-label="Delete Lesson"
                id={`delete-lesson-${refId}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        }}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'edit' ? 'Edit Lesson' : 'Add Lesson'}
        description={
          mode === 'edit' && editing
            ? `Update lesson details for "${editing.lessonName || editing.name}".`
            : 'Fill in the lesson details below to add instructional content.'
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
              id="save-lesson-btn"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {mode === 'edit' ? 'Save changes' : 'Add Lesson'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <div>
            <label className="label" htmlFor="lesson-module">
              Module <span className="text-red-500">*</span>
            </label>
            <select
              id="lesson-module"
              className="input"
              value={form.moduleRefId}
              onChange={(e) => setForm({ ...form, moduleRefId: e.target.value })}
              required
              disabled={modulesLoading}
            >
              <option value="" disabled>
                -- Select Module --
              </option>
              {modules.map((m) => (
                <option key={m.moduleRefId || m.id} value={m.moduleRefId || m.id}>
                  {m.moduleName || m.name}
                </option>
              ))}
            </select>
            {modules.length === 0 && !modulesLoading && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No modules available. Please create a module in Module Master first.
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="lesson-name">
              Lesson Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lesson-name"
              className="input"
              value={form.lessonName}
              onChange={(e) => setForm({ ...form, lessonName: e.target.value })}
              required
              placeholder="e.g. Introduction to Node.js"
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="lesson-video">
              Video (Optional)
            </label>
            <select
              id="lesson-video"
              className="input"
              value={form.videoRefId}
              onChange={(e) => setForm({ ...form, videoRefId: e.target.value })}
              disabled={videosLoading}
            >
              <option value="">-- No Video Attached --</option>
              {videos.map((v) => (
                <option key={v.videoRefId || v.id} value={v.videoRefId || v.id}>
                  {v.title || v.name || v.filename || 'Untitled Video'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="lesson-description">
              Description
            </label>
            <textarea
              id="lesson-description"
              className="input min-h-[72px] py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Overview or objectives for this lesson..."
              rows={2}
            />
          </div>

          <div>
            <label className="label" htmlFor="lesson-notes">
              Notes
            </label>
            <textarea
              id="lesson-notes"
              className="input min-h-[72px] py-2 font-mono text-xs"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Reading materials, commands, links, or instructions..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="lesson-display-order">
                Display Order <span className="text-red-500">*</span>
              </label>
              <input
                id="lesson-display-order"
                type="number"
                min={1}
                className="input"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: Math.max(1, parseInt(e.target.value) || 1) })}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="lesson-status">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="lesson-status"
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as LessonStatus })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        open={!!viewingTarget}
        onClose={() => setViewingTarget(null)}
        title="Lesson Details"
        description="Detailed metadata and attached resources for this lesson."
        footer={
          <button
            type="button"
            onClick={() => setViewingTarget(null)}
            className="btn-secondary"
          >
            Close
          </button>
        }
      >
        {viewingTarget && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingTarget.lessonName || viewingTarget.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded">
                    {viewingTarget.lessonCode || `LSN-${viewingTarget.lessonId || '—'}`}
                  </span>
                  <StatusBadge status={viewingTarget.status || 'draft'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Module
                </span>
                <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                  {viewingTarget.moduleName || getModuleName(viewingTarget.moduleRefId)}
                </p>
              </div>

              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Display Order
                </span>
                <p className="mt-1 font-semibold text-gray-800 dark:text-gray-200">
                  #{viewingTarget.displayOrder ?? 1}
                </p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Attached Video
              </span>
              <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                {viewingTarget.videoTitle || getVideoTitle(viewingTarget.videoRefId)}
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Lesson Reference ID
              </span>
              <p className="mt-1 font-mono text-xs text-gray-700 dark:text-gray-300 select-all">
                {viewingTarget.lessonRefId || viewingTarget.id || '—'}
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Description
              </span>
              <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {viewingTarget.description || <span className="text-gray-400 italic">No description provided.</span>}
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Notes
              </span>
              <p className="mt-1 text-gray-700 dark:text-gray-300 font-mono text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                {viewingTarget.notes || <span className="text-gray-400 italic font-sans">No notes available.</span>}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 dark:border-gray-800">
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Created At
                </span>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {viewingTarget.createdAt ? new Date(viewingTarget.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Updated At
                </span>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {viewingTarget.updatedAt ? new Date(viewingTarget.updatedAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Lesson?"
        description={`This will permanently delete "${deleteTarget?.lessonName || deleteTarget?.name}". This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="btn-secondary"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger"
              id="confirm-delete-lesson-btn"
            >
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
        <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Are you sure you want to delete this lesson?
            </p>
            <p className="mt-1 text-xs">
              Student progress records and materials associated with this lesson may be affected.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
