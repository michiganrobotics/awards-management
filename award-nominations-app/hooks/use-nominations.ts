import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Nomination } from '@/lib/types';

// Query keys for cache management
export const nominationsKeys = {
  all: ['nominations'] as const,
  detail: (id: string) => ['nominations', id] as const,
  files: (id: string) => ['nominations', id, 'files'] as const,
};

// Fetch all nominations
export function useNominations() {
  return useQuery({
    queryKey: nominationsKeys.all,
    queryFn: async (): Promise<Nomination[]> => {
      const response = await fetch('/api/nominations');
      if (!response.ok) {
        throw new Error('Failed to fetch nominations');
      }
      return response.json();
    },
  });
}

// Fetch single nomination by ID
export function useNomination(id: string) {
  return useQuery({
    queryKey: nominationsKeys.detail(id),
    queryFn: async (): Promise<Nomination> => {
      const response = await fetch(`/api/nominations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch nomination');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Fetch nomination files
export function useNominationFiles(nominationId: string) {
  return useQuery({
    queryKey: nominationsKeys.files(nominationId),
    queryFn: async () => {
      const response = await fetch(`/api/files/${nominationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      return data.files || [];
    },
    enabled: !!nominationId,
  });
}

// Create a new nomination
export function useCreateNomination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newNomination: Partial<Nomination>): Promise<Nomination> => {
      const response = await fetch('/api/nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNomination),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create nomination');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch nominations list
      queryClient.invalidateQueries({ queryKey: nominationsKeys.all });
    },
  });
}

// Update a nomination
export function useUpdateNomination(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Nomination>): Promise<Nomination> => {
      const response = await fetch(`/api/nominations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update nomination');
      }

      return response.json();
    },
    onSuccess: (updatedNomination) => {
      // Update the specific nomination in cache
      queryClient.setQueryData(nominationsKeys.detail(id), updatedNomination);
      // Invalidate the list to ensure consistency
      queryClient.invalidateQueries({ queryKey: nominationsKeys.all });
    },
  });
}

// Delete a nomination
export function useDeleteNomination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/nominations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete nomination');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch nominations list
      queryClient.invalidateQueries({ queryKey: nominationsKeys.all });
    },
  });
}
