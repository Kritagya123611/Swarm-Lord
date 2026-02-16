import { Annotation } from "@langchain/langgraph";

// Define a Task structure
export type AgentTask = {
  role: string;      // e.g., "Backend Dev", "Security Analyst"
  instruction: string; // e.g., "Write the API", "Check for bugs"
  status: "pending" | "complete";
};

export const AgentState = Annotation.Root({
  userGoal: Annotation<string>(),

  taskQueue: Annotation<AgentTask[]>({
    reducer: (current, update) => {
        return update || current; 
    },
  }),

  currentTask: Annotation<AgentTask | null>(),

  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),

  plan: Annotation<string[]>(), 
  lastToolResult: Annotation<string>(),
  approved: Annotation<boolean>(),
});