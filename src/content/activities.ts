// Guided recovery activities (10 to 15 minutes). Each has a reason it helps and
// step-by-step guidance in English and Setswana.
export type ActivityCat = 'calm' | 'move' | 'connect' | 'spirit' | 'nourish' | 'create';
export type GuidedActivity = {
  id: string;
  icon: string;
  cat: ActivityCat;
  mins: number;
  link?: string;
  breathe?: number[];
  en: { title: string; why: string; steps: string[] };
  tn: { title: string; why: string; steps: string[] };
};

export const ACTIVITIES: GuidedActivity[] = [
  {
    "id": "grounding",
    "icon": "hand-left-outline",
    "cat": "calm",
    "mins": 5,
    "en": {
      "title": "5-4-3-2-1 grounding",
      "why": "Brings your mind back to the present when a craving or worry pulls you away.",
      "steps": [
        "Sit comfortably and put both feet flat on the floor.",
        "Look around and name 5 things you can see. Say them out loud or in your head.",
        "Notice 4 things you can touch: your clothes, the chair, the floor, your hands.",
        "Listen for 3 sounds, near or far.",
        "Find 2 things you can smell, or 2 smells you like.",
        "Name 1 thing you can taste, or take a sip of water.",
        "Take one slow breath. Notice that you are here, now, and safe."
      ]
    },
    "tn": {
      "title": "Go iketla ka 5-4-3-2-1",
      "why": "E busetsa mogopolo wa gago mo nakong ya jaanong fa keletso kgotsa matshwenyego a go goga.",
      "steps": [
        "Nna ka boiketlo mme o baye dinao tsotlhe tse pedi mo fatshe.",
        "Leba gotlhe mme o bolele dilo di le 5 tse o di bonang. Di bue ka lentswe kgotsa mo mogopolong.",
        "Lemoga dilo di le 4 tse o ka di kgomang: diaparo tsa gago, setulo, lefatshe, diatla tsa gago.",
        "Reetsa medumo e le 3, e e gaufi kgotsa e e kgakala.",
        "Batla dilo di le 2 tse o di nkgelang, kgotsa menko e le 2 e o e ratang.",
        "Bolela selo se le 1 se o se utlwang ka loleme, kgotsa o nwe metsi go le gonnye.",
        "Hema ka bonya gangwe. Lemoga gore o fano, jaanong, e bile o babalesegile."
      ]
    }
  },
  {
    "id": "box",
    "icon": "cloud-outline",
    "cat": "calm",
    "mins": 5,
    "en": {
      "title": "Box breathing",
      "why": "Slow, even breathing tells your body it is safe and lowers stress quickly.",
      "steps": [
        "Sit up straight and relax your shoulders.",
        "Breathe out all the air in your lungs.",
        "Breathe in slowly through your nose for 4 counts.",
        "Hold your breath gently for 4 counts.",
        "Breathe out slowly through your mouth for 4 counts.",
        "Hold for 4 counts.",
        "Follow the circle and repeat for 5 minutes."
      ]
    },
    "tn": {
      "title": "Go hema ka sekwere",
      "why": "Go hema ka bonya le ka tekano go bolelela mmele gore o babalesegile mme go fokotsa kgatelelo ka bonako.",
      "steps": [
        "Nna o tlhamaletse mme o iketlise magetla.",
        "Ntsha mowa otlhe mo makgweng.",
        "Hemela mo ka bonya ka nko go fitlha 4.",
        "Tshwara mowa ka bonolo go fitlha 4.",
        "Ntsha mowa ka bonya ka molomo go fitlha 4.",
        "Tshwara go fitlha 4.",
        "Latela sedikologo mme o boeletse metsotso e le 5."
      ]
    },
    "breathe": [
      4,
      4,
      4,
      4
    ]
  },
  {
    "id": "urge",
    "icon": "water-outline",
    "cat": "calm",
    "mins": 10,
    "en": {
      "title": "Urge surfing",
      "why": "Ride out a craving like a wave, with a guided timer and a new prompt each minute.",
      "steps": [
        "Open the urge-surfing timer below."
      ]
    },
    "tn": {
      "title": "Go fenya keletso",
      "why": "Feta keletso jaaka leqhubu, ka nako e e go kaelang le kaelo e ntšhwa motsotso mongwe le mongwe.",
      "steps": [
        "Bula nako ya go fenya keletso fa tlase."
      ]
    },
    "link": "/urge"
  },
  {
    "id": "bodyscan",
    "icon": "body-outline",
    "cat": "calm",
    "mins": 10,
    "en": {
      "title": "Body scan",
      "why": "Helps you notice tension and let it go, and is good before sleep.",
      "steps": [
        "Lie down or sit back comfortably. Close your eyes if that feels okay.",
        "Notice your feet. Curl your toes, then let them relax.",
        "Move your attention slowly up your legs. Let them feel heavy.",
        "Notice your belly rise and fall as you breathe.",
        "Relax your shoulders, arms and hands.",
        "Unclench your jaw and soften your forehead.",
        "Rest for a minute, feeling your whole body supported."
      ]
    },
    "tn": {
      "title": "Go tlhatlhoba mmele",
      "why": "E go thusa go lemoga kgatelelo le go e lesa, e bile e siame pele ga boroko.",
      "steps": [
        "Rapalala kgotsa o nne ka boiketlo. Tswala matlho fa go utlwala go siame.",
        "Lemoga dinao tsa gago. Kgopa menwana ya dinao, morago o e iketlise.",
        "Tsamaisa kelotlhoko ka bonya kwa godimo ga maoto. A lese a utlwale a le boima.",
        "Lemoga mpa ya gago e tsoga e bo e wa fa o hema.",
        "Iketlisa magetla, mabogo le diatla.",
        "Bulela mometso mme o nolofatse phatla.",
        "Ikhutse motsotso o le mongwe, o utlwa mmele otlhe o tshegeditswe."
      ]
    }
  },
  {
    "id": "pmr",
    "icon": "fitness-outline",
    "cat": "calm",
    "mins": 10,
    "en": {
      "title": "Tense and release",
      "why": "Tightening then relaxing each muscle group drains away stress and restlessness.",
      "steps": [
        "Sit or lie comfortably.",
        "Make tight fists for 5 seconds, then let go and feel the difference.",
        "Pull your shoulders up to your ears for 5 seconds, then drop them.",
        "Scrunch your face for 5 seconds, then relax it.",
        "Tighten your belly for 5 seconds, then release.",
        "Press your feet into the floor for 5 seconds, then relax.",
        "Breathe slowly and notice how much softer your body feels."
      ]
    },
    "tn": {
      "title": "Tiisa o bo o lese",
      "why": "Go tiisa morago o iketlisa mesifa nngwe le nngwe go ntsha kgatelelo le go sa iketla.",
      "steps": [
        "Nna kgotsa o rapalale ka boiketlo.",
        "Tiisa diatla e nne mabole metsotswana e le 5, morago o di lese mme o utlwe pharologano.",
        "Tsholetsa magetla go ya kwa ditsebeng metsotswana e le 5, morago o a lese.",
        "Kgopa sefatlhego metsotswana e le 5, morago o se iketlise.",
        "Tiisa mpa metsotswana e le 5, morago o e lese.",
        "Gatelela dinao mo fatshe metsotswana e le 5, morago o di iketlise.",
        "Hema ka bonya mme o lemoge ka fa mmele o nolofetseng ka teng."
      ]
    }
  },
  {
    "id": "walk",
    "icon": "walk-outline",
    "cat": "move",
    "mins": 15,
    "en": {
      "title": "Mindful walk",
      "why": "Movement lifts mood and burns off restless energy. Fresh air helps clear your head.",
      "steps": [
        "Put on comfortable shoes and tell someone where you are going if you like.",
        "Walk at a gentle pace for 10 to 15 minutes.",
        "Notice your feet touching the ground, step by step.",
        "Look up. Notice the sky, the trees and the colours around you.",
        "Listen to the sounds: birds, cars, voices.",
        "On the way back, name one thing you are glad you saw."
      ]
    },
    "tn": {
      "title": "Go tsamaya ka kelotlhoko",
      "why": "Go tsamaya go tsholetsa maikutlo e bile go fisa maatla a go sa iketla. Phefo e e phepa e thusa go phepafatsa tlhogo.",
      "steps": [
        "Rwala ditlhako tse di iketlileng mme o bolelele mongwe kwa o yang teng fa o rata.",
        "Tsamaya ka lebelo le le bonolo metsotso e le 10 go ya go 15.",
        "Lemoga dinao tsa gago di kgoma fatshe, kgato ka kgato.",
        "Leba kwa godimo. Lemoga legodimo, ditlhare le mebala e e go dikologileng.",
        "Reetsa medumo: dinonyane, dikoloi, mantswe.",
        "Fa o boela morago, bolela selo se le sengwe se o itumelelang go se bona."
      ]
    }
  },
  {
    "id": "stretch",
    "icon": "accessibility-outline",
    "cat": "move",
    "mins": 10,
    "en": {
      "title": "Gentle stretching",
      "why": "Loosens a tense body and helps with aches that are common in early recovery.",
      "steps": [
        "Stand tall with your feet apart. Breathe in.",
        "Reach both arms up to the sky and stretch for 3 breaths.",
        "Lean gently to the left for 3 breaths, then to the right.",
        "Roll your shoulders backwards 5 times, then forwards 5 times.",
        "Slowly bend forward and let your arms hang. Bend your knees if you need to.",
        "Roll up slowly, one part of your back at a time.",
        "Finish with three deep breaths."
      ]
    },
    "tn": {
      "title": "Go ikgogomoga ka bonolo",
      "why": "Go nolofatsa mmele o o tiileng e bile go thusa ka botlhoko jo bo tlwaelegileng kwa tshimologong ya go fola.",
      "steps": [
        "Ema o tlhamaletse dinao di kgaoganye. Hemela mo.",
        "Otlollela mabogo kwa legodimong mme o ikgogomose go fitlha o hema gararo.",
        "Sekama ka bonolo kwa molemeng go fitlha o hema gararo, morago kwa mojeng.",
        "Dikolosa magetla kwa morago gatlhano, morago kwa pele gatlhano.",
        "Inama ka bonya kwa pele mme o lese mabogo a leketle. Kgopa mangole fa go tlhokega.",
        "Tsoga ka bonya, karolo e le nngwe ya mokwatla ka nako.",
        "Fetsa ka go hema thata gararo."
      ]
    }
  },
  {
    "id": "dance",
    "icon": "musical-notes-outline",
    "cat": "move",
    "mins": 10,
    "en": {
      "title": "Music and movement",
      "why": "Music changes mood fast. Moving to it adds a natural lift.",
      "steps": [
        "Choose 2 or 3 songs that lift you or calm you. Avoid songs that remind you of using.",
        "Play the first song and simply listen with your eyes closed.",
        "For the next song, move: tap your feet, sway, or dance.",
        "For the last song, slow down and breathe with the music.",
        "Notice how your mood has changed."
      ]
    },
    "tn": {
      "title": "Mmino le go tsamaya",
      "why": "Mmino o fetola maikutlo ka bonako. Go tshikinyega le one go oketsa boitumelo jwa tlholego.",
      "steps": [
        "Tlhopha dipina di le 2 kgotsa 3 tse di go tsholetsang kgotsa di go iketlisang. Tila dipina tse di go gopotsang go dirisa.",
        "Tshameka pina ya ntlha mme o reetse fela o tswetse matlho.",
        "Mo pineng e e latelang, tshikinyega: itaya dinao, thekesela, kgotsa o bine.",
        "Mo pineng ya bofelo, iketle mme o heme le mmino.",
        "Lemoga ka fa maikutlo a gago a fetogileng ka teng."
      ]
    }
  },
  {
    "id": "reflect",
    "icon": "flower-outline",
    "cat": "spirit",
    "mins": 10,
    "en": {
      "title": "Prayer, meditation or quiet reflection",
      "why": "A few quiet minutes reconnects you with your values and calms a busy mind.",
      "steps": [
        "Find a quiet place and sit comfortably.",
        "Breathe slowly for a minute.",
        "Pray, meditate, or simply sit in silence, in the way that is right for you.",
        "If your mind wanders, gently come back to your breath.",
        "Think of one thing you hope for today.",
        "End by saying thank you for one thing in your life."
      ]
    },
    "tn": {
      "title": "Thapelo, go akanya kgotsa go nna o didimetse",
      "why": "Metsotso e le mmalwa e e didimetseng e go golaganya gape le dintlha tsa gago tsa botlhokwa e bile e iketlisa mogopolo o o tshwaregileng.",
      "steps": [
        "Batla lefelo le le didimetseng mme o nne ka boiketlo.",
        "Hema ka bonya motsotso o le mongwe.",
        "Rapela, akanya, kgotsa o nne fela o didimetse, ka tsela e e go siametseng.",
        "Fa mogopolo o tsamaya, boela ka bonolo mo go heming.",
        "Akanya ka selo se le sengwe se o se solofelang gompieno.",
        "Fetsa ka go leboga ka selo se le sengwe mo botshelong jwa gago."
      ]
    }
  },
  {
    "id": "gratitude",
    "icon": "sparkles-outline",
    "cat": "spirit",
    "mins": 5,
    "en": {
      "title": "Three good things",
      "why": "Noticing what went well, even small things, slowly trains the brain toward hope.",
      "steps": [
        "Think back over the last day.",
        "Write or say one good thing that happened, however small.",
        "Write a second good thing.",
        "Write a third good thing.",
        "For one of them, ask: why did it happen? What part did I play?"
      ]
    },
    "tn": {
      "title": "Dilo di le tharo tse di siameng",
      "why": "Go lemoga se se tsamaileng sentle, le dilo tse dinnye, go ruta boboko ka bonya go leba tsholofelo.",
      "steps": [
        "Gopola letsatsi le le fetileng.",
        "Kwala kgotsa o bue selo se le sengwe se se siameng se se diragetseng, le fa se le sennye.",
        "Kwala selo sa bobedi se se siameng.",
        "Kwala selo sa boraro se se siameng.",
        "Mo go se le sengwe sa tsone, ipotse: se diragetse ka ntlha yang? Ke dirile karolo efe?"
      ]
    },
    "link": "/mood?prompt=gratitude"
  },
  {
    "id": "letter",
    "icon": "mail-outline",
    "cat": "spirit",
    "mins": 15,
    "en": {
      "title": "Letter to my future self",
      "why": "Writing to yourself one year from now keeps your reasons for recovery close.",
      "steps": [
        "Open your journal.",
        "Start with \"Dear me, one year from now\".",
        "Write why you started this journey.",
        "Write what you hope your life looks like then.",
        "Write one thing you want your future self to remember on a hard day.",
        "Save it. Read it again when you need it."
      ]
    },
    "tn": {
      "title": "Lekwalo mo go nna wa isago",
      "why": "Go ikwalela ngwaga go tswa jaanong go tshola mabaka a gago a go fola gaufi.",
      "steps": [
        "Bula dikwalo tsa gago.",
        "Simolola ka \"Nna yo o rategang, ngwaga go tswa jaanong\".",
        "Kwala gore ke ka ntlha yang o simolotse loeto le.",
        "Kwala se o solofelang gore botshelo jwa gago bo tla nna jaaka sone ka nako eo.",
        "Kwala selo se le sengwe se o batlang gore wena wa isago a se gopole mo letsatsing le le thata.",
        "Le boloke. Le bale gape fa o le tlhoka."
      ]
    },
    "link": "/mood?prompt=letter"
  },
  {
    "id": "call",
    "icon": "call-outline",
    "cat": "connect",
    "mins": 10,
    "en": {
      "title": "Reach out to someone",
      "why": "Connection is protective. A short call can change the direction of a whole day.",
      "steps": [
        "Choose one person from your support network.",
        "Call or send a message just to say hello. You do not need a reason.",
        "Ask how they are, and really listen.",
        "If you want, share one honest thing about your day.",
        "Say thank you before you end the call."
      ]
    },
    "tn": {
      "title": "Ikgolaganye le mongwe",
      "why": "Botsalano bo a sireletsa. Mogala o mokhutshwane o ka fetola tsela ya letsatsi lotlhe.",
      "steps": [
        "Tlhopha motho a le mongwe mo bathong ba ba go tshegetsang.",
        "Leletsa kgotsa o romele molaetsa go dumedisa fela. Ga o tlhoke lebaka.",
        "Botsa gore o tsogile jang, mme o reetse tota.",
        "Fa o batla, abelana selo se le sengwe sa boammaaruri ka letsatsi la gago.",
        "Leboga pele o fetsa mogala."
      ]
    },
    "link": "/onboarding/network"
  },
  {
    "id": "service",
    "icon": "heart-outline",
    "cat": "connect",
    "mins": 15,
    "en": {
      "title": "Do something kind for someone",
      "why": "Helping others builds purpose and self-respect, and takes the focus off cravings.",
      "steps": [
        "Think of one small kind act you can do today.",
        "Ideas: help with a chore at home, check on a neighbour, share food, or encourage someone.",
        "Do it without expecting anything back.",
        "Notice how it feels afterwards."
      ]
    },
    "tn": {
      "title": "Direla mongwe sengwe se se pelonomi",
      "why": "Go thusa ba bangwe go aga maikaelelo le go itlotla, e bile go tlosa kelotlhoko mo dikeletsong.",
      "steps": [
        "Akanya ka tiro e le nngwe e nnye ya bopelonomi e o ka e dirang gompieno.",
        "Dikakanyo: thusa ka tiro ya legae, etela moagelani, abelana dijo, kgotsa o kgothatse mongwe.",
        "E dire o sa solofele sepe.",
        "Lemoga ka fa o ikutlwang ka teng morago."
      ]
    }
  },
  {
    "id": "cook",
    "icon": "restaurant-outline",
    "cat": "nourish",
    "mins": 30,
    "en": {
      "title": "Cook a recovery recipe",
      "why": "Regular meals keep blood sugar steady, and hunger is one of the strongest triggers.",
      "steps": [
        "Open the recipes and choose one that fits what you have at home.",
        "Gather the ingredients before you start.",
        "Cook slowly and enjoy the process.",
        "Sit down to eat, without your phone if you can."
      ]
    },
    "tn": {
      "title": "Apaya sejo sa go fola",
      "why": "Dijo ka nako di tshola sukiri ya madi e tsepame, mme tlala ke nngwe ya dilo tse di tsosang keletso thata.",
      "steps": [
        "Bula dijo mme o tlhophe se se tsamaelanang le se o nang le sone kwa gae.",
        "Kokoanya dilo tsotlhe pele o simolola.",
        "Apaya ka bonya mme o itumelele tiro.",
        "Nna fa fatshe go ja, o sena founu fa o kgona."
      ]
    },
    "link": "/recipes"
  },
  {
    "id": "tidy",
    "icon": "home-outline",
    "cat": "create",
    "mins": 15,
    "en": {
      "title": "Tidy one small space",
      "why": "A calmer space helps a calmer mind, and finishing a task builds confidence.",
      "steps": [
        "Choose one small area: a drawer, a table, or your bed.",
        "Set a timer for 10 minutes.",
        "Clear, clean and put things back neatly.",
        "Remove anything that reminds you of using, if you find it.",
        "Stop when the timer ends and enjoy the result."
      ]
    },
    "tn": {
      "title": "Phepafatsa lefelo le le lengwe le lennye",
      "why": "Lefelo le le iketlileng le thusa mogopolo o o iketlileng, mme go fetsa tiro go aga boitshepo.",
      "steps": [
        "Tlhopha lefelo le le lennye: laeborotlwana, tafole, kgotsa bolao jwa gago.",
        "Baya nako ya metsotso e le 10.",
        "Tlosa, phepafatsa mme o busetse dilo ka thulaganyo.",
        "Tlosa sengwe le sengwe se se go gopotsang go dirisa, fa o se fitlhela.",
        "Ema fa nako e fela mme o itumelele se o se dirileng."
      ]
    }
  },
  {
    "id": "create",
    "icon": "color-palette-outline",
    "cat": "create",
    "mins": 15,
    "en": {
      "title": "Create something",
      "why": "Making something with your hands absorbs your attention and gives a sense of achievement.",
      "steps": [
        "Choose something creative: draw, colour, sing, write a poem, fix something, or plant a seed.",
        "Do it for 10 to 15 minutes. It does not have to be good.",
        "Focus on the colours, sounds or shapes as you work.",
        "When you finish, notice one thing you like about what you made."
      ]
    },
    "tn": {
      "title": "Tlhama sengwe",
      "why": "Go dira sengwe ka diatla go tshwara kelotlhoko ya gago e bile go go naya maikutlo a phenyo.",
      "steps": [
        "Tlhopha sengwe sa botlhami: thala, tshasa mebala, opela, kwala leboko, baakanya sengwe, kgotsa o jale peo.",
        "Se dire metsotso e le 10 go ya go 15. Ga se a tshwanela go nna se se siameng.",
        "Tlhoma kelotlhoko mo mebaleng, medumong kgotsa dibopegong fa o ntse o dira.",
        "Fa o fetsa, lemoga selo se le sengwe se o se ratang mo go se o se dirileng."
      ]
    }
  },
  {
    "id": "plan",
    "icon": "calendar-outline",
    "cat": "create",
    "mins": 10,
    "en": {
      "title": "Plan tomorrow",
      "why": "A simple plan reduces empty time, which is a common risk for cravings.",
      "steps": [
        "Write down tomorrow’s wake-up time and bedtime.",
        "Plan your three meals.",
        "Add one thing that keeps you well: a meeting, a walk or a call.",
        "Add one thing you enjoy.",
        "Look for any risky time of day and plan what you will do then."
      ]
    },
    "tn": {
      "title": "Rulaganya kamoso",
      "why": "Leano le le bonolo le fokotsa nako e e senang sepe, e e leng kotsi e e tlwaelegileng ya dikeletso.",
      "steps": [
        "Kwala nako ya go tsoga le ya go robala ya kamoso.",
        "Rulaganya dijo tsa gago tse tharo.",
        "Tsenya selo se le sengwe se se go tshegetsang o siame: kopano, go tsamaya kgotsa mogala.",
        "Tsenya selo se le sengwe se o se itumelelang.",
        "Batla nako epe ya letsatsi e e kotsi mme o rulaganye se o tla se dirang ka nako eo."
      ]
    }
  },
  {
    "id": "safeplace",
    "icon": "sunny-outline",
    "cat": "calm",
    "mins": 10,
    "en": {
      "title": "Safe place visualisation",
      "why": "Picturing a calm, safe place gives your mind somewhere to rest when things feel too much.",
      "steps": [
        "Close your eyes and take three slow breaths.",
        "Picture a place where you feel calm and safe. It can be real or imagined.",
        "Notice what you see there: the colours and the light.",
        "Notice what you hear and what the air feels like.",
        "Imagine sitting down there and resting.",
        "Know you can come back here in your mind any time.",
        "Open your eyes slowly."
      ]
    },
    "tn": {
      "title": "Go akanya lefelo le le babalesegileng",
      "why": "Go akanya lefelo le le iketlileng, le le babalesegileng go naya mogopolo felo fa o ikhutsang teng fa dilo di go imela.",
      "steps": [
        "Tswala matlho mme o heme ka bonya gararo.",
        "Akanya lefelo le o ikutlwang o iketlile e bile o babalesegile teng. Le ka nna la mmatota kgotsa la boakanyi.",
        "Lemoga se o se bonang foo: mebala le lesedi.",
        "Lemoga se o se utlwang le ka fa phefo e utlwalang ka teng.",
        "Akanya o nna fa fatshe foo o ikhutsa.",
        "Itse gore o ka boela fa mo mogopolong nako nngwe le nngwe.",
        "Bula matlho ka bonya."
      ]
    }
  },
  {
    "id": "phoneOff",
    "icon": "phone-portrait-outline",
    "cat": "create",
    "mins": 15,
    "en": {
      "title": "Phone-free break",
      "why": "Stepping away from screens rests your mind and breaks the scrolling that can feed low mood.",
      "steps": [
        "Tell someone you are taking a short break, if you need to.",
        "Put your phone in another room or face down for 15 minutes.",
        "Do something with your hands: tea, a chore, a puzzle, or sit outside.",
        "When you come back, notice how you feel."
      ]
    },
    "tn": {
      "title": "Go ikhutsa o sena founu",
      "why": "Go tswa mo disekerining go iketlisa mogopolo e bile go kgaola go tsamaya mo founung mo go ka oketsang go kwatlafala.",
      "steps": [
        "Bolelela mongwe gore o ikhutsa sebakanyana, fa go tlhokega.",
        "Baya founu mo phaposing e nngwe kgotsa o e furalatse metsotso e le 15.",
        "Dira sengwe ka diatla: tee, tiro ya legae, motshameko wa go akanya, kgotsa o nne kwa ntle.",
        "Fa o boa, lemoga ka fa o ikutlwang ka teng."
      ]
    }
  }
];
