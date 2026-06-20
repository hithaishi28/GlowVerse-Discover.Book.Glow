import { Search, SlidersHorizontal } from 'lucide-react';

export function SearchFilters({ filters, setFilters }) {
  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_.9fr_.9fr_.9fr_.9fr_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45 dark:text-white/45" size={18} />
          <input className="focus-ring h-12 w-full rounded-md border border-ink/10 bg-pearl pl-10 pr-3 dark:border-white/10 dark:bg-ink" placeholder="Search salon, service, stylist, locality" value={filters.q} onChange={(event) => update('q', event.target.value)} />
        </label>
        <select className="focus-ring h-12 rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" value={filters.service} onChange={(event) => update('service', event.target.value)}>
          <option value="">Any service</option>
          <option value="Hair">Hair</option>
          <option value="Skin">Skin</option>
          <option value="Nails">Nails</option>
          <option value="Makeup">Makeup</option>
          <option value="Spa">Spa</option>
        </select>
        <select className="focus-ring h-12 rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" value={filters.rating} onChange={(event) => update('rating', event.target.value)}>
          <option value="">Any rating</option>
          <option value="4.8">4.8+</option>
          <option value="4.5">4.5+</option>
          <option value="4.2">4.2+</option>
        </select>
        <select className="focus-ring h-12 rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" value={filters.priceRange} onChange={(event) => update('priceRange', event.target.value)}>
          <option value="">Any price</option>
          <option value="0-999">Under Rs. 999</option>
          <option value="1000-2499">Rs. 1000-2499</option>
          <option value="2500-4999">Rs. 2500-4999</option>
          <option value="5000-99999">Rs. 5000+</option>
        </select>
        <select className="focus-ring h-12 rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" value={filters.sort} onChange={(event) => update('sort', event.target.value)}>
          <option value="rating">Sort by rating</option>
          <option value="popularity">Popularity</option>
          <option value="price">Price range</option>
          <option value="distance">Distance</option>
          <option value="aiMatch">AI Match</option>
        </select>
        <select className="focus-ring h-12 rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" value={filters.distance} onChange={(event) => update('distance', event.target.value)}>
          <option value="">Any distance</option>
          <option value="3">Within 3 km</option>
          <option value="6">Within 6 km</option>
          <option value="10">Within 10 km</option>
        </select>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} />
          {['luxury', 'ecoFriendly', 'openNow'].map((key) => (
            <label key={key} className="flex items-center gap-1 text-xs font-bold">
              <input type="checkbox" checked={filters[key] === 'true'} onChange={(event) => update(key, event.target.checked ? 'true' : '')} />
              {key === 'ecoFriendly' ? 'Eco' : key === 'openNow' ? 'Open' : 'Luxury'}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
