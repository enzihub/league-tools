import Link from 'next/link';
import { img } from '@/lib/ddragon';

export default function ChampionCard({ champion, version }) {
  return (
    <Link href={`/${champion.id}`} className="champion-card">
      <img
        className="champion-image-card"
        src={img.square(version, champion.image)}
        alt=""
        width={120}
        height={120}
        loading="lazy"
      />
      <div className="champion-card-name">{champion.name}</div>
      <div className="champion-card-title">{champion.title}</div>
      <div className="champion-card-tags">{champion.tags.join(' · ')}</div>
    </Link>
  );
}
