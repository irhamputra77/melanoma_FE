import { MoreVertical, Share2 } from "lucide-react";
import { useState } from "react";
import ClinicalImageCard from "./ClinicalImageCard";
import ClinicalImageMeta from "./ClinicalImageMeta";
import AiPredictionCard from "./AiPredictionCard";
import PatientNotesCard from "./PatientNotesCard";
import PhysicianObservationBox from "./PhysicianObservationBox";
import CaseActionButtons from "./CaseActionButtons";

export default function CaseExaminationPanel({
    caseDetails,
    loading = false,
    observation,
    onObservationChange,
    onSaveObservation,
    onApprove,
    onReject,
    actionLoading = "",
}) {
    const [shareStatus, setShareStatus] = useState("");

    if (loading) {
        return (
            <div className="bg-white rounded-[32px] p-10 text-center text-sm font-semibold text-slate-500">
                Loading case details...
            </div>
        );
    }

    if (!caseDetails) {
        return (
            <div className="bg-white rounded-[32px] p-10 text-center text-sm font-semibold text-slate-500">
                Select an assigned case to review.
            </div>
        );
    }

    const receivedDate = caseDetails.receivedAt
        ? new Date(caseDetails.receivedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
        : "";
    const handleShare = async () => {
        const shareUrl = createCaseShareUrl(caseDetails.caseId);
        const shareData = {
            title: `Case #${caseDetails.caseId}`,
            text: `Review case #${caseDetails.caseId}${caseDetails.patient?.name ? ` for ${caseDetails.patient.name}` : ""}.`,
            url: shareUrl,
        };

        setShareStatus("");

        try {
            if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
                await navigator.share(shareData);
                setShareStatus("Shared");
            } else {
                await copyToClipboard(shareUrl);
                setShareStatus("Link copied");
            }

            window.setTimeout(() => setShareStatus(""), 1800);
        } catch (error) {
            if (error.name !== "AbortError") {
                setShareStatus("Unable to share");
                window.setTimeout(() => setShareStatus(""), 2200);
            }
        }
    };

    return (
        <div className="bg-white rounded-[32px] p-8 xl:p-10">
            <div className="flex items-start justify-between gap-6 mb-8">
                <div>
                    <p className="text-[10px] tracking-[0.38em] text-blue-600 font-extrabold mb-3">
                        CASE EXAMINATION
                    </p>

                    <h2 className="text-[30px] leading-tight font-extrabold text-slate-900">
                        Case #{caseDetails.caseId}: {caseDetails.patient?.name}
                    </h2>

                    <p className="text-base text-slate-500 mt-2">
                        Dermatoscopy Analysis Request - Received {receivedDate}
                    </p>
                </div>

                <div className="flex items-center gap-5 text-slate-700">
                    {shareStatus && (
                        <span className="text-xs font-extrabold text-blue-600">
                            {shareStatus}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleShare}
                        className="rounded-full p-1 transition hover:bg-slate-100 hover:text-blue-600"
                        aria-label="Share case"
                        title="Share case"
                    >
                        <Share2 size={22} />
                    </button>

                    <button type="button" className="hover:text-blue-600 transition">
                        <MoreVertical size={24} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
                <div>
                    <ClinicalImageCard imageUrl={caseDetails.clinicalImage?.imageUrl} />
                    <ClinicalImageMeta clinicalImage={caseDetails.clinicalImage} />
                </div>

                <div className="space-y-6">
                    <AiPredictionCard aiPrediction={caseDetails.aiPrediction} />
                    <PatientNotesCard notes={caseDetails.patientNotes} />
                </div>
            </div>

            <div className="mt-10">
                <PhysicianObservationBox
                    value={observation}
                    onChange={onObservationChange}
                    onSave={onSaveObservation}
                    saving={actionLoading === "save"}
                />
            </div>

            <CaseActionButtons
                onApprove={onApprove}
                onReject={onReject}
                loading={actionLoading}
            />
        </div>
    );
}

function createCaseShareUrl(caseId) {
    const url = new URL(window.location.href);
    if (caseId) {
        url.searchParams.set("caseId", caseId);
    }
    return url.toString();
}

async function copyToClipboard(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
}
