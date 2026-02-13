import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { plannerNode, executorNode, approvalNode } from "./nodes"; 

function shouldContinue(state: typeof AgentState.State) {
  if (!state.plan || state.plan.length === 0) return "end";
  if (state.plan[0] === "finish") return "end";
  return "executor";
}

function checkSafety(state: typeof AgentState.State) {
  const lastLog = state.logs[state.logs.length - 1];
  if (lastLog && lastLog.includes("PAUSED")) {
    return "end"; 
  }
  return "executor";
}

export const createBrain = () => {
  const builder = new StateGraph(AgentState)
    .addNode("planner", plannerNode)
    .addNode("gatekeeper", approvalNode) 
    .addNode("executor", executorNode)
    .addEdge(START, "planner")
    .addEdge("planner", "gatekeeper")
    .addConditionalEdges("gatekeeper", checkSafety, {
      executor: "executor",
      end: END
    })
    .addConditionalEdges("executor", shouldContinue, {
      executor: "executor",
      end: END
    });
  return builder.compile();
};