import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Reactions } from "@/components/reaction-bar";
import { StickerImage } from "@/components/sticker-image";
import type { PostComment } from "@/lib/posts";
import { fullDate, timeAgo } from "@/lib/time-ago";
import { CommentForm, DeleteCommentButton, ReplyButton, ReplyProvider } from "./comment-controls";

function countAll(list: PostComment[]) {
  return list.reduce((n, c) => n + 1 + c.replies.length, 0);
}

/** „@name“ am Anfang einer Antwort hervorheben. */
function Body({ text }: { text: string }) {
  const m = /^(@[a-zA-Z0-9_.]+)(\s[\s\S]*)?$/.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      <span className="font-semibold text-dusk">{m[1]}</span>
      {m[2]}
    </>
  );
}

function CommentItem({
  comment,
  viewerId,
  postAuthorId,
  isReply,
}: {
  comment: PostComment;
  viewerId: string;
  postAuthorId: string;
  isReply?: boolean;
}) {
  const c = comment;
  const canDelete = c.author.id === viewerId || postAuthorId === viewerId;

  return (
    <li>
      <div className="flex gap-3">
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
          {c.body && (
            <p className="mt-0.5 whitespace-pre-line break-words">
              <Body text={c.body} />
            </p>
          )}
          {c.sticker && (
            <div className="mt-1">
              <StickerImage sticker={c.sticker} size="md" />
            </div>
          )}
          {c.stickerRemoved && <p className="mt-0.5 text-sm text-muted italic">Sticker wurde gelöscht</p>}

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <Reactions
              target={{ kind: "comment", id: c.id }}
              reactions={c.reactions}
              myReactions={c.myReactions}
              size="comment"
            />
            <ReplyButton commentId={c.id} name={c.author.name} username={c.author.username} />
            {canDelete && (
              <span className="ml-auto">
                <DeleteCommentButton commentId={c.id} />
              </span>
            )}
          </div>
        </div>
      </div>

      {!isReply && c.replies.length > 0 && (
        <ul className="mt-3 space-y-3 pl-11" aria-label={`Antworten auf ${c.author.name}`}>
          {c.replies.map((r) => (
            <CommentItem key={r.id} comment={r} viewerId={viewerId} postAuthorId={postAuthorId} isReply />
          ))}
        </ul>
      )}
    </li>
  );
}

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
  const total = countAll(comments);
  return (
    <ReplyProvider>
      <section id="kommentare" aria-labelledby="kommentare-titel" className="scroll-mt-4 px-4 pt-5">
        <h2 id="kommentare-titel" className="mb-3 font-semibold">
          {total === 0 ? "Kommentare" : total === 1 ? "1 Kommentar" : `${total} Kommentare`}
        </h2>

        {comments.length === 0 ? (
          <p className="mb-4 text-sm text-muted">Noch keine Kommentare. Schreib den ersten.</p>
        ) : (
          <ul className="mb-5 space-y-4">
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} viewerId={viewerId} postAuthorId={postAuthorId} />
            ))}
          </ul>
        )}

        <CommentForm postId={postId} />
      </section>
    </ReplyProvider>
  );
}
