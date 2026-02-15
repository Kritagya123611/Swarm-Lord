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
    
    HISTORY (What happened so far):
    ${recentLogs}
    
    INSTRUCTIONS:
    - If the history shows a "QA Rejected" error, you MUST generate a NEW plan to fix it.
    - Do not just retry the same failed step. Change the code.
    
    TOOLS:
    - "list_files"
    - "read_file <filename>"
    - "write_file <filename> <content>"
    - "run_git <command>"
    - "finish"

    Output a raw JSON array of strings.
  `;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage("Generate the next steps."),
  ];

  // Ask Cohere
  const response = await model.invoke(messages);
  const aiOutput = response.content as string;
  
  // Clean JSON
  const cleanJson = aiOutput.replace(/```json|```/g, "").trim();
  let generatedPlan: string[] = [];
  try {
    generatedPlan = JSON.parse(cleanJson);
  } catch (e) {
    generatedPlan = ["finish"];
  }

  return {
    plan: generatedPlan,
    logs: [`Planner: Updated plan based on feedback.`]
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
    lastToolResult: result,
    logs: [`Executor: Ran '${command}' on '${filename}'`, `Output: ${result.substring(0, 50)}...`],
    plan: state.plan.slice(1)
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