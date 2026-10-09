import Link from 'next/link';
import { getChampion, img, stripTags } from '@/lib/ddragon';
import StatBar from '@/components/StatBar';

export async function generateMetadata({ params }) {
  const { name } = await params;
  const result = await getChampion(name);
  return { title: result?.champion ? `${result.champion.name} · Champion Mastery` : 'Champion not found' };
}

const BASE_STATS = [
  ['Health', 'hp', 'hpperlevel'],
  ['Armor', 'armor', 'armorperlevel'],
  ['Magic Resist', 'spellblock', 'spellblockperlevel'],
  ['Attack Damage', 'attackdamage', 'attackdamageperlevel'],
  ['Attack Speed', 'attackspeed', 'attackspeedperlevel', '%'],
  ['Move Speed', 'movespeed'],
  ['Attack Range', 'attackrange'],
  ['Health Regen', 'hpregen', 'hpregenperlevel'],
];

const KEYS = ['Q', 'W', 'E', 'R'];

export default async function ChampionPage({ params }) {
  const { name } = await params;
  const result = await getChampion(name);

  if (!result?.champion) {
    return (
      <div className="profile">
        <Link href="/" className="back-button">← All champions</Link>
        <div className="not-found">
          <h1>Champion not found</h1>
          <p>There is no champion with the id “{name}”.</p>
        </div>
      </div>
    );
  }

  const { version, champion: c } = result;

  return (
    <div className="profile">
      <div className="profile-splash" style={{ backgroundImage: `url(${img.splash(c.id)})` }} aria-hidden="true" />
      <Link href="/" className="back-button">← All champions</Link>

      <header className="profile-header">
        <p className="eyebrow">{c.tags.join(' · ')}</p>
        <h1 className="champion-name">{c.name}</h1>
        <p className="champion-title">{c.title}</p>
      </header>

      <div className="profile-content">
        <aside className="left-column">
          <img className="champion-portrait" src={img.loading(c.id)} alt={`${c.name} loading screen art`} width={308} height={560} />
          <section className="panel">
            <h2 className="section-title">Ratings</h2>
            <StatBar label="Attack" value={c.info.attack} />
            <StatBar label="Defense" value={c.info.defense} />
            <StatBar label="Magic" value={c.info.magic} />
            <StatBar label="Difficulty" value={c.info.difficulty} />
          </section>
        </aside>

        <div className="right-column">
          <section className="panel">
            <h2 className="section-title">Background</h2>
            <p className="blurb">{c.lore || c.blurb}</p>
          </section>

          <section className="panel">
            <h2 className="section-title">Abilities</h2>
            <div className="ability">
              <img className="ability-icon" src={img.passive(version, c.passive.image.full)} alt="" width={56} height={56} />
              <div>
                <h3 className="ability-name"><span className="ability-key">P</span>{c.passive.name}</h3>
                <p className="ability-description">{stripTags(c.passive.description)}</p>
              </div>
            </div>
            {c.spells.map((spell, i) => (
              <div className="ability" key={spell.id}>
                <img className="ability-icon" src={img.spell(version, spell.image.full)} alt="" width={56} height={56} />
                <div>
                  <h3 className="ability-name"><span className="ability-key">{KEYS[i]}</span>{spell.name}</h3>
                  <p className="ability-description">{stripTags(spell.description)}</p>
                  <p className="ability-meta">Cooldown {spell.cooldownBurn}s · Range {spell.rangeBurn}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="panel">
            <h2 className="section-title">Base stats</h2>
            <div className="stats-container">
              {BASE_STATS.map(([label, key, perLevel, unit = '']) => (
                <div className="stat-item" key={key}>
                  <div className="stat-label">{label}</div>
                  <div className="stat-value">{c.stats[key]}</div>
                  {perLevel && <div className="stat-per-level">+{c.stats[perLevel]}{unit} / level</div>}
                </div>
              ))}
            </div>
            <p className="resource">Resource: {c.partype || 'None'}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
