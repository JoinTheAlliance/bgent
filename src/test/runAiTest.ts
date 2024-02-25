import { addToReport } from "./report";

export async function runAiTest(
  testName: string,
  testFunc: () => Promise<boolean>,
  runs: number = 4,
) {
  let successful = 0;

  for (let i = 0; i < runs; i++) {
    if (await testFunc()) successful++;
  }

  const successRate = (successful / runs) * 100;
  addToReport(testName, runs, successful, successRate);
}
