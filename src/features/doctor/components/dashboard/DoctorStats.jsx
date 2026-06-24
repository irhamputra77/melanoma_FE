import StatCard from "./StatCard";
import requestIcon from "../../../../assets/Icon_request_dashboard.png";
import pendingReviewIcon from "../../../../assets/Icon_pending_review.png";
import completeScanIcon from "../../../../assets/Icon_complete_scan.png";

const defaultSummary = {
    totalRequests: 0,
    pendingReview: 0,
    completedScans: 0,
    accuracy: 0,
    growthPercentage: 0,
};

export default function DoctorStats({ summary, loading = false }) {
    const data = summary || defaultSummary;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 2xl:gap-8">
            <StatCard
                title="Total Requests"
                value={loading ? "..." : data.totalRequests?.toLocaleString("en-US")}
                icon={requestIcon}
                badge={loading ? "" : `+${data.growthPercentage || 0}%`}
                color="blue"
            />

            <StatCard
                title="Pending Review"
                value={loading ? "..." : data.pendingReview?.toLocaleString("en-US")}
                icon={completeScanIcon}
                color="orange"
            />

            <StatCard
                title="Completed Scans"
                value={loading ? "..." : data.completedScans?.toLocaleString("en-US")}
                icon={pendingReviewIcon}
                badge={loading ? "" : `${data.accuracy || 0}% Accuracy`}
                color="green"
            />

        </div>
    );
}
