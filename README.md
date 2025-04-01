# Cargo MCP Server

A Model Context Protocol server that provides access to Cargo commands for LLMs.

## Available Commands

The following Cargo commands are available through this MCP server:

- `build`: Build a Rust project
- `run`: Build and run a Rust project
- `test`: Run the tests in a Rust project
- `check`: Check a Rust project for errors without building
- `fmt`: Format Rust code
- `clippy`: Run the Rust linter
- `add`: Add a dependency to a Rust project

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd cargo-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

To use this server, you need to connect to it through an MCP client:

```bash
# Start the server
npm start
```

You can then connect to the server using any MCP client that supports stdio transport.

### Example: Using with Claude

To use this server with Claude through the Model Context Protocol:

1. Start the server
2. Connect to it from your MCP client (like Claude Desktop)
3. Once connected, you can ask questions like:
   - "Can you run the tests for this Rust project?"
   - "Build this project in release mode"
   - "Run cargo clippy on this code and show me any warnings"

## Development

To run the server in development mode:

```bash
npm run dev
```

## License

MIT
