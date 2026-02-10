import { AgentState } from "./state";
import { ChatCohere } from "@langchain/cohere";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
import { callFileSystem } from "../tools/fileSystem";

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
You are a Senior Software Engineer.
Your job is to break down a user's request into a list of executable steps.

You can ONLY use these tools:
- "list_files": Scans the directory.
- "read_file <filename>": Reads a specific file.
- "write_file <filename> <content>": Creates or updates a file. (Example: "write_file test.txt hello world")
- "finish": Ends the mission.

IMPORTANT: Return ONLY a raw JSON array of strings.
Example: ["list_files", "write_file test.txt hello world", "finish"]
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