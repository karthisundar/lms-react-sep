import { useCallback, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
  Link2,
  Users,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  userLessonMappingService,
  userService,
  lessonMasterService,
} from '@/services';
import type {
  Lesson,
  User,
  UserLessonMapping,
  UserLessonMappingCreateInput,
  UserLessonMappingStatus,
  UserLessonMappingUpdateInput,
} from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner, StatusBadge } from '@/components/ui';

interface MappingFormData {
  userLessonRefId: string;
  userId: string | number;
  lessonId: string | number;
  status: UserLessonMappingStatus;
}

const emptyForm: MappingFormData = {
  userLessonRefId: '',
  userId: '',
  lessonId: '',
  status: 1,
};

export default function AdminUserLessonMappingsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paramUserId = searchParams.get('userId') || '';
  const paramLessonId = searchParams.get('lessonId') || '';

  // Role-based protection: non-admin users must not access User Lesson Mapping
  if (user && user.role !== 'admin') {
    return <Navigate to="/sessions" replace />;
  }

  const [rows, setRows] = useState<UserLessonMapping[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState<string>(paramUserId || 'all');
  const [lessonFilter, setLessonFilter] = useState<string>(paramLessonId || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reference data for users and lessons dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  // Create / Edit modal state
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserLessonMapping | null>(null);
  const [form, setForm] = useState<MappingFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // View details modal state
  const [viewingTarget, setViewingTarget] = useState<UserLessonMapping | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<UserLessonMapping | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load users for dropdown selection
  useEffect(() => {
    setUsersLoading(true);
    userService
      .getAllUsers({ page: 1, pageSize: 200 })
      .then((res) => {
        const list = res.row || res.items || [];
        setUsers(list);
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, []);

  // Load lessons for dropdown selection
  useEffect(() => {
    setLessonsLoading(true);
    lessonMasterService
      .getAllLessons({ page: 1, pageSize: 200 })
      .then((res) => {
        const list = res.row || res.items || [];
        setLessons(list);
      })
      .catch(() => {})
      .finally(() => setLessonsLoading(false));
  }, []);

  const getUserDisplay = useCallback(
    (userId: number | string) => {
      if (!userId && userId !== 0) return { name: 'Unknown User', email: '' };
      const u = users.find(
        (item) =>
          String(item.user_id) === String(userId) ||
          String(item.id) === String(userId) ||
          item.user_ref_id === String(userId)
      );
      if (u) return { name: u.name, email: u.email, id: u.user_id ?? u.id };
      return { name: `User #${userId}`, email: '', id: userId };
    },
    [users]
  );

  const getLessonDisplay = useCallback(
    (lessonId: number | string) => {
      if (!lessonId && lessonId !== 0) return { name: '—', code: undefined };
      const l = lessons.find(
        (item) =>
          String(item.lessonId) === String(lessonId) ||
          item.lessonRefId === String(lessonId) ||
          item.id === String(lessonId)
      );
      if (l) {
        return {
          name: l.lessonName || l.name || `Lesson #${lessonId}`,
          code: l.lessonCode,
          refId: l.lessonRefId,
        };
      }
      return { name: `Lesson #${lessonId}`, code: undefined, refId: String(lessonId) };
    },
    [lessons]
  );

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      setError(null);
      userLessonMappingService
        .getAllUserLessonMappings({
          page: targetPage,
          pageSize,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          userId: userFilter !== 'all' ? userFilter : undefined,
          lessonId: lessonFilter !== 'all' ? lessonFilter : undefined,
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
        .catch((e) =>
          setError(
            e instanceof Error ? e.message : 'Failed to load user lesson mappings'
          )
        )
        .finally(() => setLoading(false));
    },
    [page, pageSize, search, statusFilter, userFilter, lessonFilter]
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
      userId: userFilter !== 'all' ? userFilter : (users[0]?.user_id ?? users[0]?.id ?? ''),
      lessonId: lessonFilter !== 'all' ? lessonFilter : (lessons[0]?.lessonId ?? lessons[0]?.lessonRefId ?? ''),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = async (mapping: UserLessonMapping) => {
    setMode('edit');
    setEditing(mapping);
    setFormError(null);
    const targetRefId = mapping.userLessonRefId || mapping.id;

    // Prepopulate immediately from selected row
    setForm({
      userLessonRefId: targetRefId,
      userId: mapping.userId,
      lessonId: mapping.lessonId,
      status: mapping.status !== undefined ? mapping.status : 1,
    });
    setModalOpen(true);

    // Call single getUserLessonMapping API to fetch freshest details
    try {
      const freshMapping = await userLessonMappingService.getUserLessonMapping(targetRefId);
      if (freshMapping) {
        setForm({
          userLessonRefId: freshMapping.userLessonRefId || targetRefId,
          userId: freshMapping.userId !== undefined ? freshMapping.userId : mapping.userId,
          lessonId: freshMapping.lessonId !== undefined ? freshMapping.lessonId : mapping.lessonId,
          status: freshMapping.status !== undefined ? freshMapping.status : 1,
        });
      }
    } catch {
      // Non-blocking: fallback to row data
    }
  };

  const openView = (mapping: UserLessonMapping) => {
    setViewingTarget(mapping);
  };

  const validateForm = (): string | null => {
    if (!String(form.userId).trim()) {
      return 'Please select a user.';
    }
    if (!String(form.lessonId).trim()) {
      return 'Please select a lesson.';
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
        Boolean(form.userLessonRefId || editing?.userLessonRefId);
      const targetRefId = isEditMode
        ? form.userLessonRefId || editing?.userLessonRefId || ''
        : '';

      const payload: UserLessonMappingCreateInput | UserLessonMappingUpdateInput = {
        userLessonRefId: targetRefId || undefined,
        userId: Number(form.userId) || form.userId,
        lessonId: form.lessonId,
        status: Number(form.status),
      };

      await userLessonMappingService.createUserLessonMapping(payload);

      if (isEditMode) {
        setSuccessMessage('User lesson mapping updated successfully.');
      } else {
        setSuccessMessage('User mapped to lesson successfully.');
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
    const targetRefId = deleteTarget.userLessonRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete mapping: missing userLessonRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await userLessonMappingService.deleteUserLessonMapping({
        userLessonRefId: targetRefId,
      });
      setSuccessMessage('User lesson mapping deleted successfully.');
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
    setUserFilter('all');
    setLessonFilter('all');
    setPage(1);
  };

  const columns: Column<UserLessonMapping>[] = [
    {
      key: 'userId',
      header: 'User',
      render: (m) => {
        const u = getUserDisplay(m.userId);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate max-w-[200px] dark:text-white" title={u.name}>
                {u.name}
              </p>
              {u.email && (
                <p className="text-xs text-gray-500 truncate max-w-[200px] dark:text-gray-400" title={u.email}>
                  {u.email}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'lessonId',
      header: 'Lesson',
      render: (m) => {
        const l = getLessonDisplay(m.lessonId);
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-xs truncate max-w-[220px] dark:text-white" title={l.name}>
                {l.name}
              </p>
              {l.code && (
                <span className="inline-flex text-[10px] font-semibold text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300 px-1.5 py-0.2 rounded mt-0.5">
                  {l.code}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => {
        const isActive =
          String(m.status) === '1' ||
          String(m.status).toLowerCase() === 'active' ||
          String(m.status).toLowerCase() === 'published';
        return (
          <StatusBadge
            status={isActive ? 'active' : 'inactive'}
            label={isActive ? 'Active' : 'Inactive'}
          />
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (m) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      render: (m) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : '—'}
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
        title="User Lesson Mappings"
        description="Assign and manage student access to curriculum lessons."
        action={
          <button
            id="create-user-lesson-mapping-btn"
            onClick={openCreate}
            className="btn btn-primary inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Map User to Lesson</span>
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
          {/* User filter */}
          <div className="flex items-center gap-2">
            <label
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="ulm-user-filter"
            >
              User:
            </label>
            <select
              id="ulm-user-filter"
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setPage(1);
              }}
              className="input w-48 py-1 text-sm"
              disabled={usersLoading}
            >
              <option value="all">All Users</option>
              {users.map((u) => (
                <option key={u.user_id || u.id} value={u.user_id ?? u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Lesson filter */}
          <div className="flex items-center gap-2">
            <label
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="ulm-lesson-filter"
            >
              Lesson:
            </label>
            <select
              id="ulm-lesson-filter"
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
                <option key={l.lessonRefId || l.id} value={l.lessonId ?? l.lessonRefId}>
                  {l.lessonCode ? `[${l.lessonCode}] ` : ''}
                  {l.lessonName || l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="ulm-status-filter"
            >
              Status:
            </label>
            <select
              id="ulm-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input w-36 py-1 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          {(statusFilter !== 'all' || userFilter !== 'all' || lessonFilter !== 'all' || search) && (
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
            id="ulm-search"
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
        rowKey={(m) => m.userLessonRefId || m.id}
        emptyMessage="No user lesson mappings found. Click 'Map User to Lesson' to create one."
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'create' ? 'Map User to Lesson' : 'Edit User Lesson Mapping'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          {/* User Select */}
          <div>
            <label
              htmlFor="ulm-form-user"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Select User <span className="text-red-500">*</span>
            </label>
            <select
              id="ulm-form-user"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="input w-full"
              required
              disabled={usersLoading}
            >
              <option value="">-- Select a User --</option>
              {users.map((u) => (
                <option key={u.user_id || u.id} value={u.user_id ?? u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Lesson Select */}
          <div>
            <label
              htmlFor="ulm-form-lesson"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Select Lesson <span className="text-red-500">*</span>
            </label>
            <select
              id="ulm-form-lesson"
              value={form.lessonId}
              onChange={(e) => setForm({ ...form, lessonId: e.target.value })}
              className="input w-full"
              required
              disabled={lessonsLoading}
            >
              <option value="">-- Select a Lesson --</option>
              {lessons.map((l) => (
                <option key={l.lessonRefId || l.id} value={l.lessonId ?? l.lessonRefId}>
                  {l.lessonCode ? `[${l.lessonCode}] ` : ''}
                  {l.lessonName || l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="ulm-form-status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Status
            </label>
            <select
              id="ulm-form-status"
              value={String(form.status)}
              onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
              className="input w-full"
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
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
        title="User Lesson Mapping Details"
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
                  {viewingTarget.userLessonRefId || viewingTarget.id}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Status
                </span>
                <div className="mt-1">
                  <StatusBadge
                    status={String(viewingTarget.status) === '1' ? 'active' : 'inactive'}
                    label={String(viewingTarget.status) === '1' ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>
            </div>

            {/* User details */}
            <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-3.5 dark:border-brand-950 dark:bg-brand-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300 mb-1">
                <Users className="h-4 w-4" />
                <span>Mapped User</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {getUserDisplay(viewingTarget.userId).name}
              </p>
              {getUserDisplay(viewingTarget.userId).email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {getUserDisplay(viewingTarget.userId).email}
                </p>
              )}
              <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                User ID: {viewingTarget.userId}
              </p>
            </div>

            {/* Lesson details */}
            <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3.5 dark:border-sky-950 dark:bg-sky-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 mb-1">
                <GraduationCap className="h-4 w-4" />
                <span>Mapped Lesson</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {getLessonDisplay(viewingTarget.lessonId).name}
              </p>
              {getLessonDisplay(viewingTarget.lessonId).code && (
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                  Code: {getLessonDisplay(viewingTarget.lessonId).code}
                </p>
              )}
              <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                Lesson ID: {viewingTarget.lessonId}
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
        title="Delete User Lesson Mapping"
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to remove the mapping between user{' '}
              <strong className="text-gray-900 dark:text-white">
                "{getUserDisplay(deleteTarget.userId).name}"
              </strong>{' '}
              and lesson{' '}
              <strong className="text-gray-900 dark:text-white">
                "{getLessonDisplay(deleteTarget.lessonId).name}"
              </strong>
              ?
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              This unlinks the lesson from the user. Neither the user account nor the lesson will be deleted.
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
