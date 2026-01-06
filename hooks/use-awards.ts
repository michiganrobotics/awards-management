import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award } from '@/lib/types';

// Query keys for cache management
export const awardsKeys = {
  all: ['awards'] as const,
  detail: (id: string) => ['awards', id] as const,
};

// Fetch all awards
export function useAwards() {
  return useQuery({
    queryKey: awardsKeys.all,
    queryFn: async (): Promise<Award[]> => {
      const response = await fetch('/api/awards');
      if (!response.ok) {
        throw new Error('Failed to fetch awards');
      }
      return response.json();
    },
  });
}

// Create a new award
export function useCreateAward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newAward: Partial<Award>): Promise<Award> => {
      const response = await fetch('/api/awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAward),
      });

      if (!response.ok) {
        throw new Error('Failed to create award');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch awards list
      queryClient.invalidateQueries({ queryKey: awardsKeys.all });
    },
  });
}
