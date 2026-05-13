import DoctorStats from "../components/dashboard/DoctorStats";
import AssignedCaseList from "../components/dashboard/AssignedCaseList";
import CaseExaminationPanel from "../components/dashboard/CaseExaminationPanel";

export default function DoctorDashboardPage() {
    return (
        <div>
            <DoctorStats />

            <div className="grid grid-cols-12 gap-8 mt-10">
                <div className="col-span-4">
                    <AssignedCaseList />
                </div>

                <div className="col-span-8">
                    <CaseExaminationPanel />
                </div>
            </div>
        </div>
    );
}