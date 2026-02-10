const virtualDisk = new Map<string, string>();

virtualDisk.set("README.md", "# SwarmLord\nA cool AI project.");
virtualDisk.set("package.json", "{ \"name\": \"swarmlord\" }");

interface FileSystemArgs {
  tool: 'list_files' | 'read_file' | 'write_file'; 
  path: string;
  content?: string; 
}

export const callFileSystem = async (args: FileSystemArgs): Promise<string> => {
  console.log(`[MOCK] Calling Tool: ${args.tool} on ${args.path}`);
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay

  if (args.tool === 'list_files') {
    const files = Array.from(virtualDisk.keys()).map(f => `[FILE] ${f}`);
    return files.join("\n");
  }

  if (args.tool === 'read_file') {
    const content = virtualDisk.get(args.path);
    return content || "Error: File not found.";
  }

  if (args.tool === 'write_file') {
    if (!args.content) return "Error: No content provided.";
    virtualDisk.set(args.path, args.content);
    return `Success: Created file '${args.path}'`;
  }

  return "Error: Unknown mock command.";
};