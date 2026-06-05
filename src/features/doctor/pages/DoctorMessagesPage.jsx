import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    CalendarDays,
    MessageSquare,
    Paperclip,
    PlusCircle,
    Search,
    Send,
    ShieldAlert,
    Trash2,
    X,
} from "lucide-react";
import doctorAvatar from "../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../utils/assets";
import {
    closeDoctorConsultation,
    deleteDoctorConsultation,
    getDoctorConsultationDetail,
    getDoctorConsultationMessages,
    getDoctorConsultations,
    markAllDoctorConsultationMessagesAsRead,
    sendDoctorConsultationMessage,
} from "../services/doctorChatService";

const filters = ["All Chats", "Open", "Closed"];
const dispositionOptions = [
    { label: "Case Resolved", value: "case_resolved" },
    { label: "Referred to Specialist", value: "referred_to_specialist" },
    { label: "Biopsy Scheduled", value: "biopsy_scheduled" },
];

export default function DoctorMessagesPage() {
    const [consultations, setConsultations] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState(filters[0]);
    const [dateFilterOpen, setDateFilterOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
    const [draftDateFilter, setDraftDateFilter] = useState({ startDate: "", endDate: "" });
    const [loadingList, setLoadingList] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [closing, setClosing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [closeCaseOpen, setCloseCaseOpen] = useState(false);
    const [deleteChatOpen, setDeleteChatOpen] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);
    const messagesRef = useRef([]);

    const selectedConversation = useMemo(() => {
        const base = consultations.find((conversation) => conversation.id === selectedId);
        return {
            ...base,
            ...normalizeConsultation(selectedDetail),
            id: selectedId || base?.id || "",
            patient: normalizePatientName(selectedDetail) || base?.patient || "Patient",
        };
    }, [consultations, selectedDetail, selectedId]);

    const visibleConsultations = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return consultations.filter((conversation) => {
            const matchesSearch = !query || `${conversation.patient} ${conversation.id}`.toLowerCase().includes(query);
            const matchesFilter =
                activeFilter === "All Chats" ||
                conversation.statusLabel === activeFilter;

            return matchesSearch && matchesFilter;
        });
    }, [activeFilter, consultations, searchTerm]);

    const scrollMessagesToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, []);

    const fetchConsultations = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setLoadingList(true);
        }
        setError("");

        try {
            const response = await getDoctorConsultations({
                page: 1,
                limit: 10,
                startDate: dateFilter.startDate,
                endDate: dateFilter.endDate,
            });
            const nextConsultations = response.data.map(normalizeConsultation);

            setConsultations(nextConsultations);
            setSelectedId((current) => current || nextConsultations[0]?.id || "");
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Failed to fetch consultations.");
        } finally {
            if (!silent) {
                setLoadingList(false);
            }
        }
    }, [dateFilter.endDate, dateFilter.startDate]);

    const fetchSelectedConversation = useCallback(async (consultationId, { silent = false } = {}) => {
        if (!consultationId) {
            setSelectedDetail(null);
            setMessages([]);
            return;
        }

        if (!silent) {
            setLoadingMessages(true);
        }
        setError("");

        try {
            const [detail, messageResponse] = await Promise.all([
                getDoctorConsultationDetail(consultationId),
                getDoctorConsultationMessages(consultationId, { page: 1, limit: 100 }),
            ]);
            const nextMessages = messageResponse.data.map(normalizeMessage);
            const hasNewMessages = hasMessageListChanged(messagesRef.current, nextMessages);

            setSelectedDetail(detail);
            setMessages(nextMessages);
            markAllDoctorConsultationMessagesAsRead(consultationId).catch(() => {});
            if (hasNewMessages) {
                window.setTimeout(scrollMessagesToBottom, 80);
            }
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Failed to fetch consultation messages.");
        } finally {
            if (!silent) {
                setLoadingMessages(false);
            }
        }
    }, [scrollMessagesToBottom]);

    useEffect(() => {
        fetchConsultations();
    }, [fetchConsultations]);

    useEffect(() => {
        fetchSelectedConversation(selectedId);
    }, [fetchSelectedConversation, selectedId]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        if (!selectedId) return undefined;

        const intervalId = window.setInterval(() => {
            if (document.hidden) return;
            fetchConsultations({ silent: true });
            fetchSelectedConversation(selectedId, { silent: true });
        }, 3000);

        return () => window.clearInterval(intervalId);
    }, [fetchConsultations, fetchSelectedConversation, selectedId]);

    const selectedIsClosed = String(selectedConversation.status || "").toUpperCase() === "CLOSED";
    const dateFilterActive = Boolean(dateFilter.startDate || dateFilter.endDate);

    const applyDateFilter = () => {
        setDateFilter(draftDateFilter);
        setDateFilterOpen(false);
        setSelectedId("");
    };

    const clearDateFilter = () => {
        const emptyFilter = { startDate: "", endDate: "" };
        setDraftDateFilter(emptyFilter);
        setDateFilter(emptyFilter);
        setDateFilterOpen(false);
        setSelectedId("");
    };

    const handleSendMessage = async ({ message, attachments = [] }) => {
        if (!selectedId || (!message.trim() && attachments.length === 0)) return;

        setSending(true);
        setError("");

        try {
            const sentMessage = await sendDoctorConsultationMessage(selectedId, {
                message: message.trim(),
                attachments,
            });
            const normalizedMessage = normalizeMessage(sentMessage);

            setMessages((current) => [
                ...current,
                normalizedMessage.text || normalizedMessage.attachments.length > 0
                    ? normalizedMessage
                    : createLocalDoctorMessage(message.trim(), attachments),
            ]);
            fetchConsultations();
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    const handleCloseCase = async ({ caseDisposition, finalClinicalNotes, emailClinicalSummary }) => {
        if (!selectedId || closing) return;

        setClosing(true);
        setError("");

        try {
            await closeDoctorConsultation(selectedId, {
                caseDisposition,
                finalClinicalNotes,
                emailClinicalSummary,
            });
            setCloseCaseOpen(false);
            await fetchConsultations();
            await fetchSelectedConversation(selectedId);
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Failed to close consultation.");
        } finally {
            setClosing(false);
        }
    };

    const handleDeleteClosedChat = async () => {
        if (!selectedId || !selectedIsClosed || deleting) return;

        setDeleting(true);
        setError("");

        try {
            await deleteDoctorConsultation(selectedId);
            setDeleteChatOpen(false);
            setSelectedId("");
            setSelectedDetail(null);
            setMessages([]);
            await fetchConsultations();
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Failed to delete consultation chat.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
        <div className="grid h-[calc(100vh-149px)] min-h-[680px] grid-cols-1 gap-8 overflow-hidden xl:grid-cols-[430px_minmax(0,1fr)]">
            <aside className="min-h-0 min-w-0 overflow-y-auto pr-1">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-[22px] font-extrabold text-slate-900">Patient Queue</h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Prioritized requests needing clinical response.
                        </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <MessageSquare size={19} />
                    </span>
                </div>

                {error && (
                    <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <div className="mb-6 flex flex-wrap gap-2">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setActiveFilter(filter)}
                            className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
                                activeFilter === filter
                                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="relative mb-5 flex gap-3">
                    <label className="relative min-w-0 flex-1">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by patient name or Case ID..."
                            className="h-14 w-full rounded-2xl border border-transparent bg-white pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={() => setDateFilterOpen((current) => !current)}
                        className={`flex h-14 items-center gap-2 rounded-2xl px-5 text-sm font-extrabold transition ${
                            dateFilterActive
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                                : "bg-white text-slate-700 hover:text-blue-600"
                        }`}
                    >
                        <CalendarDays size={17} />
                        {dateFilterActive ? "Filtered" : "Date"}
                    </button>
                    {dateFilterOpen && (
                        <DateFilterPopover
                            value={draftDateFilter}
                            onChange={setDraftDateFilter}
                            onApply={applyDateFilter}
                            onClear={clearDateFilter}
                        />
                    )}
                </div>

                <div className="space-y-4">
                    {loadingList && (
                        <div className="rounded-2xl bg-white px-5 py-8 text-center text-sm font-semibold text-slate-500">
                            Loading consultations...
                        </div>
                    )}

                    {!loadingList && visibleConsultations.length === 0 && (
                        <div className="rounded-2xl bg-white px-5 py-8 text-center text-sm font-semibold text-slate-500">
                            No consultations found.
                        </div>
                    )}

                    {!loadingList && visibleConsultations.map((conversation) => (
                        <QueueCard
                            key={conversation.id}
                            conversation={conversation}
                            active={conversation.id === selectedId}
                            onClick={() => setSelectedId(conversation.id)}
                        />
                    ))}
                </div>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-100">
                <ChatHeader
                    conversation={selectedConversation}
                    onCloseCase={() => setCloseCaseOpen(true)}
                    onDeleteChat={() => setDeleteChatOpen(true)}
                    closing={closing}
                    deleting={deleting}
                    closed={selectedIsClosed}
                />

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-10">
                    <div className="mb-7 flex items-center gap-5">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.36em] text-slate-500">
                            Conversation History
                        </span>
                        <span className="h-px flex-1 bg-slate-200" />
                    </div>

                    {loadingMessages && (
                        <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">
                            Loading messages...
                        </div>
                    )}

                    {!loadingMessages && messages.length === 0 && (
                        <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">
                            Select a consultation to review messages.
                        </div>
                    )}

                    {!loadingMessages && messages.length > 0 && (
                        <div className="space-y-6">
                            {messages.map((message) => (
                                <ChatMessage
                                    key={message.id}
                                    message={message}
                                    patientName={selectedConversation.patient}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <ChatComposer
                    patientName={selectedConversation.patient}
                    onSend={handleSendMessage}
                    disabled={!selectedId || sending || selectedIsClosed}
                    sending={sending}
                    closed={selectedIsClosed}
                />
            </section>
        </div>
        <CloseCaseModal
            open={closeCaseOpen}
            saving={closing}
            conversation={selectedConversation}
            onClose={() => setCloseCaseOpen(false)}
            onSubmit={handleCloseCase}
        />
        <DeleteClosedChatModal
            open={deleteChatOpen}
            deleting={deleting}
            conversation={selectedConversation}
            onClose={() => setDeleteChatOpen(false)}
            onConfirm={handleDeleteClosedChat}
        />
        </>
    );
}

function hasMessageListChanged(currentMessages, nextMessages) {
    if (currentMessages.length !== nextMessages.length) return true;

    const currentLast = currentMessages[currentMessages.length - 1];
    const nextLast = nextMessages[nextMessages.length - 1];

    return getMessageIdentity(currentLast) !== getMessageIdentity(nextLast);
}

function getMessageIdentity(message) {
    if (!message) return "";
    return message.id || `${message.senderRole || ""}-${message.createdAt || ""}-${message.text || ""}`;
}

function QueueCard({ conversation, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative w-full overflow-hidden rounded-2xl bg-white px-5 py-4 text-left transition hover:shadow-md ${
                active ? "shadow-sm ring-1 ring-blue-50" : ""
            }`}
        >
            {active && <span className="absolute inset-y-0 left-0 w-1 bg-blue-600" />}

            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-950">
                        {conversation.patient}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusPill
                            tone={conversation.statusLabel === "Closed" ? "red" : "slate"}
                            label={conversation.statusLabel}
                        />
                    </div>
                </div>
                <span className="mt-1 shrink-0 text-[11px] font-bold text-slate-500">
                    {conversation.time}
                </span>
            </div>

            <p className="mt-3 line-clamp-1 text-xs font-medium text-slate-500">
                "{conversation.preview}"
            </p>
        </button>
    );
}

function ChatHeader({ conversation, onCloseCase, onDeleteChat, closing, deleting, closed }) {
    return (
        <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div className="flex min-w-0 items-center gap-4">
                <Avatar name={conversation.patient} />
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-slate-950">
                        {conversation.patient}
                    </h2>
                    <p className="text-xs font-bold text-blue-600">{conversation.subject || "Consultation"}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {closed && (
                    <button
                        type="button"
                        onClick={onDeleteChat}
                        disabled={!conversation.id || deleting}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:text-red-300"
                    >
                        <Trash2 size={16} />
                        {deleting ? "Deleting..." : "Delete Chat"}
                    </button>
                )}
                <button
                    type="button"
                    onClick={onCloseCase}
                    disabled={!conversation.id || closing || closed}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-extrabold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 disabled:bg-red-300"
                >
                    <X size={16} />
                    {closing ? "Closing..." : "Close Case"}
                </button>
            </div>
        </div>
    );
}

function ChatMessage({ message, patientName }) {
    if (message.type === "system") {
        return (
            <div className="flex justify-center">
                <span className="inline-flex rounded-full bg-slate-100 px-5 py-2 text-xs font-extrabold text-slate-500">
                    {message.text}
                </span>
            </div>
        );
    }

    const isDoctor = message.type === "doctor";

    return (
        <div className={`flex items-start gap-4 ${isDoctor ? "justify-end" : ""}`}>
            {!isDoctor && <Avatar name={patientName} size="sm" />}

            <div
                className={`max-w-[760px] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                    isDoctor
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-100"
                }`}
            >
                {message.text && <p>{message.text}</p>}

                {message.note && (
                    <p className="mt-3 text-[11px] font-extrabold uppercase tracking-wide text-red-600">
                        {message.note}
                    </p>
                )}

                {message.image && (
                    <div className="mt-4 overflow-hidden rounded-xl bg-slate-950">
                        <img
                            src={message.image}
                            alt="Dermatoscopic lesion submitted by patient"
                            className="h-auto max-h-[360px] w-full object-cover"
                        />
                    </div>
                )}

                {message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {message.attachments.map((attachment) => (
                            <a
                                key={attachment.id || attachment.url || attachment.fileName}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                                    isDoctor ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                                }`}
                            >
                                <Paperclip size={14} />
                                <span className="truncate">{attachment.fileName || "Attachment"}</span>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {isDoctor && (
                <img
                    src={doctorAvatar}
                    alt="Doctor"
                    className="mt-2 h-8 w-8 shrink-0 rounded-full border border-blue-200 object-cover"
                />
            )}
        </div>
    );
}

function CloseCaseModal({ open, saving, conversation, onClose, onSubmit }) {
    const [form, setForm] = useState({
        caseDisposition: "biopsy_scheduled",
        notes: "",
        emailClinicalSummary: true,
    });

    useEffect(() => {
        if (!open) {
            setForm({
                caseDisposition: "biopsy_scheduled",
                notes: "",
                emailClinicalSummary: true,
            });
        }
    }, [open]);

    if (!open) return null;

    const submit = (event) => {
        event.preventDefault();
        if (!form.caseDisposition || !form.notes.trim()) return;
        onSubmit({
            caseDisposition: form.caseDisposition,
            finalClinicalNotes: form.notes.trim(),
            emailClinicalSummary: form.emailClinicalSummary,
        });
    };

    return (
        <ModalShell title="Close Clinical Case" onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Patient Summary</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-950">{conversation.patient || "-"}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Case Duration</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-950">{conversation.duration || "0 days"}</p>
                    </div>
                </div>

                <label className="block">
                    <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
                        Case Disposition <span className="text-red-600">*</span>
                    </span>
                    <div className="mt-3 space-y-2">
                        {dispositionOptions.map((option) => (
                            <label
                                key={option.value}
                                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200"
                            >
                                <input
                                    type="radio"
                                    name="case-disposition"
                                    value={option.value}
                                    checked={form.caseDisposition === option.value}
                                    onChange={(event) => setForm((current) => ({ ...current, caseDisposition: event.target.value }))}
                                    className="h-4 w-4 accent-blue-600"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </label>

                <label className="block">
                    <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Final Clinical Notes</span>
                    <textarea
                        value={form.notes}
                        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                        rows={4}
                        placeholder="Summarize the final diagnosis and follow-up plan..."
                        className="mt-2 w-full resize-none rounded-2xl border border-transparent bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
                    />
                </label>

                <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                    <input
                        type="checkbox"
                        checked={form.emailClinicalSummary}
                        onChange={(event) => setForm((current) => ({ ...current, emailClinicalSummary: event.target.checked }))}
                        className="h-4 w-4 rounded accent-blue-600"
                    />
                    Email clinical summary to patient
                </label>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !form.notes.trim()}
                        className="h-11 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white shadow-sm shadow-red-600/20 disabled:bg-red-300"
                    >
                        {saving ? "Closing..." : "Close Case"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function DeleteClosedChatModal({ open, deleting, conversation, onClose, onConfirm }) {
    const [confirmation, setConfirmation] = useState("");
    const requiredText = "DELETE CHAT";

    useEffect(() => {
        if (!open) setConfirmation("");
    }, [open]);

    if (!open) return null;

    const confirmed = confirmation.trim() === requiredText;

    return (
        <ModalShell title="Delete Closed Chat" onClose={onClose}>
            <div className="space-y-5">
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    This will permanently delete the closed consultation chat for{" "}
                    <span className="font-extrabold">{conversation.patient || "this patient"}</span>.
                    This action cannot be undone.
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Consultation</p>
                    <p className="mt-1 break-all text-sm font-extrabold text-slate-950">#{conversation.id || "-"}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">{conversation.subject || "Closed consultation"}</p>
                </div>

                <label className="block">
                    <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
                        Type "{requiredText}" to confirm
                    </span>
                    <input
                        type="text"
                        value={confirmation}
                        onChange={(event) => setConfirmation(event.target.value)}
                        className="mt-2 h-12 w-full rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-extrabold text-red-700 outline-none focus:border-red-200 focus:ring-4 focus:ring-red-100"
                    />
                </label>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting || !confirmed}
                        className="h-11 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white shadow-sm shadow-red-600/20 disabled:bg-red-300"
                    >
                        {deleting ? "Deleting..." : "Delete Chat"}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

function ModalShell({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
            <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl shadow-slate-950/20">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-extrabold text-slate-950">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function DateFilterPopover({ value, onChange, onApply, onClear }) {
    return (
        <div className="absolute right-0 top-16 z-20 w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100">
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Start Date</span>
                    <input
                        type="date"
                        value={value.startDate}
                        onChange={(event) => onChange((current) => ({ ...current, startDate: event.target.value }))}
                        className="mt-2 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100"
                    />
                </label>
                <label className="block">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">End Date</span>
                    <input
                        type="date"
                        value={value.endDate}
                        min={value.startDate || undefined}
                        onChange={(event) => onChange((current) => ({ ...current, endDate: event.target.value }))}
                        className="mt-2 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100"
                    />
                </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClear}
                    className="h-10 rounded-xl bg-slate-100 px-4 text-xs font-extrabold text-slate-600"
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={onApply}
                    className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-extrabold text-white shadow-sm shadow-blue-600/20"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}

function ChatComposer({ patientName, onSend, disabled, sending, closed }) {
    const [message, setMessage] = useState("");
    const [attachments, setAttachments] = useState([]);
    const fileInputRef = useRef(null);

    const submitMessage = () => {
        if ((!message.trim() && attachments.length === 0) || disabled) return;
        onSend({ message, attachments });
        setMessage("");
        setAttachments([]);
    };

    const handleFilesSelected = (event) => {
        const files = Array.from(event.target.files || []);
        setAttachments((current) => [...current, ...files].slice(0, 5));
        event.target.value = "";
    };

    return (
        <div className="border-t border-slate-100 px-6 py-5 lg:px-10">
            {closed && (
                <div className="mb-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500">
                    Consultation closed. New messages are disabled.
                </div>
            )}
            {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                        <span
                            key={`${file.name}-${index}`}
                            className="inline-flex max-w-full items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                        >
                            <Paperclip size={14} />
                            <span className="max-w-[220px] truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                className="text-blue-400 hover:text-red-600"
                                aria-label={`Remove ${file.name}`}
                            >
                                <Trash2 size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <div className="flex items-center gap-4 rounded-2xl bg-slate-100 px-4 py-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFilesSelected}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-white hover:text-blue-600"
                    aria-label="Add attachment"
                >
                    <PlusCircle size={21} />
                </button>
                <input
                    type="text"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") submitMessage();
                    }}
                    placeholder={`Write a response to ${patientName.split(" ")[0] || "patient"}...`}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 disabled:text-slate-400"
                    disabled={disabled}
                />
                <button
                    type="button"
                    onClick={submitMessage}
                    disabled={disabled || (!message.trim() && attachments.length === 0)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-blue-300"
                    aria-label={sending ? "Sending message" : "Send message"}
                >
                    <Send size={17} />
                </button>
            </div>
        </div>
    );
}

function StatusPill({ tone = "slate", label }) {
    const classes = {
        emerald: "bg-emerald-100 text-emerald-700",
        slate: "bg-slate-100 text-slate-600",
        red: "bg-red-100 text-red-700",
    };

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${classes[tone]}`}>
            {tone === "red" ? <ShieldAlert size={12} /> : null}
            {label}
        </span>
    );
}

function Avatar({ name, size = "md" }) {
    const dimensions = size === "sm" ? "h-8 w-8 text-[11px]" : "h-12 w-12 text-sm";

    return (
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-orange-100 font-extrabold text-orange-700 ${dimensions}`}>
            {initialsFromName(name)}
        </span>
    );
}

function normalizeConsultation(item = {}) {
    item = item || {};

    const id = item.consultationId || item.id || item._id || "";
    const patient = normalizePatientName(item);
    const status = item.status || item.consultationStatus || "";
    const subject = item.subject || item.typeLabel || item.requestType || "Verification Request";
    const preview = item.lastMessage?.message || item.lastMessage?.text || item.latestMessage || item.notes || "No messages yet.";

    return {
        ...item,
        id,
        patient,
        subject,
        preview,
        duration: formatCaseDuration(item.createdAt, item.closedAt),
        statusLabel: toStatusLabel(status),
        time: formatRelativeTime(item.lastMessageAt || item.updatedAt || item.createdAt),
    };
}

function normalizeMessage(item = {}) {
    item = item || {};

    const senderRole = `${item.senderRole || item.role || item.sender?.role || item.type || ""}`.toLowerCase();
    const isDoctor = senderRole.includes("doctor") || senderRole.includes("physician");
    const text = item.message || item.text || item.content || "";
    const attachments = normalizeAttachments(item.attachments);
    const imageUrl = item.imageUrl || item.attachmentUrl || firstImageAttachment(attachments)?.url || item.clinicalImage?.imageUrl;

    return {
        id: item.messageId || item.id || item._id || `${Date.now()}-${Math.random()}`,
        type: isDoctor ? "doctor" : item.system ? "system" : "patient",
        text,
        note: item.note || "",
        image: imageUrl ? toAssetUrl(imageUrl) : "",
        attachments,
        createdAt: item.createdAt,
    };
}

function createLocalDoctorMessage(message, files = []) {
    return {
        id: `local-${Date.now()}`,
        type: "doctor",
        text: message,
        attachments: files.map((file, index) => ({
            id: `local-attachment-${index}`,
            fileName: file.name,
            url: "#",
        })),
    };
}

function normalizePatientName(item = {}) {
    item = item || {};

    return item.patient?.fullName || item.patient?.name || item.patientName || item.user?.fullName || item.user?.name || "";
}

function toStatusLabel(status) {
    if (!status) return "Follow-up";

    return status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCaseDuration(startValue, endValue) {
    if (!startValue) return "0 days";

    const start = new Date(startValue);
    const end = endValue ? new Date(endValue) : new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "0 days";

    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    return days === 1 ? "1 day" : `${days} days`;
}

function formatRelativeTime(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return diffDays === 1 ? "Yesterday" : `${diffDays}d ago`;
}

function initialsFromName(name = "") {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function normalizeAttachments(attachments = []) {
    if (!Array.isArray(attachments)) return [];

    return attachments.map((attachment, index) => ({
        id: attachment.id || attachment.attachmentId || `${attachment.url || attachment.fileName || "attachment"}-${index}`,
        fileName: attachment.fileName || attachment.filename || attachment.name || "Attachment",
        mimeType: attachment.mimeType || attachment.type || "",
        url: attachment.url ? toAssetUrl(attachment.url) : "#",
    }));
}

function firstImageAttachment(attachments = []) {
    return attachments.find((attachment) => attachment.mimeType?.startsWith("image/"));
}
