import Link from "next/link";
import { mediaUrl } from "@/lib/media-url";
import type { FeedPost } from "@/lib/posts";

function StackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 drop-shadow" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
      <rect x="7" y="7" width="13" height="13" rx="2.5" />
      <path d="M4 15V6.5A2.5 2.5 0 0 1 6.5 4H15" strokeLinecap="round" />
    </svg>
  );
}

/** Profil-Raster: Fotos als Kachel, Text-Beiträge als Notiz-Kachel. */
export function PostGrid({ posts }: { posts: FeedPost[] }) {
  return (
    <ul className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => {
        const cover = post.media[0];
        return (
          <li key={post.id}>
            <Link href={`/p/${post.id}`} className="relative block aspect-square overflow-hidden bg-surface">
              {cover ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(cover.path)}
                    alt={post.body ? post.body.slice(0, 80) : "Foto"}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                  />
                  {post.media.length > 1 && (
                    <span className="absolute top-1.5 right-1.5" aria-label={`${post.media.length} Fotos`}>
                      <StackIcon />
                    </span>
                  )}
                </>
              ) : (
                <span className="block size-full border-l-2 border-moon p-2.5 text-[0.8rem] leading-snug">
                  <span className="line-clamp-6 break-words">{post.body}</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
