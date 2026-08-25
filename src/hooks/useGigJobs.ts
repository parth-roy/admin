import { useQuery } from '@tanstack/react-query';
import { gigApi } from '../lib/api/gig.api';

export function useGigJobs() {
  return useQuery({
    queryKey: ['gig-jobs'],
    queryFn: () => gigApi.getAll(),
  });
}

export function useGigJob(id: string) {
  return useQuery({
    queryKey: ['gig-job', id],
    queryFn: () => gigApi.getById(id),
    enabled: !!id,
  });
}
