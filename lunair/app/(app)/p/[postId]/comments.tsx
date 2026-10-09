import Link from "next/link";
import { Avatar } from "@/components/avatar";
import type { PostComment } from "@/lib/posts";
import { fullDate, timeAgo } from "@/lib/time-ago";
import { CommentForm, DeleteCommentButton } from "./comment-controls";

export function Comments({
  postId,
  comments,
  viewerId,
  postAuthorId,
}: {
  postId: string;
  comments: PostComment[];
  viewerId: string;
  postAuthorId: string;
}) {
  return (
    <section id="kommentare" aria-labelledby="kommentare-titel" className="scroll-mt-4 px-4 pt-5">
      <h2 id="kommentare-titel" className="mb-3 font-semibold">
        {comments.length === 0 ? "Kommentare" : comments.length === 1 ? "1 Kommentar" : `${comments.length} Kommentare`}
      </h2>

      {comments.length === 0 ? (
        <p className="mb-4 text-sm text-muted">Noch keine Kommentare. Schreib den ersten.</p>
      ) : (
        <ul className="mb-4 space-y-4">
          {comments.map((c) => {
            const canDelete = c.author.id === viewerId || postAuthorId === viewerId;
            return (
              <li key={c.id} className="flex gap-3">
                <Link href={`/u/${c.author.username}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                  <Avatar name={c.author.name} seed={c.author.username ?? c.author.id} image={c.author.image} size="xs" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <Link href={`/u/${c.author.username}`} className="font-semibold">
                      {c.author.name}
                    </Link>{" "}
                    <span className="text-muted">
                      <time dateTime={c.createdAt.toISOString()} title={fullDate(c.createdAt)}>
                        {timeAgo(c.createdAt)}
                      </time>
                    </span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-line break-words">{c.body}</p>
                </div>
                {canDelete && <DeleteCommentButton commentId={c.id} />}
              </li>
            );
          })}
        </ul>
      )}

      <CommentForm postId={postId} />
    </section>
  );
}
