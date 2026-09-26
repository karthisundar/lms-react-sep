import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
  Film,
  GraduationCap,
  Link2,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  lessonVideoMappingService,
  lessonMasterService,
  videoMasterService,
} from '@/services';
import type {
  Lesson,
  LessonVideoMapping,
  LessonVideoMappingCreateInput,
  LessonVideoMappingStatus,
  LessonVideoMappingUpdateInput,
  Video,
} from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner, StatusBadge } from '@/components/ui';

interface MappingFormData {
  lessonVideoMappingRefId: string;
  lessonRefId: string;
  videoRefId: string;
  displayOrder: number;
  status: LessonVideoMappingStatus;
}

const emptyForm: MappingFormData = {
  lessonVideoMappingRefId: '',
  lessonRefId: '',
  videoRefId: '',
  displayOrder: 1,
  status: 'draft',
};

export default function AdminLessonVideoMappingsPage() {
  const { user } = useAuth();

  // Role-based protection: non-admin users must not access Lesson Video Mappings
  if (user && user.role !== 'admin') {
    return <Navigate to="/sessions" replace />;
  }

  const [rows, setRows] = useState<LessonVideoMapping[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lessonFilter, setLessonFilter] = useState('all');
  const [videoFilter, setVideoFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reference data for dropdowns
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);

  // Create / Edit modal state
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LessonVideoMapping | null>(null);
  const [form, setForm] = useState<MappingFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // View details modal state
  const [viewingTarget, setViewingTarget] = useState<LessonVideoMapping | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<LessonVideoMapping | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load lessons for dropdown selection
  useEffect(() => {
    setLessonsLoading(true);
    lessonMasterService
      .getAllLessons({ pageSize: 100 })
      .then((res) => {
        const list = res.row || res.items || [];
        setLessons(list);
      })
      .catch(() => {})
      .finally(() => setLessonsLoading(false));
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
      .catch(() => {})
      .finally(() => setVideosLoading(false));
  }, []);

  const getLessonName = useCallback(
    (lessonRefId?: string): string => {
      if (!lessonRefId) return '—';
      const found = lessons.find(
        (l) => l.lessonRefId === lessonRefId || l.id === lessonRefId
      );
      return found ? found.lessonName || found.name : lessonRefId;
    },
    [lessons]
  );

  const getLessonCode = useCallback(
    (lessonRefId?: string): string | undefined => {
      if (!lessonRefId) return undefined;
      const found = lessons.find(
        (l) => l.lessonRefId === lessonRefId || l.id === lessonRefId
      );
      return found?.lessonCode;
    },
    [lessons]
  );

  const getVideoTitle = useCallback(
    (videoRefId?: string): string => {
      if (!videoRefId) return '—';
      const found = videos.find(
        (v) => v.videoRefId === videoRefId || v.id === videoRefId
      );
      return found ? found.title || found.name || 'Attached Video' : videoRefId;
    },
    [videos]
  );

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      setError(null);
      lessonVideoMappingService
        .getAllLessonVideoMappings({
          page: targetPage,
          pageSize,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          lessonRefId: lessonFilter !== 'all' ? lessonFilter : undefined,
          videoRefId: videoFilter !== 'all' ? videoFilter : undefined,
        })
        .then((res) => {
          const extractedRows = res.row || res.items || [];
          const extractedTotal = Number(res.totalItem ?? res.total ?? 0);
          const calculatedTotalPages = Math.max(
            1,
            Math.ceil(extractedTotal / pageSize)
          );
          const extractedTotalPages = Number(res.totalPage ?? calculatedTotalPages);

          if (targetPage > extractedTotalPages && extractedTotalPages > 0) {
            setPage(extractedTotalPages);
            return;
          }

          setRows(extractedRows);
          setTotal(extractedTotal);
          setTotalPages(extractedTotalPages);
        })
        .catch((e) =>
          setError(
            e instanceof Error ? e.message : 'Failed to load lesson video mappings'
          )
        )
        .finally(() => setLoading(false));
    },
    [page, pageSize, search, statusFilter, lessonFilter, videoFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => load(page), 250);
    return () => clearTimeout(t);
  }, [load, page]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setForm({
      ...emptyForm,
      lessonRefId: lessonFilter !== 'all' ? lessonFilter : '',
      videoRefId: videoFilter !== 'all' ? videoFilter : '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (mapping: LessonVideoMapping) => {
    setMode('edit');
    setEditing(mapping);
    setForm({
      lessonVideoMappingRefId: mapping.lessonVideoMappingRefId || mapping.id,
      lessonRefId: mapping.lessonRefId || '',
      videoRefId: mapping.videoRefId || '',
      displayOrder: Number(mapping.displayOrder ?? 1),
      status: (mapping.status as LessonVideoMappingStatus) || 'draft',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openView = (mapping: LessonVideoMapping) => {
    setViewingTarget(mapping);
  };

  const validateForm = (): string | null => {
    if (!form.lessonRefId.trim()) {
      return 'Lesson selection is required.';
    }
    if (!form.videoRefId.trim()) {
      return 'Video selection is required.';
    }
    if (form.displayOrder === undefined || form.displayOrder === null || Number(form.displayOrder) < 1) {
      return 'Display order must be an integer of 1 or greater.';
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
      const isEditMode =
        mode === 'edit' &&
        Boolean(form.lessonVideoMappingRefId || editing?.lessonVideoMappingRefId);
      const targetRefId = isEditMode
        ? form.lessonVideoMappingRefId || editing?.lessonVideoMappingRefId || ''
        : '';

      const payload: LessonVideoMappingCreateInput | LessonVideoMappingUpdateInput = {
        lessonVideoMappingRefId: targetRefId || undefined,
        lessonRefId: form.lessonRefId.trim(),
        videoRefId: form.videoRefId.trim(),
        displayOrder: Number(form.displayOrder) || 1,
        status: form.status,
      };

      await lessonVideoMappingService.createLessonVideoMapping(payload);

      if (isEditMode) {
        setSuccessMessage('Lesson video mapping updated successfully.');
      } else {
        setSuccessMessage('Lesson video mapping created successfully.');
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
    const targetRefId =
      deleteTarget.lessonVideoMappingRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete mapping: missing mapping ref ID');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await lessonVideoMappingService.deleteLessonVideoMapping({
        lessonVideoMappingRefId: targetRefId,
      });
      setSuccessMessage('Lesson video mapping deleted successfully.');
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

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setLessonFilter('all');
    setVideoFilter('all');
    setPage(1);
  };

  const columns: Column<LessonVideoMapping>[] = [
    {
      key: 'lessonRefId',
      header: 'Lesson',
      render: (m) => {
        const lessonName = m.lessonName || getLessonName(m.lessonRefId);
        const code = getLessonCode(m.lessonRefId);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate max-w-[220px] dark:text-white" title={lessonName}>
                {lessonName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {code && (
                  <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300 px-1.5 py-0.2 rounded">
                    {code}
                  </span>
                )}
                <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[120px]" title={m.lessonRefId}>
                  {m.lessonRefId.slice(0, 12)}…
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'videoRefId',
      header: 'Video',
      render: (m) => {
        const videoTitle = m.videoTitle || getVideoTitle(m.videoRefId);
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
              <Film className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-purple-900 dark:text-purple-200 text-xs truncate max-w-[200px]" title={videoTitle}>
                {videoTitle}
              </p>
              <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[120px]" title={m.videoRefId}>
                {m.videoRefId.slice(0, 12)}…
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'displayOrder',
      header: 'Order',
      render: (m) => (
        <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          #{m.displayOrder ?? 1}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <StatusBadge status={m.status || 'draft'} />,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (m) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openView(m)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            title="View Details"
            aria-label="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEdit(m)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800 dark:hover:text-brand-400 transition-colors"
            title="Edit Mapping"
            aria-label="Edit Mapping"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(m)}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
            title="Delete Mapping"
            aria-label="Delete Mapping"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Lesson Video Mappings"
        description="Associate, sequence, and manage video recordings mapped to specific course lessons."
        action={
          <button
            id="create-lesson-video-mapping-btn"
            onClick={openCreate}
            className="btn btn-primary inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Map New Video</span>
          </button>
        }
      />

      {/* Notifications */}
      {successMessage && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
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

      {/* Filter toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lesson filter */}
          <div className="flex items-center gap-2">
            <label
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="lvm-lesson-filter"
            >
              Lesson:
            </label>
            <select
              id="lvm-lesson-filter"
              value={lessonFilter}
              onChange={(e) => {
                setLessonFilter(e.target.value);
                setPage(1);
              }}
              className="input w-48 py-1 text-sm"
              disabled={lessonsLoading}
            >
              <option value="all">All Lessons</option>
              {lessons.map((l) => (
                <option key={l.lessonRefId || l.id} value={l.lessonRefId || l.id}>
                  {l.lessonName || l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Video filter */}
          <div className="flex items-center gap-2">
            <label
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="lvm-video-filter"
            >
              Video:
            </label>
            <select
              id="lvm-video-filter"
              value={videoFilter}
              onChange={(e) => {
                setVideoFilter(e.target.value);
                setPage(1);
              }}
              className="input w-48 py-1 text-sm"
              disabled={videosLoading}
            >
              <option value="all">All Videos</option>
              {videos.map((v) => (
                <option key={v.videoRefId || v.id} value={v.videoRefId || v.id}>
                  {v.title || v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="lvm-status-filter"
            >
              Status:
            </label>
            <select
              id="lvm-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input w-36 py-1 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {(statusFilter !== 'all' || lessonFilter !== 'all' || videoFilter !== 'all' || search) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="w-full sm:w-64">
          <input
            type="search"
            id="lvm-search"
            placeholder="Search mappings..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input w-full text-sm py-1.5"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        rowKey={(m) => m.lessonVideoMappingRefId || m.id}
        emptyMessage="No lesson video mappings found. Click 'Map New Video' to create one."
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'create' ? 'Map Video to Lesson' : 'Edit Lesson Video Mapping'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          {/* Lesson Select */}
          <div>
            <label
              htmlFor="lvm-form-lesson"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Target Lesson <span className="text-red-500">*</span>
            </label>
            <select
              id="lvm-form-lesson"
              value={form.lessonRefId}
              onChange={(e) => setForm({ ...form, lessonRefId: e.target.value })}
              className="input w-full"
              required
              disabled={lessonsLoading}
            >
              <option value="">-- Select a Lesson --</option>
              {lessons.map((l) => (
                <option key={l.lessonRefId || l.id} value={l.lessonRefId || l.id}>
                  {l.lessonCode ? `[${l.lessonCode}] ` : ''}
                  {l.lessonName || l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Video Select */}
          <div>
            <label
              htmlFor="lvm-form-video"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Video Recording <span className="text-red-500">*</span>
            </label>
            <select
              id="lvm-form-video"
              value={form.videoRefId}
              onChange={(e) => setForm({ ...form, videoRefId: e.target.value })}
              className="input w-full"
              required
              disabled={videosLoading}
            >
              <option value="">-- Select a Video --</option>
              {videos.map((v) => (
                <option key={v.videoRefId || v.id} value={v.videoRefId || v.id}>
                  {v.title || v.name} {v.duration || v.durationSec ? `(${v.duration || v.durationSec}s)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Display Order & Status grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="lvm-form-order"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Display Order <span className="text-red-500">*</span>
              </label>
              <input
                id="lvm-form-order"
                type="number"
                min="1"
                step="1"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm({
                    ...form,
                    displayOrder: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                className="input w-full"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Determines sequence within the lesson playlist
              </p>
            </div>

            <div>
              <label
                htmlFor="lvm-form-status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Status
              </label>
              <select
                id="lvm-form-status"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as LessonVideoMappingStatus,
                  })
                }
                className="input w-full"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Mapping' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        open={Boolean(viewingTarget)}
        onClose={() => setViewingTarget(null)}
        title="Lesson Video Mapping Details"
        size="md"
      >
        {viewingTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Mapping Ref ID
                </span>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 select-all break-all mt-0.5">
                  {viewingTarget.lessonVideoMappingRefId || viewingTarget.id}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Display Order
                  </span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    #{viewingTarget.displayOrder ?? 1}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Status
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={viewingTarget.status || 'draft'} />
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson details */}
            <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3.5 dark:border-sky-950 dark:bg-sky-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 mb-1">
                <GraduationCap className="h-4 w-4" />
                <span>Associated Lesson</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {viewingTarget.lessonName || getLessonName(viewingTarget.lessonRefId)}
              </p>
              {getLessonCode(viewingTarget.lessonRefId) && (
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                  Code: {getLessonCode(viewingTarget.lessonRefId)}
                </p>
              )}
              <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500 mt-1 select-all break-all">
                Ref: {viewingTarget.lessonRefId}
              </p>
            </div>

            {/* Video details */}
            <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-3.5 dark:border-purple-950 dark:bg-purple-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-1">
                <Film className="h-4 w-4" />
                <span>Associated Video</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {viewingTarget.videoTitle || getVideoTitle(viewingTarget.videoRefId)}
              </p>
              <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500 mt-1 select-all break-all">
                Ref: {viewingTarget.videoRefId}
              </p>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-100 dark:border-gray-800">
              {viewingTarget.createdAt && (
                <p>Created: {new Date(viewingTarget.createdAt).toLocaleString()}</p>
              )}
              {viewingTarget.updatedAt && (
                <p>Last Updated: {new Date(viewingTarget.updatedAt).toLocaleString()}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setViewingTarget(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = viewingTarget;
                  setViewingTarget(null);
                  openEdit(t);
                }}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit This Mapping</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Lesson Video Mapping"
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to remove the video mapping between lesson{' '}
              <strong className="text-gray-900 dark:text-white">
                "{deleteTarget.lessonName || getLessonName(deleteTarget.lessonRefId)}"
              </strong>{' '}
              and video{' '}
              <strong className="text-gray-900 dark:text-white">
                "{deleteTarget.videoTitle || getVideoTitle(deleteTarget.videoRefId)}"
              </strong>
              ?
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              This action unlinks the video from the lesson. Neither the lesson nor the video recording file will be deleted.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Mapping'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
