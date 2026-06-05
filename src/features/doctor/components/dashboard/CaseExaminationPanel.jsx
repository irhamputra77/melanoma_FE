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
