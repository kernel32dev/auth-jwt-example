import { Router } from "express";
import { login, refresh, signin, signoff } from "./2-controller";
import { catchApiExceptions as api } from "../error";

export const routes = Router();

routes.get("/ping", (req, res) => {
    res.send("pong");
});

routes.post("/signin", api(signin));
routes.post("/signoff", api(signoff));
routes.post("/login", api(login));
routes.post("/refresh", api(refresh));
