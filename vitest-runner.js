import { exec } from "child_process";

function runVitest() {
  return new Promise((resolve, reject) => {
    exec("npx vitest run --reporter=json", (err, stdout, stderr) => {
      if (err && !stdout) {
        reject(stderr || err.message);
        return;
      }

      try {
        const results = JSON.parse(stdout);
        resolve(results);
      } catch (parseError) {
        reject("Failed to parse Vitest output: " + parseError.message);
      }
    });
  });
}

function extractFailures(results) {
  const failures = [];

  for (const testFile of results.testResults) {
    for (const assertion of testFile.assertionResults) {
      if (assertion.status === "fail") {
        failures.push({
          file: testFile.name,
          testName: assertion.title,
          fullName: assertion.fullName,
          errorMessage: assertion.error?.message || "No message",
          errorStack: assertion.error?.stack || "No stack trace",
        });
      }
    }
  }

  return failures;
}

(async () => {
  try {
    const results = await runVitest();
    const failures = extractFailures(results);

    console.log(
      JSON.stringify(
        { summary: results.summary, failures },
        null,
        2
      )
    );
  } catch (err) {
    console.error("Error running Vitest:", err);
    process.exit(1);
  }
})();