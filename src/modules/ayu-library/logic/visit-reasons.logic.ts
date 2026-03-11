/**
 * Extract clean visit reason names from a JSON list, excluding specified names.
 */
export function extractVisitReasonNames(
  items: { name: string }[],
  excludedNames: string[]
): string[] {
  return items
    .map(item => item.name.replace(/\.json$/i, ''))
    .filter(item => !excludedNames.includes(item))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Filter names by a search term (case-insensitive).
 */
export function filterNamesBySearch(names: string[], search: string): string[] {
  if (!search) return [];
  return names.filter(n => n.toLowerCase().includes(search.toLowerCase()));
}

/**
 * Group names by their first letter (uppercased), sorted within each group.
 */
export function groupByFirstLetter(names: string[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  names.forEach(name => {
    const clean = name?.replace(/\s+/g, ' ').trim();
    const letter = clean.charAt(0).toUpperCase();

    if (!map[letter]) map[letter] = [];
    map[letter].push(clean);
  });

  Object.keys(map).forEach(letter => map[letter].sort());

  return map;
}
