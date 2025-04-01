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
  `Compiles the current Rust project. 
  This command is used to build a Rust package and all of its dependencies. 
  If the build is successful, the compiled artifacts are placed in the 'target/debug' directory (or 'target/release' if built with --release).
  Use this tool when you need to compile a Rust project without running it.`,
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

// Add cargo run tool
server.tool(
  'run',
  `Compiles and runs the current Rust project.
  This command builds the project and then immediately executes the resulting binary.
  Any additional arguments after '--' are passed to the binary when it's run.
  Use this tool when you want to build and execute a Rust project in one step.`,
  {
    path: z.string().describe('Path to the Rust project directory'),
    release: z.boolean().default(false).describe('Build in release mode'),
    verbose: z.boolean().default(false).describe('Use verbose output'),
    args: z.array(z.string()).default([]).describe('Arguments to pass to the binary'),
  },
  async ({ path, release, verbose, args }: { path: string, release: boolean, verbose: boolean, args: string[] }) => {
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
  `Runs the test suite of the current Rust project.
  This command compiles and runs all tests in the project, including documentation tests.
  You can specify a specific test to run by providing its name, or run all tests by default.
  The --nocapture flag shows the output (println! statements) from the tests even if they pass.
  Use this tool when you want to verify that the code is working correctly through its test suite.`,
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
  `Checks a Rust project for errors without building it.
  This command is significantly faster than 'cargo build' because it skips the code generation steps.
  It performs all the compilation, analysis, and linting checks but doesn't produce an executable.
  Use this tool for a quick verification that code compiles without errors when you don't need the compiled output.`,
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

// Add cargo fmt tool
server.tool(
  'fmt',
  `Formats Rust source code according to the official style guidelines.
  This command uses rustfmt to automatically format all code in the project.
  When run with the --check option, it reports formatting errors without modifying files.
  Use this tool to ensure code follows consistent Rust style conventions.`,
  {
    path: z.string().describe('Path to the Rust project directory'),
    check: z.boolean().default(false).describe('Check if formatting is correct without modifying files'),
  },
  async ({ path, check }: { path: string, check: boolean }) => {
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
  `Runs the Rust linter (Clippy) on the project.
  Clippy provides lint checks that catch common mistakes and improve your Rust code.
  It offers suggestions beyond what the compiler checks, focusing on code quality and best practices.
  The --fix option automatically applies suggested fixes when possible.
  Use this tool to find and fix potential issues in Rust code that wouldn't be caught by the compiler.`,
  {
    path: z.string().describe('Path to the Rust project directory'),
    release: z.boolean().default(false).describe('Build in release mode'),
    verbose: z.boolean().default(false).describe('Use verbose output'),
    fix: z.boolean().default(false).describe('Automatically apply lint suggestions'),
  },
  async ({ path, release, verbose, fix }: { path: string, release: boolean, verbose: boolean, fix: boolean }) => {
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
  `Adds a dependency to a Rust project's Cargo.toml file.
  This command intelligently adds and installs dependencies to the project.
  Use the --dev flag to add a dependency that's only needed during development (not in production).
  This is useful when you need to add a new library to a project without manually editing the Cargo.toml file.`,
  {
    path: z.string().describe('Path to the Rust project directory'),
    dependencies: z.array(z.string()).describe('Dependencies to add'),
    dev: z.boolean().default(false).describe('Add as development dependency'),
  },
  async ({ path, dependencies, dev }: { path: string, dependencies: string[], dev: boolean }) => {
    const args = [...dependencies];
    if (dev) args.unshift('--dev');
    
    const result = await runCargoCommand('add', args, path);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Add cargo update tool
server.tool(
  'update',
  `Updates dependencies in a Rust project's Cargo.toml file.
  This command updates all dependencies in the project to their latest versions.
  Use the --precise flag to specify a version to update to.

  Note: This command updates all dependencies in the project, including those that are not specified in the command.`,
  {
    path: z.string().describe('Path to the Rust project directory'),
    precise: z.string().optional().describe('Update to a specific version'),

  },
  async ({ path, precise }: { path: string, precise?: string }) => {
    const args = precise ? ['--precise', precise] : [];
    const result = await runCargoCommand('update', args, path);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Add cargo init tool
server.tool(
  'init',
  `Creates a new Rust project with a Cargo.toml file.
  This command initializes a new Rust project in the specified directory.
  Use the --bin flag to create a binary project, or --lib to create a library project.`,
  {
    path: z.string().describe('Path to the directory where the project will be created'),
    bin: z.boolean().default(false).describe('Create a binary project'),
    lib: z.boolean().default(false).describe('Create a library project'),
  },
  async ({ path, bin, lib }: { path: string, bin: boolean, lib: boolean }) => {
    const args = bin ? ['--bin'] : lib ? ['--lib'] : [];
    const result = await runCargoCommand('init', [...args], path);
    const formattedResult = formatCommandResult(result);
    
    return {
      content: [{ type: 'text', text: formattedResult }],
    };
  }
);

// Add cargo clean tool
server.tool(
  'clean',
  `Removes the target directory and all build artifacts.
  This command deletes the 'target' directory and all compiled artifacts.`,
  {
    path: z.string().describe('Path to the Rust project directory'),
  },
  async ({ path }: { path: string }) => {
    const result = await runCargoCommand('clean', [], path);
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
