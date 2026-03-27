const RATING_ORDER = [
  'G',
  'TV-Y',
  'TV-Y7',
  'TV-G',
  'TV-PG',
  'PG',
  'PG-13',
  'TV-14',
  'R',
  'TV-MA',
];

export function getRatingIndex(rating) {
  if (!rating) return -1;
  const idx = RATING_ORDER.indexOf(rating);
  return idx === -1 ? -1 : idx;
}

export function isRatingAllowed(itemRating, maxRating) {
  if (!maxRating) return true;
  if (!itemRating) return true; // no rating = assume curated
  const itemIdx = getRatingIndex(itemRating);
  const maxIdx = getRatingIndex(maxRating);
  if (itemIdx === -1) return true; // unknown rating = allow
  if (maxIdx === -1) return true;
  return itemIdx <= maxIdx;
}

export function getAllRatings() {
  return [...RATING_ORDER];
}
