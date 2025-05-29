import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();
    const {mutateAsync: updateProfile, isPending: isUpdatingProfile} = useMutation({
		mutationFn: async (FormData) => {
			try {
				const res = await fetch(`/api/users/update`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(FormData),
				});
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.message || "Failed to update profile");
				}
				return data;
			} catch (error) {
				throw new Error("Error updating profile: " + error.message);
			}
		},
		onSuccess: () => {
			toast.success("Profile updated successfully");
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["authUser"] }),
				queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
			]);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update profile");
		}
	});

    return {
        updateProfile,
        isUpdatingProfile
    };
}

export default useUpdateUserProfile
