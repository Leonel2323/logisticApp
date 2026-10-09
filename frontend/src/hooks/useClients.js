import { useQuery } from '@tanstack/react-query';
import * as clientService from '../services/clientService';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getClients(),
    staleTime: 5 * 60 * 1000,
  });
}
