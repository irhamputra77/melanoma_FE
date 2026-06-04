export default function ToggleSwitch({ checked = false, onClick, disabled = false, ariaLabel }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={checked}
            aria-label={ariaLabel}
            className={`relative h-6 w-11 rounded-full transition disabled:opacity-60 ${checked ? "bg-blue-600" : "bg-slate-300"}`}
        >
            <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`}
            />
        </button>
    );
}
