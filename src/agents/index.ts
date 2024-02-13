import { fetch as CjWorker } from "./cj";
import { fetch as SimpleWorker } from "./simple";

export default {
  CjWorker,
  SimpleWorker,
  fetch: CjWorker,
};
