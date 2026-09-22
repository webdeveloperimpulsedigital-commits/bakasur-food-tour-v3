export interface FoodTourCopy {
  line1: string;
  line2Prefix: string;
  highlight: string;
  line2Suffix?: string;
}

export interface FoodTourSpot {
  id: string;
  dishName: string;
  spotName: string;
  city: string;
  // Can be a static video (.mp4/.webm) or high-res image (.png/.jpg/.webp)
  eatingMedia: string;
  emptyMedia: string;
  eatingCopy: FoodTourCopy;
  emptyCopy: FoodTourCopy;
}

export const FOOD_TOUR_SPOTS: FoodTourSpot[] = [
  // 1. Giant Dosa
  {
    id: 'dosa',
    dishName: 'Crispy Butter Masala Dosa',
    spotName: 'Sri Krishna Dosa Corner',
    city: 'Pune',
    eatingMedia: '/images/all-frames/Dosa.mp4',
    emptyMedia: '/images/all-frames/Showing Empty Plate.mp4',
    eatingCopy: {
      line1: 'Dosa table se bada tha.',
      line2Prefix: 'Bakasur ki ',
      highlight: 'bhookh',
      line2Suffix: ' se nahi.'
    },
    emptyCopy: {
      line1: 'Dosa ne table bhar diya.',
      line2Prefix: 'Bakasur ka ',
      highlight: 'quota',
      line2Suffix: ' nahi.'
    }
  },

  // 2. Extra Butter Pav Bhaji
  {
    id: 'pav_bhaji',
    dishName: 'Extra Butter Pav Bhaji',
    spotName: 'Shivaji Chowk Famous Pav Bhaji',
    city: 'Pune',
    eatingMedia: '/images/all-frames/Pav Bhaji.mp4',
    emptyMedia: '/images/all-frames/Showing Empty Plate.mp4',
    eatingCopy: {
      line1: 'Amul butter ka swimming pool tha.',
      line2Prefix: 'Bakasur ne ',
      highlight: 'pura saaf',
      line2Suffix: ' kar diya.'
    },
    emptyCopy: {
      line1: 'Pav khatam, bhaji gayab.',
      line2Prefix: 'Bakasur bola: ',
      highlight: 'ek round aur',
      line2Suffix: ' banta hai!'
    }
  },

  // 3. Shahi Dum Biryani
  {
    id: 'biryani',
    dishName: 'Shahi Chicken Dum Biryani',
    spotName: 'Nawabi Handi Darbar',
    city: 'Pune',
    eatingMedia: '/images/all-frames/Biryani.mp4',
    emptyMedia: '/images/all-frames/Showing Empty Plate.mp4',
    eatingCopy: {
      line1: 'Puri handi ka dum nikal gaya.',
      line2Prefix: 'Bakasur ka ',
      highlight: 'dum',
      line2Suffix: ' abhi bhi baaki hai.'
    },
    emptyCopy: {
      line1: 'Chawal ka ek dana nahi chhoda.',
      line2Prefix: 'Pet bola bas, ',
      highlight: 'dil bola aur',
      line2Suffix: '!'
    }
  },

  // 4. Delhi Chole Bhature
  {
    id: 'chole_bhature',
    dishName: 'Sita Ram Chole Bhature',
    spotName: 'Nagpal Special Chole Bhature',
    city: 'Pune',
    eatingMedia: '/images/eating/chole_bhature.jpg',
    emptyMedia: '/images/all-frames/Showing Empty Plate.mp4',
    eatingCopy: {
      line1: 'Bhature phule the football jaise.',
      line2Prefix: 'Bakasur ne ',
      highlight: 'ek minute mein',
      line2Suffix: ' uda diye.'
    },
    emptyCopy: {
      line1: 'Plate chamak gayi shishe ki tarah.',
      line2Prefix: 'Bakasur ki bhookh ',
      highlight: 'unlimited',
      line2Suffix: ' hai!'
    }
  },

  // 5. Spicy Tarri Misal
  {
    id: 'misal',
    dishName: 'Spicy Katakirr Tarri Misal',
    spotName: 'Katakirr Tarri Misal Point',
    city: 'Pune',
    eatingMedia: '/images/eating/misal.jpg',
    emptyMedia: '/images/all-frames/Showing Empty Plate.mp4',
    eatingCopy: {
      line1: 'Teekhi tarri mein tha angaar.',
      line2Prefix: 'Bakasur ne ',
      highlight: 'haste haste',
      line2Suffix: ' piya!'
    },
    emptyCopy: {
      line1: 'Farsan khatam, rassa gayab.',
      line2Prefix: 'Agle spot pe ',
      highlight: 'kya milega',
      line2Suffix: '?'
    }
  }
];

export function getRandomFoodSpot(excludeIds: string[] = []): FoodTourSpot {
  const available = FOOD_TOUR_SPOTS.filter((s) => !excludeIds.includes(s.id));
  const pool = available.length > 0 ? available : FOOD_TOUR_SPOTS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
