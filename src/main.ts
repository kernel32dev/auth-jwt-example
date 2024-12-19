import cors from "cors";
import express from "express";
import * as auth from "./auth";
import * as group from "./group";
import { catchApiExceptions } from "./error";

const port = 8080;
const app = express();

app.use(cors());
app.get("/ping", (req, res) => {
    res.send("pong");
});
app.use(express.json({ limit: "10mb" }));
app.use(auth.routes.routes());
app.use(catchApiExceptions(auth.controller.middleware()));
app.get("/me", (req, res) => {
    res.json(req.user);
});
app.use(group.routes.routes());

app.listen(port, () => {
    console.log(`Escutando na porta ${port}`);
});
