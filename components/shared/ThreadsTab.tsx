import { fetchUserPost } from "@/lib/actions/thread.actions";
import { redirect } from "next/navigation";
import ThreadCard from "../card/ThreadCard";

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

const ThreadsTab = async ({ currentUserId, accountId, accountType }: Props) => {
  let result = await fetchUserPost(accountId);
    console.log(result)
  if (!result) redirect("/");
  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.thread.map((threads: any) => (
        <ThreadCard 
            id={threads._id}
            currentUserId={currentUserId}
            parentId={threads.parentId}
            content={threads.text}
            author={threads.author} //todo
            community={threads.community} //todo
            createdAt={threads.createdAt}
            comments={threads.children}
        />
      ))}
    </section>
  );
};

export default ThreadsTab;
