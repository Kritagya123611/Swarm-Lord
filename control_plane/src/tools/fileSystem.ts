import fs from 'fs/promises';
import path from 'path';

const WORKSPACE_DIR = path.resolve(process.cwd(), "workspace");

const ensureWorkspace = async () => {
  try {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  } catch (e) {
  }
};

interface FileSystemArgs {
  tool: 'list_files' | 'read_file' | 'write_file';
  path: string;
  content?: string;
}

export const callFileSystem = async (args: FileSystemArgs): Promise<string> => {
  await ensureWorkspace();
  const safePath = path.join(WORKSPACE_DIR, args.path);
  console.log(`[REAL-FS] Executing ${args.tool} on ${safePath}`);
  try {
    if (args.tool === 'list_files') {
      const files = await fs.readdir(WORKSPACE_DIR);
      return files.length > 0 
        ? files.map(f => `[FILE] ${f}`).join("\n")
        : "Directory is empty.";
    }
    if (args.tool === 'read_file') {
      const content = await fs.readFile(safePath, 'utf-8');
      return content;
    }
    if (args.tool === 'write_file') {
      if (!args.content) return "Error: No content provided.";
      await fs.writeFile(safePath, args.content, 'utf-8');
      return `Success: Wrote to ${args.path}`;
    }
    return "Error: Unknown command.";
  } catch (error: any) {
    return `FileSystem Error: ${error.message}`;
  }
};