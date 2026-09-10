// Future: replace with Prisma Review model (productId, userId, rating 1-5, title, body, verified).
// Mock is deterministic per slug so builds are stable and cacheable.

export type Review = {
  id: string;
  author: string;
  rating: number; // 1-5
  title: string;
  body: string;
  date: string; // ISO
  verified: boolean;
  helpful: number;
};

export type RatingSummary = {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

const NAMES = [
  "Priya S.",
  "Rahul V.",
  "Aarav M.",
  "Sara K.",
  "Neha P.",
  "Kabir D.",
  "Ananya R.",
  "Vikram S.",
  "Meera J.",
  "Arjun T.",
];

const TITLES: Record<number, string[]> = {
  5: [
    "Absolutely love it",
    "Exceeded expectations",
    "Worth every rupee",
    "Perfect purchase",
    "Amazing quality",
  ],
  4: [
    "Really good, minor nits",
    "Solid and reliable",
    "Great value for money",
    "Happy with the purchase",
    "Does the job well",
  ],
  3: [
    "Decent, but could be better",
    "Average experience",
    "Okay for the price",
    "Mixed feelings",
  ],
  2: ["Not what I expected", "Could be better", "Disappointed"],
  1: ["Poor quality", "Do not recommend", "Regret buying"],
};

const BODIES: Record<number, string[]> = {
  5: [
    "Build quality feels premium and performance has been flawless from day one. Delivery was quick and packaging was clean. Will recommend to friends.",
    "Battery life and display are excellent. Setup was instant and everything just works. Very happy with this one.",
    "Looks even better in hand. Smooth experience, no lag, and the finish is top notch. Definitely a keeper.",
  ],
  4: [
    "Overall great product. One small thing I wish was better is the weight, but performance and service from Unboxd have been solid.",
    "Very satisfied. Sound and comfort are spot on for daily use. Would have given five stars if the case material was slightly better.",
    "Good value compared to alternatives I tried. Works as described and customer support was helpful.",
  ],
  3: [
    "It is okay for the price. Works fine day to day but there are a few rough edges that keep it from being great.",
    "Average. Does what it promises, nothing more. Might suit someone with simpler needs.",
  ],
  2: [
    "Faced a couple of issues within the first week. Support helped but it took time. Expecting better at this price.",
    "Design is nice but performance is inconsistent. Hoping a replacement sorts it.",
  ],
  1: [
    "Stopped working after a few days. Had to request a return. Not a good experience this time.",
    "Quality does not match the listing photos. Would not buy again.",
  ],
};

// simple seeded hash
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getReviewsForProduct(slug: string): Review[] {
  const seed = hashSeed(slug);
  const rand = mulberry32(seed);

  // 6-12 reviews per product, stable per slug
  const count = 6 + (seed % 7);
  const reviews: Review[] = [];
  const usedTitles = new Set<string>();

  for (let i = 0; i < count; i++) {
    // skew to 4-5 stars: 55% 5, 30% 4, 10% 3, 3% 2, 2% 1
    const r = rand();
    let rating: number;
    if (r < 0.55) rating = 5;
    else if (r < 0.85) rating = 4;
    else if (r < 0.95) rating = 3;
    else if (r < 0.98) rating = 2;
    else rating = 1;

    const titlePool = TITLES[rating];
    const bodyPool = BODIES[rating];
    let title = titlePool[Math.floor(rand() * titlePool.length)];
    if (usedTitles.has(title)) {
      const unused = titlePool.find((t) => !usedTitles.has(t));
      if (unused) title = unused;
      else title = `${title} ${i + 1}`;
    }
    usedTitles.add(title);
    const body = bodyPool[Math.floor(rand() * bodyPool.length)];
    const author = NAMES[Math.floor(rand() * NAMES.length)];
    // deterministic fixed base so ISR/cache does not shift per build
    const base = new Date("2026-01-01T00:00:00.000Z").getTime();
    const daysAgo = Math.floor(rand() * 90);
    const date = new Date(base - daysAgo * 864e5).toISOString();
    const verified = rand() > 0.2;
    const helpful = Math.floor(rand() * 24);

    reviews.push({
      id: `${slug}-${i}`,
      author,
      rating,
      title,
      body,
      date,
      verified,
      helpful,
    });
  }

  // newest first
  reviews.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return reviews;
}

export function getRatingSummary(reviews: Review[]): RatingSummary {
  if (reviews.length === 0) {
    return {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
  const distribution: RatingSummary["distribution"] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    distribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
  }
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution,
  };
}
