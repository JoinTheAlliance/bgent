import * as fs from "fs";
import * as colors from "ansi-colors";

interface TestResult {
  testName: string;
  attempts: number;
  successful: number;
  successRate: number;
}

export function deleteReport() {
  // Define the path to the test-report.json file
  const reportPath = "./test-report.json";

  // Check if test-report.json exists
  if (fs.existsSync(reportPath)) {
    // Delete the file
    fs.unlinkSync(reportPath);
  }
}

export function addToReport(
  testName: string,
  attempts: number,
  successful: number,
  successRate: number,
) {
  // Define the path to the test-report.json file
  const reportPath = "./test-report.json";

  // Initialize an empty array to hold the test results
  let report: TestResult[] = [];

  // Check if test-report.json exists
  if (fs.existsSync(reportPath)) {
    // Read the existing test report
    const reportContent = fs.readFileSync(reportPath, "utf-8");
    report = JSON.parse(reportContent);
  }

  // Check if the test already exists in the report
  const existingTestIndex = report.findIndex(
    (test) => test.testName === testName,
  );

  // Create a new test result object
  const newTestResult: TestResult = {
    testName,
    attempts,
    successful,
    successRate,
  };

  if (existingTestIndex !== -1) {
    // If the test already exists, replace it with the new result
    report[existingTestIndex] = newTestResult;
  } else {
    // If the test doesn't exist, add the new result to the report
    report.push(newTestResult);
  }

  // Write the updated report to test-report.json
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

export function logReport() {
  // Define the path to the test-report.json file
  const reportPath = "./test-report.json";

  // Check if test-report.json exists
  if (!fs.existsSync(reportPath)) {
    console.log(colors.red("Error: test-report.json does not exist."));
    return;
  }

  // Read the test report
  const reportContent = fs.readFileSync(reportPath, "utf-8");
  const report: TestResult[] = JSON.parse(reportContent);

  // Log each test result with appropriate color-coding
  report.forEach((test) => {
    const logMessage = `${test.testName}: ${test.attempts} Attempts, ${test.successful} Successful, Success Rate: ${test.successRate}%`;

    if (test.successRate === 100) {
      console.log(colors.green(logMessage));
    } else if (test.successRate < 100 && test.successRate > 0) {
      console.log(colors.yellow(logMessage));
    } else {
      console.log(colors.red(logMessage));
    }
  });
}
