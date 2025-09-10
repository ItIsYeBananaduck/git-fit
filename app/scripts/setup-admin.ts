#!/usr/bin/env tsx

// Admin System Setup Script
// Run with: npx tsx scripts/setup-admin.ts

import { adminSetupService } from "../src/lib/services/adminSetup";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupAdminSystem() {
  console.log("🚀 Technically Fit Admin System Setup");
  console.log("=====================================\n");

  try {
    // Check if already initialized
    const isInitialized = await adminSetupService.isAdminSystemInitialized();
    
    if (isInitialized) {
      console.log("✅ Admin system is already initialized!");
      
      const status = await adminSetupService.getSystemStatus();
      console.log(`📊 System Status:`);
      console.log(`   - Admin Users: ${status.adminCount}`);
      console.log(`   - Roles: ${status.roleCount}`);
      console.log(`   - Permissions: ${status.permissionCount}`);
      console.log(`   - Recent Activity (24h): ${status.recentActivity} actions`);
      
      rl.close();
      return;
    }

    console.log("🔧 Setting up admin system for the first time...\n");

    // Get admin details
    const email = await question("Enter super admin email: ");
    const name = await question("Enter super admin name: ");
    const password = await question("Enter super admin password (min 8 chars): ");

    // Validate input
    if (!email || !email.includes("@")) {
      console.error("❌ Invalid email address");
      rl.close();
      return;
    }

    if (!name || name.length < 2) {
      console.error("❌ Name must be at least 2 characters");
      rl.close();
      return;
    }

    if (!password || password.length < 8) {
      console.error("❌ Password must be at least 8 characters");
      rl.close();
      return;
    }

    console.log("\n🔄 Initializing admin system...");

    // Initialize the system
    const result = await adminSetupService.initializeAdminSystem({
      email,
      name,
      password
    });

    if (result.success) {
      console.log("✅ Admin system initialized successfully!");
      console.log(`👤 Super admin created: ${result.adminUser?.name} (${result.adminUser?.email})`);
      console.log("\n🔐 Next steps:");
      console.log("1. Login to the admin dashboard");
      console.log("2. Enable MFA for enhanced security");
      console.log("3. Create additional admin users as needed");
      console.log("4. Configure IP whitelisting if required");
    } else {
      console.error(`❌ Setup failed: ${result.message}`);
    }

  } catch (error) {
    console.error("❌ Setup error:", error);
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes("--status")) {
    // Just show status
    const status = await adminSetupService.getSystemStatus();
    console.log("📊 Admin System Status:");
    console.log(`   - Initialized: ${status.initialized ? "✅ Yes" : "❌ No"}`);
    console.log(`   - Admin Users: ${status.adminCount}`);
    console.log(`   - Roles: ${status.roleCount}`);
    console.log(`   - Permissions: ${status.permissionCount}`);
    console.log(`   - Recent Activity (24h): ${status.recentActivity} actions`);
    return;
  }

  if (args.includes("--reset") && process.env.NODE_ENV !== "production") {
    // Reset system (development only)
    console.log("⚠️  Resetting admin system...");
    const result = await adminSetupService.resetAdminSystem();
    console.log(result.success ? "✅ System reset" : `❌ Reset failed: ${result.message}`);
    return;
  }

  // Run setup
  await setupAdminSystem();
}

main().catch(console.error);