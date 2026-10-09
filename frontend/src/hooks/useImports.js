import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as importService from '../services/importService';
import { useToast } from '../context/ToastContext';

// Données que l'import peut créer ou modifier.
const IMPORTED_QUERY_KEYS = ['bookings', 'booking', 'booking-stats', 'containers', 'container', 'clients', 'vehicles'];

/** Aperçu : aucune écriture, l'erreur éventuelle est affichée dans la page. */
export function usePreviewExcelImport() {
  return useMutation({
    mutationFn: (file) => importService.previewExcelImport(file),
  });
}

export function useCommitExcelImport() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (file) => importService.commitExcelImport(file),
    onSuccess: ({ report }) => {
      IMPORTED_QUERY_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      const { created, errors } = report;
      const summary = `Import terminé : ${created.containers} conteneur(s) et ${created.bookings} booking(s) créés.`;
      showToast(errors.length ? `${summary} ${errors.length} ligne(s) en erreur.` : summary, 'success');
    },
    onError: (err) => {
      showToast(err.message || "Impossible d'importer le fichier.", 'error');
    },
  });
}
