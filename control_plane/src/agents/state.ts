import { Annotation } from "@langchain/langgraph";

// This is the "Shared Brain" of the Swarm.
// Every agent can read and write to this object.
export const AgentState = Annotation.Root({
  // 1. The Goal: What the user wants to do
  userGoal: Annotation<string>,

  // 2. The Plan: A list of tasks to complete
  plan: Annotation<string[]>,

  // 3. The Logs: A history of actions (for the UI)
  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y), // Append new logs to old ones
  }),

  // 4. The Last Result: Output from the last tool execution
  lastToolResult: Annotation<string>,
});

//export const userGoal = AgentState.userGoal;
