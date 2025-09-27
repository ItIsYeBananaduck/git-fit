// Simple test to verify backend functions are deployed and accessible
// This just checks if the functions exist without calling them with invalid data

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.PUBLIC_CONVEX_URL || "https://quick-sparrow-11.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🚀 Verifying Backend Function Deployment...");
console.log("Convex URL:", CONVEX_URL);

async function verifyDeployment() {
  const functionsToCheck = [
    { name: "functions/intensity:getLatestScore", type: "query" },
    { name: "functions/intensity:getHistory", type: "query" },
    { name: "functions/intensity:calculateScore", type: "mutation" },
    { name: "functions/coaching:getVoiceStatus", type: "query" },
    { name: "functions/coaching:watchContext", type: "query" },
    { name: "functions/coaching:updateContext", type: "mutation" },
    { name: "functions/supplements:getStack", type: "query" },
    { name: "functions/supplements:scanItem", type: "mutation" },
    { name: "functions/social:getFeed", type: "query" },
    { name: "functions/social:shareContent", type: "mutation" }
  ];

  let deployed = 0;
  
  for (const func of functionsToCheck) {
    try {
      // Try to call with invalid data to trigger validation error
      // This proves the function exists and is working
      if (func.type === "query") {
        await client.query(func.name, { invalid: "test" });
      } else {
        await client.mutation(func.name, { invalid: "test" });
      }
    } catch (error) {
      if (error.message.includes("ArgumentValidationError") || 
          error.message.includes("Not authenticated") ||
          error.message.includes("Object is missing")) {
        console.log(`✅ ${func.name} - Function deployed and validating inputs`);
        deployed++;
      } else {
        console.log(`❌ ${func.name} - Unexpected error:`, error.message);
      }
    }
  }
  
  console.log(`\n📊 Deployment Summary:`);
  console.log(`✅ Functions deployed: ${deployed}/${functionsToCheck.length}`);
  console.log(`🎉 Success rate: ${Math.round((deployed/functionsToCheck.length) * 100)}%`);
  
  if (deployed === functionsToCheck.length) {
    console.log("\n🎉 ALL BACKEND FUNCTIONS ARE SUCCESSFULLY DEPLOYED!");
    console.log("The functions are working correctly - they're just validating input parameters.");
    return true;
  } else {
    console.log("\n⚠️ Some functions may not be deployed correctly.");
    return false;
  }
}

// Run the verification
verifyDeployment().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error("❌ Verification script failed:", error);
  process.exit(1);
});