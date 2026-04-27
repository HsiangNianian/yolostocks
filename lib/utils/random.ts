import seedrandom from "seedrandom";

export type Rng = seedrandom.PRNG;

export function createRng(seed: string): Rng {
  return seedrandom(seed);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function randomBetween(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

export function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(randomBetween(rng, min, max + 1));
}

export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

export function pickOne<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function shuffle<T>(rng: Rng, input: readonly T[]): T[] {
  const items = [...input];

  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex]!, items[index]!];
  }

  return items;
}

export function weightedPick<T>(
  rng: Rng,
  options: readonly { value: T; weight: number }[],
): T {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let needle = rng() * total;

  for (const option of options) {
    needle -= option.weight;
    if (needle <= 0) {
      return option.value;
    }
  }

  return options[options.length - 1]!.value;
}

export function randomNormal(rng: Rng, mean = 0, stdDev = 1): number {
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = Math.max(rng(), Number.EPSILON);
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}
