import { AgentState } from "./state";
import { ChatCohere } from "@langchain/cohere";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
import { callFileSystem } from "../tools/fileSystem";
import { callGit } from "../tools/gitTools";

dotenv.config();

// Initialize Cohere
const model = new ChatCohere({
  model: "command-r-08-2024", 
  temperature: 0, 
});

// --- WORKER 1: THE PLANNER ---
export const plannerNode = async (state: typeof AgentState.State) => {
  console.log("[Planner] Analysing request & history...");

  const userGoal = state.userGoal;
  const recentLogs = state.logs.slice(-3).join("\n"); 
  
  const systemPrompt = `
    You are a Senior Software Engineer.
    GOAL: ${userGoal}
    
    HISTORY:
    ${recentLogs}
    
    CRITICAL INSTRUCTIONS:
    1. You must ONLY output a raw JSON array of strings.
    2. Use DOUBLE QUOTES (") for the JSON. Do not use single quotes.
    3. Do NOT wrap the code in markdown blocks (like \`\`\`json). Just the raw array.
    4. Format: ["command arg1 arg2", "command2 arg"]

    TOOLS:
    - "list_files"
    - "read_file <filename>"
    - "write_file <filename> <content>" (Content must be escaped properly for JSON)
    - "run_command <cmd>"
    - "finish"
  `;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage("Generate the next steps. JSON ONLY."),
  ];
  const response = await model.invoke(messages);
  let aiOutput = response.content as string;
  console.log(`[RAW AI OUTPUT]:\n${aiOutput}`);

  let generatedPlan: string[] = [];
  try {
    aiOutput = aiOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    const startIndex = aiOutput.indexOf("[");
    const endIndex = aiOutput.lastIndexOf("]");
    
    if (startIndex !== -1 && endIndex !== -1) {
        let jsonString = aiOutput.substring(startIndex, endIndex + 1);
        generatedPlan = JSON.parse(jsonString);
    } else {
        throw new Error("No JSON brackets found");
    }
    generatedPlan = generatedPlan.map((item: any) => {
        if (typeof item === 'object') {
            return `${item.tool || item.command || "finish"} ${item.args || item.content || ""}`;
        }
        return String(item);
    });

  } catch (e) {
    console.error(`Planner parsing failed: ${(e as Error).message}`);
    generatedPlan = ["list_files"]; 
  }
  return {
    plan: generatedPlan,
    logs: [`Planner: New plan -> ${JSON.stringify(generatedPlan)}`]
  };
};
//making a new node because we want that before taking any actions which are dangerous 
//and require human approval we want to get the plan and show it to the user and ask 
// for approval before executing it
//The plan:
//1. Get the plan from the planner node
//2. Judge the plan wether it is safe to execute or not
//3. If it is safe then approve it and move to the executor node
//4. If it is not safe then reject it or take human approval and end or execute the process
// --- WORKER 3: THE GATEKEEPER --- This node checks the plan for any dangerous commands and requires approval if found.
export const approvalNode = async (state: typeof AgentState.State) => {
  console.log("[Gatekeeper] Checking plan safety...");
  const plan = state.plan;
  const validTasks = plan.filter(task => typeof task === 'string');
  
  if (validTasks.length !== plan.length) {
      console.warn("Warning: Planner generated invalid tasks (objects/nulls). Ignoring them.");
  }

  const isDangerous = validTasks.some(task => 
      task.startsWith("write_file") || 
      task.startsWith("run_git") || 
      task.startsWith("run_command")
  );

  if (isDangerous && !state.approved) {
    return {
      logs: ["PAUSED: Plan requires approval. Send request again with { approved: true }"]
    };
  }

  return {
    logs: ["Plan approved or safe. Proceeding."]
  };
};

