# bgent

Alexible, scalable and customizable agent to do your bidding.

![cj](https://github.com/lalalune/bgent/assets/18633264/7513b5a6-2352-45f3-8b87-7ee0e2171a30)

[![npm version](https://badge.fury.io/js/bgent.svg)](https://badge.fury.io/js/bgent)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://github.com/lalalune/bgent/blob/main/LICENSE)
[![stars - bgent](https://img.shields.io/github/stars/lalalune/bgent?style=social)](https://github.com/lalalune/bgent)
[![forks - bgent](https://img.shields.io/github/forks/lalalune/bgent?style=social)](https://github.com/lalalune/bgent)

## Developing Live on Discord
<a href="https://discord.gg/qetWd7J9De"><img src="https://dcbadge.vercel.app/api/server/qetWd7J9De" alt=""></a>

## PRE-ALPHA RELEASE
- This code is NOT production ready. This package has been released as-is to enable collaboration and development.
- 0.1.0 will be the first official alpha release!

## Features

- Simple and extensible
- Customizable to your use case
- Retrievable memory and document store
- Serverless artchitecture, deployable in minutes at scale with Cloudflare and Supabase
- Multi-agent and room support
- Summarization and summarization
- Goal-directed behavior

## Installation

```bash
npm install bgent
```

## Try the agent

```
# evaluation mode
npm run shell

# for development
npm run dev # start the server
npm run shell:dev # start the shell in another terminal
```

## Database setup

This library uses Supabase as a database. You can set up a free account at [supabase.io](https://supabase.io) and create a new project.

### TODO: Add script and instructions for deploying fresh copy of database

### TODO: Local supabase deployment instructions

## Usage

```javascript
const runtime = new BgentRuntime({
  serverUrl: "https://api.openai.com/v1",
  token: process.env.OPENAI_API_KEY,
  supabase: createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
  ),
});
```

## Examples

There are two examples which are set up for cloudflare in `src/agents`

- The `simple` example is a simple agent that can be deployed to cloudflare workers
- The `cj` example is a more complex agent that has the ability to introduce users to each other

### Custom actions

Actions come in two flavors -- generic `actions` which run at any time they are considered valid, and `evaluators` which run when a condition is met at the end of a conversation turn.

You can pass your own custom actions and evaluators into the BgentRuntime instance. Check out the `src/agents/cj` example for a simple example of how to do this.

### Deployment

Deploying to cloudflare is easy. `npm run deploy` will walk you through a deployment with wrangler, Cloudflare's deployment tool.

# Contributions Welcome

If you like this library and want to contribute in any way, please feel free to submit a PR and I will review it. Please note that the goal here is simplicity and accesibility, using common language and few dependencies.
