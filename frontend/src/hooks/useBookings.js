import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as bookingService from '../services/bookingService';

// Un 404 ne se corrigera pas en réessayant : on l'affiche tout de suite au lieu
// d'attendre les 3 tentatives par défaut de React Query.
function retryUnlessNotFound(failureCount, error) {
  return error?.status !== 404 && failureCount < 3;
}

export function useBookings(filters = {}) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => bookingService.getBookings(filters),
  });
}

export function useBooking(id) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBookingById(id),
    enabled: Boolean(id),
    retry: retryUnlessNotFound,
  });
}

export function useBookingStats(id) {
  return useQuery({
    queryKey: ['booking-stats', id],
    queryFn: () => bookingService.getBookingStats(id),
    enabled: !!id,
    staleTime: 30_000,
    retry: retryUnlessNotFound,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => bookingService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => bookingService.updateBooking(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats', id] });
    },
  });
}

export function useShippingCompanies() {
  return useQuery({
    queryKey: ['bookings', 'shipping-companies'],
    queryFn: () => bookingService.getShippingCompanies(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => bookingService.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
