'use client';

import { useMemo, useState } from 'react';
import ChampionCard from '@/components/ChampionCard';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';

export default function ChampionBrowser({ champions, tags, version }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return champions.filter((champ) => {
      const matchesSearch =
        !term ||
        champ.name.toLowerCase().includes(term) ||
        champ.title.toLowerCase().includes(term);
      // A champion must carry every selected tag (e.g. Mage + Support).
      const matchesTags = selectedTags.every((tag) => champ.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [champions, searchTerm, selectedTags]);

  const toggleTag = (tag) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  return (
    <>
      <div className="filters-container">
        <SearchBar onSearch={setSearchTerm} searchTerm={searchTerm} />
        <TagFilter
          tags={tags}
          selectedTags={selectedTags}
          onTagToggle={toggleTag}
          onClear={() => setSelectedTags([])}
        />
        <p className="result-count" aria-live="polite">
          {filtered.length} of {champions.length} champions
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">No champion matches that search.</p>
      ) : (
        <div className="grid">
          {filtered.map((champ) => (
            <ChampionCard key={champ.id} champion={champ} version={version} />
          ))}
        </div>
      )}
    </>
  );
}
