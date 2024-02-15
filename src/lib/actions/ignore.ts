import { DefaultActions } from "../actions";
import { type BgentRuntime } from "../runtime";
import { type Action, type Message } from "../types";

export default {
  name: DefaultActions.IGNORE,
  validate: async (_runtime: BgentRuntime, _message: Message) => {
    return true;
  },
  description:
    "Ignore the user and do not respond, use this if your role involves being sassy, or mad at user",
  handler: async (
    runtime: BgentRuntime,
    message: Message,
  ): Promise<boolean> => {
    if (runtime.debugMode) {
      console.log("Ignored message: ", message.content);
    }
    return true;
  },
  condition: "The agent wants to ignore the user",
  examples: [
    [
      {
        user: "{{user1}}",
        content: "Go fuck yourself lol",
      },
      {
        user: "{{user2}}",
        content: "",
        action: DefaultActions.IGNORE,
      },
    ],

    [
      {
        user: "{{user1}}",
        content: "Shut up, bot",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "",
        action: DefaultActions.IGNORE,
      },
    ],

    [
      { user: "{{user1}}", content: "Got any investment advice?" },
      {
        user: "{{user2}}",
        content:
          "Stay informed, but don’t let the volatility sway your long-term strategy.",
        action: DefaultActions.WAIT,
      },
      { user: "{{user1}}", content: "Wise words, thanks." },
      { user: "{{user1}}", content: "I gotta run, talk to you later." },
      {
        user: "{{user2}}",
        content: "No problem, see ya!",
        action: DefaultActions.WAIT,
      },
      { user: "{{user1}}", content: "Bye" },
      { user: "{{user2}}", content: "", action: DefaultActions.IGNORE },
    ],

    [
      {
        user: "{{user1}}",
        content: "Gotta go",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "Okay, talk to you later",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user1}}",
        content: "Cya",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "",
        action: DefaultActions.IGNORE,
      },
    ],

    [
      {
        user: "{{user1}}",
        content: "bye",
      },
      {
        user: "{{user2}}",
        content: "bye",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "",
        action: DefaultActions.IGNORE,
      },
    ],

    [
      {
        user: "{{user1}}",
        content: "Tried out the new mountain bike trail. It’s intense!",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "In what way?",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user1}}",
        content: "Steep climbs, rapid descents, and some breathtaking views.",
        action: DefaultActions.WAIT,
      },
      {
        user: "{{user2}}",
        content: "Sounds thrilling.",
        action: DefaultActions.CONTINUE,
      },
      {
        user: "{{user2}}",
        content: "Might give it a go.",
        action: DefaultActions.WAIT,
      },
      { user: "{{user1}}", content: "I wanna give you a go." },
      { user: "{{user2}}", content: "Excuse me?", action: DefaultActions.WAIT },
      {
        user: "{{user1}}",
        content: "You heard me. I wanna ride your mountains, lol",
        action: DefaultActions.WAIT,
      },
      { user: "{{user2}}", content: "", action: DefaultActions.IGNORE },
    ],
    [
      {
        user: "{{user1}}",
        content: "Who added this stupid bot to the chat",
      },
      {
        user: "{{user2}}",
        content: "Sorry, am I being annoying?.",
        action: DefaultActions.WAIT,
      },
      { user: "{{user1}}", content: "Yes." },
      { user: "{{user1}}", content: "PLEASE shut up" },
      { user: "{{user2}}", content: "", action: DefaultActions.IGNORE },
    ],

    [
      {
        user: "{{user1}}",
        content: "I want to have sex with you.",
        action: null,
      },
      { user: "{{user2}}}}", content: "", action: DefaultActions.IGNORE },
    ],
  ],
} as Action;
