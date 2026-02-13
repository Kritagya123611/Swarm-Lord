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
  console.log("[Planner] Asking Cohere to generate a plan...");
  const userGoal = state.userGoal;
  const systemPrompt = `
You are a Senior DevOps Engineer.
Your job is to break down a user's request into executable steps.

You can ONLY use these tools:
- "list_files": Scans the directory.
- "read_file <filename>": Reads a file.
- "write_file <filename> <content>": Creates/updates a file.
- "run_git <command>": Runs a git command. (Example: "run_git init", "run_git add .", "run_git commit -m 'msg'")
- "finish": Ends the mission.

IMPORTANT: Return ONLY a raw JSON array.
Example: ["write_file app.ts console.log('hi')", "run_git add .", "run_git commit -m 'feat: add app'", "finish"]
`;
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userGoal),
  ];

  // Ask Cohere
  const response = await model.invoke(messages);
  const aiOutput = response.content as string;
  
  console.log("Cohere says:", aiOutput);
  const cleanJson = aiOutput.replace(/```json|```/g, "").trim();

  let generatedPlan: string[] = [];
  try {
    generatedPlan = JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse AI plan. Falling back to default.");
    generatedPlan = ["list_files", "finish"]; 
  }

  return {
    plan: generatedPlan,
    logs: [`Planner: Generated plan via Cohere: ${JSON.stringify(generatedPlan)}`]
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
// --- WORKER 3: THE GATEKEEPER ---
export const approvalNode = async (state: typeof AgentState.State) => {
  console.log("[Gatekeeper] Checking plan safety...");
  
  const plan = state.plan;
  const isDangerous = plan.some(task => task.startsWith("write_file") || task.startsWith("run_git"));
  if (isDangerous && !state.approved) {
    console.log("STOP: Plan requires human approval.");
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
  const currentTaskString = state.plan[0]; 
  console.log(`[Executor] Processing task: ${currentTaskString}`);
  const parts = currentTaskString.split(" ");
  const command = parts[0];
  const filename = parts[1]; 
  const content = parts.slice(2).join(" "); 

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
       result = await callFileSystem({ 
         tool: "write_file", 
         path: filename, 
         content: content 
       });
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
    lastToolResult: result,
    logs: [`Executor: Ran '${command}' on '${filename}'`, `Output: ${result.substring(0, 50)}...`],
    plan: state.plan.slice(1)
  };
};