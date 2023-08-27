import { currentUser } from "@clerk/nextjs";
import { fetchPost } from "@/lib/actions/thread.actions";
import ThreadCard from "@/components/card/ThreadCard";

export default async function Home() {
  const result = await fetchPost(1, 30);
  const User = await currentUser();
  // console.log(result);
  return (
    <main>
      <h3 className="text-white">Home</h3>

      <section className="mt-9 flex flex-col gap-10">
        {result.posts.length === 0 ? (
          <p className="no-result">No threads found</p>
        ) : (
          <>
            {result.posts.map((post) => (
              <ThreadCard 
                key={post._id}
                id={post._id}
                currentUserId={User?.id || ""}
                parentId={post.parentId}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
              />
            ))}
          </>
        )}
      </section>
    </main>
  )
}
