const birthdayData = {
  name: "Sakshi",
  nickname: "Cartoon",
  birthDate: "2026-08-15",
  birthYear: 2005,
  birthdayMessage: "Today is about celebrating the person who makes ordinary moments feel a little more special.",
  openingMessage: "Today isn't just another day.\nIt's a day made for celebrating you.",
  finalMessage:
    "Sakshi, I hope this year gives you more reasons to smile, more places to explore, more dreams to chase, and more moments that make you stop and realize how far you've come.\n\nI love the way you are completely yourself, and I hope you never lose that.\n\nKeep growing.\nKeep dreaming.\nKeep laughing at the little things.\nKeep being the person I’m so lucky to call my girlfriend.\n\nHappy Birthday, Sakshi.\nI hope this year is as beautiful as you are.",
  finalSignature: "With all my love,\nNilay ❤️",
  finalClosing: {
  status: "Official Birthday Review:\n10/10 ✦",
  position: "Current Role:\nStealing Hearts Without Even Trying ❤️",
  duration: "Status:\nStill My Favorite Girl 💕",
  },
  sectionMessages: {
    countdown:
      "Something beautiful is almost here. One more moment until her day begins.",
    photoJourney:
      "Your smile, your little moments, the places you've been, and all the versions of you I hope you never stop becoming.",
    movableMemories:
      "So here's a little collection of you — arranged exactly the way my brain remembers you: everywhere.",
    videoFirst:
      "Another moment I didn't want to let disappear.",
    videoSecond:
      "Some memories are better felt than explained.",
    memoryUniverse:
      "Little moments, different places, different versions of you — somehow they all become part of what makes you, you.",
  },
  // 1. Birthday Reveal hero photo (1 unique photo: 1 (18).jpeg)
  heroPhoto: {
    src: "/assets/optimized/hero_photo.webp",
    caption: "That smile I never get tired of",
    label: "Chapter One",
    alt: "Sakshi hero photograph",
  },
  // 2. Photo Journey (8 unique photos celebrating HER)
  photoJourneyPhotos: [
    {
      src: "/assets/optimized/photo_journey_01.webp",
      caption: "You were never meant to blend into the background.",
      label: "Main Character Energy",
      alt: "Sakshi photo 1",
    },
    {
      src: "/assets/optimized/photo_journey_02.webp",
      caption: "Somehow, you make even ordinary light look beautiful.",
      label: "Golden Hour",
      alt: "Golden Hour memory",
    },
    {
      src: "/assets/optimized/photo_journey_03.webp",
      caption: "The kind of smile that can change the mood of an entire day.",
      label: "Behind the Birthday Girl 📸",
      alt: "Sakshi smiling",
    },
    {
      src: "/assets/optimized/photo_journey_04.webp",
      caption: "No explanation needed.",
      label: "Simply You",
      alt: "Sakshi photo 4",
    },
    {
      src: "/assets/optimized/photo_journey_05.webp",
      caption: "Not because it's perfect. Because it's you.",
      label: "One of My Favorites",
      alt: "Sakshi photo 5",
    },
    {
      src: "/assets/optimized/photo_journey_06.webp",
      caption: "Still unfairly charming.",
      label: "That Look",
      alt: "Sakshi photo 6",
    },
    {
      src: "/assets/optimized/photo_journey_07.webp",
      caption: "Proof that the best memories don't need a reason.",
      label: "Little Moment",
      alt: "Sakshi photo 7",
    },
    {
      src: "/assets/optimized/photo_journey_08.webp",
      caption: "Honestly, what else was I supposed to write?",
      label: "Beautiful, As Always",
      alt: "Sakshi photo 8",
    },
  ],
  // 3. Movable Memories (8 different unique photos)
  movableMemoryPhotos: [
    {
      src: "/assets/optimized/movable_01.webp",
      caption: "Floating thoughts of you",
      label: "Memory I",
      alt: "Movable memory 1",
    },
    {
      src: "/assets/optimized/movable_02.webp",
      caption: "A smile worth keeping",
      label: "Memory II",
      alt: "Movable memory 2",
    },
    {
      src: "/assets/optimized/movable_03.webp",
      caption: "Unfairly charming",
      label: "Memory III",
      alt: "Movable memory 3",
    },
    {
      src: "/assets/optimized/movable_04.webp",
      caption: "Unforgettable",
      label: "Memory IV",
      alt: "Movable memory 4",
    },
    {
      src: "/assets/optimized/movable_05.webp",
      caption: "Pure joy",
      label: "Memory V",
      alt: "Movable memory 5",
    },
    {
      src: "/assets/optimized/movable_06.webp",
      caption: "Golden light",
      label: "Memory VI",
      alt: "Movable memory 6",
    },
    {
      src: "/assets/optimized/movable_07.webp",
      caption: "Impossible to ignore",
      label: "Memory VII",
      alt: "Movable memory 7",
    },
    {
      src: "/assets/optimized/movable_08.webp",
      caption: "Close to my heart",
      label: "Memory VIII",
      alt: "Movable memory 8",
    },
  ],
  // 4. Memory Universe (8 different unique photos)
  memoryUniversePhotos: [
    {
      src: "/assets/optimized/universe_01.webp",
      caption: "Shining in your own light",
      label: "Star I",
      alt: "Universe memory 1",
    },
    {
      src: "/assets/optimized/universe_02.webp",
      caption: "Brightest light in my world",
      label: "Star II",
      alt: "Universe memory 2",
    },
    {
      src: "/assets/optimized/universe_03.webp",
      caption: "An endless sky of you",
      label: "Star III",
      alt: "Universe memory 3",
    },
    {
      src: "/assets/optimized/universe_04.webp",
      caption: "Timeless impression",
      label: "Star IV",
      alt: "Universe memory 4",
    },
    {
      src: "/assets/optimized/universe_05.webp",
      caption: "Soft radiance",
      label: "Star V",
      alt: "Universe memory 5",
    },
    {
      src: "/assets/optimized/universe_06.webp",
      caption: "Constellation of beauty",
      label: "Star VI",
      alt: "Universe memory 6",
    },
    {
      src: "/assets/optimized/universe_07.webp",
      caption: "A reason to smile",
      label: "Star VII",
      alt: "Universe memory 7",
    },
    {
      src: "/assets/optimized/universe_08.webp",
      caption: "So many memories left to make",
      label: "Star VIII",
      alt: "Universe memory 8",
    },
  ],
  // Fallback getter for photos
  get photos() {
    return this.photoJourneyPhotos
  },
  // 5 & 6. Video Posters (2 unique photos for videos)
  videos: {
    main: {
      src: "/assets/converted/VID_20260813205638-converted.mp4",
      title: "A Moment Just for You",
      poster: "/assets/optimized/hero_photo.webp",
      placeholder: "Your main birthday video.",
    },
    second: {
      src: "/assets/converted/VID20260707170652-converted.mp4",
      title: "A little moment worth remembering.",
      poster: "/assets/optimized/video1_poster.webp",
      placeholder: "Your second memory video.",
    },
  },
  music: "/assets/music/Saudebazi.mpeg",
}

export default birthdayData
