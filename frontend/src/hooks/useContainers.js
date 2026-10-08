import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as containerService from '../services/containerService';
import { useToast } from '../context/ToastContext';

export function useContainers(filters = {}) {
  return useQuery({
    queryKey: ['containers', filters],
    queryFn: () => containerService.getContainers(filters),
  });
}

export function useContainer(id) {
  return useQuery({
    queryKey: ['container', id],
    queryFn: () => containerService.getContainerById(id),
    enabled: Boolean(id),
  });
}

export function useCreateContainer() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data) => containerService.createContainer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      showToast('Conteneur créé avec succès.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Impossible de créer le conteneur.', 'error');
    },
  });
}

export function useUpdateContainer() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => containerService.updateContainer(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['container', id] });
      showToast('Conteneur mis à jour avec succès.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Impossible de mettre à jour le conteneur.', 'error');
    },
  });
}

export function useDeleteContainer() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id) => containerService.deleteContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      showToast('Conteneur supprimé avec succès.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Impossible de supprimer le conteneur.', 'error');
    },
  });
}

export function useMarkContainerProcessed() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => containerService.markContainerProcessed(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['container', id] });
      showToast('Conteneur marqué comme traité.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Impossible de marquer le conteneur comme traité.', 'error');
    },
  });
}

export function useContainerMovements(id) {
  return useQuery({
    queryKey: ['container', id, 'movements'],
    queryFn: () => containerService.getContainerMovements(id),
    enabled: Boolean(id),
  });
}

export function useContainerStatsByBooking(bookingId) {
  return useQuery({
    queryKey: ['containers', 'stats', bookingId],
    queryFn: () => containerService.getContainerStatsByBooking(bookingId),
    enabled: Boolean(bookingId),
  });
}