// --- WORKER 2: THE EXECUTOR ---
export const executorNode = async (state: typeof AgentState.State) => {
const task = state.currentTask;
  if (!task) return { logs: ["Worker: No task!"] };

  console.log(`[Executor] Processing task: ${task}`);
  const taskString = typeof task === 'string' ? task : task.toString();
  const parts = taskString.split(" ");
  const command = parts[0];
  const filename = parts[1]; 
  let content = parts.slice(2).join(" "); 

  let result = "";
  try {
    if (command === "list_files") {
       result = await callFileSystem({ 
         tool: "list_files", 
         path: "." 
       });

    } else if (command === "read_file") {
       result = await callFileSystem({ 
         tool: "read_file", 
         path: filename 
       });

    } else if (command === "write_file") {
        await callFileSystem({ tool: "write_file", path: filename, content: content });
        result = `\n[ACTION] Wrote to ${filename}\n[CONTENT PREVIEW]\n${content}`;
    }
    //for git related commands such as init,add,commit etc
    else if(command==="run_git"){
        const gitCommand = parts.slice(1).join(" ");
        result = await callGit(gitCommand);
    } else if (command === "finish") {
       result = "Mission Accomplished.";
    } else {
       result = `Error: Unknown command '${command}'`;
    }
  } catch (error: any) {
    result = `Tool Error: ${error.message}`;
  }

  return {
    logs: [`Worker: Finished ${task}`] 
  };
};

// --- WORKER 4: THE REVIEWER ---
// This is the AI orchestrator that reviews the results and decides whether to 
// continue or not based on the last tool result and the logs.
// Steps for clarity:
// 1. Load the last tool result and the original user goal.(Langraph)
// 2. Decide if the plan is on track or if adjustments are needed by asking the Cohere.
// 3. If adjustments are needed, modify the plan or request human input.
// 4. If on track, approve the next step in the plan.
export const reviewerNode = async (state: typeof AgentState.State) => {
  console.log("[Reviewer] Checking the work...");
  
  const lastResult = state.lastToolResult;
  const originalGoal = state.userGoal;

  const systemPrompt = `
    You are a Senior QA Engineer.
    Goal: "${originalGoal}"
    Result: "${lastResult}"

    Does this result fully solve the goal?
    If YES, respond "APPROVED".
    If NO, explain clearly why it failed and what code is missing.
  `;

  const response = await model.invoke([new SystemMessage(systemPrompt)]);
  const feedback = response.content as string;

  console.log(`Reviewer says: ${feedback}`);

  if (feedback.includes("APPROVED")) {
    console.log("this was the output : ", lastResult);
    return { 
      logs: ["QA Approved. Mission Complete."],
      plan: ["finish"]
    };
  } else {
    return {
      logs: [`QA Rejected: ${feedback}`], 
      plan: [] 
    };
  }
};

// Next Goal:
// There would be a central manager which would decide how many and which ai agents 
// to use for a specific task and would also be responsible for the communication 
// between the agents and the tools and the user. It would also be responsible for 
// the overall orchestration of the process and would be the main entry point for 
// the user to interact with the system.
/*
1) The CEO (Manager): Takes your big goal and breaks it into small tasks. 
It assigns each task to a specific Specialist (e.g., "Researcher", "Coder", "Writer").

2) The Task Queue: A shared list of work to be done.

3) The Worker (Shapeshifter): A single node that dynamically changes its personality 
based on the task. If the CEO assigns a task to "Security Engineer," this node 
becomes a Security Engineer for that turn.

Architecture:
User input -> break the complex goal into small tasks -> push tasks into a queue 
-> Worker node pulls a task -> updates the current task and changes its role/personality 
based on the task -> executes the task -> logs the result -> 
CEO reviews the logs and assigns the next task.
*/

