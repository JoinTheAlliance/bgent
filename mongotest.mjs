import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoDatabaseAdapter } from './src/lib/adapters/mongodb.ts';
import { v4 as uuid } from 'uuid';
import { GoalStatus } from './src/lib/types.ts';

const mongod = await MongoMemoryServer.create({ binary: { version: '8.2.6' } });
const adapter = new MongoDatabaseAdapter(mongod.getUri(), 'test');
await adapter.connect();

// 1. room
const room = await adapter.createRoom();
console.log('ROOM:', room);
console.log('GET ROOM:', await adapter.getRoom(room));

// 2. account + participant
const uid = uuid();
await adapter.createAccount({ id: uid, name: 'Alice', email: 'a@b.c', details: { tagline: 't', summary: 's', quote: 'q' } });
console.log('ACCOUNT:', (await adapter.getAccountById(uid))?.name);
await adapter.addParticipant(uid, room);
console.log('ACTORS:', await adapter.getActorDetails({ room_id: room }));
console.log('ROOMS FOR P:', await adapter.getRoomsForParticipant(uid));

// 3. memory + vector search
const mem = { id: uuid(), user_id: uuid(), room_id: room, content: { content: 'hello world' }, embedding: [1, 0, 0] };
await adapter.createMemory(mem, 'facts', true);
await adapter.createMemory({ ...mem, id: uuid(), content: { content: 'hello world dup' }, embedding: [0.99, 0.1, 0] }, 'facts', true);
console.log('COUNT UNIQUE:', await adapter.countMemories(room, true, 'facts'));
const found = await adapter.searchMemoriesByEmbedding([1, 0.05, 0], { tableName: 'facts', room_id: room, match_threshold: 0.9, count: 5 });
console.log('SEARCH:', found.length, found[0]?.content?.content);

// 4. goals
const goal = { id: uuid(), room_id: room, user_id: uuid(), name: 'g', status: GoalStatus.IN_PROGRESS, objectives: [{ description: 'x', completed: false }] };
await adapter.createGoal(goal);
console.log('GOALS:', (await adapter.getGoals({ room_id: room })).length);
await adapter.updateGoalStatus({ goalId: goal.id, status: GoalStatus.DONE });
console.log('GOAL DONE:', (await adapter.getGoals({ room_id: room }))[0].status);

// 5. log + relationship
await adapter.log({ body: { k: 1 }, user_id: uid, room_id: room, type: 'evt' });
const b = uuid();
console.log('REL CREATE:', await adapter.createRelationship({ userA: uid, userB: b }));
console.log('REL GET:', (await adapter.getRelationship({ userA: b, userB: uid })) !== null);

await adapter.disconnect();
await mongod.stop();
console.log('ALL PASSED ✅');
