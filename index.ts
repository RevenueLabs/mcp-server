#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";


const getSalesTotal: Tool =  {
    name: "get_sales_total",
    description: "Get the total sales for the current month",
    inputSchema: {
        type: "object",
        properties: {
            accountName: {
                type: "string",
                description: "Name of the account",
                default: "None",
            }
        },
    },
};


const authHeader = {
    "X-API-Key": `${process.env.API_KEY}`,
    "Content-Type": "application/json",
};

async function getSalesTotalFromServer(accountName: string) {

    const url = "https://api.revenuelabs.co/mcp/get_sales_total";
    const response = await fetch(url, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({"account_name":accountName}),
    });
    const data = await response.text()
    return data;
}

const server = new Server({
name: "revenue-labs-mcp-server",
version: "0.1.0",
},
{
    capabilities: {
    tools: {},
}
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [getSalesTotal],
}));
  

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    try {
      const { name, arguments: args } = request.params;
  
      if (!args) {
        throw new Error("No arguments provided");
      }
  
      switch (name) {
        case "get_sales_total": {
         
          const { accountName  } = args;
          const results = await getSalesTotalFromServer(accountName);
          return {
            content: [{ type: "text", text: results }],
            isError: false,
          };
        }
        default: {
            throw new Error(`Unknown tool: ${name}`);
        }
      }
    } catch (error: any) {
      return {
        content: [{ type: "text", text: error.message }],
        isError: true,
      };
    }
  });

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Revenue Labs MCP Server is running over stdio");
}
  
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});