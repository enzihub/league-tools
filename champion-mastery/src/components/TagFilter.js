'use client';

export default function TagFilter({ tags, selectedTags, onTagToggle, onClear }) {
  return (
    <div className="tag-filter-container">
      <span className="filter-title">Roles</span>
      <div className="tags-grid">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={selectedTags.includes(tag)}
            className={`tag-pill ${selectedTags.includes(tag) ? 'active' : ''}`}
            onClick={() => onTagToggle(tag)}
          >
            {tag}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button type="button" className="tag-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
