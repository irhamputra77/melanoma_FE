import ClinicalImageCard from "./ClinicalImageCard";
import ClinicalImageMeta from "./ClinicalImageMeta";
import GradcamImageCard from "./GradcamImageCard";
import AiPredictionCard from "./AiPredictionCard";
import PatientNotesCard from "./PatientNotesCard";
import PhysicianObservationBox from "./PhysicianObservationBox";
import CaseActionButtons from "./CaseActionButtons";
import GradcamAnnotationModal from "./GradcamAnnotationModal";
import { useState } from "react";

export default function CaseExaminationPanel({
    caseDetails,
    loading = false,
    observation,
    observationError = "",
    onObservationChange,
    onApprove,
    onReject,
    onSaveAnnotation,
    actionLoading = "",
}) {
    const [annotationOpen, setAnnotationOpen] = useState(false);

    if (loading) {
        return (
            <div className="rounded-[24px] bg-white p-6 text-center text-sm font-semibold text-slate-500 sm:rounded-[32px] sm:p-10">
                Loading case details...
            </div>
        );
    }

    if (!caseDetails) {
        return (
            <div className="rounded-[24px] bg-white p-6 text-center text-sm font-semibold text-slate-500 sm:rounded-[32px] sm:p-10">
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
        <div className="rounded-[24px] bg-white p-4 sm:rounded-[32px] sm:p-6 lg:p-8 xl:p-10">
            <div className="mb-6 flex items-start justify-between gap-6 sm:mb-8">
                <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.38em] text-blue-600 font-extrabold mb-3">
                        CASE EXAMINATION
                    </p>

                    <h2 className="break-words text-2xl font-extrabold leading-tight text-slate-900 sm:text-[30px]">
                        Case #{caseDetails.caseId}: {caseDetails.patient?.name}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500 sm:text-base">
                        Dermatoscopy Analysis Request - Received {receivedDate}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2 2xl:gap-8">
                <div className="min-w-0">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <ClinicalImageCard
                            clinicalImage={caseDetails.clinicalImage}
                            onOpenAnnotation={() => setAnnotationOpen(true)}
                        />
                        <GradcamImageCard gradcamUrl={caseDetails.aiPrediction?.gradcamUrl} />
                        {caseDetails.clinicalImage?.annotatedImageUrl && (
                            <GradcamImageCard
                                gradcamUrl={caseDetails.clinicalImage.annotatedImageUrl}
                                label="EDITED ANNOTATION"
                                emptyLabel="No edited annotation"
                            />
                        )}
                    </div>
                    <ClinicalImageMeta clinicalImage={caseDetails.clinicalImage} />
                </div>

                <div className="space-y-6">
                    <AiPredictionCard aiPrediction={caseDetails.aiPrediction} />
                    <PatientNotesCard notes={caseDetails.patientNotes} />
                </div>
            </div>

            <div className="mt-10">
                {observationError && (
                    <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                        {observationError}
                    </div>
                )}
                <PhysicianObservationBox
                    value={observation}
                    onChange={onObservationChange}
                />
            </div>

            <CaseActionButtons
                onApprove={onApprove}
                onReject={onReject}
                loading={actionLoading}
            />

            <GradcamAnnotationModal
                open={annotationOpen}
                caseDetails={caseDetails}
                saving={actionLoading === "annotation"}
                onClose={() => setAnnotationOpen(false)}
                onSave={async (file) => {
                    await onSaveAnnotation?.(file);
                    setAnnotationOpen(false);
                }}
            />
        </div>
    );
}
