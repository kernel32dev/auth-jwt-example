import { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../utils";
import * as service from "./3-service";

export async function listGroup(req: Request, res: Response) {
    const query = validate(req.query, z.object({
        message: z.string().optional(),
    }));
    res.json(await service.listGroup(query));
}

export async function createGroup(req: Request, res: Response) {
    const body = validate(req.body, z.object({
        message: z.string(),
        minimumExpectedPrice: z.number().nullable(),
        maximumExpectedPrice: z.number().nullable(),
    }));
    res.json(await service.createGroup(req.user, body));
}

export async function getGroup(req: Request<{ group_id: string }>, res: Response) {
    res.json(await service.getGroup(req.params.group_id));
}

export async function updateGroup(req: Request<{ group_id: string }>, res: Response) {
    const body = validate(req.body, z.object({
        message: z.string().optional(),
        minimumExpectedPrice: z.number().nullable().optional(),
        maximumExpectedPrice: z.number().nullable().optional(),
    }));
    res.json(await service.updateGroup(req.user, req.params.group_id, body));
}

export async function deleteGroup(req: Request<{ group_id: string }>, res: Response) {
    await service.deleteGroup(req.user, req.params.group_id);
    res.json({});
}

export async function joinGroup(req: Request<{ group_id: string }>, res: Response) {
    const body = validate(req.body, z.object({
        wish: z.string(),
        presentOffered: z.string(),
    }));
    await service.joinGroup(req.user, req.params.group_id, body);
    res.json({});
}

export async function leaveGroup(req: Request<{ group_id: string }>, res: Response) {
    await service.leaveGroup(req.user, req.params.group_id);
    res.json({});
}

export async function drawGroup(req: Request<{ group_id: string }>, res: Response) {
    await service.drawGroup(req.user, req.params.group_id);
    res.json({});
}
