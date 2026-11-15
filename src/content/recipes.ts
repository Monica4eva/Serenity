// Recovery recipes (original). Two sets:
//  - RECIPES: familiar Botswana dishes (mabele, morogo, dinawa...), in English and Setswana.
//    Shown when the app is in Setswana.
//  - RECIPES_GLOBAL: well-known dishes from around the world, in English. Shown in English.
// Nutrition notes are general guidance, not medical advice.
export type Recipe = {
  id: string;
  emoji: string;
  mins: number;
  serves: number;
  tag: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
  en: { title: string; why: string; ingredients: string[]; steps: string[] };
  tn?: { title: string; why: string; ingredients: string[]; steps: string[] };
};

export const RECIPES: Recipe[] = [
  {
    "id": "mabele",
    "emoji": "🥣",
    "mins": 15,
    "serves": 2,
    "tag": "breakfast",
    "en": {
      "title": "Mabele porridge with peanut butter and banana",
      "why": "Sorghum and peanuts give slow, steady energy and protein, so your mood and blood sugar stay calmer through the morning.",
      "ingredients": [
        "1 cup mabele (sorghum) meal",
        "3 cups water",
        "1 pinch of salt",
        "2 tablespoons peanut butter",
        "1 banana, sliced",
        "1 cup milk (optional)"
      ],
      "steps": [
        "Mix the mabele meal with 1 cup of cold water to make a smooth paste.",
        "Boil the other 2 cups of water with the salt, then stir in the paste.",
        "Cook on low heat for 10 minutes, stirring often so it does not stick.",
        "Stir in the peanut butter and a little milk if you like.",
        "Top with banana slices and serve warm."
      ]
    },
    "tn": {
      "title": "Motogo wa mabele ka peanut butter le banana",
      "why": "Mabele le manoko di neela maatla a a bonya, a a tsepameng le porotini, ka jalo maikutlo le sukiri ya madi di nna di iketlile moso otlhe.",
      "ingredients": [
        "kopi e le 1 ya bupi jwa mabele",
        "dikopi di le 3 tsa metsi",
        "letswai le lennye",
        "dikhaba tse dikgolo di le 2 tsa peanut butter",
        "banana e le 1, e segilwe",
        "kopi e le 1 ya mashi (ga go patelesege)"
      ],
      "steps": [
        "Tlhakanya bupi jwa mabele le kopi e le 1 ya metsi a a tsididi go dira motswako o o boreledi.",
        "Bedisa dikopi di le 2 tse di setseng tsa metsi le letswai, morago o tsenye motswako.",
        "Apaya ka molelo o o kwa tlase metsotso e le 10, o ntse o fudua gore o se ka wa ngaparela.",
        "Tsenya peanut butter le mashi a mannye fa o rata.",
        "Baya banana kwa godimo mme o je o sa le mogote."
      ]
    }
  },
  {
    "id": "oats",
    "emoji": "🥣",
    "mins": 10,
    "serves": 1,
    "tag": "breakfast",
    "en": {
      "title": "Warm oats with banana and cinnamon",
      "why": "Oats are rich in fibre and B vitamins, which the body needs more of in early recovery.",
      "ingredients": [
        "1/2 cup oats",
        "1 cup milk or water",
        "1/2 banana, mashed",
        "1 pinch of cinnamon",
        "1 teaspoon honey (optional)"
      ],
      "steps": [
        "Put the oats and milk or water in a small pot.",
        "Cook on medium heat for 5 minutes, stirring.",
        "Stir in the mashed banana and cinnamon.",
        "Add a little honey if you like, and eat warm."
      ]
    },
    "tn": {
      "title": "Oats tse di mogote ka banana le cinnamon",
      "why": "Oats di na le faeba le divitamine tsa B, tse mmele o di tlhokang thata kwa tshimologong ya go fola.",
      "ingredients": [
        "halofo ya kopi ya oats",
        "kopi e le 1 ya mashi kgotsa metsi",
        "halofo ya banana, e pitlilwe",
        "cinnamon e nnye",
        "khaba e nnye e le 1 ya mamapo a dinotshe (ga go patelesege)"
      ],
      "steps": [
        "Tsenya oats le mashi kgotsa metsi mo pitseng e nnye.",
        "Apaya ka molelo o o magareng metsotso e le 5, o ntse o fudua.",
        "Tsenya banana e e pitlilweng le cinnamon.",
        "Tsenya mamapo a dinotshe a mannye fa o rata, mme o je o sa le mogote."
      ]
    }
  },
  {
    "id": "eggs",
    "emoji": "🍳",
    "mins": 10,
    "serves": 1,
    "tag": "breakfast",
    "en": {
      "title": "Egg and tomato scramble on brown bread",
      "why": "Eggs are an easy, cheap protein that helps repair the body and keeps you full.",
      "ingredients": [
        "2 eggs",
        "1 tomato, chopped",
        "1/4 onion, chopped",
        "1 teaspoon oil",
        "salt and pepper",
        "2 slices brown bread"
      ],
      "steps": [
        "Heat the oil in a pan and fry the onion until soft.",
        "Add the tomato and cook for 2 minutes.",
        "Beat the eggs with a little salt and pepper and pour them in.",
        "Stir gently until just cooked.",
        "Serve on brown bread."
      ]
    },
    "tn": {
      "title": "Mae a a fuduilweng ka tamati mo borotong jo bo sootho",
      "why": "Mae ke porotini e e bonolo, e e sa tureng, e e thusang mmele go baakanyega e bile e go kgorisa.",
      "ingredients": [
        "mae a le 2",
        "tamati e le 1, e segilwe",
        "kotara ya eiye, e segilwe",
        "khaba e nnye e le 1 ya oli",
        "letswai le pepere",
        "dilae di le 2 tsa borotho jo bo sootho"
      ],
      "steps": [
        "Bedisa oli mo paneng mme o gadike eiye go fitlha e nolofala.",
        "Tsenya tamati mme o apeye metsotso e le 2.",
        "Itaya mae le letswai le pepere mme o a tshele mo paneng.",
        "Fudua ka bonolo go fitlha a butswa.",
        "Ja ka borotho jo bo sootho."
      ]
    }
  },
  {
    "id": "morogo",
    "emoji": "🥬",
    "mins": 20,
    "serves": 3,
    "tag": "lunch",
    "en": {
      "title": "Morogo with tomato and onion",
      "why": "Leafy greens give iron, folate and magnesium, which support energy and a calmer nervous system.",
      "ingredients": [
        "1 bunch spinach or morogo, washed and chopped",
        "1 onion, chopped",
        "2 tomatoes, chopped",
        "1 tablespoon oil",
        "salt to taste",
        "1/2 cup water"
      ],
      "steps": [
        "Heat the oil and fry the onion until golden.",
        "Add the tomatoes and cook until soft.",
        "Add the greens and the water, then cover.",
        "Cook for 10 minutes until the greens are tender.",
        "Season with salt and serve with pap or rice."
      ]
    },
    "tn": {
      "title": "Morogo ka tamati le eiye",
      "why": "Merogo e metala e neela tshipi, folate le magnesium, tse di tshegetsang maatla le methapo e e iketlileng.",
      "ingredients": [
        "sengata se le 1 sa sepinatšhe kgotsa morogo, se tlhapilwe se bo se segwa",
        "eiye e le 1, e segilwe",
        "ditamati di le 2, di segilwe",
        "khaba e kgolo e le 1 ya oli",
        "letswai ka fa o ratang",
        "halofo ya kopi ya metsi"
      ],
      "steps": [
        "Bedisa oli mme o gadike eiye go fitlha e nna serolwana.",
        "Tsenya ditamati mme o apeye go fitlha di nolofala.",
        "Tsenya morogo le metsi, morago o khurumetse.",
        "Apaya metsotso e le 10 go fitlha morogo o nolofala.",
        "Tsenya letswai mme o je ka bogobe kgotsa raese."
      ]
    }
  },
  {
    "id": "dinawa",
    "emoji": "🫘",
    "mins": 40,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Bean and vegetable stew (dinawa)",
      "why": "Beans are full of protein and fibre, cost little and keep you full for hours.",
      "ingredients": [
        "2 cups cooked beans (or 1 tin, drained)",
        "1 onion, chopped",
        "1 carrot, diced",
        "1 potato, diced",
        "2 tomatoes, chopped",
        "1 tablespoon oil",
        "1 teaspoon curry powder (optional)",
        "2 cups water",
        "salt"
      ],
      "steps": [
        "Fry the onion in the oil until soft.",
        "Add the carrot, potato and curry powder and stir for 2 minutes.",
        "Add the tomatoes, beans and water.",
        "Simmer for 25 minutes until the vegetables are soft.",
        "Season with salt. Serve with pap, rice or bread."
      ]
    },
    "tn": {
      "title": "Dinawa le merogo",
      "why": "Dinawa di tletse porotini le faeba, ga di ture e bile di go kgorisa diura di le dintsi.",
      "ingredients": [
        "dikopi di le 2 tsa dinawa tse di apeilweng (kgotsa thini e le 1, e tshololetswe metsi)",
        "eiye e le 1, e segilwe",
        "segwete se le 1, se segilwe",
        "potata e le 1, e segilwe",
        "ditamati di le 2, di segilwe",
        "khaba e kgolo e le 1 ya oli",
        "khaba e nnye e le 1 ya curry (ga go patelesege)",
        "dikopi di le 2 tsa metsi",
        "letswai"
      ],
      "steps": [
        "Gadika eiye mo oling go fitlha e nolofala.",
        "Tsenya segwete, potata le curry mme o fudue metsotso e le 2.",
        "Tsenya ditamati, dinawa le metsi.",
        "Bedisa ka bonya metsotso e le 25 go fitlha merogo e nolofala.",
        "Tsenya letswai. Ja ka bogobe, raese kgotsa borotho."
      ]
    }
  },
  {
    "id": "lentil",
    "emoji": "🍲",
    "mins": 35,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Lentil and pumpkin soup",
      "why": "A warm, gentle soup for days when your appetite is low. Lentils give protein and iron.",
      "ingredients": [
        "1 cup red lentils, rinsed",
        "2 cups pumpkin or butternut, cubed",
        "1 onion, chopped",
        "1 clove garlic",
        "1 tablespoon oil",
        "5 cups water or stock",
        "salt and pepper"
      ],
      "steps": [
        "Fry the onion and garlic in the oil until soft.",
        "Add the pumpkin, lentils and water.",
        "Simmer for 25 minutes until everything is soft.",
        "Mash or blend until smooth.",
        "Season and serve with bread."
      ]
    },
    "tn": {
      "title": "Sopo ya dilentile le lephutshe",
      "why": "Sopo e e mogote, e e bonolo ya malatsi a o sa batleng go ja thata. Dilentile di neela porotini le tshipi.",
      "ingredients": [
        "kopi e le 1 ya dilentile tse dihibidu, di tlhapilwe",
        "dikopi di le 2 tsa lephutshe, le segilwe",
        "eiye e le 1, e segilwe",
        "konope e le 1 ya garlic",
        "khaba e kgolo e le 1 ya oli",
        "dikopi di le 5 tsa metsi kgotsa sopo",
        "letswai le pepere"
      ],
      "steps": [
        "Gadika eiye le garlic mo oling go fitlha di nolofala.",
        "Tsenya lephutshe, dilentile le metsi.",
        "Bedisa ka bonya metsotso e le 25 go fitlha sengwe le sengwe se nolofala.",
        "Pitla kgotsa o sile go fitlha go nna boreledi.",
        "Tsenya letswai mme o je ka borotho."
      ]
    }
  },
  {
    "id": "chicken",
    "emoji": "🍗",
    "mins": 45,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Chicken and vegetable stew with pap",
      "why": "A filling family meal with protein and vegetables to rebuild strength.",
      "ingredients": [
        "4 chicken pieces",
        "1 onion, chopped",
        "2 carrots, sliced",
        "1 green pepper, chopped",
        "2 tomatoes, chopped",
        "1 tablespoon oil",
        "2 cups water",
        "salt and pepper",
        "maize meal for pap"
      ],
      "steps": [
        "Brown the chicken in the oil, then take it out.",
        "Fry the onion and green pepper until soft.",
        "Add the tomatoes, carrots, water and chicken.",
        "Cover and simmer for 30 minutes until the chicken is cooked through.",
        "Season and serve with soft pap."
      ]
    },
    "tn": {
      "title": "Nama ya koko le merogo ka bogobe",
      "why": "Dijo tsa lelapa tse di kgorisang tse di nang le porotini le merogo go busetsa maatla.",
      "ingredients": [
        "dikarolo di le 4 tsa koko",
        "eiye e le 1, e segilwe",
        "digwete di le 2, di segilwe",
        "pepere e le 1 e tala, e segilwe",
        "ditamati di le 2, di segilwe",
        "khaba e kgolo e le 1 ya oli",
        "dikopi di le 2 tsa metsi",
        "letswai le pepere",
        "bupi jwa bogobe"
      ],
      "steps": [
        "Gadika koko mo oling go fitlha e nna sootho, morago o e ntshe.",
        "Gadika eiye le pepere e tala go fitlha di nolofala.",
        "Tsenya ditamati, digwete, metsi le koko.",
        "Khurumetsa mme o bedise ka bonya metsotso e le 30 go fitlha koko e butswa.",
        "Tsenya letswai mme o je ka bogobe jo bo bonolo."
      ]
    }
  },
  {
    "id": "beef",
    "emoji": "🥩",
    "mins": 90,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Slow-cooked beef with vegetables",
      "why": "Slow cooking makes a cheaper cut tender. Beef is rich in iron and B12 for energy.",
      "ingredients": [
        "500 g stewing beef, cubed",
        "1 onion, chopped",
        "2 potatoes, cubed",
        "2 carrots, sliced",
        "1 tablespoon oil",
        "4 cups water",
        "salt"
      ],
      "steps": [
        "Brown the beef in the oil in a heavy pot.",
        "Add the onion and water, cover and simmer on low heat for 1 hour.",
        "Add the potatoes and carrots.",
        "Cook for 25 more minutes, adding a little water if needed.",
        "Season with salt and serve with morogo and pap."
      ]
    },
    "tn": {
      "title": "Nama ya kgomo e e apeilweng ka bonya le merogo",
      "why": "Go apaya ka bonya go nolofatsa nama e e sa tureng. Nama ya kgomo e na le tshipi le B12 tsa maatla.",
      "ingredients": [
        "500 g ya nama ya kgomo, e segilwe",
        "eiye e le 1, e segilwe",
        "dipotata di le 2, di segilwe",
        "digwete di le 2, di segilwe",
        "khaba e kgolo e le 1 ya oli",
        "dikopi di le 4 tsa metsi",
        "letswai"
      ],
      "steps": [
        "Gadika nama mo oling mo pitseng e e boima go fitlha e nna sootho.",
        "Tsenya eiye le metsi, khurumetsa mme o bedise ka molelo o o kwa tlase ura e le 1.",
        "Tsenya dipotata le digwete.",
        "Apaya metsotso e mengwe e le 25, o tsenya metsi a mannye fa go tlhokega.",
        "Tsenya letswai mme o je ka morogo le bogobe."
      ]
    }
  },
  {
    "id": "samp",
    "emoji": "🌽",
    "mins": 60,
    "serves": 4,
    "tag": "lunch",
    "en": {
      "title": "Samp and beans (dikgobe)",
      "why": "A traditional, budget meal that gives long-lasting energy and plant protein.",
      "ingredients": [
        "1 cup samp, soaked overnight",
        "1 cup sugar beans, soaked overnight",
        "1 onion, chopped",
        "1 tablespoon oil",
        "salt",
        "water"
      ],
      "steps": [
        "Drain the samp and beans, cover with fresh water in a pot.",
        "Boil, then simmer for about 1 hour until soft, adding water as needed.",
        "Fry the onion in the oil in a small pan.",
        "Stir the onion into the samp and beans.",
        "Season with salt and serve."
      ]
    },
    "tn": {
      "title": "Dikgobe",
      "why": "Dijo tsa setso, tse di sa tureng, tse di neelang maatla a a nnelang le porotini ya dimela.",
      "ingredients": [
        "kopi e le 1 ya samp, e inetswe bosigo jotlhe",
        "kopi e le 1 ya dinawa, di inetswe bosigo jotlhe",
        "eiye e le 1, e segilwe",
        "khaba e kgolo e le 1 ya oli",
        "letswai",
        "metsi"
      ],
      "steps": [
        "Tshololela metsi a samp le dinawa, o di tsenye mo pitseng ka metsi a mašwa.",
        "Bedisa, morago o apeye ka bonya ura e le nngwe go fitlha di nolofala, o tsenya metsi fa go tlhokega.",
        "Gadika eiye mo oling mo paneng e nnye.",
        "Tsenya eiye mo dikgobeng mme o fudue.",
        "Tsenya letswai mme o je."
      ]
    }
  },
  {
    "id": "butternut",
    "emoji": "🎃",
    "mins": 35,
    "serves": 3,
    "tag": "dinner",
    "en": {
      "title": "Roasted butternut and sweet potato",
      "why": "Orange vegetables give vitamin A and gentle carbohydrates that support a steady mood.",
      "ingredients": [
        "1 butternut, peeled and cubed",
        "2 sweet potatoes, cubed",
        "1 tablespoon oil",
        "1 pinch of salt",
        "1 pinch of cinnamon or mixed herbs"
      ],
      "steps": [
        "Heat the oven to 200 °C (or use a covered pot on the stove).",
        "Toss the vegetables with the oil, salt and spice.",
        "Spread them on a tray in one layer.",
        "Roast for 30 minutes, turning once, until golden and soft.",
        "Serve as a side or with beans for a full meal."
      ]
    },
    "tn": {
      "title": "Lephutshe le potata e monate tse di besitsweng",
      "why": "Merogo e e serolwana e neela vitamine A le dikhabohaedereite tse di bonolo tse di tshegetsang maikutlo a a tsepameng.",
      "ingredients": [
        "lephutshe le le 1, le obotswe le bo le segwa",
        "dipotata tse di monate di le 2, di segilwe",
        "khaba e kgolo e le 1 ya oli",
        "letswai le lennye",
        "cinnamon e nnye kgotsa ditlhare tse di nkgang monate"
      ],
      "steps": [
        "Bedisa ontong go fitlha 200 °C (kgotsa dirisa pitsa e e khurumeditsweng mo setofong).",
        "Tlhakanya merogo le oli, letswai le dinoko.",
        "E ale mo theraeng ka mokgabo o le mongwe.",
        "Besa metsotso e le 30, o e fetola gangwe, go fitlha e nna serolwana e bo e nolofala.",
        "Ja jaaka sejo sa thuso kgotsa ka dinawa go nna dijo tse di feletseng."
      ]
    }
  },
  {
    "id": "pilchards",
    "emoji": "🐟",
    "mins": 20,
    "serves": 3,
    "tag": "dinner",
    "en": {
      "title": "Pilchards in tomato and onion relish",
      "why": "Tinned fish is cheap and full of protein and omega-3 fats that support the brain and mood.",
      "ingredients": [
        "1 tin pilchards in tomato sauce",
        "1 onion, sliced",
        "1 green pepper, sliced",
        "1 tomato, chopped",
        "1 teaspoon oil",
        "pap or bread to serve"
      ],
      "steps": [
        "Fry the onion and green pepper in the oil until soft.",
        "Add the chopped tomato and cook for 3 minutes.",
        "Add the pilchards and their sauce, breaking them up gently.",
        "Heat through for 5 minutes.",
        "Serve with pap or bread."
      ]
    },
    "tn": {
      "title": "Ditlhapi tsa thini ka moro wa tamati le eiye",
      "why": "Ditlhapi tsa thini ga di ture e bile di tletse porotini le mafura a omega-3 a a tshegetsang boboko le maikutlo.",
      "ingredients": [
        "thini e le 1 ya ditlhapi mo moro wa tamati",
        "eiye e le 1, e segilwe",
        "pepere e le 1 e tala, e segilwe",
        "tamati e le 1, e segilwe",
        "khaba e nnye e le 1 ya oli",
        "bogobe kgotsa borotho"
      ],
      "steps": [
        "Gadika eiye le pepere e tala mo oling go fitlha di nolofala.",
        "Tsenya tamati e e segilweng mme o apeye metsotso e le 3.",
        "Tsenya ditlhapi le moro wa tsone, o di robe ka bonolo.",
        "Di bedise metsotso e le 5.",
        "Ja ka bogobe kgotsa borotho."
      ]
    }
  },
  {
    "id": "cabbage",
    "emoji": "🥗",
    "mins": 15,
    "serves": 2,
    "tag": "lunch",
    "en": {
      "title": "Cabbage and carrot stir-fry with egg",
      "why": "Quick, crunchy and cheap. Cabbage gives vitamin C and fibre; the egg adds protein.",
      "ingredients": [
        "1/4 cabbage, finely sliced",
        "1 carrot, grated",
        "1/2 onion, sliced",
        "2 eggs",
        "1 tablespoon oil",
        "salt and pepper"
      ],
      "steps": [
        "Heat the oil and fry the onion for 2 minutes.",
        "Add the cabbage and carrot and stir-fry for 5 minutes.",
        "Push the vegetables to the side and scramble the eggs in the space.",
        "Mix everything together.",
        "Season and serve on its own or with rice."
      ]
    },
    "tn": {
      "title": "Khabetšhe le segwete se se gadikilweng ka lee",
      "why": "Ka bonako, go a kgatlha e bile ga go ture. Khabetšhe e neela vitamine C le faeba; lee le oketsa porotini.",
      "ingredients": [
        "kotara ya khabetšhe, e segilwe sentle",
        "segwete se le 1, se gerilwe",
        "halofo ya eiye, e segilwe",
        "mae a le 2",
        "khaba e kgolo e le 1 ya oli",
        "letswai le pepere"
      ],
      "steps": [
        "Bedisa oli mme o gadike eiye metsotso e le 2.",
        "Tsenya khabetšhe le segwete mme o gadike metsotso e le 5.",
        "Kgarametsa merogo kwa thoko mme o fudue mae mo sebakeng seo.",
        "Tlhakanya sengwe le sengwe.",
        "Tsenya letswai mme o je jalo kgotsa ka raese."
      ]
    }
  },
  {
    "id": "pbsandwich",
    "emoji": "🥪",
    "mins": 5,
    "serves": 1,
    "tag": "snack",
    "en": {
      "title": "Peanut butter and banana sandwich",
      "why": "A fast snack for when a craving hits on an empty stomach. Hunger makes cravings stronger.",
      "ingredients": [
        "2 slices brown bread",
        "1 tablespoon peanut butter",
        "1 banana, sliced"
      ],
      "steps": [
        "Spread the peanut butter on one slice of bread.",
        "Lay the banana slices on top.",
        "Close the sandwich and cut in half.",
        "Eat slowly and drink a glass of water with it."
      ]
    },
    "tn": {
      "title": "Sangwiitšhe ya peanut butter le banana",
      "why": "Sejo se se bonako fa keletso e tla o le mo tlaleng. Tlala e dira dikeletso di nne maatla.",
      "ingredients": [
        "dilae di le 2 tsa borotho jo bo sootho",
        "khaba e kgolo e le 1 ya peanut butter",
        "banana e le 1, e segilwe"
      ],
      "steps": [
        "Tshasa peanut butter mo silaeng se le sengwe sa borotho.",
        "Baya dilae tsa banana kwa godimo.",
        "Tswala sangwiitšhe mme o e sege bogare.",
        "Ja ka bonya mme o nwe galase ya metsi le yone."
      ]
    }
  },
  {
    "id": "yoghurt",
    "emoji": "🍓",
    "mins": 5,
    "serves": 1,
    "tag": "snack",
    "en": {
      "title": "Yoghurt with fruit and seeds",
      "why": "Yoghurt helps gut health, which is linked to mood. Fruit adds natural sweetness for sugar cravings.",
      "ingredients": [
        "1 cup plain yoghurt or maas",
        "1 handful of fruit (banana, apple, orange or berries)",
        "1 tablespoon seeds or chopped peanuts",
        "1 teaspoon honey (optional)"
      ],
      "steps": [
        "Spoon the yoghurt or maas into a bowl.",
        "Chop the fruit and add it on top.",
        "Sprinkle the seeds or peanuts over.",
        "Add honey if you like."
      ]
    },
    "tn": {
      "title": "Yoghurt ka maungo le dipeo",
      "why": "Yoghurt e thusa boitekanelo jwa mala, jo bo amanang le maikutlo. Maungo a oketsa bomonate jwa tlholego fa o eletsa sukiri.",
      "ingredients": [
        "kopi e le 1 ya yoghurt kgotsa madila",
        "seatla se le 1 sa maungo (banana, apole, namune kgotsa diberi)",
        "khaba e kgolo e le 1 ya dipeo kgotsa manoko a a segilweng",
        "khaba e nnye e le 1 ya mamapo a dinotshe (ga go patelesege)"
      ],
      "steps": [
        "Tsenya yoghurt kgotsa madila mo sejaneng.",
        "Sega maungo mme o a tsenye kwa godimo.",
        "Gasa dipeo kgotsa manoko kwa godimo.",
        "Tsenya mamapo a dinotshe fa o rata."
      ]
    }
  },
  {
    "id": "omelette",
    "emoji": "🍳",
    "mins": 15,
    "serves": 1,
    "tag": "lunch",
    "en": {
      "title": "Vegetable omelette",
      "why": "Use whatever vegetables you have. Protein and vegetables in one pan, ready in minutes.",
      "ingredients": [
        "2 eggs",
        "1 handful spinach, chopped",
        "1/4 onion, chopped",
        "1/4 green pepper, chopped",
        "1 teaspoon oil",
        "salt and pepper"
      ],
      "steps": [
        "Beat the eggs with salt and pepper.",
        "Fry the onion, pepper and spinach in the oil for 3 minutes.",
        "Pour the eggs over the vegetables.",
        "Cook on low heat until set, then fold in half.",
        "Serve with bread or a salad."
      ]
    },
    "tn": {
      "title": "Omelete ya merogo",
      "why": "Dirisa merogo epe e o nang le yone. Porotini le merogo mo paneng e le nngwe, e siame ka metsotso.",
      "ingredients": [
        "mae a le 2",
        "seatla se le 1 sa sepinatšhe, se segilwe",
        "kotara ya eiye, e segilwe",
        "kotara ya pepere e tala, e segilwe",
        "khaba e nnye e le 1 ya oli",
        "letswai le pepere"
      ],
      "steps": [
        "Itaya mae le letswai le pepere.",
        "Gadika eiye, pepere le sepinatšhe mo oling metsotso e le 3.",
        "Tshela mae mo godimo ga merogo.",
        "Apaya ka molelo o o kwa tlase go fitlha a tiya, morago o mene bogare.",
        "Ja ka borotho kgotsa salate."
      ]
    }
  },
  {
    "id": "chickpea",
    "emoji": "🍛",
    "mins": 30,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Chickpea and tomato curry with rice",
      "why": "A warming plant-protein meal. Spices add flavour without needing lots of salt or sugar.",
      "ingredients": [
        "1 tin chickpeas, drained",
        "1 onion, chopped",
        "2 tomatoes, chopped",
        "1 tablespoon curry powder",
        "1 tablespoon oil",
        "1 cup water",
        "salt",
        "cooked rice to serve"
      ],
      "steps": [
        "Fry the onion in the oil until soft.",
        "Add the curry powder and stir for 1 minute.",
        "Add the tomatoes and cook until saucy.",
        "Add the chickpeas and water, simmer for 15 minutes.",
        "Season and serve with rice."
      ]
    },
    "tn": {
      "title": "Curry ya chickpea le tamati ka raese",
      "why": "Dijo tse di thuthafatsang tsa porotini ya dimela. Dinoko di oketsa tatso go sa tlhokege letswai kgotsa sukiri e ntsi.",
      "ingredients": [
        "thini e le 1 ya chickpea, e tshololetswe metsi",
        "eiye e le 1, e segilwe",
        "ditamati di le 2, di segilwe",
        "khaba e kgolo e le 1 ya curry",
        "khaba e kgolo e le 1 ya oli",
        "kopi e le 1 ya metsi",
        "letswai",
        "raese e e apeilweng"
      ],
      "steps": [
        "Gadika eiye mo oling go fitlha e nolofala.",
        "Tsenya curry mme o fudue motsotso o le 1.",
        "Tsenya ditamati mme o apeye go fitlha go nna moro.",
        "Tsenya chickpea le metsi, bedisa ka bonya metsotso e le 15.",
        "Tsenya letswai mme o je ka raese."
      ]
    }
  },
  {
    "id": "sweetbean",
    "emoji": "🥙",
    "mins": 15,
    "serves": 2,
    "tag": "lunch",
    "en": {
      "title": "Sweet potato and bean salad",
      "why": "A colourful, filling salad that is good cold, so you can make it ahead for busy days.",
      "ingredients": [
        "2 sweet potatoes, boiled and cubed",
        "1 cup cooked beans",
        "1 tomato, chopped",
        "1/4 onion, finely chopped",
        "1 handful spinach or lettuce",
        "1 tablespoon oil and a squeeze of lemon",
        "salt"
      ],
      "steps": [
        "Boil the sweet potato cubes for 10 minutes until just soft, then cool.",
        "Mix the sweet potato, beans, tomato and onion in a bowl.",
        "Add the spinach or lettuce.",
        "Dress with oil, lemon and salt and toss gently."
      ]
    },
    "tn": {
      "title": "Salate ya potata e monate le dinawa",
      "why": "Salate e e mebalabala, e e kgorisang e e monate e tsiditse, ka jalo o ka e baakanya pele ga malatsi a a tshwaregileng.",
      "ingredients": [
        "dipotata tse di monate di le 2, di bedisitswe di bo di segwa",
        "kopi e le 1 ya dinawa tse di apeilweng",
        "tamati e le 1, e segilwe",
        "kotara ya eiye, e segilwe sentle",
        "seatla se le 1 sa sepinatšhe kgotsa lettuce",
        "khaba e kgolo e le 1 ya oli le lemone e nnye",
        "letswai"
      ],
      "steps": [
        "Bedisa dipotata tse di monate metsotso e le 10 go fitlha di nolofala, morago o di tsidifatse.",
        "Tlhakanya potata, dinawa, tamati le eiye mo sejaneng.",
        "Tsenya sepinatšhe kgotsa lettuce.",
        "Tsenya oli, lemone le letswai mme o tlhakanye ka bonolo."
      ]
    }
  },
  {
    "id": "smoothie",
    "emoji": "🥤",
    "mins": 5,
    "serves": 1,
    "tag": "drink",
    "en": {
      "title": "Banana and mango smoothie",
      "why": "A gentle way to get fruit, fluids and some protein when you do not feel like eating.",
      "ingredients": [
        "1 banana",
        "1/2 mango (or 1 cup of any fruit)",
        "1 cup yoghurt or milk",
        "a few ice cubes (optional)"
      ],
      "steps": [
        "Peel and chop the fruit.",
        "Put everything in a blender.",
        "Blend until smooth.",
        "Pour into a glass and sip slowly. No blender? Mash the fruit well and stir into the yoghurt."
      ]
    },
    "tn": {
      "title": "Smoothie ya banana le mango",
      "why": "Tsela e e bonolo ya go bona maungo, metsi le porotini fa o sa ikutlwe o batla go ja.",
      "ingredients": [
        "banana e le 1",
        "halofo ya mango (kgotsa kopi e le 1 ya leungo lepe)",
        "kopi e le 1 ya yoghurt kgotsa mashi",
        "dikaba di le mmalwa tsa aese (ga go patelesege)"
      ],
      "steps": [
        "Obola o bo o sega maungo.",
        "Tsenya sengwe le sengwe mo motšhining wa go sila.",
        "Sila go fitlha go nna boreledi.",
        "Tshela mo galaseng mme o nwe ka bonya. Ga o na motšhine? Pitla maungo sentle mme o a tlhakanye le yoghurt."
      ]
    }
  },
  {
    "id": "rooibos",
    "emoji": "🫖",
    "mins": 10,
    "serves": 4,
    "tag": "drink",
    "en": {
      "title": "Rooibos iced tea with lemon",
      "why": "A caffeine-free drink to keep in the fridge. Having something cold to sip helps in moments you would usually drink.",
      "ingredients": [
        "3 rooibos tea bags",
        "1 litre hot water",
        "1 lemon, sliced",
        "1 tablespoon honey (optional)",
        "ice"
      ],
      "steps": [
        "Steep the tea bags in the hot water for 5 minutes.",
        "Remove the bags and stir in the honey if using.",
        "Add the lemon slices and let it cool.",
        "Keep it in the fridge and serve over ice."
      ]
    },
    "tn": {
      "title": "Tee ya rooibos e e tsididi ka lemone",
      "why": "Seno se se se nang caffeine se o ka se bayang mo setsidifatsing. Go nna le sengwe se se tsididi sa go nwa go thusa mo metsotsong e o neng o tle o nwe.",
      "ingredients": [
        "dikgetsana di le 3 tsa tee ya rooibos",
        "litara e le 1 ya metsi a a mogote",
        "lemone e le 1, e segilwe",
        "khaba e kgolo e le 1 ya mamapo a dinotshe (ga go patelesege)",
        "aese"
      ],
      "steps": [
        "Ina dikgetsana tsa tee mo metsing a a mogote metsotso e le 5.",
        "Ntsha dikgetsana mme o tsenye mamapo a dinotshe fa o a dirisa.",
        "Tsenya dilae tsa lemone mme o e lese e tsidifale.",
        "E boloke mo setsidifatsing mme o e nwe ka aese."
      ]
    }
  },
  {
    "id": "infused",
    "emoji": "💧",
    "mins": 5,
    "serves": 4,
    "tag": "drink",
    "en": {
      "title": "Lemon, cucumber and mint water",
      "why": "Drinking enough water helps headaches, tiredness and cravings, which are common in early recovery.",
      "ingredients": [
        "1 litre cold water",
        "1/2 cucumber, sliced",
        "1/2 lemon, sliced",
        "a few mint leaves"
      ],
      "steps": [
        "Put the cucumber, lemon and mint in a jug.",
        "Fill with cold water.",
        "Leave in the fridge for 30 minutes.",
        "Drink through the day and refill with water."
      ]
    },
    "tn": {
      "title": "Metsi a lemone, kukumere le mint",
      "why": "Go nwa metsi a a lekaneng go thusa ka tlhogo e e botlhoko, letsapa le dikeletso, tse di tlwaelegileng kwa tshimologong ya go fola.",
      "ingredients": [
        "litara e le 1 ya metsi a a tsididi",
        "halofo ya kukumere, e segilwe",
        "halofo ya lemone, e segilwe",
        "matlhare a le mmalwa a mint"
      ],
      "steps": [
        "Tsenya kukumere, lemone le mint mo jokong.",
        "Tlatsa ka metsi a a tsididi.",
        "Lesa mo setsidifatsing metsotso e le 30.",
        "Nwa letsatsi lotlhe mme o tlatse gape ka metsi."
      ]
    }
  },
  {
    "id": "mince",
    "emoji": "🍝",
    "mins": 30,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Beef mince and vegetable pot with brown rice",
      "why": "A one-pot meal that stretches a little meat with lots of vegetables. Freezes well for hard days.",
      "ingredients": [
        "250 g lean beef mince",
        "1 onion, chopped",
        "1 carrot, grated",
        "1 cup chopped cabbage or spinach",
        "1 tin chopped tomatoes",
        "1 tablespoon oil",
        "1 cup water",
        "salt",
        "brown rice to serve"
      ],
      "steps": [
        "Fry the onion in the oil, then add the mince and brown it.",
        "Add the carrot, cabbage or spinach, tomatoes and water.",
        "Simmer for 20 minutes, stirring now and then.",
        "Season with salt.",
        "Serve with brown rice. Freeze extra portions."
      ]
    },
    "tn": {
      "title": "Nama e e sitsweng ya kgomo le merogo ka raese e e sootho",
      "why": "Dijo tsa pitsa e le nngwe tse di atolosang nama e nnye ka merogo e mentsi. Di bolokega sentle mo setsidifatsing sa aese ga malatsi a a thata.",
      "ingredients": [
        "250 g ya nama e e sitsweng ya kgomo",
        "eiye e le 1, e segilwe",
        "segwete se le 1, se gerilwe",
        "kopi e le 1 ya khabetšhe kgotsa sepinatšhe se se segilweng",
        "thini e le 1 ya ditamati tse di segilweng",
        "khaba e kgolo e le 1 ya oli",
        "kopi e le 1 ya metsi",
        "letswai",
        "raese e e sootho"
      ],
      "steps": [
        "Gadika eiye mo oling, morago o tsenye nama o e gadike go fitlha e nna sootho.",
        "Tsenya segwete, khabetšhe kgotsa sepinatšhe, ditamati le metsi.",
        "Bedisa ka bonya metsotso e le 20, o fudua ka dinako.",
        "Tsenya letswai.",
        "Ja ka raese e e sootho. Boloka tse di setseng mo setsidifatsing sa aese."
      ]
    }
  },
  {
    "id": "soup",
    "emoji": "🥣",
    "mins": 40,
    "serves": 4,
    "tag": "lunch",
    "en": {
      "title": "Chicken and vegetable soup",
      "why": "Easy on the stomach, warming and hydrating. Good on days you feel unwell or low.",
      "ingredients": [
        "2 chicken pieces",
        "1 onion, chopped",
        "2 carrots, sliced",
        "2 potatoes, cubed",
        "1 handful spinach",
        "6 cups water",
        "salt and pepper"
      ],
      "steps": [
        "Put the chicken, onion and water in a pot and bring to the boil.",
        "Simmer for 20 minutes, then take out the chicken and pull the meat off the bones.",
        "Add the carrots and potatoes and cook for 15 minutes.",
        "Return the chicken and add the spinach for 2 minutes.",
        "Season and serve in bowls."
      ]
    },
    "tn": {
      "title": "Sopo ya koko le merogo",
      "why": "E bonolo mo maleng, e a thuthafatsa e bile e naya mmele metsi. E siame mo malatsing a o sa ikutlweng sentle kgotsa o kwatlafetse.",
      "ingredients": [
        "dikarolo di le 2 tsa koko",
        "eiye e le 1, e segilwe",
        "digwete di le 2, di segilwe",
        "dipotata di le 2, di segilwe",
        "seatla se le 1 sa sepinatšhe",
        "dikopi di le 6 tsa metsi",
        "letswai le pepere"
      ],
      "steps": [
        "Tsenya koko, eiye le metsi mo pitseng mme o bedise.",
        "Bedisa ka bonya metsotso e le 20, morago o ntshe koko o kgaoganye nama le marapo.",
        "Tsenya digwete le dipotata mme o apeye metsotso e le 15.",
        "Busetsa koko mme o tsenye sepinatšhe metsotso e le 2.",
        "Tsenya letswai mme o je mo dijaneng."
      ]
    }
  },
  {
    "id": "mealie",
    "emoji": "🌽",
    "mins": 25,
    "serves": 4,
    "tag": "snack",
    "en": {
      "title": "Boiled mealies with roasted peanuts",
      "why": "A filling, traditional snack. Keeping healthy snacks nearby helps avoid the hunger that fuels cravings.",
      "ingredients": [
        "4 fresh mealies (maize cobs)",
        "1 cup raw peanuts",
        "1 pinch of salt",
        "water"
      ],
      "steps": [
        "Boil the mealies in salted water for 20 minutes.",
        "Meanwhile, dry-roast the peanuts in a pan for 5 to 8 minutes, stirring often.",
        "Let the peanuts cool and sprinkle with a little salt.",
        "Serve the mealies with the peanuts on the side."
      ]
    },
    "tn": {
      "title": "Mmidi o o bedisitsweng le manoko a a besitsweng",
      "why": "Sejo sa setso se se kgorisang. Go nna le dijo tse di itekanetseng gaufi go thusa go tila tlala e e oketsang dikeletso.",
      "ingredients": [
        "mmidi o le 4 o mošwa",
        "kopi e le 1 ya manoko a a tala",
        "letswai le lennye",
        "metsi"
      ],
      "steps": [
        "Bedisa mmidi mo metsing a a nang le letswai metsotso e le 20.",
        "Fa o ntse o letile, besa manoko mo paneng e e omileng metsotso e le 5 go ya go 8, o ntse o fudua.",
        "Lesa manoko a tsidifale mme o gase letswai le lennye.",
        "Ja mmidi ka manoko fa thoko."
      ]
    }
  }
];

