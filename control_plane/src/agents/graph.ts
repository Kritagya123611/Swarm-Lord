import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { plannerNode, executorNode } from "./nodes";

function shouldContinue(state: typeof AgentState.State) {
  if (!state.plan || state.plan.length === 0) {
    return "end"; 
  }
  const nextStep = state.plan[0];
  if (nextStep === "finish") {
    return "end";
  }
  return "executor";
}

export const createBrain = () => {
  const builder = new StateGraph(AgentState)
    .addNode("planner", plannerNode)
    .addNode("executor", executorNode)
    .addEdge(START, "planner")
    .addEdge("planner", "executor")
    .addConditionalEdges("executor", shouldContinue, {
      executor: "executor",
      end: END
    });
  return builder.compile();
};