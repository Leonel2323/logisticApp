/**
 * Textarea de formulaire générique, intégrée à react-hook-form.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.name
 * @param {Function} props.register - `register` de react-hook-form
 * @param {Object} [props.error] - `formState.errors[name]` (objet avec `.message`)
 * @param {number} [props.rows=3]
 * @param {string} [props.placeholder]
 * @param {Object} [props.rules] - Règles de validation RHF (maxLength/...).
 */
export default function FormTextarea({ label, name, register, error, rows = 3, placeholder, rules }) {
  const errorId = `${name}-error`;
  const validationRules = rules ?? {};

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`rounded border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
        {...register(name, validationRules)}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error.message}
        </p>
      )}
    </div>
  );
}
