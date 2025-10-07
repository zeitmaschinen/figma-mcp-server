/**
 * Local test script for Figma MCP Server
 * Run this to validate your setup before configuring Claude Desktop
 * 
 * Usage: 
 * 1. Set FIGMA_ACCESS_TOKEN in .env
 * 2. Update FILE_KEY constant below
 * 3. Run: npx tsx src/test-server.ts
 */

import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ===== CONFIGURATION =====
const FILE_KEY = "EJiO85RAB6E5whkaYc0fEs"; // Your Figma file key
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
// ========================

const FIGMA_API_BASE = "https://api.figma.com/v1";

if (!FIGMA_TOKEN) {
  console.error("❌ Error: FIGMA_ACCESS_TOKEN not found in environment");
  console.error("Please create a .env file with: FIGMA_ACCESS_TOKEN=your-token");
  process.exit(1);
}

const figmaAPI = axios.create({
  baseURL: FIGMA_API_BASE,
  headers: {
    "X-Figma-Token": FIGMA_TOKEN,
  },
});

// Helper function to extract components
function extractComponents(node: any, components: any[] = []): any[] {
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
    components.push({
      id: node.id,
      name: node.name,
      type: node.type,
      description: node.description || "",
    });
  }

  if (node.children) {
    node.children.forEach((child: any) => extractComponents(child, components));
  }

  return components;
}

async function runTests() {
  console.log("🧪 Figma MCP Server - Test Suite\n");
  console.log("=".repeat(50));

  try {
    // Test 1: Authentication & File Access
    console.log("\n✅ Test 1: Authentication & File Access");
    const fileResponse = await figmaAPI.get(`/files/${FILE_KEY}`);
    console.log(`   ✓ File name: ${fileResponse.data.name}`);
    console.log(`   ✓ Last modified: ${fileResponse.data.lastModified}`);
    console.log(`   ✓ Version: ${fileResponse.data.version}`);

    // Test 2: Extract Components
    console.log("\n✅ Test 2: Extract Components");
    const components = extractComponents(fileResponse.data.document);
    console.log(`   ✓ Total components found: ${components.length}`);

    if (components.length > 0) {
      console.log("\n   Sample components:");
      components.slice(0, 5).forEach((comp, idx) => {
        console.log(`   ${idx + 1}. ${comp.name} (${comp.type})`);
      });
    }

    // Test 3: Get Styles
    console.log("\n✅ Test 3: Get Styles");
    const stylesResponse = await figmaAPI.get(`/files/${FILE_KEY}/styles`);
    const styles = stylesResponse.data.meta.styles;
    const colorStyles = Object.values(styles).filter(
      (s: any) => s.styleType === "FILL"
    );
    const textStyles = Object.values(styles).filter(
      (s: any) => s.styleType === "TEXT"
    );

    console.log(`   ✓ Color styles: ${colorStyles.length}`);
    console.log(`   ✓ Text styles: ${textStyles.length}`);

    // Test 4: Naming Convention Analysis
    console.log("\n✅ Test 4: Naming Convention Analysis");
    const kebabCasePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    const issuesFound: any[] = [];

    components.forEach((comp) => {
      if (!kebabCasePattern.test(comp.name)) {
        issuesFound.push({
          name: comp.name,
          suggestion: comp.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/_/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
        });
      }
    });

    console.log(
      `   ✓ Components analyzed: ${components.length}`
    );
    console.log(
      `   ✓ Naming issues found: ${issuesFound.length}`
    );
    console.log(
      `   ✓ Compliance rate: ${(((components.length - issuesFound.length) / components.length) * 100).toFixed(1)}%`
    );

    if (issuesFound.length > 0) {
      console.log("\n   Sample naming issues:");
      issuesFound.slice(0, 3).forEach((issue) => {
        console.log(`   • "${issue.name}" → "${issue.suggestion}"`);
      });
    }

    // Test 5: Component Search
    console.log("\n✅ Test 5: Component Search");
    const searchTerm = "button"; // Customize search term
    const matches = components.filter((c) =>
      c.name.toLowerCase().includes(searchTerm)
    );
    console.log(`   ✓ Search term: "${searchTerm}"`);
    console.log(`   ✓ Matches found: ${matches.length}`);

    if (matches.length > 0) {
      console.log("\n   Matches:");
      matches.slice(0, 3).forEach((match) => {
        console.log(`   • ${match.name}`);
      });
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("🎉 All tests passed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   • File: ${fileResponse.data.name}`);
    console.log(`   • Components: ${components.length}`);
    console.log(`   • Color Styles: ${colorStyles.length}`);
    console.log(`   • Text Styles: ${textStyles.length}`);
    console.log(`   • Naming Issues: ${issuesFound.length}`);
    console.log("\n✅ Your Figma MCP Server is ready to use with Claude!");
    console.log(
      "\nNext steps:"
    );
    console.log("1. Run 'npm run build' to compile the server");
    console.log("2. Configure claude_desktop_config.json");
    console.log("3. Restart Claude Desktop");
    console.log("4. Start chatting with Claude to audit your design system!");

  } catch (error: any) {
    console.error("\n❌ Test failed:");

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);

      if (error.response.status === 403) {
        console.error(
          "\n   💡 This usually means your token doesn't have access to this file."
        );
        console.error("   Check:");
        console.error("   1. Token is correct in .env");
        console.error("   2. You have access to the file in Figma");
        console.error("   3. File key is correct");
      }
    } else {
      console.error(`   ${error.message}`);
    }

    process.exit(1);
  }
}

// Run tests
console.log("Starting test suite...\n");
runTests();