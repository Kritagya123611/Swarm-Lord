import express from 'express';
import { createBrain } from "./agents/graph";

const app=express();
app.use(express.json());

app.post("/summon",async(req,res)=>{
    const {goal}=req.body;
    console.log(`Received goal: ${goal}`);
    //creating the brain here for the first time,
    //but we can move this outside the route handler 
    //if we want to reuse the same brain for multiple requests.
    const brain=createBrain();
    //we start the graph with the initial state containing the user goal.
    const initialState={
        userGoal: goal,
        plan: [],
        logs: [],
        lastToolResult: ""
    }
    const finalState = await brain.invoke(initialState);
    //sending the response back to the dashboard or client that made the request.
    res.json({
        message: "Goal received and being processed.",
        success:true,
        finalPlan: finalState.plan,
        logs: finalState.logs
    });
});

app.get("/",(req,res)=>{
    res.send("SwarmLord Control Plane is up and running!");
});

app.listen(3000,()=>{
    console.log("Control Plane server is listening on port 3000");
});

