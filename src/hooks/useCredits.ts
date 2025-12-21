import useSWR from 'swr';

type CreditsData = {
  balance: string;
  reserved: string;
  available: string;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useCredits() {
  const { data, error, isLoading, mutate } = useSWR<CreditsData>(
    '/api/user/credits',
    fetcher,
    {
      refreshInterval: 0, // Don't auto-refresh
      revalidateOnFocus: true, // Refresh when tab becomes active
    },
  );

  return {
    credits: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate, // Call this after purchases or submissions
  };
}
