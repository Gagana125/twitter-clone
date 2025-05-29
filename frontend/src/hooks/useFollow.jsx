import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const useFollow = () => {
    const queryClient = useQueryClient();

    const {mutate: follow, isPending} = useMutation({
        mutationFn: async (userId) => {
            try {
                const res = await fetch(`/api/users/follow/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error('Failed to follow user');
                }
                return data;
            } catch (error) {
                console.error("Error following user:", error);
                throw error; // Rethrow the error to handle it in the UI
            }
        },
        onSuccess: (data) => {
            Promise.all(
                [
                    queryClient.invalidateQueries({queryKey: ['suggestedUsers']}),
                    queryClient.invalidateQueries({queryKey: ['authUser']})
                ]
            )
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to follow user');
        }
    })
  return { follow, isPending }
}

export default useFollow;
