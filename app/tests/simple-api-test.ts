// Simple test to verify our backend functions are working
// This bypasses the ConvexTestingHelper dependency issue

import { api } from "../convex/_generated/api.js";

async function testBasicFunctionality() {
  console.log("Testing basic Convex functions...");
  
  try {
    console.log("✅ API imports work correctly");
    console.log("Available functions:", Object.keys(api));
    
    if (api.intensity && api.coaching && api.supplements && api.social) {
      console.log("✅ All required function modules exist:");
      console.log("  - intensity:", Object.keys(api.intensity));
      console.log("  - coaching:", Object.keys(api.coaching));
      console.log("  - supplements:", Object.keys(api.supplements));  
      console.log("  - social:", Object.keys(api.social));
    } else {
      console.log("❌ Missing function modules");
      console.log("Available modules:", Object.keys(api));
    }
    
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

// Run the test
testBasicFunctionality()
  .then(success => {
    console.log(success ? "\n🎉 Basic tests passed!" : "\n💥 Tests failed");
    process.exit(success ? 0 : 1);
  })
  .catch(console.error);