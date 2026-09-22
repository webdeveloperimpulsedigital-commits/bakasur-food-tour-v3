import { Dish } from './db';

export interface DishTemplate {
  name: string;
  description: string;
  price: number;
  image: string;
  popularity: number;
  rating: number;
}

export interface CuisineProfile {
  name: string;
  keywords: string[];
  dishes: DishTemplate[];
}

// 1. EXACT SIGNATURE DISHES FOR ICONIC RESTAURANTS ACROSS INDIA
export const ICONIC_RESTAURANT_DISHES: Record<string, DishTemplate[]> = {
  // Hotel Panchali (Jangali Maharaj Road, Pune)
  'panchali': [
    {
      name: "Panchali Special Shahi Maharaja Thali",
      description: "Jangali Maharaj Road landmark royal feast: Puran Poli, Paneer Subzi, Spiced Amti, Bhakri, and Aamras.",
      price: 280,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Panchali Special Veg Kolhapuri with Butter Roti",
      description: "Spicy mixed vegetable curry cooked in fiery roasted Kolhapuri masala, served with tandoor rotis.",
      price: 210,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Panchali Shahi Dum Biryani with Veg Raita",
      description: "Fragrant saffron Basmati rice slow-cooked with fresh garden vegetables and paneer in sealed handi.",
      price: 240,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Panchali Special Paneer Butter Masala Handi",
      description: "Soft cottage cheese cubes simmered in rich creamy butter tomato gravy.",
      price: 230,
      image: "/images/eating/paneer_dish.jpg",
      popularity: 96,
      rating: 4.8
    }
  ],

  // Gajanan Vadapav (Thane)
  'gajanan': [
    {
      name: "Gajanan Special Yellow Chutney Vada Pav (2 Pcs)",
      description: "Thane's iconic golden potato vada stuffed in soft ladi pav, drenched in legendary spicy-tangy yellow besan chutney.",
      price: 50,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Crispy Kothimbir Vadi Plate",
      description: "Steamed fresh coriander cilantro diamond cakes shallow-fried crisp with sweet & spicy dip.",
      price: 80,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Crispy Sabudana Vada with Sweet Dahi",
      description: "Golden fried tapioca pearl patties with roasted crushed peanuts and spiced sweet curd.",
      price: 90,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.8
    },
    {
      name: "Spicy Schezwan Cheese Vada Pav",
      description: "Loaded with melted mozzarella cheese, fiery schezwan sauce, and garlic chutney.",
      price: 90,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 95,
      rating: 4.8
    }
  ],

  // Mamledar Misal (Thane)
  'mamledar': [
    {
      name: "Mamledar Famous Fiery Rassa Misal Pav",
      description: "Thane Zilla Parishad's legendary 1946 fiery red cut tarri misal topped with crispy farsan, onion, and soft pav.",
      price: 130,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Mamledar Medium Spicy Matki Misal",
      description: "Balanced spiced sprouted moth bean misal served with extra crunchy farsan bowl and toasted pav.",
      price: 120,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Chilled Kokum Solkadhi Glass",
      description: "Refreshing pink digestive cooler made with coconut milk, kokum extract, garlic, and green chillies.",
      price: 50,
      image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Prashant Corner (Thane)
  'prashant corner': [
    {
      name: "Prashant Corner Shahi Kaju Katli (250g)",
      description: "Thane's celebrated melt-in-mouth diamond cashew fudge made with premium Goan cashews.",
      price: 260,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Traditional Puran Poli with Pure Desi Ghee",
      description: "Warm golden flatbread stuffed with cardamom chana dal jaggery stuffing, slathered in pure ghee.",
      price: 140,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Special Dahi Sev Batata Puri Chaat",
      description: "Crispy puris layered with spiced potato mash, sweetened chilled curd, tamarind glaze, and sev.",
      price: 120,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Gurukripa (Sion, Mumbai) - Legendary Samosas & Chole Bhature
  'gurukripa': [
    {
      name: "Samosa",
      description: "Sion's legendary golden crisp samosa filled with spiced potatoes, served with signature sweet tamarind & mint chutney.",
      price: 45,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Chole Bhature",
      description: "Iconic North Indian style spicy chickpea curry served with two piping hot golden fluffy bhature and pickled onions.",
      price: 150,
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Dahi Samosa",
      description: "Crushed crisp samosas drenched in chilled sweet curd, tangy tamarind chutney, spicy green chutney and crunchy sev.",
      price: 90,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Samosa Chaat",
      description: "Special crushed samosa layered with hot chole gravy, diced onions, coriander, and chatpata chaat masala.",
      price: 110,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Gulab Jamun Plate",
      description: "Warm, melt-in-mouth milk solid dumplings soaked in aromatic saffron and cardamom sugar syrup.",
      price: 70,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
      popularity: 95,
      rating: 4.8
    },
    {
      name: "Sweet Lassi Glass",
      description: "Thick, creamy Punjabi style beaten yogurt drink topped with a layer of thick malai.",
      price: 60,
      image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80",
      popularity: 94,
      rating: 4.7
    }
  ],

  // Hotel Roopali (FC Road Pune)
  'roopali': [
    {
      name: "Roopali Special Butter Set Dosa",
      description: "Trio of ultra-spongy golden dosas served with creamy white coconut chutney and spicy potato saggu.",
      price: 150,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 4.9
    },
    {
      name: "Crispy Onion Rava Masala Dosa",
      description: "Crispy semolina crepe tempered with mustard, green chillies & cashews, stuffed with spiced aloo masala.",
      price: 160,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.8
    },
    {
      name: "Roopali Heritage Hot Filter Coffee",
      description: "Aromatic South Indian filter coffee frothed to perfection in authentic brass davarah.",
      price: 55,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Roopali Special Veg Cutlet & Sambar",
      description: "Crispy beetroot and vegetable cutlets served with hot piping lentil sambar and spicy green chutney.",
      price: 120,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 95,
      rating: 4.7
    }
  ],

  // Vaishali (FC Road Pune)
  'vaishali': [
    {
      name: "Vaishali Special Mysore Masala Dosa",
      description: "FC Road's iconic golden fermented rice crepe smeared with fiery red garlic paste & spiced potato mash.",
      price: 160,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Vaishali Signature SPDP (Sev Potato Dahi Puri)",
      description: "Legendary Pune student snack: crispy puris filled with potatoes, sweetened curd, date chutney & mountain of sev.",
      price: 130,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Crispy Cheese Onion Rava Dosa",
      description: "Crisp semolina crepe tempered with mustard, green chilies, cashews, and loaded with processed cheese.",
      price: 180,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Special Veg Cutlet & Coconut Chutney",
      description: "Golden beetroot vegetable patties served with piping hot lentil sambar and creamy coconut dip.",
      price: 120,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8
    },
    {
      name: "Steamed Button Idlis in Ghee Sambar",
      description: "Bowl of mini button idlis submerged in aromatic South Indian sambar with pure desi ghee.",
      price: 110,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Heritage South Indian Filter Coffee",
      description: "Strong chicory-blended decoction frothed with rich hot milk in traditional brass tumbler.",
      price: 60,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    }
  ],

  // Cafe Goodluck (Deccan Pune)
  'goodluck': [
    {
      name: "Goodluck Bun Maska & Special Irani Chai",
      description: "Deccan's 1935 classic: crusty bun slathered with salted whipped butter and steaming hot cardamom Irani tea.",
      price: 75,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Goodluck Famous Mutton Keema Ghotala Pav",
      description: "Minced spiced mutton scrambled with farm eggs, green chillies, and served with toasted ladi pav.",
      price: 290,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Crispy Chicken Baida Roti",
      description: "Crispy pan-fried flatbread layered with spiced chicken mince and egg wrap.",
      price: 220,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Spicy Mutton Biryani Iranian Style",
      description: "Slow-cooked fragrant Basmati rice with succulent mutton pieces, fried potatoes & caramelized onions.",
      price: 340,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    },
    {
      name: "Cheese Egg Omelette with Bun",
      description: "Fluffy 3-egg omelette loaded with green chilies, onions, melted cheese and toasted buttery pav.",
      price: 150,
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8
    }
  ],

  // Sujata Mastani (Pune)
  'sujata': [
    {
      name: "Sujata Special Alphonso Mango Mastani",
      description: "Pune's original thick Alphonso mango milkshake topped with rich vanilla ice cream, dry fruits, and cherry.",
      price: 150,
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Royal Kaju Draksh Sitaphal Mastani",
      description: "Custard apple pulp blended thick with whole roasted cashews, black raisins, and creamy ice cream.",
      price: 170,
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Kesar Pista Special Dryfruit Shake",
      description: "Aromatic Kashmiri saffron thick milk blend topped with generous crushed green pistachios.",
      price: 160,
      image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.8
    },
    {
      name: "Chocolate Brownie Mastani",
      description: "Rich dark chocolate shake topped with brownie chunks, fudge sauce and chocolate ice cream.",
      price: 180,
      image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Hotel Jagdamb (Pune)
  'jagdamb': [
    {
      name: "Jagdamb Special Gavran Mutton Thali",
      description: "Legendary spicy Gavran mutton thali with mutton sukka, Tambda rassa, Pandhra rassa & hot jowar bhakri.",
      price: 420,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Kala Masala Chicken Handi with Bhakri",
      description: "Country chicken simmered in traditional roasted black spices on open charcoal fire.",
      price: 380,
      image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Tambda & Pandhra Rassa Bowl Duo",
      description: "Spicy red fiery mutton soup and silky white coconut-poppy seed broth.",
      price: 120,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Mutton Alani Bhat (Aromatic Bone Broth Rice)",
      description: "Fragrant rice cooked in rich unspiced mutton bone stock with tender meat pieces.",
      price: 240,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Shivraj Hotel (Pune)
  'shivraj': [
    {
      name: "Shivraj World Famous Raavan Mutton Thali",
      description: "Giant non-veg feast platter with mutton chops, kheema, chicken handi, 5 rassas, bhakri & biryani.",
      price: 990,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Bullet Chicken Special Thali",
      description: "Spicy country chicken handi, chicken sukka, tambda rassa, pandhra rassa, rice & hot jowar bhakri.",
      price: 390,
      image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Tandoori Surmai Fish Fry",
      description: "Fresh kingfish steak coated in Kolhapuri spices and rawa fried crisp in pure coconut oil.",
      price: 480,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Agashiye (Ahmedabad, Gujarat)
  'agashiye': [
    {
      name: "Agashiye Grand Royal Gujarati Thali",
      description: "The House of MG's celebrated 20+ item royal Gujarati feast: Farsan, Rasawala Shaak, Kadhi, Rotli & Aamras.",
      price: 580,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Traditional Surati Undhiyu with Puri",
      description: "Heritage winter mixed vegetable casserole slow-cooked in earthen pot with methi muthiyas and hot puris.",
      price: 240,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Authentic Fafda Jalebi & Sambharo Plate",
      description: "Crispy fafda paired with hot crunchy saffron jalebi, fried chillies, and papaya sambharo.",
      price: 140,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Das Khaman (Surat / Ahmedabad, Gujarat)
  'das khaman': [
    {
      name: "Das Famous Spongy Nylon Khaman",
      description: "Ahmedabad's 1922 institution world-famous for super soft, juicy steamed gram flour khaman tempered with mustard & curry leaves.",
      price: 80,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Special Surati Locho with Butter & Sev",
      description: "Steamed seasoned gram flour delicacy topped with melting butter, green garlic chutney, and crispy nylon sev.",
      price: 90,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Authentic Fafda Jalebi Plate",
      description: "Crispy gram flour fafda with golden crunchy saffron jalebis and fried green chillies.",
      price: 130,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Rawat Mishthan Bhandar (Jaipur, Rajasthan)
  'rawat': [
    {
      name: "Rawat World Famous Spicy Pyaaz Kachori (2 Pcs)",
      description: "Jaipur's iconic flaky golden pastry stuffed with spicy caramelized onion masala, served with tamarind chutney.",
      price: 80,
      image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Royal Dal Baati Churma with Desi Ghee",
      description: "Baked whole wheat baatis crushed in pure desi ghee, served with spicy panchmel dal and sweet dry fruit churma.",
      price: 280,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 99,
      rating: 5.0
    },
    {
      name: "Shahi Malai Ghevar with Saffron Rabdi",
      description: "Honeycomb textured Rajasthani festive dessert soaked in cardamom sugar syrup crowned with thick malai.",
      price: 160,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    }
  ],

  // Chokhi Dhani (Jaipur, Rajasthan)
  'chokhi dhani': [
    {
      name: "Chokhi Dhani Royal Dal Baati Churma Feast",
      description: "Heritage village royal platter: Baatis soaked in country ghee, Panchmel Dal, Churma, Gatte Ki Sabzi & Ker Sangri.",
      price: 490,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Authentic Gatte Ki Sabzi with Bajra No Rotlo",
      description: "Gram flour roundels simmered in spiced yogurt curry, served hot with clay-roasted bajra flatbread & white makhan.",
      price: 220,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Ker Sangri Marwari Delicacy",
      description: "Rare desert beans and berries cooked with dry spices, amchur, and raisins in mustard oil.",
      price: 240,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Tunday Kababi (Lucknow, UP)
  'tunday': [
    {
      name: "Tunday Original Galouti Kebab (4 Pcs)",
      description: "Lucknow's 1905 Aminabad legend: 160-spice minced mutton kebabs that literally melt in your mouth.",
      price: 280,
      image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Mughlai Paratha with Mutton Korma",
      description: "Flaky pan-fried parathas paired with rich, slow-simmered Awadhi brown onion mutton gravy.",
      price: 360,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Awadhi Shahi Dum Biryani",
      description: "Fragrant saffron Basmati rice layered with tender lamb pieces on dum in sealed handi.",
      price: 390,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Karim's (Delhi)
  'karim': [
    {
      name: "Karim's Royal Mutton Burra Kebab",
      description: "Charcoal-tandoor smoked juicy mutton chops marinated in secret royal Mughal spices.",
      price: 520,
      image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Shahi Mutton Korma & Khamiri Roti",
      description: "Slow-simmered rich gravy infused with brown onions, kewra essence, served with fluffy clay-oven flatbread.",
      price: 440,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Royal Mutton Dum Biryani",
      description: "Saffron infused Basmati rice cooked with tender marinated mutton in traditional sealed handi.",
      price: 460,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Aslam Butter Chicken (Delhi)
  'aslam': [
    {
      name: "Aslam Special Dahi Butter Chicken",
      description: "Old Delhi's sensation: tandoori roasted chicken bathed in a stream of melted Amul butter and spiced curd.",
      price: 480,
      image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Seekh Kebab Butter Bath",
      description: "Charcoal grilled mutton seekh kebabs dipped in melted butter and spiced yogurt.",
      price: 360,
      image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Soft Rumali Roti & Mint Chutney",
      description: "Paper-thin soft rumali roti served with tangy coriander-mint yogurt dip.",
      price: 50,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 95,
      rating: 4.8
    }
  ],

  // Sita Ram Diwan Chand (Delhi)
  'sita ram': [
    {
      name: "Sita Ram Paneer Stuffed Chole Bhature",
      description: "Paharganj's iconic puffed golden bhaturas stuffed with grated paneer, served with spicy tangy chickpea curry & aam pickle.",
      price: 160,
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Special Chhole Kulche with Aloo Pickle",
      description: "Soft buttered kulchas served with dry spiced chickpeas, ginger juliennes, and sour green chili pickle.",
      price: 130,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Special Malai Meethi Lassi",
      description: "Thick creamy churned yogurt drink topped with a thick layer of fresh malai and rose syrup.",
      price: 90,
      image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.9
    }
  ],

  // Arsalan Biryani (Kolkata)
  'arsalan': [
    {
      name: "Arsalan Special Mutton Dum Biryani (with Aloo & Egg)",
      description: "Kolkata's crown jewel: fragrant long-grain Basmati rice, melt-in-mouth mutton, slow-cooked whole potato, and boiled egg.",
      price: 420,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Juicy Mutton Chaap with Roomali Roti",
      description: "Slow-braised mutton ribs in thick poppy seed and cashew gravy, served with paper-thin roomali roti.",
      price: 380,
      image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Kolkata Chicken Kathi Roll",
      description: "Flaky layered paratha wrapped with spicy chicken tikka, sliced onions, green chillies, and lime.",
      price: 180,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
      popularity: 97,
      rating: 4.8
    }
  ],

  // Peter Cat (Kolkata)
  'peter cat': [
    {
      name: "Peter Cat World Famous Chelo Kebab",
      description: "Legendary platter: fragrant buttered rice crowned with grilled chicken & mutton kebabs, roasted tomato, and fried egg.",
      price: 490,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
      popularity: 100,
      rating: 5.0
    },
    {
      name: "Sizzling Butter Chicken Steak",
      description: "Hot iron sizzler plate with spiced chicken steak, sauteed vegetables, and jacket potatoes.",
      price: 460,
      image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      popularity: 98,
      rating: 4.9
    },
    {
      name: "Heritage Caramel Custard",
      description: "Silky smooth baked egg and milk custard with burnt caramel sugar glaze.",
      price: 130,
      image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
      popularity: 96,
      rating: 4.8
    }
  ]
};

// 2. UNIVERSAL CUISINE CATEGORIES FOR DYNAMICALLY BRANDED PLACES
export const CUISINE_MENUS: CuisineProfile[] = [
  // Kachori & Samosa Sweets
  {
    name: "Kachori, Samosa & Sweets",
    keywords: ['kachori', 'pyaaz kachori', 'mawa kachori', 'samosa', 'bikanervala', 'haldiram', 'mithai', 'sweet', 'bhandar', 'mishthan', 'jalebi', 'ghevar', 'laddu', 'laddoo', 'gulab jamun'],
    dishes: [
      {
        name: "Special Crispy Pyaaz Kachori (2 Pcs)",
        description: "Crispy flaky golden pastry stuffed with spicy caramelized onion masala, served with tamarind chutney.",
        price: 80,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        popularity: 100,
        rating: 5.0
      },
      {
        name: "Hot Samosa with Sweet-Spicy Chutney (2 Pcs)",
        description: "Crispy pastry cones filled with spiced potatoes, green peas, and cashews, served with mint chutney.",
        price: 60,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        popularity: 98,
        rating: 4.9
      },
      {
        name: "Shahi Malai Ghevar with Rabdi",
        description: "Honeycomb textured festive delicacy soaked in saffron syrup crowned with thick malai.",
        price: 160,
        image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
        popularity: 97,
        rating: 4.9
      }
    ]
  },

  // Sandwiches & Fast Food
  {
    name: "Sandwich & Fast Food",
    keywords: ['sandwich', 'toast', 'burger', 'grill', 'frankie', 'fries', 'wrap', 'sub', 'roll'],
    dishes: [
      {
        name: "Special 3-Layer Cheese Burst Grilled Sandwich",
        description: "Toasted jumbo bread loaded with spiced potato, veggies, spicy green chutney, and melted cheese blend.",
        price: 160,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
        popularity: 100,
        rating: 5.0
      },
      {
        name: "Famous Chocolate Cheese Toast Sandwich",
        description: "Decadent sandwich layered with Nutella chocolate spread, butter, and grated processed cheese.",
        price: 140,
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80",
        popularity: 98,
        rating: 4.9
      },
      {
        name: "Loaded Peri Peri French Fries",
        description: "Crispy golden potato fries seasoned with fiery African peri peri spice rub and cheese sauce.",
        price: 120,
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
        popularity: 96,
        rating: 4.8
      }
    ]
  },

  // Chai, Tea & Tapri
  {
    name: "Chai & Tapri Snacks",
    keywords: ['chai', 'tea', 'tapri', 'katta', 'dolly', 'chalo chai', 'chaiwala', 'cutting', 'tea post', 'bun maska'],
    dishes: [
      {
        name: "Special Kulhad Masala Chai & Bun Maska",
        description: "Strong aromatic tea brewed with ginger, cardamom, and lemongrass, served with warm buttery bun.",
        price: 70,
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
        popularity: 100,
        rating: 5.0
      },
      {
        name: "Crispy Samosa Pav with Spicy Garlic Chutney",
        description: "Fresh fried samosa tucked inside soft ladi pav with fiery red dry garlic chutney.",
        price: 50,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        popularity: 98,
        rating: 4.9
      },
      {
        name: "Special Ginger Lemongrass Cutting Chai (2 Cups)",
        description: "Boiled milk tea infused with crushed fresh ginger root and aromatic lemongrass.",
        price: 40,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
        popularity: 97,
        rating: 4.8
      }
    ]
  },

  // Gujarati Farsan & Thali
  {
    name: "Gujarati Farsan & Thali",
    keywords: ['gujarat', 'gujarati', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'khaman', 'dhokla', 'fafda', 'jalebi', 'locho', 'thepla', 'undhiyu', 'handvo', 'kathiyawadi', 'sev khamani', 'sev tameta'],
    dishes: [
      {
        name: "Special Surati Locho with Butter & Sev",
        description: "Steamed seasoned gram flour delicacy topped with melting butter, green garlic chutney, and crispy nylon sev.",
        price: 90,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        popularity: 100,
        rating: 5.0
      },
      {
        name: "Authentic Fafda Jalebi Plate with Papaya Sambharo",
        description: "Crispy gram flour fafda paired with hot crunchy saffron jalebi, fried green chillies, and raw papaya salad.",
        price: 130,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
        popularity: 99,
        rating: 5.0
      },
      {
        name: "Royal Kathiyawadi Sev Tameta & Bajra No Rotlo",
        description: "Tangy spiced tomato curry topped with ratlami sev, served with clay-roasted pearl millet flatbread and fresh white butter.",
        price: 210,
        image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80",
        popularity: 98,
        rating: 4.9
      }
    ]
  },

  // South Indian & Udupi Cafes
  {
    name: "South Indian & Udupi Tiffin",
    keywords: ['dosa', 'idli', 'udupi', 'south indian', 'bhavan', 'tiffin', 'coffee', 'mtr', 'vidyarthi', 'sangeetha', 'saravana', 'priya', 'dakshin', 'wada', 'vada', 'sambar', 'rameshwaram', 'roopali', 'vaishali', 'wadeshwar'],
    dishes: [
      { name: "Mysore Butter Masala Dosa", description: "Crispy golden crepe with fiery red garlic spread & spiced potato masala.", price: 160, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Crispy Medu Vada Sambar (2 Pcs)", description: "Golden fried lentil donuts in hot aromatic lentil sambar & coconut chutney.", price: 110, image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Steamed Thatte Idli with Ghee Podi", description: "Plate-sized soft fluffy idlis drenched in pure desi ghee and spiced gun powder.", price: 120, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Crispy Onion Rava Dosa", description: "Lacy semolina crepe tempered with mustard, green chilies, cashews & onions.", price: 170, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Cheese Burst Masala Dosa", description: "Loaded with melted mozzarella & cheddar cheese over spiced potato filling.", price: 190, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Special Mixed Veg Uttapam", description: "Thick fermented pancake topped with juicy tomatoes, onions, capsicum & coriander.", price: 150, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 94, rating: 4.7 },
      { name: "Ven Pongal with Desi Ghee & Cashews", description: "Comforting rice-lentil porridge tempered with black pepper, cumin & whole cashews.", price: 130, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 93, rating: 4.8 },
      { name: "Heritage South Indian Filter Coffee", description: "Aromatic chicory-decoction frothed with boiling whole milk in brass davarah.", price: 60, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Sweet Pineapple Sheera / Kesari Bath", description: "Melt-in-mouth semolina pudding infused with saffron, pineapple chunks & ghee.", price: 90, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", popularity: 92, rating: 4.8 },
      { name: "Curd Rice with Pomegranate & Tadka", description: "Tempered creamy yogurt rice with mustard seeds, curry leaves & roasted cashews.", price: 140, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 90, rating: 4.7 }
    ]
  },

  // Vada Pav & Street Food
  {
    name: "Vada Pav & Street Food",
    keywords: ['vadapav', 'vada pav', 'wada pav', 'batata vada', 'vada', 'street food', 'babu vadapav', 'gajanan', 'jumbo king'],
    dishes: [
      { name: "Special Legendary Vada Pav (2 Pcs)", description: "Freshly fried golden potato dumplings stuffed in soft ladi pav with red garlic chutney.", price: 50, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Fiery Schezwan Cheese Vada Pav", description: "Loaded with melted mozzarella, spicy schezwan glaze, and roasted garlic chutney.", price: 90, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Crispy Kothimbir Vadi Plate", description: "Steamed cilantro diamond cakes shallow-fried crisp with sweet-tangy chutney.", price: 80, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Crispy Sabudana Vada with Sweet Dahi", description: "Golden fried tapioca patties with roasted peanuts and sweetened curd.", price: 90, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.8 },
      { name: "Steamed Kanda Poha Plate", description: "Fluffy flattened rice tempered with mustard, onions, roasted peanuts & lemon.", price: 60, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.7 },
      { name: "Spicy Misal Pav Combo", description: "Fiery sprouted bean curry topped with crispy farsan, onion, lemon & soft pav.", price: 120, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Batata Bhajji (Pakoda) Plate", description: "Crispy spiced gram flour coated potato fritters served with fried green chilies.", price: 70, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", popularity: 94, rating: 4.8 },
      { name: "Special Masala Chai Kulhad", description: "Cardamom & ginger infused hot milky tea served in traditional clay cup.", price: 30, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 }
    ]
  },

  // Misal & Maharashtrian
  {
    name: "Misal & Maharashtrian Food",
    keywords: ['misal', 'tarri', 'bhakri', 'pithla', 'thalipeeth', 'maratha', 'kolhapuri', 'katakirr', 'bedekar', 'mamledar'],
    dishes: [
      { name: "Fiery Kolhapuri Tarri Misal Pav", description: "Sprouted moth beans in blistering spicy red cut rassa, crunchy farsan & fresh pav.", price: 140, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Special Puneri Sweet-Spicy Misal", description: "Authentic Pune style misal with pohe, matki, sample gravy, farsan & onion.", price: 130, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Pithla Bhakri & Thecha Thali", description: "Gram flour pithla served piping hot with freshly roasted jowar bhakri & green thecha.", price: 180, image: "/images/eating/bhakri_bhaji_dish.jpg", popularity: 99, rating: 5.0 },
      { name: "Special Bhakri Bhaji Thali", description: "Authentic roasted jowar bhakri with spicy vegetable bhaji, green thecha, onion & pickle.", price: 190, image: "/images/eating/bhakri_bhaji_dish.jpg", popularity: 100, rating: 5.0 },
      { name: "Crispy Bhajani Thalipeeth with White Butter", description: "Multi-grain savory spiced flatbread served with fresh homemade white makkhan.", price: 120, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Bharli Vangi (Stuffed Eggplant Curry)", description: "Baby eggplants slow-cooked in rich roasted peanut, coconut and sesame gravy.", price: 190, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Khandeshi Shev Bhaji with Pav", description: "Fiery spicy roasted red gravy served with thick crunchy ratlami shev.", price: 170, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Steamed Ukdiche Modak (2 Pcs)", description: "Delicate rice dough dumplings filled with freshly grated coconut, jaggery & ghee.", price: 120, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Chilled Kokum Solkadhi Glass", description: "Pink digestive drink made of fresh coconut milk, kokum extract, garlic & cilantro.", price: 50, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 }
    ]
  },

  // Biryani, Mughlai & Non-Veg
  {
    name: "Biryani & Mughlai Kebabs",
    keywords: ['biryani', 'mutton', 'chicken', 'kebab', 'kebabs', 'nihari', 'handi', 'non veg', 'darbar', 'boti', 'seekh', 'tandoori', 'jagdamb', 'karim', 'behrouz'],
    dishes: [
      { name: "Special Dum Mutton Biryani", description: "Aromatic Basmati rice slow cooked on dum with tender mutton chunks & saffron ghee.", price: 390, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Hyderabadi Chicken Dum Biryani", description: "Fragrant spiced long grain rice layered with succulent marinated chicken & mint.", price: 320, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Charcoal Smoky Tandoori Chicken (Full)", description: "Whole spring chicken marinated in Kashmiri red chilli yogurt and grilled in clay tandoor.", price: 420, image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Old Delhi Style Butter Chicken", description: "Tender roasted chicken tikka simmered in rich creamy tomato cashew makhani gravy.", price: 360, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Mutton Rogan Josh Kashmiri", description: "Slow-cooked Kashmiri tender mutton curry infused with ratanjot & fennel spices.", price: 410, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Juicy Chicken Seekh Kebab (4 Pcs)", description: "Charcoal grilled spiced minced chicken skewers served with mint chutney.", price: 290, image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Spicy Chicken Handi with Gravy", description: "Rustic country chicken cooked in traditional earthenware handi with whole spices.", price: 370, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Fluffy Butter Garlic Naan (2 Pcs)", description: "Leavened oven-baked flatbread glazed with crushed roasted garlic & pure butter.", price: 90, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Dal Makhani Overnight Simmered", description: "Black lentils and kidney beans slow simmered with butter and fresh cream.", price: 230, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Royal Shahi Phirni Kulhad", description: "Ground rice pudding infused with Kashmiri saffron, cardamom & silver vark.", price: 110, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 }
    ]
  },

  // Seafood & Coastal
  {
    name: "Coastal & Malvani Seafood",
    keywords: ['seafood', 'fish', 'surmai', 'pomfret', 'prawns', 'crab', 'malvan', 'konkan', 'goan', 'bombil', 'nisarg', 'gajalee', 'mahesh'],
    dishes: [
      { name: "Surmai Rava Fish Fry (Kingfish)", description: "Fresh kingfish steak coated in fiery coastal masala and crispy golden semolina crust.", price: 440, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Special Pomfret Curry Thali", description: "Whole fresh pomfret curry, fried fish, rice bhakri, steamed rice & solkadhi.", price: 490, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Crispy Bombay Duck (Bombil) Fry", description: "Fresh Bombay duck fillets marinated in triphala spices and pan-fried extra crisp.", price: 320, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Butter Garlic Tiger Prawns", description: "Jumbo prawns tossed in sizzling garlic butter, white pepper and fresh parsley.", price: 420, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Crab Sukka Masala (Mud Crab)", description: "Whole fresh crab simmered in dry roasted coconut, black pepper and Malvani spices.", price: 540, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Tisrya (Clams) Masala Fry", description: "Fresh ocean clams cooked with shallots, curry leaves, tamarind & coconut masala.", price: 340, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Steamed Rice Bhakri (2 Pcs)", description: "Traditional soft gluten-free flatbread prepared from freshly milled rice flour.", price: 60, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Digestive Pink Solkadhi Glass", description: "Chilled extract of fresh coconut milk and wild kokum with crushed green chilies.", price: 50, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 }
    ]
  },

  // Pav Bhaji & Chaat
  {
    name: "Pav Bhaji & Chaat Adda",
    keywords: ['pav bhaji', 'bhel', 'chaat', 'pani puri', 'golgappe', 'sev puri', 'ragda', 'dahi puri', 'sardar', 'honest', 'relax', 'girija'],
    dishes: [
      { name: "Special Amul Butter Pav Bhaji", description: "Mashed vegetable spiced gravy served with a floating slab of pure butter & warm pav.", price: 160, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Cheese Loaded Masala Pav Bhaji", description: "Topped with a mountain of grated mozzarella and processed cheese.", price: 190, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Special SPDP (Sev Potato Dahi Puri)", description: "Crispy puris layered with spiced potatoes, sweetened curd, date chutney & sev.", price: 110, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Pani Puri Platter (6 Pcs)", description: "Crisp puffed puris served with spicy mint pani, sweet sonth chutney & warm ragda.", price: 60, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Dahi Papdi Chaat Supreme", description: "Crispy flour wafers layered with boiled chickpeas, spiced yogurt, sev & pomegranate.", price: 120, image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.8 },
      { name: "Double Butter Masala Pav", description: "Soft ladi pavs drenched in sizzling butter garlic bhaji gravy.", price: 110, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Ragda Pattice Platter", description: "Crispy golden potato patties drowned in hot white pea curry, chutney & sev.", price: 120, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Royal Mango Kulfi Falooda", description: "Chilled rose vermicelli blend with sweet basil seeds, mango puree & malai kulfi.", price: 150, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 }
    ]
  },

  // Bar & Restaurant / Multi-Cuisine Dining / Permit Room
  {
    name: "Bar & Multi-Cuisine Restaurant",
    keywords: ['bar', 'permit room', 'lounge', 'resto', 'beer', 'pub', 'club', 'dining bar', 'family restaurant', 'city point', 'barometer', 'hidden place'],
    dishes: [
      { name: "Special Tandoori Chicken Tikka (6 Pcs)", description: "Smoky boneless chicken chunks marinated in hung curd, ginger garlic & roasted spices.", price: 320, image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Famous Butter Chicken with Garlic Naan", description: "Charcoal grilled chicken in rich creamy tomato cashew gravy with hot garlic butter naan.", price: 360, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Crispy Fish Koliwada Fry", description: "Fresh fish fillets coated in spicy gram flour batter, deep fried crisp with mint dip.", price: 380, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Crispy Chicken Lollipop Schezwan (6 Pcs)", description: "Crumb-fried juicy chicken wings tossed in fiery wok Schezwan sauce.", price: 290, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 4.9 },
      { name: "Paneer Chilli Dry & Hakka Noodles", description: "Wok-fried cottage cheese cubes tossed with bell peppers, green chillies & noodles.", price: 270, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.8 },
      { name: "Tandoori Chicken Platter (Half)", description: "Smoky bone-in roasted chicken seasoned with lemon, chaat masala & mint sauce.", price: 280, image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Mutton Sukka Fry with Bhakri", description: "Dry roasted tender mutton cooked with caramelized onions, coconut and black masala.", price: 410, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Special Veg Pulao with Raita", description: "Long grain Basmati rice tossed with fresh garden vegetables, paneer & brown onions.", price: 210, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Garlic Cheese Naan (2 Pcs)", description: "Fresh tandoori naan stuffed with mozzarella cheese and coated in garlic butter.", price: 120, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Sizzling Brownie with Vanilla Ice Cream", description: "Warm chocolate walnut brownie on cast iron sizzler with dark fudge sauce.", price: 180, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 }
    ]
  },

  // Chinese & Pan-Asian
  {
    name: "Chinese & Pan-Asian Wok",
    keywords: ['chinese', 'noodle', 'noodles', 'momo', 'momos', 'wok', 'schezwan', 'manchurian', 'dragon', 'asian', 'dimsum', 'chopstick', 'fried rice', 'mainland'],
    dishes: [
      { name: "Special Triple Schezwan Fried Rice & Gravy", description: "Wok-tossed spicy rice and noodles topped with red Schezwan gravy & crispy noodles.", price: 260, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Steamed Veg Momos (6 Pcs)", description: "Authentic steamed Himalayan dumplings served with fiery red spicy garlic chutney.", price: 140, image: "/images/eating/momos_dish.jpg", popularity: 100, rating: 5.0 },
      { name: "Crispy Fried Cheese Momos (6 Pcs)", description: "Golden fried crunchy dumplings stuffed with melted mozzarella & sweet corn, served with mayo dip.", price: 170, image: "/images/eating/momos_dish.jpg", popularity: 99, rating: 5.0 },
      { name: "Steamed Butter Garlic Momos (6 Pcs)", description: "Handcrafted steamed dumplings glazed in sizzling chili garlic butter sauce.", price: 180, image: "/images/eating/momos_dish.jpg", popularity: 99, rating: 5.0 },
      { name: "Fiery Schezwan Gravy Momos", description: "Steamed momos wok-tossed in hot sizzling Schezwan red pepper gravy.", price: 190, image: "/images/eating/momos_dish.jpg", popularity: 98, rating: 4.9 },
      { name: "Fiery Dragon Chicken / Paneer Sizzler", description: "Crispy strips tossed with cashews, red peppers, and fiery hot sauce on sizzler plate.", price: 310, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Classic Veg Hakka Noodles", description: "Wok-tossed noodles with shredded cabbage, carrots, capsicum, soy & white pepper.", price: 190, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Chilli Garlic Fried Rice", description: "Aromatic jasmine rice stir-fried with burnt garlic, red chillies and scallions.", price: 210, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.8 },
      { name: "Crispy Spring Rolls with Sweet Chilli Dip", description: "Golden fried pastry rolls packed with spiced Asian vegetable juliennes.", price: 180, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Hot & Sour Manchow Soup with Fried Noodles", description: "Spicy dark broth loaded with minced mushrooms, garlic, coriander & crispy noodles.", price: 140, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 }
    ]
  },

  // Pizza & Italian
  {
    name: "Pizza & Italian Adda",
    keywords: ['pizza', 'domino', 'pizza hut', 'ovenstory', 'la pinoz', 'mojo', 'pasta', 'italian', 'slice', 'crust'],
    dishes: [
      { name: "Special Farmhouse 7-Cheese Burst Pizza", description: "Hand-stretched crust overflowing with mozzarella, cheddar, bell peppers, olives & corn.", price: 360, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Fiery Peri Peri Paneer / Chicken Pizza", description: "Loaded with spiced peri peri chunks, red paprika, jalapenos & smoked cheese blend.", price: 340, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 4.9 },
      { name: "Cheesy Garlic Breadsticks with Dip", description: "Buttered golden breadsticks stuffed with molten mozzarella & sweet corn kernels.", price: 170, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Creamy White Sauce Alfredo Pasta", description: "Penne pasta tossed in rich parmesan garlic cream sauce with mushrooms & herbs.", price: 260, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.8 },
      { name: "Spicy Red Arrabiata Pasta", description: "Al dente penne in fiery crushed tomato sauce with garlic, basil, olives & parmesan.", price: 240, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Margherita Supreme with Fresh Basil", description: "San Marzano style tomato base with fresh mozzarella slices & basil leaves.", price: 290, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Molten Choco Lava Cake", description: "Warm chocolate sponge cake with gooey flowing dark chocolate center.", price: 110, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 }
    ]
  },

  // Burger & Fast Food
  {
    name: "Burger & Fast Food",
    keywords: ['burger', 'mcdonald', 'burger king', 'kfc', 'wendy', 'wrap', 'fries', 'fast food', 'crunch', 'subway'],
    dishes: [
      { name: "Special Double Patty Crispy Burger & Fries", description: "Toasted brioche bun with crispy spiced patty, melted cheese, lettuce & secret sauce.", price: 210, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Fiery Peri Peri Crunch Bites Bucket", description: "Crumb-fried golden bites tossed in hot peri peri spice mix with cheese dip.", price: 180, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Cheese Loaded Peri Peri French Fries", description: "Crispy crinkle-cut golden fries smothered in warm cheese sauce & jalapenos.", price: 140, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Crispy Paneer / Chicken Tikka Wrap", description: "Warm tortilla stuffed with smoky tikka cubes, crunchy onions & mint mayo.", price: 190, image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.8 },
      { name: "Spicy Zinger Crunch Burger", description: "Extra crispy spiced whole fillet topped with fresh coleslaw and chipotle drizzle.", price: 230, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Golden Crispy Onion Rings (8 Pcs)", description: "Thick sweet onion slices batter-fried crisp served with garlic aioli.", price: 130, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", popularity: 95, rating: 4.7 },
      { name: "Thick Cold Chocolate Frappe", description: "Blended dark espresso, rich cocoa fudge and whipped dairy cream.", price: 160, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 }
    ]
  },

  // Ice Cream, Desserts & Shakes
  {
    name: "Ice Cream, Mastani & Shakes",
    keywords: ['ice cream', 'dessert', 'falooda', 'kulfi', 'mastani', 'shake', 'waffle', 'bakery', 'cake', 'naturals', 'havmor', 'amul', 'sujata', 'giani', 'baskin'],
    dishes: [
      { name: "Special Alphonso Mango Mastani", description: "Thick mango puree milkshake crowned with vanilla ice cream, dry fruits & cherries.", price: 170, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Royal Kaju Sitaphal Mastani", description: "Real custard apple pulp blended thick with whole roasted cashews & malai scoop.", price: 190, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Royal Shahi Falooda with Rabdi", description: "Rose milk layered with vermicelli, basil seeds, rich malai kulfi & rabdi.", price: 180, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Tender Coconut Natural Ice Cream", description: "Artisanal handcrafted natural ice cream packed with fresh malai coconut chunks.", price: 100, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Saffron Matka Kulfi on Stick", description: "Slow-reduced milk kulfi infused with Kashmiri saffron, pistachios & cardamom.", price: 80, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Nutella Belgian Waffle with Ice Cream", description: "Freshly ironed golden crisp waffle smothered in warm Nutella and choco chips.", price: 210, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 }
    ]
  },

  // Pure Veg, Dhaba & North Indian
  {
    name: "Pure Veg & Punjabi Dhaba",
    keywords: ['dhaba', 'punjabi', 'paneer', 'thali', 'north indian', 'pure veg', 'veg', 'bhojanalaya', 'hotel', 'restaurant', 'dining'],
    dishes: [
      { name: "Special Paneer Butter Masala", description: "Fresh malai paneer cubes simmered in rich creamy butter tomato gravy & kasuri methi.", price: 260, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Royal Shahi Kaju Kari", description: "Whole roasted cashews slow cooked in rich white onion, cashew and saffron gravy.", price: 290, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Dal Makhani Charcoal Simmered", description: "Black lentils slow-cooked overnight with churned white butter, cream & whole spices.", price: 230, image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Crispy Butter Garlic Naan (2 Pcs)", description: "Clay oven tandoor baked leavened bread slathered with roasted garlic butter.", price: 90, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Spicy Veg Kolhapuri Gravy", description: "Mixed garden vegetables tossed in fiery red Kolhapuri chili paste and roasted coconut.", price: 240, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80", popularity: 97, rating: 4.9 },
      { name: "Tandoori Paneer Tikka Platter (6 Pcs)", description: "Charcoal grilled cottage cheese chunks with bell peppers, onions & mint chutney.", price: 270, image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 },
      { name: "Fragrant Jeera Rice & Yellow Dal Tadka", description: "Cumin tempered Basmati rice served with garlic and red chili tadka yellow dal.", price: 220, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 96, rating: 4.8 },
      { name: "Grand Shahi Maharaja Veg Thali", description: "Paneer dish, veg gravy, dal fry, jeera rice, 2 butter rotis, papad, raita & gulab jamun.", price: 340, image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80", popularity: 100, rating: 5.0 },
      { name: "Hot Gulab Jamun in Saffron Syrup (2 Pcs)", description: "Soft melt-in-mouth milk solids dumplings soaked in warm cardamom saffron syrup.", price: 80, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80", popularity: 99, rating: 5.0 },
      { name: "Punjabi Sweet Lassi Malai Mar Ke", description: "Thick churned creamy yogurt shake served in a tall brass glass with malai layer.", price: 90, image: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80", popularity: 98, rating: 4.9 }
    ]
  }
];

// Helper to extract a clean prefix name from any restaurant string
function getCleanSpotBrandName(rawName: string): string {
  if (!rawName) return 'Special';
  // Remove common words like Hotel, Restaurant, Cafe, Stall, Dhaba, etc.
  const clean = rawName
    .replace(/\b(hotel|restaurant|cafe|dhaba|stall|point|corner|center|outlet|bhojanalaya|refreshment|bhandar|the|famous)\b/gi, '')
    .trim();
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 0 && words[0].length >= 2) {
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return rawName.split(/\s+/)[0] || 'Special';
}

export function generateLiveMenuForRestaurant(restaurant: { id: number; name: string; description?: string; area?: string; city?: string }): Dish[] {
  const text = `${restaurant.name} ${restaurant.description || ''} ${restaurant.area || ''} ${restaurant.city || ''}`.toLowerCase();
  const restName = restaurant.name || 'Special Food Joint';
  const brandName = getCleanSpotBrandName(restName);

  // 1. Find best matching cuisine category
  let matchedProfile = CUISINE_MENUS[CUISINE_MENUS.length - 1]; // default pure veg / dhaba
  for (const profile of CUISINE_MENUS) {
    if (profile.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      matchedProfile = profile;
      break;
    }
  }

  // 2. Check for iconic specialties
  let iconicItems: DishTemplate[] = [];
  for (const [key, iconicDishes] of Object.entries(ICONIC_RESTAURANT_DISHES)) {
    if (text.includes(key.toLowerCase())) {
      iconicItems = iconicDishes;
      break;
    }
  }

  // 3. Merge iconic specialties with full cuisine menu (prevent duplicates)
  const combinedList: DishTemplate[] = [...iconicItems];
  const seenDishNames = new Set<string>(iconicItems.map(d => d.name.toLowerCase().trim()));

  for (const item of matchedProfile.dishes) {
    const lowerName = item.name.toLowerCase().trim();
    if (!seenDishNames.has(lowerName)) {
      seenDishNames.add(lowerName);
      combinedList.push(item);
    }
  }

  // 4. Generate dynamic branded signature dishes specifically named after THIS selected restaurant
  return combinedList.map((item, idx) => {
    let brandedName = item.name;
    if (idx === 0 && !brandedName.toLowerCase().includes(brandName.toLowerCase()) && brandName.length >= 2) {
      brandedName = `${brandName} Special ${item.name.replace(/^special\s+/i, '')}`;
    }

    return {
      id: restaurant.id * 100 + idx + 1,
      restaurant_id: restaurant.id,
      name: brandedName,
      description: item.description,
      price: item.price,
      image: item.image,
      rating: item.rating,
      popularity: item.popularity,
      is_recommended: idx < 3 ? 1 : 0,
      status: 'active' as const
    };
  });
}

