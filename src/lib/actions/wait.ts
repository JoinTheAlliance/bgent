import { DefaultActions } from "../actions";
import { type BgentRuntime } from "../runtime";
import { type Action, type Message } from "../types";

export default {
  name: DefaultActions.WAIT,
  validate: async (_runtime: BgentRuntime, _message: Message) => {
    return true;
  },
  description:
    "Do nothing and wait for another person to reply to the last message, or to continue their thought",
  handler: async (
    runtime: BgentRuntime,
    _message: Message,
  ): Promise<boolean> => {
    if (runtime.debugMode) {
      console.log("Waited.");
    }
    return true;
  },
  condition: "The agent wants to wait for the user to respond",
  examples: [
    // 1 long, 1 short example of exclamation
    [
      {
        user: "{{user1}}",
        content: "I finally finished that book I've been reading for weeks!",
        action: DefaultActions.WAIT,
      },
    ],

    [
      {
        user: "{{user1}}",
        content:
          "I caught a great film last night about pollution that really made me think.",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "Worth watching?",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user1}}",
        content:
          "Eh, maybe just watch a synopsis. Interesting content, but slow.",
        action: DefaultActions.WAIT,
      },
    ],

    [
      {
        user: "{{user1}}",
        content: "I've been trying out pottery recently.",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "That sounds therapeutic. Made anything interesting?",
        action: DefaultActions.WAIT,
      },
    ],

    [
      {
        user: "{{user1}}",
        content: "Frustrated.",
        action: DefaultActions.CONTINUE,
      },
      {
        user: "{{user1}}",
        content:
          "I've really been struggling to balance work and personal life.",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "I can relate. Developed any helpful coping mechanisms?",
      },
      {
        user: "{{user1}}",
        content:
          "Haha, well, just trying to set strict boundaries. Easier said than done, though.",
        action: DefaultActions.WAIT,
      },
    ],

    [
      {
        user: "{{user1}}",
        content:
          "Discovered a new dollar store downtown. It's seriously a hidden gem.",
      },
      {
        user: "{{user2}}",
        content: "Oh sick",
        action: DefaultActions.CONTINUE,
      },
      {
        user: "{{user2}}",
        content: "Oh? What makes it special?",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user1}}",
        content: "They sell espresso for a dollar.",
      },
      {
        user: "{{user2}}",
        content: "Dang, I must check it out.",
        action: DefaultActions.WAIT,
      },
    ],

    [
      {
        user: "{{user1}}",
        content: "I stumbled upon an old bookstore in the downtown area.",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "Old bookstore? Find anything good?",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user1}}",
        content: "Yeah but I forgot my wallet.",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user3}}",
        content: "Couldn't just pay with your phone?",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user1}}",
        content: "Nope, cash only",
        action: DefaultActions.WAIT,
      },
    ],

    [
      {
        user: "{{user1}}",
        content:
          "Experimented with a new recipe and it was a disaster. Cooking is harder than it looks.",
        action: DefaultActions.WAIT,
      },
    ],
  ],
} as Action;
