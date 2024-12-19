import { Router, Request, Response } from "express";
import { catchApiExceptions as api } from "../error";

//#region dependencies
export interface Controller {
    (req: Request, res: Response): Promise<void>;
}
export interface ControllerWithGroupId {
    (req: Request<{ group_id: string }>, res: Response): Promise<void>;
}
//#endregion

export function routes(
    listGroup: Controller,
    createGroup: Controller,
    getGroup: ControllerWithGroupId,
    updateGroup: ControllerWithGroupId,
    deleteGroup: ControllerWithGroupId,
    joinGroup: ControllerWithGroupId,
    leaveGroup: ControllerWithGroupId,
    drawGroup: ControllerWithGroupId,
) {
    const routes = Router();

    routes.get("/group", api(listGroup));
    routes.post("/group", api(createGroup));
    routes.get("/group/:group_id", api(getGroup));
    routes.put("/group/:group_id", api(updateGroup));
    routes.delete("/group/:group_id", api(deleteGroup));

    routes.post("/group/:group_id/join", api(joinGroup));
    routes.post("/group/:group_id/leave", api(leaveGroup));
    routes.post("/group/:group_id/draw", api(drawGroup));

    return routes;
}
