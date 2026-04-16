import { ERROR_DATABASE } from "../data/errorDatabase";

export function matchError(input) {
  if (!input || !input.trim()) return null;

  const normalizedInput = input.trim();

  // Try exact pattern match first
  for (const entry of ERROR_DATABASE) {
    if (entry.pattern.test(normalizedInput)) {
      return entry;
    }
  }

  // Try fuzzy keyword match as fallback
  const inputLower = normalizedInput.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of ERROR_DATABASE) {
    let score = 0;
    for (const term of entry.searchTerms) {
      if (inputLower.includes(term.toLowerCase())) {
        score += term.length;
      }
    }
    for (const tag of entry.tags) {
      if (inputLower.includes(tag.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestScore > 3 ? bestMatch : null;
}

export function getErrorBySlug(slug) {
  return ERROR_DATABASE.find((entry) => entry.slug === slug) || null;
}

export function getErrorsByEcosystem(ecosystem) {
  return ERROR_DATABASE.filter((entry) => entry.ecosystem === ecosystem);
}
