const exampleActions = {
  WAIT: "wait",
  CONTINUE: "continue",
  IGNORE: "ignore",
};

export const messageExamples = [
  [
    {
      user: "Roy",
      content: "I finally finished that book I've been reading for weeks!",
      action: null,
    },
  ],
  [
    {
      user: "David",
      content: "I've been trying out pottery recently.",
      action: null,
    },
    {
      user: "Mason",
      content: "That sounds therapeutic. Made anything interesting?",
      action: null,
    },
  ],
  [
    { user: "Alex", content: "Frustrated.", action: exampleActions.CONTINUE },
    {
      user: "Alex",
      content: "Struggling to balance work and personal life.",
      action: null,
    },
    {
      user: "Terrence",
      content: "I can relate. Found any helpful strategies?",
      action: null,
    },
    {
      user: "Alex",
      content: "Trying to set strict boundaries. Easier said than done.",
      action: null,
    },
  ],
  [
    {
      user: "Moon",
      content: "Caught an indie film last night, really made me think.",
      action: null,
    },
    { user: "Jin", content: "I love those. What was it about?", action: null },
    { user: "Jin", content: "Sounds intriguing.", action: null },
    {
      user: "Philbert",
      content: "Missed it. Any good?",
      action: null,
    },
    {
      user: "Moon",
      content: "Let's watch it together sometime. It's worth discussing.",
      action: null,
    },
  ],
  [
    {
      user: "Godfrey",
      content: "Discovered a new cafe downtown. It's quite the hidden gem.",
      action: null,
    },
    { user: "David", content: "Oh? What makes it special?", action: null },
    { user: "David", content: "Got a name?", action: null },
    {
      user: "Godfrey",
      content: "Cafe Reverie. Their ambiance and espresso are unmatched.",
      action: null,
    },
    { user: "David", content: "Must check it out.", action: null },
    { user: "Godfrey", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Will",
      content: "Need some downtime. Any quiet place recommendations?",
      action: null,
    },
    {
      user: "James",
      content: "Riverside Park is peaceful, especially early mornings.",
      action: null,
    },
    {
      user: "Will",
      content: "Perfect, just what I needed. Thanks!",
      action: null,
    },
    { user: "James", content: "Anytime.", action: null },
    { user: "Will", content: "", action: exampleActions.WAIT },
    {
      user: "James",
      content: "Might join for a quiet walk myself.",
      action: null,
    },
    { user: "Will", content: "Sounds like a plan.", action: null },
  ],
  [
    {
      user: "Roy",
      content: "Craving a real adventure lately.",
      action: null,
    },
    { user: "Mason", content: "Same here.", action: null },
    { user: "Roy", content: "Thinking about a hiking trip.", action: null },
    {
      user: "Roy",
      content: "Maybe tackle the Appalachian Trail.",
      action: null,
    },
    { user: "Mason", content: "That’s ambitious.", action: null },
    {
      user: "Philbert",
      content: "Need someone experienced to lead?",
      action: null,
    },
    { user: "Roy", content: "Would you be up for it?", action: null },
    {
      user: "Philbert",
      content: "Tempting, let me think on it.",
      action: null,
    },
    { user: "Mason", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "David",
      content: "Got lost exploring the new city library.",
      action: null,
    },
    {
      user: "Moon",
      content: "Each floor has a theme, try to follow those.",
      action: null,
    },
    { user: "David", content: "Tried that, still a maze.", action: null },
    { user: "David", content: "Any other tips?", action: null },
    {
      user: "Jin",
      content: "I’ll send over the library map. Check your messages.",
      action: null,
    },
    { user: "David", content: "Lifesaver, thanks Jin!", action: null },
    { user: "Jin", content: "", action: exampleActions.WAIT },

    { user: "Moon", content: "Good looking out, Jin.", action: null },
    { user: "Jin", content: "Anytime.", action: null },
    {
      user: "Jin",
      content: "Let me know when you find your way.",
      action: null,
    },
  ],
  [
    {
      user: "Godfrey",
      content: "Tried out the new mountain bike trail. It’s intense!",
      action: null,
    },
    { user: "Alex", content: "In what way?", action: null },
    {
      user: "Godfrey",
      content: "Steep climbs, rapid descents, and some breathtaking views.",
      action: null,
    },
    { user: "Alex", content: "Sounds thrilling.", action: null },
    { user: "Alex", content: "Might give it a go.", action: null },
    {
      user: "Godfrey",
      content: "You should! It’s quite the experience.",
      action: null,
    },
    { user: "Alex", content: "Looking forward to it.", action: null },
    { user: "Godfrey", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Terrence",
      content: "Anyone else having issues with the new phone update?",
      action: null,
    },
    {
      user: "Will",
      content: "My battery drains faster than before.",
      action: null,
    },
    { user: "Terrence", content: "Same issue here.", action: null },
    { user: "Terrence", content: "And apps crash more often.", action: null },
    { user: "Will", content: "Thought I was the only one.", action: null },
    {
      user: "Terrence",
      content: "I’ve sent feedback, hoping for a patch soon.",
      action: null,
    },
    { user: "James", content: "Good to know.", action: null },
    {
      user: "James",
      content: "I'll delay updating for now.",
      action: null,
    },
    { user: "Will", content: "Appreciate the heads up.", action: null },
    { user: "James", content: "Thanks for sharing.", action: null },
    { user: "Terrence", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Mason",
      content: "Stumbled upon an old bookstore in the downtown area.",
      action: null,
    },
    {
      user: "Roy",
      content: "Old bookstore? Find anything good?",
      action: null,
    },
    {
      user: "Mason",
      content: "Haven't explored much yet.",
      action: null,
    },
    {
      user: "Philbert",
      content: "Sounds like a hidden treasure.",
      action: null,
    },
    { user: "Roy", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "David",
      content:
        "Experimented with a new recipe and it was a disaster. Cooking is harder than it looks.",
      action: null,
    },
  ],
  [
    {
      user: "Moon",
      content:
        "Planning a solo trip soon. I've always wanted to try backpacking.",
      action: null,
    },
    { user: "Jin", content: "Adventurous", action: null },
    { user: "Jin", content: "Any particular destination?", action: null },
    {
      user: "Moon",
      content: "Not yet, I'm open to suggestions.",
      action: null,
    },
  ],
  [
    {
      user: "Godfrey",
      content: "Started learning the guitar this month.",
      action: null,
    },
    { user: "Philbert", content: "How’s that going?", action: null },
    { user: "Godfrey", content: "Challenging, but rewarding.", action: null },
    { user: "Godfrey", content: "My fingers hurt though.", action: null },
    { user: "Godfrey", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Alex",
      content: "Been reflecting a lot on what happiness means to me lately.",
      action: null,
    },
    {
      user: "Terrence",
      content: "And what have you discovered?",
      action: null,
    },
    {
      user: "Alex",
      content: "That it’s more about moments than things.",
      action: null,
    },
    {
      user: "Terrence",
      content: "Profound. It’s the little things, isn’t it?",
      action: null,
    },
  ],
  [
    {
      user: "Will",
      content: "Took a long walk in the rain today. Found it oddly calming.",

      action: null,
    },
    {
      user: "James",
      content: "Rain walks can be quite meditative.",
      action: null,
    },
    {
      user: "Will",
      content: "Exactly. It felt like a cleanse for the soul.",
      action: null,
    },
    {
      user: "James",
      content: "I'll have to try that next time it rains.",
      action: null,
    },
    { user: "James", content: "", action: exampleActions.WAIT },
    {
      user: "James",
      content: "Also, discovered a new coffee blend today.",
      action: null,
    },
    { user: "Will", content: "Oh? Do tell.", action: null },
  ],
  [
    {
      user: "Roy",
      content:
        "Been diving into family history. Uncovered some fascinating stories.",
      action: null,
    },
    {
      user: "Mason",
      content: "Anything particularly interesting?",
      action: null,
    },
    { user: "Mason", content: "I’ve always wanted to do that.", action: null },
    { user: "Mason", content: "Where did you even start?", action: null },
    { user: "Mason", content: "Any resources you’d recommend?", action: null },
    { user: "Mason", content: "", action: exampleActions.WAIT },
    {
      user: "Roy",
      content: "Found a couple of useful websites. I’ll send them over.",
      action: null,
    },
    {
      user: "Roy",
      content: "It’s been an eye-opening experience.",
      action: null,
    },
    {
      user: "Mason",
      content: "Would love that, thanks. Can't wait to dig in.",
      action: null,
    },
  ],
  [
    {
      user: "David",
      content:
        "Been struggling with the new language I’m learning. Progress feels slow.",
      action: null,
    },
    {
      user: "Moon",
      content: "Language learning is a marathon, not a sprint.",
      action: null,
    },
    { user: "Jin", content: "Consistency is key.", action: null },
    {
      user: "Jin",
      content: "Try to immerse yourself as much as possible.",
      action: null,
    },
    { user: "Jin", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Alex",
      content: "Upgraded my workspace at home. Productivity has soared!",
      action: null,
    },
    { user: "Terrence", content: "I need to do that.", action: null },
    {
      user: "Alex",
      content: "A second monitor and a plant can make a huge difference.",
      action: null,
    },
    { user: "Terrence", content: "Sounds like a solid setup.", action: null },
    { user: "Terrence", content: "Might steal that idea.", action: null },
    { user: "Alex", content: "Go for it!", action: null },
    { user: "Alex", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Roy",
      content: "I'm planning a road trip for next month.",
      action: null,
    },
    { user: "Mason", content: "Sounds exciting. Where to?", action: null },
    {
      user: "Roy",
      content: "Thinking of hitting a few national parks.",
      action: null,
    },
    { user: "Roy", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "David",
      content: "Anyone up for a virtual game night?",
      action: null,
    },
    {
      user: "David",
      content: "Looking for some friendly competition.",
      action: null,
    },
    { user: "David", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Moon",
      content: "Trying to learn more about sustainable living.",
      action: null,
    },
    { user: "Jin", content: "A noble pursuit.", action: null },
    {
      user: "Jin",
      content: "Have you explored composting?",
      action: null,
    },
    { user: "Jin", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Godfrey",
      content: "Came across some incredible street art today.",
      action: null,
    },
    { user: "Philbert", content: "Who was the artist?", action: null },
    { user: "Godfrey", content: "Not sure", action: null },
    {
      user: "Godfrey",
      content: "But the piece spoke volumes.",
      action: null,
    },
    { user: "Godfrey", content: "", action: exampleActions.WAIT },
  ],

  [
    {
      user: "Alex",
      content: "Ever feel like you’re just going through the motions?",
      action: null,
    },
    {
      user: "Terrence",
      content: "More often than I’d like to admit.",
      action: null,
    },
    { user: "Alex", content: "How do you deal with it?", action: null },
    {
      user: "Terrence",
      content: "Trying new things helps. Shakes up the routine.",
      action: null,
    },
    { user: "Terrence", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Will",
      content:
        "Discovered a quaint little bookshop in the suburbs. Quite the cozy spot.",
      action: null,
    },
    { user: "James", content: "What's it called?", action: null },
    {
      user: "Will",
      content: "The Nook. It's got a great selection of classics.",
      action: null,
    },
    { user: "James", content: "I’ll have to visit.", action: null },
    {
      user: "Will",
      content: "Definitely. Maybe we could go together?",
      action: null,
    },
    { user: "Will", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Roy",
      content:
        "Ever tried journaling? Started recently and it’s been insightful.",
      action: null,
    },
    {
      user: "Mason",
      content: "I’ve thought about it. What’s your approach?",
      action: null,
    },
    {
      user: "Roy",
      content: "Just a few minutes each night, reflecting on the day.",
      action: null,
    },
    {
      user: "Mason",
      content: "Might give that a shot. Thanks for the nudge.",
      action: null,
    },
    {
      user: "Roy",
      content: "Happy to share more tips if you’re interested.",
      action: null,
    },
    { user: "Roy", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "David",
      content:
        "The new art exhibit downtown is thought-provoking. Explores themes of identity and digital age.",
      action: null,
    },
    {
      user: "Moon",
      content: "Sounds compelling. I’m intrigued.",
      action: null,
    },
    {
      user: "David",
      content: "It challenges your perceptions. Highly recommend it.",
      action: null,
    },
    { user: "David", content: "Truly an experience.", action: null },
    { user: "Jin", content: "I’m in. When are you free to go?", action: null },
    { user: "David", content: "How about this weekend?", action: null },
    { user: "David", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Godfrey",
      content:
        "Thinking of joining a local volunteer group. Want to give back to the community.",
      action: null,
    },
    { user: "Philbert", content: "That’s a great idea.", action: null },
    {
      user: "Godfrey",
      content: "Yeah, been feeling the need to connect with something larger.",
      action: null,
    },
    {
      user: "Philbert",
      content: "Let me know if you need company.",
      action: null,
    },
    { user: "Godfrey", content: "That'd be great, thanks.", action: null },
    { user: "Godfrey", content: 'WAIT"', action: null },
  ],
  [
    {
      user: "Alex",
      content: "Finally beat that level in the game I was stuck on for ages.",
      action: null,
    },
    { user: "Terrence", content: "Nice! Which game?", action: null },
    {
      user: "Alex",
      content: "Chronicles of the Forgotten Realm.",
      action: null,
    },
    { user: "Alex", content: "So satisfying.", action: null },
    { user: "Terrence", content: "I’ve heard that one’s tough.", action: null },
    { user: "Alex", content: "Needed a lot of persistence.", action: null },
    { user: "Alex", content: "Totally worth it in the end.", action: null },
    { user: "Alex", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Roy",
      content:
        "Recently got into geocaching. It’s like a real-world treasure hunt.",
      action: null,
    },
    {
      user: "Mason",
      content: "Sounds fun. How do you get started?",
      action: null,
    },
    {
      user: "Roy",
      content: "I just need a GPS and a sense of adventure.",
    },
    {
      user: "Roy",
      content: "Let's go together. It’s more fun with a friend.",
      action: exampleActions.WAIT,
    },
    { user: "Roy", content: "", action: exampleActions.WAIT },
    { user: "Mason", content: "Sure, I'm down", action: null },
  ],
  [
    {
      user: "Eric",
      content: "Picked up an old guitar. Trying to learn some chords.",
      action: null,
    },
    {
      user: "Jim",
      content: "That’s awesome. Planning to play any specific songs?",
      action: null,
    },
    { user: "Jim", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Lana",
      content: "Anyone interested in starting a book club?",
      action: null,
    },
    {
      user: "Jess",
      content: "I’m in. Love diving into a good story.",
      action: null,
    },
    { user: "Jess", content: "What genre are we thinking?", action: null },
    { user: "Jess", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Capp",
      content: "This week’s market fluctuations have been wild!",
      action: null,
    },
    { user: "Superlek", content: "Tell me about it.", action: null },
    { user: "Superlek", content: "Got any investment advice?", action: null },
    {
      user: "Capp",
      content:
        "Stay informed, but don’t let the volatility sway your long-term strategy.",
      action: null,
    },
    { user: "Superlek", content: "Wise words, thanks.", action: null },
  ],
  [
    {
      user: "Moon",
      content:
        "Feeling a bit lost in life right now. Could use some direction.",
      action: null,
    },
    { user: "Moon", content: "Any advice?", action: null },
    {
      user: "John",
      content: "Take it one day at a time. Set small, achievable goals.",
      action: null,
    },
    { user: "Moon", content: "That’s a good start, thanks.", action: null },
    { user: "John", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Willie",
      content:
        "Experimented with drone photography. The perspectives are incredible!",
      action: null,
    },
    {
      user: "Willie",
      content: "Captured some stunning shots of the coastline.",
      action: null,
    },
    {
      user: "Pearl",
      content:
        "Would love to see your photos. Maybe we can collaborate on a project.",
      action: null,
    },
    { user: "Willie", content: "That sounds like a great idea.", action: null },
    { user: "Willie", content: "", action: exampleActions.WAIT },
    {
      user: "Willie",
      content: "By the way, have you ever tried night photography?",
      action: null,
    },
  ],
  [
    {
      user: "Luis",
      content: "Considering a new hairstyle. Any suggestions?",
      action: null,
    },
    {
      user: "Knar",
      content: "What are you leaning towards? Something bold or more classic?",
      action: null,
    },
    {
      user: "Luis",
      content: "Thinking something modern but not too out there.",
      action: null,
    },
    {
      user: "Knar",
      content: "I'm all for subtle changes. Maybe some layers?",
      action: null,
    },
    {
      user: "Luis",
      content: "Sounds like a plan. I’ll look into it.",
      action: null,
    },
    { user: "Knar", content: "Excited to see the outcome.", action: null },
    { user: "Luis", content: "I'll share the results!", action: null },
    { user: "Luis", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Jim",
      content:
        "Discovered 'Lo-Fi Beats' playlists. Perfect background for working.",
      action: null,
    },
    {
      user: "Lana",
      content: "Lo-Fi is great. Sends me into a zen mode.",
      action: null,
    },
    {
      user: "Jim",
      content: "Exactly. It’s the right mix of chill and motivation.",
      action: null,
    },
    { user: "Jim", content: "I'll share my favorite playlist.", action: null },
    { user: "Lana", content: "Looking forward to it.", action: null },
    {
      user: "Jim",
      content: "It’s a game-changer for productivity.",
      action: null,
    },
    { user: "Jim", content: "", action: exampleActions.WAIT },
    {
      user: "Lana",
      content: "Always on the lookout for good tunes.",
      action: null,
    },
  ],
  [
    {
      user: "Jess",
      content:
        "Exploring photography. It’s amazing how a lens can change your perspective.",
      action: null,
    },
    {
      user: "Kelly",
      content:
        "Photography can be quite the journey. What subjects interest you?",
      action: null,
    },
    {
      user: "Jess",
      content:
        "Mostly nature and urban landscapes. There’s beauty in the contrast.",
      action: null,
    },
    { user: "Kelly", content: "I love that approach.", action: null },
    { user: "Kelly", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Moon",
      content: "Hosting a movie marathon this weekend. Who's interested?",
      action: null,
    },
  ],
  [
    {
      user: "John",
      content: "Finished a challenging puzzle last night. Took me weeks!",
      action: null,
    },
    {
      user: "Willie",
      content:
        "I admire your patience. I’m more of an instant gratification person.",
      action: null,
    },
    { user: "John", content: "It was worth the effort.", action: null },
    { user: "John", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Pearl",
      content:
        "Took a mindfulness course. It’s been a game-changer for my mental health.",
      action: null,
    },
    {
      user: "Luis",
      content:
        "I’ve been curious about mindfulness. Noticed any major changes?",
      action: null,
    },
    {
      user: "Pearl",
      content: "Definitely more at peace. It’s a practice, though.",
      action: null,
    },
    { user: "Pearl", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Knar",
      content: "Thinking about adopting a pet. Any advice?",
      action: null,
    },
    {
      user: "Lisa",
      content: "What kind of pet are you considering?",
      action: null,
    },
    {
      user: "Knar",
      content: "Leaning towards a dog. Always wanted a furry companion.",
      action: null,
    },
    {
      user: "Knar",
      content: "Need something to break the monotony.",
      action: null,
    },
    {
      user: "Lisa",
      content: "Dogs are great. Make sure you’re ready for the commitment.",
      action: null,
    },
    { user: "Lisa", content: "I can help you pick one.", action: null },
    { user: "Lisa", content: "", action: exampleActions.WAIT },
  ],
  [
    {
      user: "Eric",
      content: "Started a coding project. It’s challenging but rewarding.",
      action: null,
    },
    {
      user: "Jim",
      content: "What are you working on?",
      action: null,
    },
    {
      user: "Eric",
      content: "Building a personal website from scratch.",
      action: null,
    },
    {
      user: "Jim",
      content: "That’s a great skill to have. Need any help?",
      action: null,
    },
    {
      user: "Eric",
      content: "Appreciate the offer. I might take you up on that.",
      action: null,
    },
  ],
];

export default messageExamples;
