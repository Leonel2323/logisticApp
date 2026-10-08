import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import BookingSelect from '../components/BookingSelect';
import ClientSelect from '../components/ClientSelect';
import { useCreateContainer } from '../hooks/useContainers';

const TYPE_OPTIONS = [
  { value: '40FT', label: '40FT' },
  { value: '20FT', label: '20FT' },
  { value: '10FT', label: '10FT' },
];

const STATE_OPTIONS = [
  { value: 'PLEIN', label: 'Plein' },
  { value: 'VIDE', label: 'Vide' },
];

export default function ContainerNew() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);
  const createContainer = useCreateContainer();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      container_number: '',
      type: '',
      state: '',
      merchandise: '',
      booking_id: '',
      client_id: '',
      arrival_datetime: '',
    },
  });

  function onSubmit(values) {
    setSubmitError(null);

    const payload = {
      container_number: values.container_number.trim(),
      type: values.type,
      state: values.state,
      merchandise: values.merchandise.trim() || null,
      booking_id: Number(values.booking_id),
      client_id: values.client_id ? Number(values.client_id) : null,
      arrival_datetime: values.arrival_datetime ? new Date(values.arrival_datetime).toISOString() : null,
    };

    createContainer.mutate(payload, {
      onSuccess: () => navigate('/containers'),
      onError: (err) => setSubmitError(err.message || 'Impossible de créer le conteneur.'),
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800">Nouveau conteneur</h1>
        <Link
          to="/containers"
          className="flex min-h-11 items-center rounded border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Annuler
        </Link>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        {submitError && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <FormInput
          label="Numéro de conteneur"
          name="container_number"
          required
          placeholder="Ex : MSCU1234567"
          register={register}
          error={errors.container_number}
          rules={{
            required: 'Le numéro de conteneur est requis.',
            pattern: { value: /^[A-Za-z0-9]+$/, message: 'Le numéro de conteneur doit être alphanumérique.' },
            minLength: { value: 4, message: 'Le numéro de conteneur doit contenir au moins 4 caractères.' },
            maxLength: { value: 50, message: 'Le numéro de conteneur ne doit pas dépasser 50 caractères.' },
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            label="Type"
            name="type"
            required
            placeholder="Sélectionner un type"
            options={TYPE_OPTIONS}
            register={register}
            error={errors.type}
            rules={{ required: 'Le type est requis.' }}
          />

          <FormSelect
            label="État"
            name="state"
            required
            placeholder="Sélectionner un état"
            options={STATE_OPTIONS}
            register={register}
            error={errors.state}
            rules={{ required: "L'état est requis." }}
          />
        </div>

        <FormInput
          label="Marchandise"
          name="merchandise"
          placeholder="Ex : Pièces détachées"
          register={register}
          error={errors.merchandise}
          rules={{ maxLength: { value: 255, message: 'La marchandise ne doit pas dépasser 255 caractères.' } }}
        />

        <Controller
          control={control}
          name="booking_id"
          rules={{ required: 'Le booking est requis.' }}
          render={({ field, fieldState }) => (
            <BookingSelect value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />

        <Controller
          control={control}
          name="client_id"
          render={({ field }) => <ClientSelect value={field.value} onChange={field.onChange} />}
        />

        <FormInput
          label="Date d'arrivée"
          name="arrival_datetime"
          type="datetime-local"
          register={register}
          error={errors.arrival_datetime}
        />

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            to="/containers"
            className="flex min-h-11 items-center justify-center rounded border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:order-1"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={createContainer.isPending}
            className="flex min-h-11 items-center justify-center gap-2 rounded bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:order-2"
          >
            {createContainer.isPending && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            )}
            {createContainer.isPending ? 'Création...' : 'Créer le conteneur'}
          </button>
        </div>
      </form>
    </div>
  );
}