// --- WORKER 1: THE ARCHITECT (Breaks Goal into Tasks) ---
export const architectNode = async (state: typeof AgentState.State) => {
  const userGoal = state.userGoal;
  console.log(`[Architect] Breaking down: "${userGoal}"`);

  const systemPrompt = `
    You are a Technical Lead.
    GOAL: "${userGoal}"

    Break this goal into 3-5 EXECUTABLE CODING TASKS.
    - Each task must be a clear, single-step coding instruction.
    - Start with "Create <filename>" or "Write <filename>".
    - JSON Array of strings ONLY.

    Example: ["Create package.json", "Create server.js", "Create index.html"]
  `;

  const response = await model.invoke([new SystemMessage(systemPrompt)]);
  const aiOutput = response.content as string;
  
  // 🧹 SANITIZER: Robust JSON Parsing
  let tasks: string[] = [];
  try {
    const jsonMatch = aiOutput.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
    } else {
        // Fallback if AI fails
        tasks = [userGoal]; 
    }
  } catch (e) {
    console.error("Architect parsing failed. Defaulting to single task.");
    tasks = [userGoal];
  }

  return {
    taskQueue: tasks, 
    logs: [`Architect: Created ${tasks.length} tasks.`]
  };
};

// --- WORKER 2: THE MANAGER (Assigns Work) ---
export const managerNode = async (state: typeof AgentState.State) => {
  const queue = state.taskQueue || [];

  // 1. Check if done
  if (queue.length === 0) {
      console.log("[Manager] Queue empty. All done.");
      return { 
          currentTask: null // Signal to Graph to STOP
      }; 
  }

  // 2. Pop the next task
  const nextTask = queue[0];
  const remainingQueue = queue.slice(1);

  console.log(`[Manager] Popped task: "${nextTask}"`);

  return {
    currentTask: nextTask,
    taskQueue: remainingQueue,
    logs: [`Manager: Assigning "${nextTask}" to Worker...`]
  };
};

// --- WORKER 3: THE SMART WORKER (Writes Code + Shares Context) ---
export const workerNode = async (state: typeof AgentState.State) => {
  const task = state.currentTask;
  if (!task) return { logs: ["Worker: No task assigned."] };

  console.log(`[Worker] Working on: "${task}"...`);

  // STEP A: Ask AI to write the code
  const systemPrompt = `
    You are a Senior Developer.
    TASK: "${task}"
    
    // THE HIVE MIND: What other agents have built so far
    PREVIOUS CONTEXT:
    ${state.sharedContext || "Nothing yet. You are the first worker."}
    
    Write the code to complete your task.
    Make sure your code connects properly to the files and functions mentioned in the PREVIOUS CONTEXT.
    
    Return a JSON Array of commands to execute.
    
    TOOLS:
    - "write_file <filename> <content>"
    
    Example: ["write_file index.js console.log('hi')"]
  `;

  // 1. Call the AI
  const response = await model.invoke([new SystemMessage(systemPrompt)]);
  const aiOutput = response.content as string;

  // 2. Parse commands
  let commands: string[] = [];
  try {
      const jsonMatch = aiOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) commands = JSON.parse(jsonMatch[0]);
  } catch (e) {
      console.error("Worker parsing failed.");
  }

  // 3. Execute commands immediately
  const executionLogs = [];
  for (const cmdString of commands) {
      if (typeof cmdString !== 'string') continue;

      const firstSpace = cmdString.indexOf(" ");
      const command = firstSpace === -1 ? cmdString : cmdString.slice(0, firstSpace);
      const args = firstSpace === -1 ? "" : cmdString.slice(firstSpace + 1);

      try {
        if (command === "write_file") {
            const [file, ...rest] = args.split(" ");
            const content = rest.join(" ");
            await callFileSystem({ tool: "write_file", path: file, content });
            executionLogs.push(`[Worker] Wrote ${file}`);
        } 
      } catch (err: any) {
          executionLogs.push(`[Worker] Error: ${err.message}`);
      }
  }

  // 4. LEAVE A NOTE FOR THE NEXT AGENT
  const filesWritten = executionLogs
    .filter(log => log.includes("Wrote"))
    .join(", ");
    
  // Summarize what this worker did
  const contextUpdate = `[Task: ${task}] -> ${filesWritten || "No files written."}`;

  return {
    logs: [`Worker finished: ${task}`, ...executionLogs],
    sharedContext: contextUpdate // Appends to the Hive Mind memory
  };
};