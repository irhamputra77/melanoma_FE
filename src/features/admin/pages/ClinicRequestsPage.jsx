import { useEffect, useMemo, useState } from 'react';
import {
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    UsersRound,
    X,
    XCircle,
} from 'lucide-react';
import { createClinic, deleteClinic, getClinics, updateClinic } from '../../../services/clinicService';
import { getClinicRequests, resolveClinicRequest } from '../../../services/clinicRequestService';
import { getEmailValidationError, normalizeEmail } from '../../../utils/emailValidation';
import {
    DEFAULT_ADMIN_PAGE_SIZE,
    formatAdminDate,
    isStrictDeleteConfirmationEnabled,
} from '../../../utils/adminSettings';

const tabs = [
    { key: 'clinics', label: 'Clinic Directory' },
    { key: 'requests', label: 'Approval Requests' },
];

const blankClinic = {
    name: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
};

export default function ClinicRequestsPage() {
    const [activeTab, setActiveTab] = useState('clinics');
    const [clinics, setClinics] = useState([]);
    const [requests, setRequests] = useState([]);
    const [clinicMeta, setClinicMeta] = useState({ page: 1, limit: DEFAULT_ADMIN_PAGE_SIZE, total: 0 });
    const [requestMeta, setRequestMeta] = useState({ page: 1, limit: DEFAULT_ADMIN_PAGE_SIZE, total: 0 });
    const [clinicPage, setClinicPage] = useState(1);
    const [requestPage, setRequestPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reviewTarget, setReviewTarget] = useState(null);
    const [clinicForm, setClinicForm] = useState(null);
    const [clinicFormMode, setClinicFormMode] = useState('create');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [modalError, setModalError] = useState('');

    const fetchClinics = async (overrides = {}) => {
        const nextPage = overrides.page || clinicPage;
        const response = await getClinics({
            page: nextPage,
            isActive: statusFilter,
            search: search.trim() || undefined,
        });
        const parsed = parsePagedResponse(response);
        setClinics(parsed.data.map(normalizeClinic));
        setClinicMeta(parsed.meta || { page: nextPage, limit: DEFAULT_ADMIN_PAGE_SIZE, total: parsed.data.length });
    };

    const fetchRequests = async () => {
        const response = await getClinicRequests({
            page: requestPage,
            status: 'pending',
            search: search.trim() || undefined,
        });
        const parsed = parsePagedResponse(response);
        setRequests(parsed.data.map(normalizeRequest));
        setRequestMeta(parsed.meta || { page: requestPage, limit: DEFAULT_ADMIN_PAGE_SIZE, total: parsed.data.length });
    };

    const refreshData = async () => {
        setLoading(true);
        setError('');

        try {
            await Promise.all([fetchClinics(), fetchRequests()]);
        } catch (err) {
            setError(getApiErrorMessage(err) || 'Gagal memuat data clinic.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [clinicPage, requestPage, statusFilter]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setClinicPage(1);
            setRequestPage(1);
            refreshData();
        }, 350);

        return () => clearTimeout(timeout);
    }, [search]);

    const stats = useMemo(() => {
        const active = clinics.filter((clinic) => clinic.isActive).length;
        const doctors = clinics.reduce((total, clinic) => total + Number(clinic.doctorsCount || 0), 0);

        return {
            total: clinicMeta.total || clinics.length,
            active,
            doctors,
            pending: requestMeta.total || requests.length,
        };
    }, [clinics, requests, clinicMeta.total, requestMeta.total]);

    const submitReview = async (event) => {
        event.preventDefault();
        if (!reviewTarget) return;

        if (reviewTarget.status === 'rejected' && !reviewTarget.reviewNote.trim()) {
            setError('Review note wajib diisi saat menolak request clinic.');
            return;
        }

        setActionLoading(true);
        setError('');
        setSuccess('');

        try {
            await resolveClinicRequest(reviewTarget.requestId, {
                status: reviewTarget.status,
                reviewNote: reviewTarget.reviewNote.trim() || 'Data clinic valid.',
            });
            setReviewTarget(null);
            await refreshData();
            setSuccess(reviewTarget.status === 'approved' ? 'Clinic request berhasil disetujui.' : 'Clinic request berhasil ditolak.');
            setActiveTab(reviewTarget.status === 'approved' ? 'clinics' : 'requests');
        } catch (err) {
            setError(getApiErrorMessage(err) || 'Gagal memproses clinic request.');
        } finally {
            setActionLoading(false);
        }
    };

    const submitClinic = async (event) => {
        event.preventDefault();
        if (!clinicForm) return;

        const validationError = validateClinicForm(clinicForm);
        if (validationError) {
            setModalError(validationError);
            return;
        }

        setActionLoading(true);
        setError('');
        setSuccess('');
        setModalError('');

        try {
            if (clinicFormMode === 'edit') {
                await updateClinic(clinicForm.clinicId, toClinicPayload(clinicForm));
            } else {
                await createClinic(toClinicPayload(clinicForm));
            }
            setClinicForm(null);
            setClinicFormMode('create');
            setActiveTab('clinics');
            if (clinicFormMode === 'edit') {
                await Promise.all([fetchClinics(), fetchRequests()]);
                setSuccess('Clinic berhasil diperbarui.');
            } else {
                setClinicPage(1);
                await Promise.all([fetchClinics({ page: 1 }), fetchRequests()]);
                setSuccess('Clinic berhasil ditambahkan.');
            }
        } catch (err) {
            setModalError(getApiErrorMessage(err) || `Gagal ${clinicFormMode === 'edit' ? 'memperbarui' : 'menambahkan'} clinic.`);
        } finally {
            setActionLoading(false);
        }
    };

    const submitDeleteClinic = async () => {
        if (!deleteTarget?.clinicId) return;

        setActionLoading(true);
        setError('');
        setSuccess('');
        setModalError('');

        try {
            await deleteClinic(deleteTarget.clinicId);
            setDeleteTarget(null);
            await refreshData();
            setSuccess(`${deleteTarget.name} berhasil dihapus permanen.`);
        } catch (err) {
            setModalError(getApiErrorMessage(err) || 'Gagal menghapus clinic.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl pb-10">
            <div className="mb-7 flex flex-col gap-5 sm:mb-9 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold leading-tight text-slate-950 sm:text-[40px]">
                        Clinic Management
                    </h1>
                    <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
                        Monitor registered clinics and review new clinic registration requests from one workspace.
                    </p>
                </div>

                <div className="grid gap-3 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
                    <button
                        type="button"
                        onClick={() => {
                            setError('');
                            setSuccess('');
                            setModalError('');
                            setClinicForm({ ...blankClinic });
                            setClinicFormMode('create');
                            setActiveTab('clinics');
                        }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white shadow-sm shadow-slate-900/20"
                    >
                        <Plus size={17} />
                        Add Clinic
                    </button>
                    <button
                        type="button"
                        onClick={refreshData}
                        disabled={loading}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 disabled:bg-blue-300"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh Data
                    </button>
                </div>
            </div>

            <div className="mb-7 grid gap-5 md:grid-cols-2 xl:grid-cols-2">
                <MetricCard title="Total Clinics" value={stats.total} icon={<Building2 size={18} />} tone="blue" />
                <MetricCard title="Active Clinics" value={stats.active} icon={<CheckCircle2 size={18} />} tone="emerald" />
            </div>

            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`h-10 rounded-full px-6 text-sm font-extrabold ${activeTab === tab.key
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-white text-slate-600 shadow-sm'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="relative block">
                        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search clinic or requester"
                            className="h-11 w-full rounded-xl bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none placeholder:text-slate-400 sm:w-72"
                        />
                    </label>
                    {activeTab === 'clinics' && (
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setClinicPage(1);
                            }}
                            className="h-11 w-full rounded-xl bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm outline-none sm:w-auto"
                        >
                            <option value="all">All clinics</option>
                            <option value="true">Active only</option>
                            <option value="false">Inactive only</option>
                        </select>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-6 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                    {success}
                </div>
            )}

            {activeTab === 'clinics' ? (
                <ClinicTable
                    clinics={clinics}
                    loading={loading}
                    onEdit={(clinic) => {
                        setError('');
                        setSuccess('');
                        setModalError('');
                        setClinicFormMode('edit');
                        setClinicForm({ ...clinic });
                    }}
                    onDelete={(clinic) => {
                        setError('');
                        setSuccess('');
                        setModalError('');
                        setDeleteTarget(clinic);
                    }}
                />
            ) : (
                <RequestTable
                    requests={requests}
                    loading={loading}
                    onReview={(request, status) => {
                        setError('');
                        setSuccess('');
                        setReviewTarget({
                            ...request,
                            status,
                            reviewNote: status === 'approved' ? 'Data clinic valid.' : '',
                        });
                    }}
                />
            )}

            <div className="mt-6 flex flex-col gap-4 px-1 text-sm text-slate-600 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p>
                    Showing <span className="font-extrabold text-slate-900">{activeTab === 'clinics' ? clinics.length : requests.length}</span> of{' '}
                    {activeTab === 'clinics' ? clinicMeta.total : requestMeta.total} records
                </p>
                <Pagination
                    page={activeTab === 'clinics' ? clinicMeta.page || clinicPage : requestMeta.page || requestPage}
                    total={activeTab === 'clinics' ? clinicMeta.total : requestMeta.total}
                    limit={activeTab === 'clinics' ? clinicMeta.limit || DEFAULT_ADMIN_PAGE_SIZE : requestMeta.limit || DEFAULT_ADMIN_PAGE_SIZE}
                    onPageChange={activeTab === 'clinics' ? setClinicPage : setRequestPage}
                />
            </div>

            {reviewTarget && (
                <ReviewModal
                    request={reviewTarget}
                    setRequest={setReviewTarget}
                    saving={actionLoading}
                    onClose={() => setReviewTarget(null)}
                    onSubmit={submitReview}
                />
            )}

            {clinicForm && (
                <ClinicFormModal
                    mode={clinicFormMode}
                    clinic={clinicForm}
                    setClinic={setClinicForm}
                    saving={actionLoading}
                    error={modalError}
                    onClose={() => {
                        setModalError('');
                        setClinicForm(null);
                    }}
                    onSubmit={submitClinic}
                />
            )}

            {deleteTarget && (
                <DeleteClinicModal
                    clinic={deleteTarget}
                    strictConfirmation={isStrictDeleteConfirmationEnabled()}
                    saving={actionLoading}
                    error={modalError}
                    onClose={() => {
                        setModalError('');
                        setDeleteTarget(null);
                    }}
                    onConfirm={submitDeleteClinic}
                />
            )}
        </div>
    );
}

function ClinicTable({ clinics, loading, onEdit, onDelete }) {
    return (
        <section className="admin-table-scroll overflow-x-auto rounded-[24px] border border-slate-200/70 bg-white shadow-sm sm:rounded-[28px]">
            <div className="grid min-w-[1240px] grid-cols-[1.1fr_1fr_1.25fr_0.55fr_0.65fr_0.75fr_0.55fr] gap-6 bg-slate-50 px-8 py-5 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                <span>Clinic</span>
                <span>Contact</span>
                <span>Address</span>
                <span>Doctors</span>
                <span>Status</span>
                <span>Updated</span>
                <span>Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
                {loading && <EmptyRow text="Loading clinics..." />}
                {!loading && clinics.length === 0 && <EmptyRow text="No clinics found." />}
                {!loading && clinics.map((clinic) => (
                    <article key={clinic.key} className="grid min-h-[96px] min-w-[1240px] grid-cols-[1.1fr_1fr_1.25fr_0.55fr_0.65fr_0.75fr_0.55fr] items-center gap-6 px-8 text-sm text-slate-700">
                        <div className="flex items-center gap-4">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <Building2 size={20} />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-base font-extrabold text-slate-950">{clinic.name}</p>
                                <p className="truncate text-xs font-semibold text-slate-400">{clinic.email || 'No clinic email'}</p>
                            </div>
                        </div>
                        <ContactStack email={clinic.email} phone={clinic.phone} />
                        <span className="line-clamp-2 pr-8 text-sm leading-relaxed text-slate-600">{clinic.address || '-'}</span>
                        <span className="font-extrabold text-slate-950">{clinic.doctorsCount ?? '-'}</span>
                        <StatusBadge active={clinic.isActive} />
                        <span className="text-sm font-semibold text-slate-500">{formatDate(clinic.updatedAt || clinic.createdAt)}</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onEdit(clinic)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                                aria-label="Edit clinic"
                            >
                                <Pencil size={17} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(clinic)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"
                                aria-label="Delete clinic"
                            >
                                <Trash2 size={17} />
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function RequestTable({ requests, loading, onReview }) {
    return (
        <section className="admin-table-scroll overflow-x-auto rounded-[24px] border border-slate-200/70 bg-white shadow-sm sm:rounded-[28px]">
            <div className="grid min-w-[980px] grid-cols-[1.05fr_1fr_1.2fr_1.1fr_0.9fr] gap-6 bg-slate-50 px-8 py-5 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                <span>Requested Clinic</span>
                <span>Requester</span>
                <span>Clinic Contact</span>
                <span>Address</span>
                <span>Review</span>
            </div>
            <div className="divide-y divide-slate-100">
                {loading && <EmptyRow text="Loading requests..." />}
                {!loading && requests.length === 0 && <EmptyRow text="No pending clinic requests." />}
                {!loading && requests.map((request) => (
                    <article key={request.key} className="grid min-h-[108px] min-w-[980px] grid-cols-[1.05fr_1fr_1.2fr_1.1fr_0.9fr] items-center gap-6 px-8 text-sm text-slate-700">
                        <div>
                            <p className="text-base font-extrabold text-slate-950">{request.clinicName}</p>
                            <p className="mt-1 text-xs font-semibold text-amber-600">Pending review</p>
                        </div>
                        <div>
                            <p className="font-extrabold text-slate-800">{request.requesterName}</p>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-400">{request.requesterEmail}</p>
                        </div>
                        <ContactStack email={request.email} phone={request.phone || request.requesterPhone} />
                        <span className="line-clamp-2 pr-8 text-sm leading-relaxed text-slate-600">{request.address || '-'}</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onReview(request, 'approved')}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                                aria-label="Approve clinic request"
                            >
                                <CheckCircle2 size={19} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onReview(request, 'rejected')}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
                                aria-label="Reject clinic request"
                            >
                                <XCircle size={19} />
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function MetricCard({ title, value, icon, tone }) {
    const toneClass = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-700',
        slate: 'bg-slate-100 text-slate-700',
    }[tone];

    return (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
                    {icon}
                </span>
            </div>
            <p className="text-[34px] font-extrabold leading-none text-slate-950">{Number(value || 0).toLocaleString('en-US')}</p>
        </section>
    );
}

function ReviewModal({ request, setRequest, saving, onClose, onSubmit }) {
    const isReject = request.status === 'rejected';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <form onSubmit={onSubmit} className="w-full max-w-[480px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">
                            {isReject ? 'Reject Clinic Request' : 'Approve Clinic Request'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{request.clinicName}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close review modal">
                        <X size={22} />
                    </button>
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                    <InfoLine icon={<Building2 size={16} />} value={request.clinicName} />
                    <InfoLine icon={<MapPin size={16} />} value={request.address || '-'} />
                    <InfoLine icon={<Mail size={16} />} value={request.email || request.requesterEmail || '-'} />
                </div>

                <label className="mt-5 block">
                    <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">
                        Review Note
                    </span>
                    <textarea
                        value={request.reviewNote}
                        onChange={(event) => setRequest((current) => ({ ...current, reviewNote: event.target.value }))}
                        placeholder={isReject ? 'Tuliskan alasan penolakan' : 'Catatan approval'}
                        className="min-h-28 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    />
                </label>

                <div className="mt-7 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className={`h-12 rounded-xl font-extrabold text-white shadow-lg disabled:opacity-60 ${isReject ? 'bg-red-600 shadow-red-600/20' : 'bg-blue-600 shadow-blue-600/20'}`}
                    >
                        {saving ? 'Saving...' : isReject ? 'Reject Request' : 'Approve Request'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function ClinicFormModal({ mode = 'create', clinic, setClinic, saving, error, onClose, onSubmit }) {
    const isEdit = mode === 'edit';
    const updateField = (field, value) => {
        setClinic((current) => ({ ...current, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <form noValidate onSubmit={onSubmit} className="w-full max-w-[540px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">{isEdit ? 'Edit Clinic' : 'Add Clinic'}</h2>
                        <p className="mt-1 text-sm text-slate-500">{isEdit ? 'Update clinic profile and active status.' : 'Create a clinic record for doctor assignment.'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close clinic modal">
                        <X size={22} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <ModalField label="Clinic Name" value={clinic.name} onChange={(value) => updateField('name', value)} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ModalField label="Email" value={clinic.email} type="email" maxLength={254} onChange={(value) => updateField('email', value)} />
                        <ModalField label="Phone" value={clinic.phone} onChange={(value) => updateField('phone', value)} />
                    </div>
                    <label className="block">
                        <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">Address</span>
                        <textarea
                            value={clinic.address || ''}
                            onChange={(event) => updateField('address', event.target.value)}
                            className="min-h-28 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">Status</span>
                        <select
                            value={clinic.isActive ? 'true' : 'false'}
                            onChange={(event) => updateField('isActive', event.target.value === 'true')}
                            className="h-12 w-full rounded-xl bg-slate-100 px-4 text-sm font-extrabold text-slate-800 outline-none"
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </label>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="h-12 rounded-xl bg-blue-600 font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:bg-blue-300">
                        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Clinic'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function DeleteClinicModal({ clinic, strictConfirmation, saving, error, onClose, onConfirm }) {
    const [confirmation, setConfirmation] = useState('');
    const confirmationText = `DELETE ${clinic.name}`;
    const canDelete = !strictConfirmation || confirmation === confirmationText;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">Delete {clinic.name}?</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            Clinic akan dihapus permanen dari sistem. Pastikan data ini memang tidak lagi dibutuhkan.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close delete modal">
                        <X size={22} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                {strictConfirmation && (
                    <label className="mb-5 block">
                        <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">
                            Ketik "{confirmationText}"
                        </span>
                        <input
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            className="h-12 w-full rounded-xl bg-red-50 px-4 text-sm font-extrabold text-red-700 outline-none ring-1 ring-red-100 placeholder:text-red-300"
                            placeholder={confirmationText}
                        />
                    </label>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} disabled={saving || !canDelete} className="h-12 rounded-xl bg-red-600 font-extrabold text-white shadow-lg shadow-red-600/20 disabled:bg-red-300">
                        {saving ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ModalField({ label, value, onChange, type = 'text', maxLength }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">{label}</span>
            <input
                type={type}
                maxLength={maxLength}
                value={value || ''}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
        </label>
    );
}

function ContactStack({ email, phone }) {
    return (
        <div className="min-w-0 space-y-2 text-xs font-semibold text-slate-500">
            <InfoLine icon={<Mail size={14} />} value={email || '-'} />
            <InfoLine icon={<Phone size={14} />} value={phone || '-'} />
        </div>
    );
}

function InfoLine({ icon, value }) {
    return (
        <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-slate-400">{icon}</span>
            <span className="truncate">{value}</span>
        </div>
    );
}

function StatusBadge({ active }) {
    return (
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-600' : 'bg-slate-400'}`} />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function EmptyRow({ text }) {
    return (
        <div className="px-8 py-12 text-center text-sm font-semibold text-slate-500">
            {text}
        </div>
    );
}

function Pagination({ page, total, limit, onPageChange }) {
    const totalPages = Math.max(1, Math.ceil(Number(total || 0) / Number(limit || DEFAULT_ADMIN_PAGE_SIZE)));

    return (
        <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm disabled:opacity-40">
                <ChevronLeft size={19} />
            </button>
            <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-600 px-3 font-extrabold text-white shadow-lg shadow-blue-600/20">
                {page}
            </span>
            <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm disabled:opacity-40">
                <ChevronRight size={19} />
            </button>
        </div>
    );
}

function parsePagedResponse(response) {
    const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.data)
                ? response.data.data
                : [];
    const meta = response?.meta || response?.data?.meta;

    return { data, meta };
}

function normalizeClinic(clinic) {
    return {
        key: clinic.clinicId || clinic.id || clinic.name,
        clinicId: clinic.clinicId || clinic.id || '',
        name: clinic.name || '-',
        address: clinic.address || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        isActive: clinic.isActive !== false,
        doctorsCount: clinic.doctorsCount,
        createdAt: clinic.createdAt,
        updatedAt: clinic.updatedAt,
    };
}

function normalizeRequest(request) {
    return {
        key: request.requestId || request.id || request.clinicName,
        requestId: request.requestId || request.id,
        clinicName: request.clinicName || request.name || '-',
        address: request.address || '',
        phone: request.phone || '',
        email: request.email || '',
        requesterName: request.requesterName || '-',
        requesterEmail: request.requesterEmail || '',
        requesterPhone: request.requesterPhone || '',
        createdAt: request.createdAt,
    };
}

function validateClinicForm(clinic) {
    if (!clinic.name?.trim()) return 'Clinic name wajib diisi.';
    const emailError = getEmailValidationError(clinic.email, { required: false });
    if (emailError) return emailError;
    return '';
}

function toClinicPayload(clinic) {
    return {
        name: clinic.name.trim(),
        email: clinic.email ? normalizeEmail(clinic.email) : undefined,
        phone: clinic.phone?.trim() || undefined,
        address: clinic.address?.trim() || undefined,
        isActive: Boolean(clinic.isActive),
    };
}

function formatDate(value) {
    return formatAdminDate(value);
}

function getApiErrorMessage(error) {
    const payload = error.response?.data;

    if (payload?.message) return payload.message;
    if (payload?.error) return payload.error;
    if (payload?.errors && typeof payload.errors === 'object') {
        return Object.values(payload.errors).flat().filter(Boolean).join(' ');
    }

    return '';
}
