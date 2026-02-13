import express from 'express';
import { createBrain } from "./agents/graph";

const app = express();
app.use(express.json());

app.post("/summon", async (req, res) => {
    const { goal, approved } = req.body; 
    console.log(`Received goal: ${goal} | Approved: ${approved}`);
    const brain = createBrain();
    const initialState = {
        userGoal: goal,
        plan: [],
        logs: [],
        lastToolResult: "",
        approved: approved || false 
    };
    const finalState = await brain.invoke(initialState);
    res.json({
        message: "Goal processed.",
        success: true,
        finalPlan: finalState.plan,
        logs: finalState.logs
    });
});

app.get("/", (req, res) => {
    res.send("SwarmLord Control Plane is up and running!");
});

app.listen(3000, () => {
    console.log("Control Plane server is listening on port 3000");
});