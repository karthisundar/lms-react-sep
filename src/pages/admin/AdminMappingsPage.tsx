import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Link2, CirclePlay as PlayCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userSessionMappingService, sessionMasterService, userService } from '@/services';
import type {
  Session,
  User,
  UserSessionMapping,
  UserSessionMappingCreateInput,
  UserSessionMappingUpdateInput,
} from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner, StatusBadge } from '@/components/ui';

interface UserSessionMappingFormData {
  userSessionRefId: string;
  userId: string;
  sessionId: string;
  status: number;
}

const emptyForm: UserSessionMappingFormData = {
  userSessionRefId: '',
  userId: '',
  sessionId: '',
  status: 1,
};

interface AdminMappingsPageProps {
  initialMode?: 'create' | 'edit';
}

export default function AdminMappingsPage({ initialMode }: AdminMappingsPageProps = {}) {
  const navigate = useNavigate();
  const { id, userSessionRefId } = useParams<{ id?: string; userSessionRefId?: string }>();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/sessions" replace />;
  }

  const [rows, setRows] = useState<UserSessionMapping[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserSessionMapping | null>(null);
  const [form, setForm] = useState<UserSessionMappingFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<UserSessionMapping | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load users and sessions for selection dropdowns and table lookup
  useEffect(() => {
    Promise.all([
      userService.getAllUsers({ page: 1, pageSize: 200 }),
      sessionMasterService.getAllSessions({ page: 1, pageSize: 200 }),
    ])
      .then(([uRes, sRes]) => {
        setUsers(uRes.row || uRes.items || []);
        setSessions(sRes.row || sRes.items || []);
      })
      .catch(() => {});
  }, []);

  const getUserDisplay = (userId: number | string) => {
    if (!userId && userId !== 0) return { name: 'Unknown User', email: '' };
    const u = users.find(
      (item) =>
        String(item.user_id) === String(userId) ||
        String(item.id) === String(userId) ||
        item.user_ref_id === String(userId)
    );
    if (u) return { name: u.name, email: u.email };
    return { name: `User #${userId}`, email: '' };
  };

  const getSessionDisplay = (sessionId: string) => {
    if (!sessionId) return { name: '—', date: '' };
    const s = sessions.find((item) => item.sessionRefId === sessionId || item.id === sessionId);
    if (s) {
      return {
        name: s.sessionName || s.name || sessionId,
        date: s.startDate || s.date || '',
      };
    }
    return { name: sessionId, date: '' };
  };

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      setError(null);
      userSessionMappingService
        .getAllUserSessionMappings({ page: targetPage, pageSize, search: search || undefined })
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
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load user-session mappings'))
        .finally(() => setLoading(false));
    },
    [page, pageSize, search]
  );

  useEffect(() => {
    const t = setTimeout(() => load(page), 250);
    return () => clearTimeout(t);
  }, [load, page]);

  const handleCloseModal = () => {
    setModalOpen(false);
    if (initialMode) {
      navigate('/admin/mappings');
    }
  };

  const openCreate = () => {
    setMode('create');
    setEditing(null);

    const defaultUserId = users[0]?.user_ref_id || String(users[0]?.user_id ?? users[0]?.id ?? '');
    const defaultSessionId = sessions[0]?.sessionRefId || sessions[0]?.id || '';

    setForm({
      userSessionRefId: '',
      userId: defaultUserId,
      sessionId: defaultSessionId,
      status: 1,
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const openEdit = (m: UserSessionMapping) => {
    setMode('edit');
    setEditing(m);
    const refId = m.userSessionRefId || m.id || '';

    setForm({
      userSessionRefId: refId,
      userId: String(m.userId),
      sessionId: m.sessionId || '',
      status: m.status ?? 1,
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);

    // Call single record endpoint using userSessionRefId
    if (refId) {
      userSessionMappingService
        .getUserSessionMapping(refId)
        .then((fetched) => {
          if (fetched) {
            setForm({
              userSessionRefId: fetched.userSessionRefId || refId,
              userId: String(fetched.userId ?? m.userId),
              sessionId: fetched.sessionId ?? m.sessionId,
              status: fetched.status ?? m.status ?? 1,
            });
          }
        })
        .catch(() => {
          // Keep existing row values on fetch failure
        });
    }
  };

  useEffect(() => {
    if (initialMode === 'create') {
      openCreate();
    } else if (initialMode === 'edit') {
      const targetId = userSessionRefId || id;
      if (targetId) {
        userSessionMappingService
          .getUserSessionMapping(targetId)
          .then((fetched) => {
            if (fetched) openEdit(fetched);
          })
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, id, userSessionRefId]);

  const validateForm = (): string | null => {
    if (!form.userId) {
      return 'User is required. Please select a user.';
    }
    if (!form.sessionId) {
      return 'Session is required. Please select a session.';
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
      const isEditMode = mode === 'edit' && Boolean(form.userSessionRefId || editing?.userSessionRefId);
      const targetRefId = isEditMode
        ? form.userSessionRefId || editing?.userSessionRefId || ''
        : '';

      const payload: UserSessionMappingCreateInput | UserSessionMappingUpdateInput = {
        userSessionRefId: targetRefId,
        userId: form.userId,
        sessionId: form.sessionId,
        status: form.status,
      };

      await userSessionMappingService.createUserSessionMapping(payload);

      if (isEditMode) {
        setSuccessMessage('User session mapping updated successfully.');
      } else {
        setSuccessMessage('User session mapping created successfully.');
      }

      handleCloseModal();
      load(page);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetRefId = deleteTarget.userSessionRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete mapping: missing userSessionRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      // Backend deleteUserSessionMapping route is POST with body: { userSessionRefId }
      await userSessionMappingService.deleteUserSessionMapping(targetRefId);
      setSuccessMessage('User session mapping deleted successfully.');
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

  const canModifyMapping = () => {
    return isAdmin;
  };

  const columns: Column<UserSessionMapping>[] = [
    {
      key: 'user',
      header: 'User',
      render: (m) => {
        const userDisplay = m.user?.name ? { name: m.user.name, email: m.user.email } : getUserDisplay(m.userId);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {userDisplay.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{userDisplay.name}</p>
              {userDisplay.email && <p className="text-xs text-gray-400">{userDisplay.email}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'session',
      header: 'Session',
      render: (m) => {
        const sessionDisplay = m.session?.name
          ? { name: m.session.name, date: m.session.date || '' }
          : getSessionDisplay(m.sessionId);
        return (
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-brand-500" />
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-200">{sessionDisplay.name}</span>
              {sessionDisplay.date && (
                <p className="text-xs text-gray-400">
                  {new Date(sessionDisplay.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <StatusBadge status={m.status === 1 ? 'published' : 'draft'} />,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (m) =>
        m.createdAt
          ? new Date(m.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '—',
    },
  ];

  const targetDeleteUserDisplay = deleteTarget
    ? deleteTarget.user?.name
      ? { name: deleteTarget.user.name }
      : getUserDisplay(deleteTarget.userId)
    : null;

  const targetDeleteSessionDisplay = deleteTarget
    ? deleteTarget.session?.name
      ? { name: deleteTarget.session.name }
      : getSessionDisplay(deleteTarget.sessionId)
    : null;

  return (
    <div>
      <PageHeader
        title="User Session Mapping"
        description="Manage user session assignments."
        action={
          isAdmin ? (
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> Assign Session
            </button>
          ) : null
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
        rowKey={(m) => m.userSessionRefId || m.id || String(m.userSessionId)}
        actions={(m) => {
          const allowed = canModifyMapping();
          if (!allowed) return null;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openEdit(m)}
                className="btn-ghost h-8 w-8 p-0 text-brand-600 hover:text-brand-700 dark:text-brand-400"
                title="Edit Mapping"
                aria-label="Edit Mapping"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(m)}
                className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600"
                title="Remove Mapping"
                aria-label="Remove Mapping"
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
        onClose={handleCloseModal}
        title={mode === 'edit' ? 'Edit Mapping' : 'Assign Session'}
        description={
          mode === 'edit'
            ? 'Update the user or session connection.'
            : 'Map a user or student to a class session.'
        }
        footer={
          <>
            <button onClick={handleCloseModal} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {mode === 'edit' ? 'Save changes' : 'Assign'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <div>
            <label className="label">
              User <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
            >
              <option value="">Select user…</option>
              {users.map((u) => {
                const uId = u.user_ref_id || String(u.user_id ?? u.id);
                return (
                  <option key={uId} value={uId}>
                    {u.name} — {u.email}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="label">
              Session <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={form.sessionId}
              onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
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
          </div>

          <div>
            <label className="label">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
              required
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Once assigned, the user will be able to access this session's videos and learning material.</p>
          </div>

          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove mapping?"
        description={`This will unassign "${targetDeleteUserDisplay?.name || 'User'}" from "${targetDeleteSessionDisplay?.name || 'Session'}".`}
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
              Remove
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          The user will lose access to this session's videos immediately.
        </p>
      </Modal>
    </div>
  );
}
