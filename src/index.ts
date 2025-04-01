import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { runCargoCommand, formatCommandResult } from './cargo.js';

// Define schemas for common parameters
const commonParams = {
  path: z.string().describe('Path to the Rust project directory'),
  release: z.boolean().default(false).describe('Build in release mode'),
  verbose: z.boolean().default(false).describe('Use verbose output'),
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
    target: z.string().optional().describe('Target triple to build for'),
    features: z.array(z.string()).optional().describe('Features to enable'),
  },
  async ({ path, release, verbose, target, features }) => {
    let args = getCommonArgs({ release, verbose });
    
    if (target) args = [...args, '--target', target];
    if (features && features.length > 0) {
      args = [...args, '--features', features.join(',')];
    }
    
    const result = await runCargoCommand('build', args, path);
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
    args: z.array(z.string()).default([]).describe('Arguments to pass to the binary'),
  },
  async ({ path, release, verbose, args }) => {
    let commandArgs = getCommonArgs({ release, verbose });
    if (args.length > 0) {
      commandArgs = [...commandArgs, '--', ...args];
    }
    
    const result = await runCargoCommand('run', commandArgs, path);
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
    testName: z.string().optional().describe('Name of the test to run'),
    noCapture: z.boolean().default(false).describe('Show output of tests'),
  },
  async ({ path, release, verbose, testName, noCapture }) => {
    let args = getCommonArgs({ release, verbose });
    
    if (testName) args.push(testName);
    if (noCapture) args.push('--nocapture');
    
    const result = await runCargoCommand('test', args, path);
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
  async ({ path, release, verbose }) => {
    const args = getCommonArgs({ release, verbose });
    const result = await runCargoCommand('check', args, path);
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
    path: z.string().describe('Path to the Rust project directory'),
    check: z.boolean().default(false).describe('Check if formatting is correct without modifying files'),
  },
  async ({ path, check }) => {
    const args = check ? ['--check'] : [];
    const result = await runCargoCommand('fmt', args, path);
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
    fix: z.boolean().default(false).describe('Automatically apply lint suggestions'),
  },
  async ({ path, release, verbose, fix }) => {
    let args = getCommonArgs({ release, verbose });
    if (fix) args.push('--fix');
    
    const result = await runCargoCommand('clippy', args, path);
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
    path: z.string().describe('Path to the Rust project directory'),
    dependencies: z.array(z.string()).describe('Dependencies to add'),
    dev: z.boolean().default(false).describe('Add as development dependency'),
  },
  async ({ path, dependencies, dev }) => {
    const args = [...dependencies];
    if (dev) args.unshift('--dev');
    
    const result = await runCargoCommand('add', args, path);
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
