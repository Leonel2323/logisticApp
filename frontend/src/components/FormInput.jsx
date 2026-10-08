/**
 * Champ de formulaire texte générique, intégré à react-hook-form.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.name
 * @param {Function} props.register - `register` de react-hook-form
 * @param {Object} [props.error] - `formState.errors[name]` (objet avec `.message`)
 * @param {string} [props.type='text']
 * @param {string} [props.placeholder]
 * @param {boolean} [props.required=false]
 * @param {Object} [props.rules] - Règles de validation RHF (pattern/minLength/...).
 *   Si omis, `required` seul génère une règle `required` basique.
 */
export default function FormInput({
  label,
  name,
  register,
  error,
  type = 'text',
  placeholder,
  required = false,
  rules,
}) {
  const errorId = `${name}-error`;
  const validationRules = rules ?? (required ? { required: `${label} est requis.` } : {});

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-11 rounded border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
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
