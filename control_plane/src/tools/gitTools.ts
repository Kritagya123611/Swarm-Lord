import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

const WORKSPACE_DIR = path.resolve(process.cwd(), "workspace");

export const callGit = async (command: string): Promise<string> => {
  console.log(`[GIT] Running: git ${command}`);

  try {
    const { stdout, stderr } = await execAsync(`git ${command}`, { cwd: WORKSPACE_DIR });
    if (stderr && !stderr.includes("To") && !stderr.includes("Switched")) {
        console.warn(`[GIT WARN] ${stderr}`);
    }
    
    return stdout || "Git command executed successfully.";
  } catch (error: any) {
    return `Git Error: ${error.message}`;
  }
};