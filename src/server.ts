#!/usr/bin/env node

/**
 * Figma MCP Server
 * Provides Claude with direct access to Figma API for design system maintenance
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Server configuration
const FIGMA_API_BASE = "https://api.figma.com/v1";
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN; // Set this in your environment

if (!FIGMA_TOKEN) {
  throw new Error("FIGMA_ACCESS_TOKEN environment variable is required");
}

// Axios instance with authentication
const figmaAPI = axios.create({
  baseURL: FIGMA_API_BASE,
  headers: {
    "X-Figma-Token": FIGMA_TOKEN,
  },
});

// Helper: Extract components recursively from Figma document tree
function extractComponents(node: any, components: any[] = []): any[] {
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
    components.push({
      id: node.id,
      name: node.name,
      type: node.type,
      description: node.description || "",
      properties: node.componentPropertyDefinitions || {},
      children: node.children || [],
    });
  }

  if (node.children) {
    node.children.forEach((child: any) => extractComponents(child, components));
  }

  return components;
}

// Helper: Extract color styles from file
function extractColorStyles(styles: any): any[] {
  return Object.entries(styles)
    .filter(([_, style]: [string, any]) => style.styleType === "FILL")
    .map(([key, style]: [string, any]) => ({
      key,
      name: style.name,
      description: style.description || "",
    }));
}

// Helper: Extract text styles from file
function extractTextStyles(styles: any): any[] {
  return Object.entries(styles)
    .filter(([_, style]: [string, any]) => style.styleType === "TEXT")
    .map(([key, style]: [string, any]) => ({
      key,
      name: style.name,
      description: style.description || "",
    }));
}

// Create MCP server instance
const server = new Server(
  {
    name: "figma-design-system-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool 1: Get file structure and metadata
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_figma_file",
        description:
          "Retrieves complete Figma file structure including all pages, frames, and metadata. Use this to understand the file organization.",
        inputSchema: {
          type: "object",
          properties: {
            file_key: {
              type: "string",
              description:
                "The Figma file key (from URL: figma.com/file/FILE_KEY/...)",
            },
          },
          required: ["file_key"],
        },
      },
      {
        name: "get_figma_components",
        description:
          "Extracts all components and component sets from a Figma file. Returns component names, types, properties, and descriptions for design system analysis.",
        inputSchema: {
          type: "object",
          properties: {
            file_key: {
              type: "string",
              description: "The Figma file key",
            },
          },
          required: ["file_key"],
        },
      },
      {
        name: "get_figma_styles",
        description:
          "Retrieves all color and text styles defined in the Figma file. Essential for analyzing design tokens and style consistency.",
        inputSchema: {
          type: "object",
          properties: {
            file_key: {
              type: "string",
              description: "The Figma file key",
            },
          },
          required: ["file_key"],
        },
      },
      {
        name: "search_figma_components",
        description:
          "Search for specific components by name or pattern. Useful for finding related components or checking naming conventions.",
        inputSchema: {
          type: "object",
          properties: {
            file_key: {
              type: "string",
              description: "The Figma file key",
            },
            search_term: {
              type: "string",
              description:
                "Term to search for in component names (case-insensitive)",
            },
          },
          required: ["file_key", "search_term"],
        },
      },
      {
        name: "get_component_details",
        description:
          "Get detailed information about a specific component including all variants, properties, and nested elements.",
        inputSchema: {
          type: "object",
          properties: {
            file_key: {
              type: "string",
              description: "The Figma file key",
            },
            node_id: {
              type: "string",
              description:
                "The component node ID (from component list or search)",
            },
          },
          required: ["file_key", "node_id"],
        },
      },
      {
        name: "analyze_naming_conventions",
        description:
          "Analyzes component naming patterns and identifies inconsistencies. Checks for kebab-case, proper hierarchy, and naming best practices.",
        inputSchema: {
          type: "object",
          properties: {
            file_key: {
              type: "string",
              description: "The Figma file key",
            },
          },
          required: ["file_key"],
        },
      },
    ],
  };
});

// Tool implementation handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Ensure args exists
  if (!args) {
    return {
      content: [
        {
          type: "text",
          text: "Error: Missing arguments",
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case "get_figma_file": {
        const fileKey = args.file_key as string;
        const response = await figmaAPI.get(`/files/${fileKey}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  name: response.data.name,
                  lastModified: response.data.lastModified,
                  version: response.data.version,
                  pages: response.data.document.children.map((page: any) => ({
                    id: page.id,
                    name: page.name,
                    type: page.type,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_figma_components": {
        const fileKey = args.file_key as string;
        const response = await figmaAPI.get(`/files/${fileKey}`);
        const components = extractComponents(response.data.document);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total: components.length,
                  components: components.map((c) => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    description: c.description,
                    hasProperties: Object.keys(c.properties).length > 0,
                    propertyCount: Object.keys(c.properties).length,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_figma_styles": {
        const fileKey = args.file_key as string;
        const fileResponse = await figmaAPI.get(`/files/${fileKey}`);
        const stylesResponse = await figmaAPI.get(`/files/${fileKey}/styles`);

        const colorStyles = extractColorStyles(
          stylesResponse.data.meta.styles
        );
        const textStyles = extractTextStyles(stylesResponse.data.meta.styles);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  colorStyles: {
                    total: colorStyles.length,
                    styles: colorStyles,
                  },
                  textStyles: {
                    total: textStyles.length,
                    styles: textStyles,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "search_figma_components": {
        const fileKey = args.file_key as string;
        const searchTerm = (args.search_term as string).toLowerCase();
        const response = await figmaAPI.get(`/files/${fileKey}`);
        const components = extractComponents(response.data.document);

        const matches = components.filter((c) =>
          c.name.toLowerCase().includes(searchTerm)
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  searchTerm,
                  matchCount: matches.length,
                  matches: matches.map((c) => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_component_details": {
        const fileKey = args.file_key as string;
        const nodeId = args.node_id as string;
        const response = await figmaAPI.get(
          `/files/${fileKey}/nodes?ids=${nodeId}`
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data.nodes[nodeId], null, 2),
            },
          ],
        };
      }

      case "analyze_naming_conventions": {
        const fileKey = args.file_key as string;
        const response = await figmaAPI.get(`/files/${fileKey}`);
        const components = extractComponents(response.data.document);

        // Analyze naming patterns
        const issues: any[] = [];
        const patterns = {
          hasUpperCase: /[A-Z]/,
          hasSpaces: /\s/,
          hasUnderscores: /_/,
          isKebabCase: /^[a-z0-9]+(-[a-z0-9]+)*$/,
        };

        components.forEach((component) => {
          const name = component.name;
          const componentIssues: string[] = [];

          if (patterns.hasUpperCase.test(name)) {
            componentIssues.push("Contains uppercase letters");
          }
          if (patterns.hasSpaces.test(name)) {
            componentIssues.push("Contains spaces");
          }
          if (patterns.hasUnderscores.test(name)) {
            componentIssues.push("Uses underscores instead of hyphens");
          }
          if (!patterns.isKebabCase.test(name)) {
            componentIssues.push("Not in kebab-case format");
          }

          if (componentIssues.length > 0) {
            issues.push({
              id: component.id,
              name: component.name,
              issues: componentIssues,
              suggestion: name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/_/g, "-")
                .replace(/[^a-z0-9-]/g, ""),
            });
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalComponents: components.length,
                  componentsWithIssues: issues.length,
                  complianceRate: (
                    ((components.length - issues.length) /
                      components.length) *
                    100
                  ).toFixed(1),
                  issues,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ""}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Figma MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});