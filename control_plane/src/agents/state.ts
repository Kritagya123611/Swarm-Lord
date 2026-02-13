import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  userGoal: Annotation<string>,

  plan: Annotation<string[]>,

  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y), 
  }),

  lastToolResult: Annotation<string>,
  approved: Annotation<boolean>()
});

