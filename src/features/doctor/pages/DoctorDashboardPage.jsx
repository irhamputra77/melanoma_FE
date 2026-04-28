export default function DoctorDashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Doctor Dashboard</h1>

            <div className="grid grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Requests" value="1,284" />
                <StatCard title="Pending Review" value="42" />
                <StatCard title="Completed Scans" value="1,242" />
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-4 space-y-4">
                    <h2 className="font-bold">Assigned</h2>
                    {["Sarah Johnson", "David Chen", "Aaron Minaj", "Kevin Smith"].map(
                        (name) => (
                            <div key={name} className="bg-white p-4 rounded-2xl shadow-sm">
                                <p className="font-semibold">{name}</p>
                                <p className="text-xs text-slate-500">ID: #SK-9921</p>
                            </div>
                        )
                    )}
                </div>

                <div className="col-span-8 bg-white p-8 rounded-3xl shadow-sm">
                    <p className="text-xs tracking-widest text-blue-600 font-bold mb-2">
                        CASE EXAMINATION
                    </p>
                    <h2 className="text-2xl font-bold mb-1">
                        Case #SK-9921: Sarah Johnson
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Dermatoscopy Analysis Request
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-56 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                            Clinical Image
                        </div>

                        <div className="bg-blue-50 p-6 rounded-2xl">
                            <p className="font-bold text-blue-600">AI Clinical Prediction</p>
                            <h3 className="text-3xl font-bold mt-6">88%</h3>
                            <p className="text-sm text-slate-600">Melanocytic Nevus</p>
                        </div>
                    </div>

                    <textarea
                        placeholder="Type your professional assessment here..."
                        className="w-full bg-slate-100 rounded-2xl p-4 mt-6 h-28 outline-none"
                    />

                    <div className="flex gap-4 mt-6">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">
                            Approve Diagnosis
                        </button>
                        <button className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold">
                            Reject / False Positive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value }) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm">
            <p className="text-sm text-slate-500">{title}</p>
            <h2 className="text-3xl font-bold mt-3">{value}</h2>
        </div>
    );
}