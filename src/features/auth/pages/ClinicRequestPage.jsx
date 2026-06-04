import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClinicRequest } from '../../../services/clinicRequestService';

export default function ClinicRequestPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        clinicName: '',
        address: '',
        phone: '',
        email: '',
        requesterName: '',
        requesterEmail: '',
        requesterPhone: '',
        message: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((c) => ({ ...c, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.clinicName.trim() || !form.requesterName.trim() || !form.requesterEmail.trim()) {
            setError('clinicName, requesterName, dan requesterEmail wajib diisi.');
            return;
        }

        setLoading(true);
        try {
            await createClinicRequest(form);
            setSuccess('Clinic request berhasil dibuat. Admin akan meninjau permintaan Anda.');
            setTimeout(() => navigate('/auth/login'), 2500);
        } catch (err) {
            const payload = err.response?.data;
            const message = payload?.message || payload?.error;
            const errors = payload?.errors;

            if (errors) {
                setError(Object.values(errors).flat().join(' '));
            } else {
                setError(message || 'Gagal mengirim request. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto pt-12">
            <h2 className="text-2xl font-bold mb-4">Daftarkan Klinik Anda</h2>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            {success ? (
                <p className="text-sm text-emerald-600 mb-3">{success}</p>
            ) : (
                <>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input name="clinicName" placeholder="Clinic Name" value={form.clinicName} onChange={handleChange} className="w-full border-b py-2" />
                        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className="w-full border-b py-2" />
                        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="w-full border-b py-2" />
                        <input name="email" placeholder="Email Clinic" value={form.email} onChange={handleChange} className="w-full border-b py-2" />
                        <input name="requesterName" placeholder="Requester Name" value={form.requesterName} onChange={handleChange} className="w-full border-b py-2" />
                        <input name="requesterEmail" placeholder="Requester Email" value={form.requesterEmail} onChange={handleChange} className="w-full border-b py-2" />
                        <input name="requesterPhone" placeholder="Requester Phone" value={form.requesterPhone} onChange={handleChange} className="w-full border-b py-2" />
                        <textarea name="message" placeholder="Message (optional)" value={form.message} onChange={handleChange} className="w-full border-b py-2" />

                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded">
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>

                    <p className="mt-4 text-sm text-slate-500">
                        Kembali ke registrasi dokter?{' '}
                        <Link to="/auth/register" className="text-blue-600 font-semibold">
                            Kembali ke Register
                        </Link>
                    </p>
                </>
            )}
        </div>
    );
}
