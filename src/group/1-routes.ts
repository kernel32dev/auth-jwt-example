import { Router } from "express";
import { catchApiExceptions as api } from "../error";
import { createGroup, deleteGroup, drawGroup, getGroup, joinGroup, leaveGroup, listGroup, updateGroup } from "./2-controller";

export const routes = Router();

routes.post("/me", (req, res) => {
    res.json(req.user);
});

routes.get("/group", api(listGroup));
routes.post("/group", api(createGroup));
routes.get("/group/:group_id", api(getGroup));
routes.put("/group/:group_id", api(updateGroup));
routes.delete("/group/:group_id", api(deleteGroup));

routes.post("/group/:group_id/join", api(joinGroup));
routes.post("/group/:group_id/leave", api(leaveGroup));
routes.post("/group/:group_id/draw", api(drawGroup));

