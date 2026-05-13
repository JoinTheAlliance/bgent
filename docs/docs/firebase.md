# Firebase adapter setup

Bgent can use Cloud Firestore through the `FirebaseDatabaseAdapter`. The adapter uses the Firebase Admin SDK, so it is intended for trusted server runtimes such as Cloud Functions, Cloud Run, Workers with a server-side credential bridge, or local development with Application Default Credentials.

## Install

```bash
npm install bgent firebase-admin
```

## Configure credentials

For Google Cloud and Firebase managed runtimes, prefer Application Default Credentials:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export FIREBASE_PROJECT_ID="your-project-id"
```

Then create the adapter:

```ts
import { BgentRuntime, FirebaseDatabaseAdapter } from "bgent";

const databaseAdapter = new FirebaseDatabaseAdapter({
  projectId: process.env.FIREBASE_PROJECT_ID,
  collectionPrefix: "bgent",
});

const runtime = new BgentRuntime({
  serverUrl: "https://api.openai.com/v1",
  token: process.env.OPENAI_API_KEY,
  databaseAdapter,
});
```

If your application already initializes Firebase Admin, pass the existing Firestore client:

```ts
import { getFirestore } from "firebase-admin/firestore";
import { FirebaseDatabaseAdapter } from "bgent";

const databaseAdapter = new FirebaseDatabaseAdapter({
  firestore: getFirestore(),
});
```

## Firestore collections

The adapter stores bgent entities in these top-level collections:

- `accounts`
- `rooms`
- `participants`
- `relationships`
- `memories`
- `goals`
- `logs`

Set `collectionPrefix` to isolate environments or tenants. For example, `collectionPrefix: "dev"` stores documents in `dev_accounts`, `dev_rooms`, and the other prefixed collections.

## Memory embeddings and vector search

The adapter stores memory embeddings in two fields:

- `embedding`: Firestore vector value used by native nearest-neighbor search.
- `embedding_values`: plain number array used for reads, emulators, and test fallback.

Firestore does not generate embeddings. Generate embeddings with bgent's configured model, Vertex AI, or another embedding provider before writing memories.

To use native Firestore vector search, create a vector index for the `embedding` field on the memories collection or prefixed memories collection. Example:

```bash
gcloud firestore indexes composite create \
  --collection-group=bgent_memories \
  --query-scope=COLLECTION \
  --field-config=order=ASCENDING,field-path="type" \
  --field-config=order=ASCENDING,field-path="room_id" \
  --field-config=order=ASCENDING,field-path="unique" \
  --field-config=field-path="embedding",vector-config='{"dimension":"1536", "flat": "{}"}' \
  --database="(default)"
```

Use the embedding dimension that matches your configured embedding model. If the vector index is not available, disable native vector search and the adapter will rank matching memories in process:

```ts
const databaseAdapter = new FirebaseDatabaseAdapter({
  projectId: process.env.FIREBASE_PROJECT_ID,
  useFirestoreVectorSearch: false,
});
```

## Google Vertex AI extension integration

Vertex AI Extensions can be used alongside the Firebase adapter for retrieval or tool execution. The current Vertex AI Extension API is a Preview service and is only available in `us-central1`, so treat it as an optional integration layer rather than a hard runtime dependency.

Recommended setup:

1. Keep bgent state in Firestore through `FirebaseDatabaseAdapter`.
2. Generate and store memory embeddings in Firestore, either from bgent's embedding model or from Vertex AI text embeddings.
3. Create the Firestore vector index for the memories collection.
4. Register or configure the Vertex AI extension in `us-central1` with a service account that can read the relevant Firestore or Vertex AI Search resources.
5. Test retrieval with `FirebaseDatabaseAdapter.searchMemoriesByEmbedding` before routing the same data into the Vertex AI extension.

The adapter tests include coverage for CRUD behavior, relationship room creation, vector-search fallback, and the Firestore `findNearest` integration path without requiring live Firebase credentials.
