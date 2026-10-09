'use client';

export default function SearchBar({ onSearch, searchTerm }) {
  return (
    <div className="search-container">
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search champions or titles…"
        aria-label="Search champions"
      />
    </div>
  );
}
