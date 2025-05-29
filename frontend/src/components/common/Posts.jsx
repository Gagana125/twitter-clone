import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
// import { POSTS } from "../../utils/db/dummy";

const Posts = ({feedType, username, userId}) => {
	// const isLoading = false;

	const getPostEndPoints = () => {
		switch (feedType) {
			case "forYou" :
				return "/api/posts/all";
			case "following" :
				return "/api/posts/following";
			case "posts" :
				return `/api/posts/user/${username}`;
			case "liked" :
				return `/api/posts/likes/${userId}`;
			default:
				return "/api/posts/all";
		}
	}

	const POST_ENDPOINT = getPostEndPoints();

	const {data: posts, isLoading, refetch, isRefetching} = useQuery({
		queryKey: ["posts"],
		queryFn: async () => {
			try {
				const response = await fetch(POST_ENDPOINT);
				const data = await response.json();
				if (!response.ok) {
					throw new Error("Failed to fetch posts");
				}
				return data;
			} catch (error) {
				console.error("Error fetching posts:", error);
				return [];
			}
			
		},
	});

	useEffect(() => {
		refetch();
	}, [feedType, refetch, username]);

	return (
		<>
			{(isLoading || isRefetching) && (
				<div className='flex flex-col justify-center'>
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}
			{!isLoading && !isRefetching && posts?.length === 0 && <p className='text-center my-4'>No posts in this tab. Switch 👻</p>}
			{!isLoading && !isRefetching && posts && (
				<div>
					{posts.map((post) => (
						<Post key={post._id} post={post} />
					))}
				</div>
			)}
		</>
	);
};
export default Posts;