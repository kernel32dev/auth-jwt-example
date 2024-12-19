import { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../utils";
import { GroupSelected } from "../db";
import { service as defaultService } from "./3-service";

//#region dependencies
export interface ListGroupService {
    (search: { message?: string }): Promise<GroupSelected[]>
}
export interface CreateGroupService {
    (
        user: {
            id: string,
        },
        data: {
            message: string,
            minimumExpectedPrice: number | null,
            maximumExpectedPrice: number | null,
        },
    ): Promise<GroupSelected>
}
export interface GetGroupService {
    (groupId: string): Promise<GroupSelected>
}
export interface UpdateGroupService {
    (
        user: {
            id: string,
        },
        groupId: string,
        data: {
            message?: string,
            minimumExpectedPrice?: number | null,
            maximumExpectedPrice?: number | null,
        },
    ): Promise<GroupSelected>
}
export interface DeleteGroupService {
    (
        user: {
            id: string,
        },
        groupId: string,
    ): Promise<void>
}
export interface GetPresentService {
    (
        user: {
            id: string,
        },
        groupId: string,
    ): Promise<string>
}
export interface JoinGroupService {
    (
        user: {
            id: string,
        },
        groupId: string,
        data: {
            wish: string,
            presentOffered: string,
        },
    ): Promise<void>
}
export interface LeaveGroupService {
    (
        user: {
            id: string,
        },
        groupId: string,
    ): Promise<void>
}
export interface DrawGroupService {
    (
        user: {
            id: string,
        },
        groupId: string,
    ): Promise<void>
}
//#endregion

export function controller(service: {
    listGroup: ListGroupService,
    createGroup: CreateGroupService,
    getGroup: GetGroupService,
    updateGroup: UpdateGroupService,
    deleteGroup: DeleteGroupService,
    getPresent: GetPresentService,
    joinGroup: JoinGroupService,
    leaveGroup: LeaveGroupService,
    drawGroup: DrawGroupService,
} = defaultService()) {
    return {
        listGroup: listGroup.bind(null, service.listGroup),
        createGroup: createGroup.bind(null, service.createGroup),
        getGroup: getGroup.bind(null, service.getGroup),
        updateGroup: updateGroup.bind(null, service.updateGroup),
        deleteGroup: deleteGroup.bind(null, service.deleteGroup),
        getPresent: getPresent.bind(null, service.getPresent),
        joinGroup: joinGroup.bind(null, service.joinGroup),
        leaveGroup: leaveGroup.bind(null, service.leaveGroup),
        drawGroup: drawGroup.bind(null, service.drawGroup),
    };
}

export async function listGroup(listGroup: ListGroupService, req: Request, res: Response) {
    const query = validate(req.query, z.object({
        message: z.string().optional(),
    }));
    res.json(await listGroup(query));
}

export async function createGroup(createGroup: CreateGroupService, req: Request, res: Response) {
    const body = validate(req.body, z.object({
        message: z.string(),
        minimumExpectedPrice: z.number().nullable(),
        maximumExpectedPrice: z.number().nullable(),
    }));
    res.json(await createGroup(req.user, body));
}

export async function getGroup(getGroup: GetGroupService, req: Request<{ group_id: string }>, res: Response) {
    res.json(await getGroup(req.params.group_id));
}

export async function updateGroup(updateGroup: UpdateGroupService, req: Request<{ group_id: string }>, res: Response) {
    const body = validate(req.body, z.object({
        message: z.string().optional(),
        minimumExpectedPrice: z.number().nullable().optional(),
        maximumExpectedPrice: z.number().nullable().optional(),
    }));
    res.json(await updateGroup(req.user, req.params.group_id, body));
}

export async function deleteGroup(deleteGroup: DeleteGroupService, req: Request<{ group_id: string }>, res: Response) {
    await deleteGroup(req.user, req.params.group_id);
    res.json({});
}

export async function getPresent(getFriendGroup: GetPresentService, req: Request<{ group_id: string }>, res: Response) {
    res.json(await getFriendGroup(req.user, req.params.group_id));
}

export async function joinGroup(joinGroup: JoinGroupService, req: Request<{ group_id: string }>, res: Response) {
    const body = validate(req.body, z.object({
        wish: z.string(),
        presentOffered: z.string(),
    }));
    await joinGroup(req.user, req.params.group_id, body);
    res.json({});
}

export async function leaveGroup(leaveGroup: LeaveGroupService, req: Request<{ group_id: string }>, res: Response) {
    await leaveGroup(req.user, req.params.group_id);
    res.json({});
}

export async function drawGroup(drawGroup: DrawGroupService, req: Request<{ group_id: string }>, res: Response) {
    await drawGroup(req.user, req.params.group_id);
    res.json({});
}
