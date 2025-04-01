import { spawn } from 'child_process';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
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
    const process = spawn('cargo', fullArgs, { cwd: path });
    
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
