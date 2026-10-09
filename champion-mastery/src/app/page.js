import ChampionBrowser from '@/components/ChampionBrowser';
import { getAllChampions, getUniqueTags } from '@/lib/ddragon';

export default async function ChampionsPage() {
  const { version, champions } = await getAllChampions();
  const tags = getUniqueTags(champions);

  // Only pass what the grid needs to the client.
  const list = champions.map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    tags: c.tags,
    image: c.image.full,
    difficulty: c.info.difficulty,
  }));

  return (
    <>
      <header className="header">
        <p className="eyebrow">League Tools</p>
        <h1>Champion Mastery</h1>
        <p className="subtitle">
          Every champion, their roles, base stats and abilities. Live from Data Dragon patch{' '}
          <span className="patch">{version}</span>.
        </p>
      </header>
      <ChampionBrowser champions={list} tags={tags} version={version} />
    </>
  );
}
