import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Find the Cargo executable on the system
 * @returns Path to the cargo executable or 'cargo' if not found
 */
function findCargoExecutable(): string {
  // First check if it's specified by environment variable
  if (process.env.CARGO_PATH && existsSync(process.env.CARGO_PATH)) {
    return process.env.CARGO_PATH;
  }
  
  // Common locations for Cargo based on OS
  const commonLocations = [
    path.join(os.homedir(), '.cargo', 'bin', 'cargo'),
    path.join(os.homedir(), '.rustup', 'toolchains', 'stable-x86_64-apple-darwin', 'bin', 'cargo'),
    path.join(os.homedir(), '.rustup', 'toolchains', 'stable-x86_64-unknown-linux-gnu', 'bin', 'cargo'),
    path.join(os.homedir(), '.rustup', 'toolchains', 'stable-x86_64-pc-windows-msvc', 'bin', 'cargo.exe'),
    '/usr/local/bin/cargo',
    '/usr/bin/cargo',
    'C:\\Program Files\\Rust\\bin\\cargo.exe',
    'C:\\Rust\\bin\\cargo.exe'
  ];
  
  for (const location of commonLocations) {
    if (existsSync(location)) {
      return location;
    }
  }
  
  // If we can't find it, just return 'cargo' and hope it's in the PATH
  return 'cargo';
}

/**
 * Execute a Cargo command in the specified directory
 * @param command The cargo subcommand (e.g., 'build', 'run')
 * @param args Additional arguments to pass to the command
 * @param path Path to the Rust project directory
 * @returns Promise with command result
 */
export async function runCargoCommand(
  command: string,
  args: string[] = [],
  path: string
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const fullArgs = [command, ...args];
    const cargoPath = findCargoExecutable();
    const process = spawn(cargoPath, fullArgs, { cwd: path });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (exitCode) => {
      resolve({
        stdout,
        stderr,
        exitCode: exitCode || 0
      });
    });
  });
}

/**
 * Format a command result into a string suitable for display
 */
export function formatCommandResult(result: CommandResult): string {
  let output = '';
  
  if (result.stdout) {
    output += `STDOUT:\n${result.stdout}\n`;
  }
  
  if (result.stderr) {
    output += `STDERR:\n${result.stderr}\n`;
  }
  
  output += `Exit code: ${result.exitCode}`;
  
  return output;
}
