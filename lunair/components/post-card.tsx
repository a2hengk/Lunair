import Link from "next/link";
import type { FeedPost } from "@/lib/posts";
import { fullDate, timeAgo } from "@/lib/time-ago";
import { Avatar } from "./avatar";
import { MediaCarousel } from "./media-carousel";
import { ReactionBar } from "./reaction-bar";

/** Kurze reine Text-Beiträge („wie war dein Tag“) bekommen die Tagebuch-Schrift. */
const SHORT_TEXT = 140;

export function PostCard({ post, linkToPost = true }: { post: FeedPost; linkToPost?: boolean }) {
  const { author } = post;
  const profileHref = `/u/${author.username}`;
  const textOnly = post.media.length === 0;
  const diary = textOnly && post.body !== null && post.body.length <= SHORT_TEXT;

  const time = (
    <time dateTime={post.createdAt.toISOString()} title={fullDate(post.createdAt)}>
      {timeAgo(post.createdAt)}
    </time>
  );

  return (
    <article className="border-b border-line pb-4">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link href={profileHref} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <Avatar name={author.name} seed={author.username ?? author.id} image={author.image} size="sm" />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link href={profileHref} className="block truncate font-semibold">
            {author.name}
          </Link>
          <span className="text-sm text-muted">
            {linkToPost ? (
              <Link href={`/p/${post.id}`} className="hover:text-ink">
                {time}
              </Link>
            ) : (
              time
            )}
          </span>
        </div>
      </header>

      {post.media.length > 0 && <MediaCarousel media={post.media} alt={`Foto von ${author.name}`} />}

      {post.body && (
        <p
          className={
            diary
              ? "px-4 pt-1 font-display text-2xl leading-snug whitespace-pre-line break-words"
              : `px-4 whitespace-pre-line break-words ${textOnly ? "pt-1 text-lg leading-relaxed" : "pt-3"}`
          }
        >
          {post.body}
        </p>
      )}

      <ReactionBar
        postId={post.id}
        reactions={post.reactions}
        myReactions={post.myReactions}
        commentCount={post.commentCount}
        showCommentLink={linkToPost}
      />
    </article>
  );
}
