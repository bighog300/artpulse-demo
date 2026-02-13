import Image from "next/image";
import Link from "next/link";

type EventCardProps = {
  title: string;
  startAt: string | Date;
  endAt?: string | Date | null;
  venueName?: string | null;
  venueSlug?: string | null;
  imageUrl?: string | null;
  href: string;
  badges?: string[];
  secondaryText?: string;
};

function formatRange(startAt: string | Date, endAt?: string | Date | null) {
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;
  return end ? `${start.toLocaleString()} – ${end.toLocaleString()}` : start.toLocaleString();
}

export function EventCard({ title, startAt, endAt, venueName, imageUrl, href, badges, secondaryText }: EventCardProps) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-lg border bg-white transition hover:border-zinc-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
      <div className="flex gap-3 p-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-zinc-100">
          {imageUrl ? <Image src={imageUrl} alt="" fill className="object-cover" sizes="80px" /> : <div className="flex h-full items-center justify-center text-xs text-zinc-500">No image</div>}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 font-semibold text-zinc-900 group-hover:underline">{title}</h3>
          <p className="text-sm text-zinc-700">{formatRange(startAt, endAt)}</p>
          {secondaryText ? <p className="text-xs text-zinc-600">{secondaryText}</p> : null}
          {venueName ? <p className="text-xs text-zinc-600">{venueName}</p> : null}
          {badges?.length ? <div className="flex flex-wrap gap-1 pt-1">{badges.map((badge) => <span key={badge} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">{badge}</span>)}</div> : null}
        </div>
      </div>
    </Link>
  );
}
