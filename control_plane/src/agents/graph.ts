import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { plannerNode, executorNode, approvalNode, reviewerNode,workerNode,managerNode,architectNode} from "./nodes"; 

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
  const workflow = new StateGraph(AgentState)
    .addNode("architect", architectNode)
    .addNode("manager", managerNode)
    .addNode("worker", workerNode)

    // 1. Start -> Architect (Build the Queue)
    .addEdge(START, "architect")

    // 2. Architect -> Manager (Start the Loop)
    .addEdge("architect", "manager")

    // 3. Manager -> Decision (Worker or End?)
    .addConditionalEdges("manager", (state) => {
        if (!state.currentTask) return END; // Queue was empty
        return "worker"; // Found a task? Go work.
    })

    // 4. Worker -> Manager (Loop back to Pop the next one!)
    .addEdge("worker", "manager");
    return workflow.compile();
};