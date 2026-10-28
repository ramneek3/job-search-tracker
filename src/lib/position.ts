const GAP = 1024

/**
 * Fractional indexing: returns a position strictly between `before` and `after`
 * so a move only rewrites the moved card, never its neighbours.
 */
export function positionBetween(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return GAP
  if (before === undefined) return after! - GAP
  if (after === undefined) return before + GAP
  return (before + after) / 2
}

/** Position for a card dropped at `index` in a column (the card itself already removed). */
export function positionAtIndex(column: { position: number }[], index: number): number {
  return positionBetween(column[index - 1]?.position, column[index]?.position)
}