export const RECIPES_GLOBAL: Recipe[] = [
  {
    "id": "overnight-oats",
    "emoji": "🥣",
    "mins": 5,
    "serves": 1,
    "tag": "breakfast",
    "en": {
      "title": "Overnight oats",
      "why": "Made the night before, so breakfast is ready even on a hard morning. Oats give slow energy and B vitamins.",
      "ingredients": [
        "1/2 cup rolled oats",
        "1/2 cup milk or plant milk",
        "1/4 cup plain yoghurt",
        "1 teaspoon honey",
        "1 handful berries or chopped fruit"
      ],
      "steps": [
        "Mix the oats, milk, yoghurt and honey in a jar.",
        "Cover and leave in the fridge overnight.",
        "In the morning, stir and add the fruit.",
        "Eat cold, or warm it for 1 minute."
      ]
    }
  },
  {
    "id": "avocado-toast",
    "emoji": "🥑",
    "mins": 10,
    "serves": 1,
    "tag": "breakfast",
    "en": {
      "title": "Avocado toast with egg",
      "why": "Healthy fats and protein keep you full and steady, so hunger does not trigger cravings mid-morning.",
      "ingredients": [
        "2 slices wholegrain bread",
        "1 ripe avocado",
        "2 eggs",
        "1 squeeze of lemon",
        "salt, pepper and chilli flakes (optional)"
      ],
      "steps": [
        "Toast the bread.",
        "Mash the avocado with lemon, salt and pepper.",
        "Fry, boil or poach the eggs.",
        "Spread the avocado on the toast and top with the eggs."
      ]
    }
  },
  {
    "id": "parfait",
    "emoji": "🍓",
    "mins": 5,
    "serves": 1,
    "tag": "snack",
    "en": {
      "title": "Yoghurt parfait",
      "why": "A quick sweet treat with protein and fruit, good for sugar cravings.",
      "ingredients": [
        "1 cup plain or Greek yoghurt",
        "1/2 cup granola or oats",
        "1 cup mixed berries or fruit",
        "1 teaspoon honey"
      ],
      "steps": [
        "Spoon a layer of yoghurt into a glass.",
        "Add a layer of fruit, then granola.",
        "Repeat the layers.",
        "Drizzle with honey and eat straight away."
      ]
    }
  },
  {
    "id": "banana-pancakes",
    "emoji": "🥞",
    "mins": 15,
    "serves": 2,
    "tag": "breakfast",
    "en": {
      "title": "Banana oat pancakes",
      "why": "Naturally sweet pancakes with no added sugar. A good weekend breakfast to look forward to.",
      "ingredients": [
        "2 ripe bananas",
        "2 eggs",
        "1/2 cup oats",
        "1 pinch of cinnamon",
        "1 teaspoon oil for the pan"
      ],
      "steps": [
        "Mash the bananas in a bowl.",
        "Beat in the eggs, then stir in the oats and cinnamon.",
        "Heat a little oil in a pan over medium heat.",
        "Cook small spoonfuls for 2 minutes on each side.",
        "Serve with fruit or yoghurt."
      ]
    }
  },
  {
    "id": "shakshuka",
    "emoji": "🍳",
    "mins": 25,
    "serves": 2,
    "tag": "lunch",
    "en": {
      "title": "Shakshuka (eggs in tomato sauce)",
      "why": "A warming one-pan meal from North Africa and the Middle East, full of protein and vegetables.",
      "ingredients": [
        "1 onion, chopped",
        "1 red pepper, chopped",
        "2 cloves garlic",
        "1 tin chopped tomatoes",
        "1 teaspoon cumin and 1 teaspoon paprika",
        "4 eggs",
        "1 tablespoon olive oil",
        "bread to serve"
      ],
      "steps": [
        "Fry the onion and pepper in the oil until soft.",
        "Add the garlic and spices for 1 minute.",
        "Pour in the tomatoes and simmer for 10 minutes.",
        "Make 4 hollows and crack an egg into each.",
        "Cover and cook for 6 to 8 minutes until the eggs are set. Serve with bread."
      ]
    }
  },
  {
    "id": "minestrone",
    "emoji": "🍲",
    "mins": 40,
    "serves": 4,
    "tag": "lunch",
    "en": {
      "title": "Minestrone soup",
      "why": "An Italian vegetable soup that is gentle on the stomach and easy to make in a big batch.",
      "ingredients": [
        "1 onion, 1 carrot and 1 celery stick, chopped",
        "2 cloves garlic",
        "1 tin chopped tomatoes",
        "1 tin beans, drained",
        "1 cup small pasta",
        "5 cups vegetable stock",
        "1 handful spinach",
        "1 tablespoon olive oil"
      ],
      "steps": [
        "Fry the onion, carrot and celery in the oil for 5 minutes.",
        "Add the garlic, tomatoes and stock and bring to the boil.",
        "Add the pasta and beans and simmer for 10 minutes.",
        "Stir in the spinach for the last 2 minutes.",
        "Season and serve. Freeze extra portions."
      ]
    }
  },
  {
    "id": "chicken-noodle",
    "emoji": "🍜",
    "mins": 35,
    "serves": 4,
    "tag": "lunch",
    "en": {
      "title": "Chicken noodle soup",
      "why": "A comforting classic for days you feel run down. Warm, hydrating and easy to eat.",
      "ingredients": [
        "2 chicken breasts or 4 thighs",
        "1 onion, 2 carrots and 2 celery sticks, chopped",
        "6 cups chicken stock",
        "1 cup egg noodles",
        "salt, pepper and parsley"
      ],
      "steps": [
        "Put the chicken, vegetables and stock in a pot and bring to the boil.",
        "Simmer for 20 minutes, then take out the chicken and shred it.",
        "Add the noodles and cook for 5 minutes.",
        "Return the chicken, season, and sprinkle with parsley."
      ]
    }
  },
  {
    "id": "dal",
    "emoji": "🍛",
    "mins": 30,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Lentil dal",
      "why": "A budget Indian favourite. Lentils give plant protein, iron and fibre for steady energy.",
      "ingredients": [
        "1 cup red lentils, rinsed",
        "1 onion, chopped",
        "2 cloves garlic and 1 thumb of ginger, grated",
        "1 teaspoon turmeric and 1 teaspoon cumin",
        "1 tin chopped tomatoes",
        "3 cups water",
        "1 tablespoon oil",
        "rice or flatbread to serve"
      ],
      "steps": [
        "Fry the onion in the oil until golden.",
        "Add the garlic, ginger and spices for 1 minute.",
        "Add the lentils, tomatoes and water.",
        "Simmer for 20 minutes, stirring, until thick and soft.",
        "Season and serve with rice or flatbread."
      ]
    }
  },
  {
    "id": "chili",
    "emoji": "🌶️",
    "mins": 40,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Chilli con carne",
      "why": "A hearty, freezer-friendly meal. Beans and lean mince give protein and fibre.",
      "ingredients": [
        "250 g lean beef mince",
        "1 onion and 1 pepper, chopped",
        "2 cloves garlic",
        "1 tin kidney beans, drained",
        "1 tin chopped tomatoes",
        "1 teaspoon chilli powder and 1 teaspoon cumin",
        "1 tablespoon oil",
        "rice to serve"
      ],
      "steps": [
        "Brown the mince in the oil, then add the onion and pepper.",
        "Add the garlic and spices and stir for 1 minute.",
        "Add the tomatoes and beans.",
        "Simmer for 25 minutes, stirring now and then.",
        "Serve with rice."
      ]
    }
  },
  {
    "id": "bolognese",
    "emoji": "🍝",
    "mins": 35,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Spaghetti bolognese with hidden vegetables",
      "why": "A family favourite with extra vegetables blended into the sauce.",
      "ingredients": [
        "250 g lean beef mince",
        "1 onion, 1 carrot and 1 courgette, grated",
        "2 cloves garlic",
        "1 tin chopped tomatoes",
        "1 tablespoon tomato paste",
        "1 teaspoon dried herbs",
        "300 g spaghetti",
        "1 tablespoon oil"
      ],
      "steps": [
        "Fry the onion, carrot and courgette in the oil for 5 minutes.",
        "Add the mince and brown it.",
        "Stir in the garlic, tomatoes, paste and herbs.",
        "Simmer for 20 minutes.",
        "Cook the spaghetti and serve with the sauce."
      ]
    }
  },
  {
    "id": "stir-fry",
    "emoji": "🥡",
    "mins": 20,
    "serves": 2,
    "tag": "dinner",
    "en": {
      "title": "Chicken and vegetable stir-fry",
      "why": "Fast, colourful and full of vegetables. Cooking something quick helps on low-energy evenings.",
      "ingredients": [
        "1 chicken breast, sliced",
        "2 cups mixed vegetables (pepper, broccoli, carrot, cabbage)",
        "2 cloves garlic and 1 thumb of ginger",
        "2 tablespoons soy sauce",
        "1 tablespoon oil",
        "cooked rice or noodles"
      ],
      "steps": [
        "Heat the oil in a large pan until very hot.",
        "Stir-fry the chicken for 5 minutes until cooked.",
        "Add the vegetables, garlic and ginger and stir-fry for 4 minutes.",
        "Add the soy sauce and toss.",
        "Serve with rice or noodles."
      ]
    }
  },
  {
    "id": "fried-rice",
    "emoji": "🍚",
    "mins": 15,
    "serves": 2,
    "tag": "lunch",
    "en": {
      "title": "Egg fried rice",
      "why": "A great way to use leftover rice. Eggs and peas add protein.",
      "ingredients": [
        "2 cups cooked rice (cold is best)",
        "2 eggs",
        "1 cup peas and carrots",
        "2 spring onions, sliced",
        "2 tablespoons soy sauce",
        "1 tablespoon oil"
      ],
      "steps": [
        "Heat the oil and scramble the eggs, then push them to one side.",
        "Add the peas and carrots and cook for 2 minutes.",
        "Add the rice and stir-fry until hot.",
        "Add the soy sauce and spring onions and mix well."
      ]
    }
  },
  {
    "id": "chicken-curry",
    "emoji": "🍛",
    "mins": 40,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Mild chicken curry",
      "why": "A warming curry with protein and vegetables. Spices give flavour without lots of salt.",
      "ingredients": [
        "4 chicken thighs, cubed",
        "1 onion, chopped",
        "2 cloves garlic and 1 thumb of ginger",
        "2 tablespoons mild curry powder",
        "1 tin chopped tomatoes",
        "1/2 cup plain yoghurt or coconut milk",
        "1 tablespoon oil",
        "rice to serve"
      ],
      "steps": [
        "Fry the onion in the oil until soft.",
        "Add the garlic, ginger and curry powder for 1 minute.",
        "Add the chicken and brown it.",
        "Add the tomatoes and simmer for 20 minutes.",
        "Stir in the yoghurt or coconut milk and serve with rice."
      ]
    }
  },
  {
    "id": "baked-fish",
    "emoji": "🐟",
    "mins": 30,
    "serves": 2,
    "tag": "dinner",
    "en": {
      "title": "Baked fish with roasted vegetables",
      "why": "Fish gives omega-3 fats that support the brain and mood. One tray, easy clean-up.",
      "ingredients": [
        "2 fish fillets (hake, tilapia or salmon)",
        "2 potatoes, cubed",
        "1 pepper and 1 courgette, chopped",
        "1 lemon",
        "1 tablespoon olive oil",
        "salt, pepper and dried herbs"
      ],
      "steps": [
        "Heat the oven to 200 °C.",
        "Toss the vegetables with the oil and seasoning on a tray and roast for 15 minutes.",
        "Add the fish to the tray, squeeze lemon over it and season.",
        "Roast for 12 more minutes until the fish flakes easily."
      ]
    }
  },
  {
    "id": "greek-salad",
    "emoji": "🥗",
    "mins": 10,
    "serves": 2,
    "tag": "lunch",
    "en": {
      "title": "Greek salad with chickpeas",
      "why": "Fresh and crunchy, with chickpeas for protein. No cooking needed.",
      "ingredients": [
        "2 tomatoes and 1 cucumber, chopped",
        "1/2 red onion, sliced",
        "1 tin chickpeas, drained",
        "100 g feta cheese",
        "a few olives",
        "2 tablespoons olive oil and a squeeze of lemon"
      ],
      "steps": [
        "Put the tomatoes, cucumber and onion in a bowl.",
        "Add the chickpeas and olives.",
        "Crumble the feta on top.",
        "Dress with oil, lemon, salt and pepper and toss."
      ]
    }
  },
  {
    "id": "tuna-pasta",
    "emoji": "🍝",
    "mins": 20,
    "serves": 3,
    "tag": "lunch",
    "en": {
      "title": "Tuna pasta salad",
      "why": "Cheap, filling and good cold, so you can make it ahead for the week.",
      "ingredients": [
        "250 g pasta",
        "1 tin tuna, drained",
        "1 cup sweetcorn",
        "1 pepper, chopped",
        "2 tablespoons mayonnaise or plain yoghurt",
        "salt and pepper"
      ],
      "steps": [
        "Cook the pasta, drain and cool under cold water.",
        "Mix in the tuna, sweetcorn and pepper.",
        "Stir in the mayonnaise or yoghurt.",
        "Season and keep in the fridge for up to 3 days."
      ]
    }
  },
  {
    "id": "hummus",
    "emoji": "🥕",
    "mins": 10,
    "serves": 4,
    "tag": "snack",
    "en": {
      "title": "Hummus with vegetable sticks",
      "why": "Something to crunch on when you feel restless. Chickpeas give protein and fibre.",
      "ingredients": [
        "1 tin chickpeas, drained (keep some liquid)",
        "2 tablespoons tahini or peanut butter",
        "1 clove garlic",
        "juice of 1 lemon",
        "2 tablespoons olive oil",
        "carrots, cucumber and peppers cut into sticks"
      ],
      "steps": [
        "Blend the chickpeas, tahini, garlic, lemon and oil.",
        "Add a little chickpea liquid until smooth.",
        "Season with salt.",
        "Serve with the vegetable sticks."
      ]
    }
  },
  {
    "id": "tortilla",
    "emoji": "🥔",
    "mins": 30,
    "serves": 4,
    "tag": "dinner",
    "en": {
      "title": "Spanish omelette (tortilla)",
      "why": "A Spanish classic of eggs and potatoes. Good hot or cold, and lasts a few days.",
      "ingredients": [
        "4 potatoes, thinly sliced",
        "1 onion, sliced",
        "6 eggs",
        "3 tablespoons olive oil",
        "salt"
      ],
      "steps": [
        "Cook the potatoes and onion slowly in the oil for 15 minutes until soft.",
        "Beat the eggs with salt in a bowl and stir in the potatoes.",
        "Pour back into the pan and cook on low heat for 8 minutes.",
        "Flip using a plate and cook for 3 more minutes.",
        "Cut into wedges."
      ]
    }
  },
  {
    "id": "green-smoothie",
    "emoji": "🥤",
    "mins": 5,
    "serves": 1,
    "tag": "drink",
    "en": {
      "title": "Green smoothie",
      "why": "A simple way to get fruit and greens when you do not feel like eating.",
      "ingredients": [
        "1 banana",
        "1 handful spinach",
        "1/2 cup frozen mango or pineapple",
        "1 cup milk or water",
        "1 tablespoon oats (optional)"
      ],
      "steps": [
        "Put everything in a blender.",
        "Blend until smooth.",
        "Add more liquid if it is too thick.",
        "Sip slowly."
      ]
    }
  },
  {
    "id": "fruit-salad",
    "emoji": "🍉",
    "mins": 10,
    "serves": 4,
    "tag": "snack",
    "en": {
      "title": "Fruit salad with mint",
      "why": "Naturally sweet and hydrating. Keep a bowl in the fridge for sugar cravings.",
      "ingredients": [
        "4 cups mixed fruit (watermelon, orange, apple, grapes, pineapple)",
        "a few mint leaves",
        "juice of 1/2 lime or orange"
      ],
      "steps": [
        "Chop the fruit into bite-sized pieces.",
        "Put it in a bowl.",
        "Squeeze over the juice and add the chopped mint.",
        "Chill and eat within 2 days."
      ]
    }
  },
  {
    "id": "ginger-tea",
    "emoji": "🫖",
    "mins": 10,
    "serves": 2,
    "tag": "drink",
    "en": {
      "title": "Ginger and lemon tea",
      "why": "A calming, caffeine-free drink that can settle the stomach.",
      "ingredients": [
        "1 thumb of fresh ginger, sliced",
        "2 cups water",
        "juice of 1/2 lemon",
        "1 teaspoon honey"
      ],
      "steps": [
        "Boil the ginger in the water for 5 minutes.",
        "Pour into mugs.",
        "Add the lemon and honey.",
        "Sip slowly while warm."
      ]
    }
  },
  {
    "id": "burrito-bowl",
    "emoji": "🌯",
    "mins": 20,
    "serves": 2,
    "tag": "dinner",
    "en": {
      "title": "Bean burrito bowl",
      "why": "A colourful bowl with beans, rice and vegetables. Easy to change with what you have.",
      "ingredients": [
        "1 cup cooked rice",
        "1 tin black or kidney beans, drained",
        "1 cup sweetcorn",
        "1 tomato and 1/2 onion, chopped",
        "1 avocado",
        "1 teaspoon cumin",
        "lime and fresh coriander"
      ],
      "steps": [
        "Warm the beans with the cumin and a little salt.",
        "Mix the tomato, onion, lime and coriander to make salsa.",
        "Divide the rice between bowls.",
        "Top with beans, sweetcorn, salsa and sliced avocado."
      ]
    }
  }
];

/** The set for the app language: Botswana dishes in Setswana, international dishes in English. */
export const recipesFor = (lang: 'en' | 'tn') => (lang === 'tn' ? RECIPES : RECIPES_GLOBAL);
export const findRecipe = (id: string) => RECIPES.find((r) => r.id === id) ?? RECIPES_GLOBAL.find((r) => r.id === id);
