import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { runCargoCommand, formatCommandResult } from './cargo.js';

// Create the MCP server
const server = new McpServer({
  name: 'Cargo-MCP',
  version: '1.0.0',
  description: 'Model Context Protocol server for Cargo commands. Use ',
});

// Helper function to get command args based on common parameters
function getCommonArgs(params: { release?: boolean; verbose?: boolean }): string[] {
  const args: string[] = [];
  if (params.release) args.push('--release');
  if (params.verbose) args.push('--verbose');
  return args;
}

// Add cargo build tool
server.tool(
  'build',
  `Compiles the current Rust project.`,
  {
    path: z.string().describe('Path to the Rust project directory'),
    release: z.boolean().default(false).describe('Build in release mode'),
    verbose: z.boolean().default(false).describe('Use verbose output'),
    target: z.string().optional().describe('Target triple to build for'),
    features: z.array(z.string()).optional().describe('Features to enable'),
  },
  async ({ path, release, verbose, target, features }: { path: string, release: boolean, verbose: boolean, target?: string, features?: string[] }) => {
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

// Add cargo test tool
server.tool(
  'test',
  `Runs the test suite of the current Rust project.`,
  {
    path: z.string().describe('Path to the Rust project directory'),
    release: z.boolean().default(false).describe('Build in release mode'),
    verbose: z.boolean().default(false).describe('Use verbose output'),
    testName: z.string().optional().describe('Name of the test to run'),
    noCapture: z.boolean().default(false).describe('Show output of tests'),
  },
  async ({ path, release, verbose, testName, noCapture }: { path: string, release: boolean, verbose: boolean, testName?: string, noCapture: boolean }) => {
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
  `Checks a Rust project for errors without building it.`,
  {
    path: z.string().describe('Path to the Rust project directory'),
    release: z.boolean().default(false).describe('Build in release mode'),
    verbose: z.boolean().default(false).describe('Use verbose output'),
  },
  async ({ path, release, verbose }: { path: string, release: boolean, verbose: boolean }) => {
    const args = getCommonArgs({ release, verbose });
    const result = await runCargoCommand('check', args, path);
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
