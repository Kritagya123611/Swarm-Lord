import { exec } from 'child_process';
import util from 'util';
import path from 'path';

// Promisify exec so we can use 'await'
const execAsync = util.promisify(exec);

// 🛡️ WORKSPACE: Same as fileSystem, we only run git in the workspace
const WORKSPACE_DIR = path.resolve(process.cwd(), "workspace");

export const callGit = async (command: string): Promise<string> => {
  console.log(`[GIT] Running: git ${command}`);

  try {
    // We run the command INSIDE the workspace folder
    const { stdout, stderr } = await execAsync(`git ${command}`, { cwd: WORKSPACE_DIR });
    
    if (stderr && !stderr.includes("To") && !stderr.includes("Switched")) {
        // Git often writes non-errors to stderr (like progress bars), so be careful
        console.warn(`[GIT WARN] ${stderr}`);
    }
    
    return stdout || "Git command executed successfully.";
  } catch (error: any) {
    return `Git Error: ${error.message}`;
  }
};