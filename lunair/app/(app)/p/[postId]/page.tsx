import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { StickerImage } from "@/components/sticker-image";
import { PostCard } from "@/components/post-card";
import { getComments, getPost, getReactors } from "@/lib/posts";
import { requireUser } from "@/lib/session";
import { Comments } from "./comments";
import { DeletePostButton } from "./delete-button";

type Props = { params: Promise<{ postId: string }> };

export const metadata: Metadata = { title: "Beitrag" };

export default async function PostPage({ params }: Props) {
  const me = await requireUser();
  const { postId } = await params;
  const post = await getPost(postId, me.id);
  if (!post) notFound();

  const [comments, reactors] = await Promise.all([getComments(post.id, me.id), getReactors(post.id)]);

  return (
    <>
      <header className="flex items-center justify-between px-4 pt-2 pb-1">
        <BackButton fallback={`/u/${post.author.username}`} />
        {post.author.id === me.id && <DeletePostButton postId={post.id} />}
      </header>

      <PostCard post={post} linkToPost={false} />

      {reactors.length > 0 && (
        <ul className="space-y-1 border-b border-line px-4 py-3 text-sm" aria-label="Wer reagiert hat">
          {reactors.map((r) => (
            <li key={r.key} className="flex items-center gap-2">
              {r.sticker ? <StickerImage sticker={r.sticker} size="xs" /> : <span aria-hidden="true">{r.key}</span>}
              <span className="text-muted">
                {r.people.map((p, i) => (
                  <span key={`${p.username}-${i}`}>
                    {i > 0 && ", "}
                    <Link href={`/u/${p.username}`} className="text-ink hover:underline">
                      {p.name}
                    </Link>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Comments postId={post.id} comments={comments} viewerId={me.id} postAuthorId={post.author.id} />
    </>
  );
}
