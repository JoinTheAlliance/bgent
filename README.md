# bgent

A flexible, scalable and customizable agent to do your bidding.

![cj](https://github.com/lalalune/bgent/assets/18633264/7513b5a6-2352-45f3-8b87-7ee0e2171a30)

[![npm version](https://badge.fury.io/js/bgent.svg)](https://badge.fury.io/js/bgent)
![build passing](https://github.com/JoinTheAlliance/bgent/actions/workflows/deploy_worker.yaml/badge.svg)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://github.com/lalalune/bgent/blob/main/LICENSE)
[![stars - bgent](https://img.shields.io/github/stars/lalalune/bgent?style=social)](https://github.com/lalalune/bgent)
[![forks - bgent](https://img.shields.io/github/forks/lalalune/bgent?style=social)](https://github.com/lalalune/bgent)

## Connect With Us

[![Join the Discord server](https://dcbadge.vercel.app/api/server/qetWd7J9De)](https://discord.gg/jointhealliance)

## Features

- 🛠 Simple and extensible
- 🎨 Customizable to your use case
- 📚 Easily ingest and interact with your documents
- 💾 Retrievable memory and document store
- ☁️ Serverless architecture
- 🚀 Deployable in minutes at scale with Cloudflare
- 👥 Multi-agent and room support
- 🎯 Goal-directed behavior
- 📦 Comes with ready-to-deploy examples

## What can I use it for?
- 🤖 Chatbots
- 🕵️ Autonomous Agents
- 📈 Business process handling
- 🎮 Video game NPCs

## Try the agent

```
npx bgent
```

## Installation

Currently bgent is dependent on Supabase. You can install it with the following command:

```bash
npm install bgent @supabase/supabase-js
```

### Set up environment variables

You will need a Supbase account, as well as an OpenAI developer account.

Copy and paste the `.dev.vars.example` to `.dev.vars` and fill in the environment variables:

```bash
SUPABASE_URL="https://your-supabase-url.supabase.co"
SUPABASE_SERVICE_API_KEY="your-supabase-service-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

### Supabase Local Setup

First, you will need to install the Supabase CLI. You can install it using the instructions [here](https://supabase.com/docs/guides/cli/getting-started).

Once you have the CLI installed, you can run the following commands to set up a local Supabase instance:

```bash
supabase start
```

You can now start the bgent project with `npm run dev` and it will connect to the local Supabase instance by default.

**NOTE**: You will need Docker installed for this to work. If that is an issue for you, use the _Supabase Cloud Setup_ instructions instead below).

### Supabase Cloud Setup

This library uses Supabase as a database. You can set up a free account at [supabase.io](https://supabase.io) and create a new project.

- Step 1: On the Subase All Projects Dashboard, select “New Project”.
- Step 2: Select the organization to store the new project in, assign a database name, password and region.
- Step 3: Select “Create New Project”.
- Step 4: Wait for the database to setup. This will take a few minutes as supabase setups various directories.
- Step 5: Select the “SQL Editor” tab from the left navigation menu.
- Step 6: Copy in your own SQL dump file or optionally use the provided file in the bgent directory at: "src/supabase/db.sql". Note: You can use the command "supabase db dump" if you have a pre-exisiting supabase database to generate the SQL dump file.
- Step 7: Paste the SQL code into the SQL Editor and hit run in the bottom right.
- Step 8: Select the “Databases” tab from the left navigation menu to verify all of the tables have been added properly.

Once you've set up your Supabase project, you can find your API key by going to the "Settings" tab and then "API". You will need to set the `SUPABASE_URL` and `SUPABASE_SERVICE_API_KEY` environment variables in your `.dev.vars` file.

## Local Model Setup

While bgent uses ChatGPT 3.5 by default, you can use a local model by setting the `serverUrl` to a local endpoint. The [LocalAI](https://localai.io/) project is a great way to run a local model with a compatible API endpoint.

```typescript
const runtime = new BgentRuntime({
  serverUrl: process.env.LOCALAI_URL,
  token: process.env.LOCALAI_TOKEN, // Can be an API key or JWT token for your AI service
  // ... other options
});
```

## Development

```
npm run dev # start the server
npm run shell # start the shell in another terminal to talk to the default agent
```

## Usage

```typescript
import { BgentRuntime } from "bgent";
import { createClient } from "@supabase/supabase-js";
const supabase = new createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_API_KEY,
);

const runtime = new BgentRuntime({
  serverUrl: "https://api.openai.com/v1",
  token: process.env.OPENAI_API_KEY, // Can be an API key or JWT token for your AI services
  supabase,
  actions: [
    /* your custom actions */
  ],
  evaluators: [
    /* your custom evaluators */
  ],
});
```

## Custom Actions

Bgent is customized through actions and evaluators. Actions are functions that are called when a user input is received, and evaluators are functions that are called when a condition is met at the end of a conversation turn.

An example of an action is `wait` (the agent should stop and wait for the user to respond) or `continue` (the agent should continue with the next step in the conversation).

An example of a evaluator is `summarization` (the agent should summarize the conversation so far).

```typescript
import { wait, summarization } from "bgent";

const runtime = new BgentRuntime({
  // ... other options
  actions: [wait],
  evaluators: [summarization],
});

// You can also register actions and evaluators after the runtime has been created
bgentRuntime.registerAction(wait);
bgentRuntime.registerEvaluator(summarization);
```

## Handling User Input

The BgentRuntime instance has a `handleMessage` method that can be used to handle user input. The method returns a promise that resolves to the agent's response.

You will need to make sure that the userIds and room_id already exist in the database. You can use the Supabase client to create new users and rooms if necessary.

```typescript
const message = {
  agentId: "agent-uuid", // Replace with your agent's UUID
  senderId: "user-uuid", // Replace with the sender's UUID
  userIds: ["user-uuid"], // List of user UUIDs involved in the conversation
  content: { content: content }, // The message content
  room_id: "room-uuid", // Replace with the room's UUID
};
const response = await bgentRuntime.handleMessage(message);
console.log("Agent response:", response);
```

## Example Agents

There are two examples which are set up for cloudflare in `src/agents`

- The `simple` example is a simple agent that can be deployed to cloudflare workers
- The `cj` example is a more complex agent that has the ability to introduce users to each other. This agent is also deployable to cloudflare workers, and is the default agent in [Cojourney](https://cojourney.app).

An external example of an agent is the `afbot` Aframe Discord Bot, which is a discord bot that uses bgent as a backend. You can find it [here](https://github.com/JoinTheAlliance/afbot).

### Deploy to Cloudflare

To deploy an agent to Cloudflare, you can run `npm run deploy` -- this will by default deploy the `cj` agent. To deploy your own agent, see the [afbot](https://github.com/JoinTheAlliance/afbot) example.

## API Documentation

Complete API documentation is available at https://bgent.org/docs

## Contributions Welcome

This project is made by people like you. No contribution is too small. We welcome your input and support. Please file an issue if you notice something that needs to be resolved, or [join us on Discord](https://discord.gg/jointhealliance) to discuss working with us on fixes and new features.
