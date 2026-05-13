import StatCard from "./StatCard";
import requestIcon from "../../../../assets/Icon_request_dashboard.png";
import pendingReviewIcon from "../../../../assets/Icon_pending_review.png";
import completeScanIcon from "../../../../assets/Icon_complete_scan.png";

export default function DoctorStats() {
    return (
        <div className="grid grid-cols-3 gap-8">
            <StatCard
                title="Total Requests"
                value="1,284"
                icon={requestIcon}
                badge="+12%"
                color="blue"
            />

            <StatCard
                title="Pending Review"
                value="42"
                icon={completeScanIcon}
                color="orange"
            />

            <StatCard
                title="Completed Scans"
                value="1,242"
                icon={pendingReviewIcon}
                badge="98% Accuracy"
                color="green"
            />

        </div>
    );
}
