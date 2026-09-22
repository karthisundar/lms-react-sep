import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Layers, CheckCircle2, Eye, BookOpen, Hash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { moduleMasterService, courseMasterService } from '@/services';
import type { Module, ModuleCreateInput, ModuleUpdateInput, ModuleStatus, Course } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner, StatusBadge } from '@/components/ui';

interface ModuleFormData {
  moduleRefId: string;
  courseRefId: string;
  moduleName: string;
  description: string;
  displayOrder: number;
  status: ModuleStatus;
}

const emptyForm: ModuleFormData = {
  moduleRefId: '',
  courseRefId: '',
  moduleName: '',
  description: '',
  displayOrder: 1,
  status: 'draft',
};

export default function AdminModulesPage() {
  const { user } = useAuth();

  // Role-based protection: non-admin users must not access Module Master
  if (user && user.role !== 'admin') {
    return <Navigate to="/sessions" replace />;
  }

  const [rows, setRows] = useState<Module[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Available courses for dropdown and course name resolution
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Create / Edit modal state
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [form, setForm] = useState<ModuleFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // View details modal state
  const [viewingTarget, setViewingTarget] = useState<Module | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Module | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load courses for dropdown selection
  useEffect(() => {
    setCoursesLoading(true);
    courseMasterService
      .getAllCourses({ pageSize: 100 })
      .then((res) => {
        const list = res.row || res.items || [];
        setCourses(list);
      })
      .catch(() => {
        // Non-blocking error
      })
      .finally(() => setCoursesLoading(false));
  }, []);

  const getCourseName = useCallback(
    (courseRefId?: string): string => {
      if (!courseRefId) return '—';
      const found = courses.find((c) => c.courseRefId === courseRefId || c.id === courseRefId);
      return found ? found.courseName || found.name : courseRefId;
    },
    [courses]
  );

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      setError(null);
      moduleMasterService
        .getAllModules({
          page: targetPage,
          pageSize,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          courseRefId: courseFilter !== 'all' ? courseFilter : undefined,
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
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load modules'))
        .finally(() => setLoading(false));
    },
    [page, pageSize, search, statusFilter, courseFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => load(page), 250);
    return () => clearTimeout(t);
  }, [load, page]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setForm({
      moduleRefId: '',
      courseRefId: courseFilter !== 'all' ? courseFilter : courses[0]?.courseRefId || '',
      moduleName: '',
      description: '',
      displayOrder: rows.length + 1,
      status: 'draft',
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const openEdit = (mod: Module) => {
    setMode('edit');
    setEditing(mod);
    setForm({
      moduleRefId: mod.moduleRefId || mod.id || '',
      courseRefId: mod.courseRefId || '',
      moduleName: mod.moduleName || mod.name || '',
      description: mod.description || '',
      displayOrder: mod.displayOrder ?? 1,
      status: mod.status || 'draft',
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);

    const refId = mod.moduleRefId || mod.id;
    if (refId) {
      moduleMasterService
        .getModule(refId)
        .then((fetched) => {
          if (fetched) {
            setForm({
              moduleRefId: fetched.moduleRefId || refId,
              courseRefId: fetched.courseRefId || mod.courseRefId || '',
              moduleName: fetched.moduleName || fetched.name || mod.moduleName || '',
              description: fetched.description || '',
              displayOrder: fetched.displayOrder ?? mod.displayOrder ?? 1,
              status: fetched.status || mod.status || 'draft',
            });
          }
        })
        .catch(() => {
          // Keep existing values on failure
        });
    }
  };

  const openView = (mod: Module) => {
    setViewingTarget(mod);
    const refId = mod.moduleRefId || mod.id;
    if (refId) {
      moduleMasterService
        .getModule(refId)
        .then((fetched) => {
          if (fetched) setViewingTarget(fetched);
        })
        .catch(() => {});
    }
  };

  const validateForm = (): string | null => {
    if (!form.courseRefId.trim()) {
      return 'Course is required. Please select a course.';
    }
    const trimmedName = form.moduleName.trim();
    if (!trimmedName) {
      return 'Module Name is required and cannot be empty.';
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
      const isEditMode = mode === 'edit' && Boolean(form.moduleRefId || editing?.moduleRefId);
      const targetRefId = isEditMode ? (form.moduleRefId || editing?.moduleRefId || '') : '';

      const payload: ModuleCreateInput | ModuleUpdateInput = {
        moduleRefId: targetRefId || undefined,
        courseRefId: form.courseRefId.trim(),
        moduleName: form.moduleName.trim(),
        description: form.description.trim(),
        displayOrder: Number(form.displayOrder) || 1,
        status: form.status,
      };

      await moduleMasterService.createModule(payload);

      if (isEditMode) {
        setSuccessMessage(`Module "${form.moduleName.trim()}" updated successfully.`);
      } else {
        setSuccessMessage(`Module "${form.moduleName.trim()}" created successfully.`);
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
    const targetRefId = deleteTarget.moduleRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete module: missing moduleRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await moduleMasterService.deleteModule({ moduleRefId: targetRefId });
      setSuccessMessage(`Module "${deleteTarget.moduleName || deleteTarget.name}" deleted successfully.`);
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

  const columns: Column<Module>[] = [
    {
      key: 'moduleCode',
      header: 'Module Code',
      render: (m) => (
        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
          {m.moduleCode || `MOD-${m.moduleId || '—'}`}
        </span>
      ),
    },
    {
      key: 'moduleName',
      header: 'Module Name',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{m.moduleName || m.name}</p>
            {m.moduleRefId && (
              <p className="font-mono text-xs text-gray-400 dark:text-gray-500" title={m.moduleRefId}>
                Ref: {m.moduleRefId.length > 18 ? `${m.moduleRefId.slice(0, 18)}…` : m.moduleRefId}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'courseRefId',
      header: 'Course',
      render: (m) => {
        const courseName = m.courseName || getCourseName(m.courseRefId);
        return (
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[180px]" title={courseName}>
              {courseName}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (m) => (
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={m.description || undefined}>
          {m.description ? m.description : <span className="text-gray-400 dark:text-gray-500 italic">—</span>}
        </p>
      ),
    },
    {
      key: 'displayOrder',
      header: 'Order',
      render: (m) => (
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
          {m.displayOrder ?? 1}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <StatusBadge status={m.status || 'draft'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Module Master"
        description="Organize courses into structured learning modules with custom order and descriptions."
        action={
          <button onClick={openCreate} className="btn-primary" id="create-module-btn">
            <Plus className="h-4 w-4" /> Add Module
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="module-status-filter">
              Status:
            </label>
            <select
              id="module-status-filter"
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

          {/* Course filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="module-course-filter">
              Course:
            </label>
            <select
              id="module-course-filter"
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setPage(1);
              }}
              className="input max-w-xs py-1 text-sm"
              disabled={coursesLoading}
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.courseRefId || c.id} value={c.courseRefId || c.id}>
                  {c.courseName || c.name}
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
        rowKey={(m) => m.moduleRefId || m.id || String(m.moduleId)}
        emptyMessage="No modules found."
        actions={(m) => {
          const refId = m.moduleRefId || m.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openView(m)}
                className="btn-ghost h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                title="View Module Details"
                aria-label="View Module Details"
                id={`view-module-${refId}`}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEdit(m)}
                className="btn-ghost h-8 w-8 p-0"
                title="Edit Module"
                aria-label="Edit Module"
                id={`edit-module-${refId}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(m)}
                className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600"
                title="Delete Module"
                aria-label="Delete Module"
                id={`delete-module-${refId}`}
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
        title={mode === 'edit' ? 'Edit Module' : 'Add Module'}
        description={
          mode === 'edit' && editing
            ? `Update module details for "${editing.moduleName || editing.name}".`
            : 'Fill in the module details below to organize curriculum content.'
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
              id="save-module-btn"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {mode === 'edit' ? 'Save changes' : 'Add Module'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <div>
            <label className="label" htmlFor="module-course">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              id="module-course"
              className="input"
              value={form.courseRefId}
              onChange={(e) => setForm({ ...form, courseRefId: e.target.value })}
              required
              disabled={coursesLoading}
            >
              <option value="" disabled>
                -- Select Course --
              </option>
              {courses.map((c) => (
                <option key={c.courseRefId || c.id} value={c.courseRefId || c.id}>
                  {c.courseName || c.name}
                </option>
              ))}
            </select>
            {courses.length === 0 && !coursesLoading && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No courses available. Please create a course in Course Master first.
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="module-name">
              Module Name <span className="text-red-500">*</span>
            </label>
            <input
              id="module-name"
              className="input"
              value={form.moduleName}
              onChange={(e) => setForm({ ...form, moduleName: e.target.value })}
              required
              placeholder="e.g. Introduction to Asynchronous Programming"
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="module-description">
              Description
            </label>
            <textarea
              id="module-description"
              className="input min-h-[84px] py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed syllabus, topics, or lessons included in this module..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="module-display-order">
                Display Order <span className="text-red-500">*</span>
              </label>
              <input
                id="module-display-order"
                type="number"
                min={1}
                className="input"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: Math.max(1, parseInt(e.target.value) || 1) })}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="module-status">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="module-status"
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ModuleStatus })}
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
        title="Module Details"
        description="Detailed specification and metadata for this module."
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingTarget.moduleName || viewingTarget.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    {viewingTarget.moduleCode || `MOD-${viewingTarget.moduleId || '—'}`}
                  </span>
                  <StatusBadge status={viewingTarget.status || 'draft'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Course
                </span>
                <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                  {viewingTarget.courseName || getCourseName(viewingTarget.courseRefId)}
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
                Module Reference ID
              </span>
              <p className="mt-1 font-mono text-xs text-gray-700 dark:text-gray-300 select-all">
                {viewingTarget.moduleRefId || viewingTarget.id || '—'}
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
        title="Delete Module?"
        description={`This will permanently delete "${deleteTarget?.moduleName || deleteTarget?.name}". This action cannot be undone.`}
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
              id="confirm-delete-module-btn"
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
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Are you sure you want to delete this module?
            </p>
            <p className="mt-1 text-xs">
              Sessions and lessons assigned to this module may need to be updated.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
