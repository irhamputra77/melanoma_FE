import CaseHistoryTable from "../components/historical/CaseHistoryTable";
import HistoricalCaseControls from "../components/historical/HistoricalCaseControls";
import PatientDetailPanel from "../components/historical/PatientDetailPanel";

export default function HistoricalCasePage() {
    return (
        <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 2xl:col-span-9">
                <HistoricalCaseControls />
                <CaseHistoryTable />
            </div>

            <div className="col-span-12 2xl:col-span-3">
                <PatientDetailPanel />
            </div>
        </div>
    );
}
