import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { runCargoCommand, formatCommandResult } from './cargo.js';

// Define schemas for common parameters
const commonParams = {
  cwd: z.string().default(process.cwd()),
  release: z.boolean().default(false),
  verbose: z.boolean().default(false),
};

// Create the MCP server
const server = new McpServer({
  name: 'Cargo-MCP',
  version: '1.0.0',
  description: 'Model Context Protocol server for Cargo commands',
});

// Helper function to get command args based on common parameters
function getCommonArgs(params: { release?: boolean; verbose?: boolean }) {
  const args: string[] = [];
  if (params.release) args.push('--release');
  if (params.verbose) args.push('--verbose');
  return args;
}

// Add cargo build tool
server.tool(
  'build',
  {
    ...commonParams,
    target: z.string().optional(),
    features: z.array(z.string()).optional(),
  },
  async ({ cwd, release, verbose, target, features }) => {
    let args = getCommonArgs({ release, verbose });
    
    if (target) args = [...args, '--target', target];
    if (features && features.length > 0) {
      args = [...args, '--features', features.join(',')];
    }
    
    const result = await runCargoCommand('build', args, cwd);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Add cargo run tool
server.tool(
  'run',
  {
    ...commonParams,
    args: z.array(z.string()).default([]),
  },
  async ({ cwd, release, verbose, args }) => {
    let commandArgs = getCommonArgs({ release, verbose });
    if (args.length > 0) {
      commandArgs = [...commandArgs, '--', ...args];
    }
    
    const result = await runCargoCommand('run', commandArgs, cwd);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Add cargo test tool
server.tool(
  'test',
  {
    ...commonParams,
    testName: z.string().optional(),
    noCapture: z.boolean().default(false),
  },
  async ({ cwd, release, verbose, testName, noCapture }) => {
    let args = getCommonArgs({ release, verbose });
    
    if (testName) args.push(testName);
    if (noCapture) args.push('--nocapture');
    
    const result = await runCargoCommand('test', args, cwd);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Add cargo check tool
server.tool(
  'check',
  {
    ...commonParams,
  },
  async ({ cwd, release, verbose }) => {
    const args = getCommonArgs({ release, verbose });
    const result = await runCargoCommand('check', args, cwd);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Add cargo fmt tool
server.tool(
  'fmt',
  {
    cwd: z.string().default(process.cwd()),
    check: z.boolean().default(false),
  },
  async ({ cwd, check }) => {
    const args = check ? ['--check'] : [];
    const result = await runCargoCommand('fmt', args, cwd);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Add cargo clippy tool
server.tool(
  'clippy',
  {
    ...commonParams,
    fix: z.boolean().default(false),
  },
  async ({ cwd, release, verbose, fix }) => {
    let args = getCommonArgs({ release, verbose });
    if (fix) args.push('--fix');
    
    const result = await runCargoCommand('clippy', args, cwd);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Add cargo add tool
server.tool(
  'add',
  {
    cwd: z.string().default(process.cwd()),
    dependencies: z.array(z.string()),
    dev: z.boolean().default(false),
  },
  async ({ cwd, dependencies, dev }) => {
    const args = [...dependencies];
    if (dev) args.unshift('--dev');
    
    const result = await runCargoCommand('add', args, cwd);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Start the server with stdio transport
const transport = new StdioServerTransport();

async function main() {
  try {
    console.error('Starting Cargo MCP server...');
    await server.connect(transport);
    console.error('Server connected!');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

main();
