import cors from "cors";
import express from "express";
import 'express-async-errors';
import * as auth from "./auth";
import * as group from "./group";
import { catchApiExceptions as api } from "./error";
const port = 8080;
const app = express();
app.use(cors());

app.use(express.json({ limit: "10mb" }));

app.get("/ping", (req, res) => {
    res.send("pong");
});

app.post("/signin", api(auth.signin));
app.post("/signoff", api(auth.signoff));
app.post("/login", api(auth.login));
app.post("/refresh", api(auth.refresh));

app.get("/group", api(group.listGroup));
app.post("/group", api(group.createGroup));
app.get("/group/:group_id", api(group.getGroup));
app.put("/group/:group_id", api(group.updateGroup));
app.delete("/group/:group_id", api(group.deleteGroup));

app.post("/group/:group_id/join", api(group.joinGroup));
app.post("/group/:group_id/leave");
app.post("/group/:group_id/draw");

app.use(auth.authMiddleware);

app.post("/me", (req, res) => {
    res.json(req.user);
});

app.listen(port, () => {
    console.log(`Escutando na porta ${port}`);
});
