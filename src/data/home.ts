export type ComicHighlight = {
  id: string;
  title: string;
  cover: string;
  tagline: string;
  meta: string;
  latestChapter: string;
  updatedAt: string;
};

export type ComicUpdate = {
  id: string;
  title: string;
  cover: string;
  latestChapter: string;
  releaseAgo: string;
  previousChapter?: string;
  previousAgo?: string;
};

export const newComics: ComicHighlight[] = [
  {
    id: "reincarnated-villain",
    title: "I Reincarnated as a Hated Villainess",
    cover:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=640&q=80",
    tagline: "Fantasy • Romance",
    meta: "20+ chapters",
    latestChapter: "Chapter 22",
    updatedAt: "5 jam",
  },
  {
    id: "eater-of-all",
    title: "Eater of All",
    cover:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=640&q=80",
    tagline: "Action • Supernatural",
    meta: "Baru rilis",
    latestChapter: "Chapter 8",
    updatedAt: "3 jam",
  },
  {
    id: "dear-husband",
    title: "I Know, Dear Husband",
    cover:
      "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=640&q=80",
    tagline: "Drama • Romance",
    meta: "Top 10 minggu ini",
    latestChapter: "Chapter 12",
    updatedAt: "2 jam",
  },
  {
    id: "reincarnators-stream",
    title: "Reincarnator's Stream",
    cover:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80",
    tagline: "Action • Game",
    meta: "Badge live",
    latestChapter: "Chapter 17",
    updatedAt: "1 jam",
  },
  {
    id: "hayate-blade",
    title: "Hayate x Blade 2",
    cover:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=640&q=80",
    tagline: "Action • School",
    meta: "New season",
    latestChapter: "Chapter 5",
    updatedAt: "Baru saja",
  },
  {
    id: "saint-is-five",
    title: "The Saint Is Five",
    cover:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=640&q=80",
    tagline: "Fantasy • Comedy",
    meta: "Baru rilis",
    latestChapter: "Chapter 3",
    updatedAt: "30 menit",
  },
];

export const updatedComics: ComicUpdate[] = [
  {
    id: "fallen-family",
    title: "The Player Of The Fallen Family",
    cover:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=640&q=80",
    latestChapter: "Chapter 22",
    releaseAgo: "5 jam",
    previousChapter: "Chapter 21",
    previousAgo: "7 hari",
  },
  {
    id: "hidden-past",
    title: "The Player Hides His Past",
    cover:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=640&q=80",
    latestChapter: "Chapter 100",
    releaseAgo: "5 jam",
    previousChapter: "Chapter 99",
    previousAgo: "7 hari",
  },
  {
    id: "regressed-mage",
    title: "The Regressed Life Of A Back Alley Mage",
    cover:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=640&q=80",
    latestChapter: "Chapter 25",
    releaseAgo: "5 jam",
    previousChapter: "Chapter 24",
    previousAgo: "9 hari",
  },
  {
    id: "legendary-prodigy",
    title: "Dukedom's Legendary Prodigy",
    cover:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=640&q=80&sat=-100",
    latestChapter: "Chapter 24",
    releaseAgo: "5 jam",
  },
  {
    id: "demon-sovereign",
    title: "The Great Heavenly Demon Sovereign",
    cover:
      "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=640&q=80",
    latestChapter: "Chapter 29",
    releaseAgo: "5 jam",
    previousChapter: "Chapter 28",
    previousAgo: "9 hari",
  },
  {
    id: "mad-dog-duke",
    title: "The Mad Dog Of The Duke's Estate",
    cover:
      "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=640&q=80&sat=-30",
    latestChapter: "Chapter 33",
    releaseAgo: "5 jam",
    previousChapter: "Chapter 32",
    previousAgo: "9 hari",
  },
  {
    id: "martial-god",
    title: "The Martial God Who Regressed To Level 2",
    cover:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=640&q=80",
    latestChapter: "Chapter 105",
    releaseAgo: "18 jam",
    previousChapter: "Chapter 104",
    previousAgo: "7 hari",
  },
  {
    id: "chaos-demon",
    title: "Legend Of Heavenly Chaos Demon",
    cover:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=640&q=80&sat=-20",
    latestChapter: "Chapter 97",
    releaseAgo: "18 jam",
    previousChapter: "Chapter 96",
    previousAgo: "7 hari",
  },
  {
    id: "heavenly-demon",
    title: "The Heavenly Demon Can't Live A Normal Life",
    cover:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=640&q=80",
    latestChapter: "Chapter 178",
    releaseAgo: "18 jam",
  },
  {
    id: "reincarnators-stream",
    title: "Reincarnator's Stream",
    cover:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=640&q=80",
    latestChapter: "Chapter 18",
    releaseAgo: "17 jam",
  },
  {
    id: "heavenly-demon-sovereign",
    title: "The Great Heavenly Demon Sovereign",
    cover:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=640&q=80",
    latestChapter: "Chapter 29",
    releaseAgo: "10 jam",
  },
  {
    id: "mad-dog-continued",
    title: "The Mad Dog Of The Duke's Estate",
    cover:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=640&q=80",
    latestChapter: "Chapter 33",
    releaseAgo: "9 jam",
  },
];

