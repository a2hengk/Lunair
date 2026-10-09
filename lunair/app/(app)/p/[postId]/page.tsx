import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { getPost } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import { DeletePostButton } from "./delete-button";

type Props = { params: Promise<{ postId: string }> };

export const metadata: Metadata = { title: "Beitrag" };

export default async function PostPage({ params }: Props) {
  const me = await requireUser();
  const { postId } = await params;
  const post = await getPost(postId);
  if (!post) notFound();

  return (
    <>
      <header className="flex items-center justify-between px-4 pt-4 pb-1">
        <Link href={`/u/${post.author.username}`} className="py-1 text-muted hover:text-ink">
          Zum Profil
        </Link>
        {post.author.id === me.id && <DeletePostButton postId={post.id} />}
      </header>
      <PostCard post={post} linkToPost={false} />
    </>
  );
}
