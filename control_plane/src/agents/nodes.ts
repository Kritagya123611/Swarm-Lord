import {AgentState} from "./state";

//import { callFileSystem } from "../tools/fileSystem"; // Connects to your Go tool

// --- WORKER 1: THE PLANNER ---
// Responsibilities: Look at the user goal -> Create a checklist.
export const plannerNode = async (state: typeof AgentState.State) => {
  console.log("[Planner] Analyzing request...");
    const userGoal = state.userGoal || "";
  // TODO: connect this to Claude API later.
  // For now, we simulate a plan to test the loop.
  const simulatedPlan = [
    "list_files",   // Task 1: Check what files exist
    "read_readme",  // Task 2: Read the documentation
    "finish"        // Task 3: Stop
  ];

  if(userGoal.includes("bugs")){
    return{
        //returning only readfile and finish
        plan: ["read_file", "finish"],
        logs: ["Planner: Created a plan to find bugs in the codebase."]
    }
  }else if(userGoal.includes("list")){
    return{
        plan: ["list_files", "finish"],
        logs: ["Planner: Created a plan to list all files in the codebase."]
    }
  }else{
    return{
        plan:[
            "read_file",
            "list_files",
            "finish"
        ]
    }
  }
};

// --- WORKER 2: THE EXECUTOR ---
// Responsibilities: Take the first task -> Run the correct Go tool.
export const executorNode = async (state: typeof AgentState.State) => {
  // 1. Get the current task
  const currentTask = state.plan[0];
  console.log(`[Executor] Processing task: ${currentTask}`);

  let result = "";

  // 2. Route the task to the correct Tool (The Muscle)
  try {
    if (currentTask === "list_files") {
       // Make sure to uncomment this when ready!
       // result = await callFileSystem({ tool: "list_files", path: "." });
       result = "Simulated: Listing files..."; 

    } else if (currentTask === "read_file") {  // <--- CHANGED FROM "read_readme"
       
       // For this simple test, let's just read the README whenever "read_file" is asked
       // result = await callFileSystem({ tool: "read_file", path: "README.md" });
       result = "Simulated: Reading README.md...";

    } else if (currentTask === "finish") {
      result = "Mission Accomplished.";
    } else {
      result = "Error: Unknown task type.";
    }
  } catch (error: any) {
    result = `Tool Error: ${error.message || error}`;
  }

  // 3. Update the Clipboard (State)
  // We remove the current task from the plan so we don't do it twice.
  return {
    lastToolResult: result,
    logs: [`Executor: Ran '${currentTask}'`, `Output: ${result.substring(0, 50)}...`], // Log first 50 chars
    plan: state.plan.slice(1) // CRITICAL: Remove the top item from the list
  };
};