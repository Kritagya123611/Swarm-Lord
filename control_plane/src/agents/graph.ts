import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { plannerNode, executorNode } from "./nodes";

// THE TRAFFIC COP (Router Logic)
// This function runs after the Executor finishes a task.
// It checks the plan to decide: "Do we keep working, or are we done?"
function shouldContinue(state: typeof AgentState.State) {
  
  // 1. If the plan is empty, we have nothing left to do.
  if (!state.plan || state.plan.length === 0) {
    return "end"; // Go to END
  }

  // 2. If the Planner explicitly wrote "finish" as a step, we stop.
  const nextStep = state.plan[0];
  if (nextStep === "finish") {
    return "end";
  }

  // 3. Otherwise, loop back to the Executor to do the next step.
  return "executor";
}

// THE BRAIN ASSEMBLY
export const createBrain = () => {
  // Initialize the graph with our "Clipboard" (AgentState)
  const builder = new StateGraph(AgentState)

    // --- 1. HIRE THE WORKERS (Add Nodes) ---
    .addNode("planner", plannerNode)
    .addNode("executor", executorNode)

    // --- 2. DEFINE THE FLOW (Add Edges) ---
    
    // START -> Planner
    // (When the app starts, the Planner goes first)
    .addEdge(START, "planner")

    // Planner -> Executor
    // (Once the plan is written, hand it to the Executor)
    .addEdge("planner", "executor")

    // --- 3. DEFINE THE LOOP (Conditional Edge) ---
    // After Executor, we ask 'shouldContinue':
    // - If it returns "executor", we loop back.
    // - If it returns "end", we stop.
    .addConditionalEdges("executor", shouldContinue, {
      executor: "executor",
      end: END
    });

  // --- 4. COMPILE & EXPORT ---
  return builder.compile();
};