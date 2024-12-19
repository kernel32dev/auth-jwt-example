import { Request, Response } from "express";
import { z } from "zod";
import { CONFLICT, FORBIDDEN, NOT_FOUND, validate } from "./utils";
import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import { AppError } from "./error";

export const groupSelect = {
    id: true,
    drawDate: true,
    owner: {
        select: {
            id: true,
            name: true,
        },
    },
    message: true,
    maximumExpectedPrice: true,
    minimumExpectedPrice: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.GroupSelect;

export async function listGroup(req: Request, res: Response) {
    const query = validate(req.query, z.object({
        message: z.string().optional(),
    }));
    res.json(await prisma.group.findMany({
        select: groupSelect,
        where: {
            message: query.message,
            deletedAt: null
        },
    }));
}

export async function createGroup(req: Request, res: Response) {
    const body = validate(req.body, z.object({
        message: z.string(),
        minimumExpectedPrice: z.number().nullable(),
        maximumExpectedPrice: z.number().nullable(),
    }));
    res.json(await prisma.group.create({
        select: groupSelect,
        data: {
            ownerId: req.user.id,
            message: body.message,
            minimumExpectedPrice: body.minimumExpectedPrice,
            maximumExpectedPrice: body.maximumExpectedPrice,
        }
    }));
}

export async function getGroup(req: Request<{ group_id: string }>, res: Response) {
    const group = await prisma.group.findUnique({
        select: groupSelect,
        where: {
            id: req.params.group_id,
            deletedAt: null
        },
    });
    if (!group) throw new GroupByIdNotFoundError();
    res.json(group);
}

export async function updateGroup(req: Request<{ group_id: string }>, res: Response) {
    const body = validate(req.body, z.object({
        message: z.string().optional(),
        minimumExpectedPrice: z.number().nullable().optional(),
        maximumExpectedPrice: z.number().nullable().optional(),
    }));
    await assertCanMutateGroup(req.params.group_id, req.user.id);
    const { count } = await prisma.group.updateMany({
        data: body,
        where: {
            id: req.params.group_id,
            deletedAt: null
        },
    });
    if (count == 0) throw new GroupByIdNotFoundError();
}

export async function deleteGroup(req: Request<{ group_id: string }>, res: Response) {
    const { count } = await prisma.group.updateMany({
        data: {
            deletedAt: new Date()
        },
        where: {
            id: req.params.group_id,
            ownerId: req.user.id,
            deletedAt: null
        },
    });
    if (count == 0) {
        const count = await prisma.group.count({
            where: {
                id: req.params.group_id,
                deletedAt: null
            }
        });
        if (count == 0) {
            throw new GroupByIdNotFoundError();
        } else {
            throw new NotGroupOwnerError();
        }
    }
    res.json({});
}

export async function joinGroup(req: Request<{ group_id: string }>, res: Response) {
    const body = validate(req.body, z.object({
        wish: z.string(),
        presentOffered: z.string(),
    }));
    await assertCanMutateGroup(req.params.group_id);
    if (await prisma.member.count({
        where: {
            userId: req.user.id,
            groupId: req.params.group_id,
            deletedAt: null
        }
    })) {
        throw new AlreadyInGroupError();
    }
    await prisma.member.create({
        select: {},
        data: {
            userId: req.user.id,
            groupId: req.params.group_id,
            wish: body.wish,
            presentOffered: body.presentOffered,
        }
    });
    res.json({});
}

export async function leaveGroup(req: Request<{ group_id: string }>, res: Response) {
    await assertCanMutateGroup(req.params.group_id);
    const { count } = await prisma.member.updateMany({
        data: {
            deletedAt: null
        },
        where: {
            userId: req.user.id,
            groupId: req.params.group_id,
            deletedAt: null
        }
    });
    if (count == 0) throw new NotInGroupError();
    res.json({});
}

export async function drawGroup(req: Request<{ group_id: string }>, res: Response) {
    await assertCanMutateGroup(req.params.group_id, req.user.id);

    const members = await prisma.member.findMany({
        select: {
            id: true,
        },
        where: {
            groupId: req.params.group_id,
            deletedAt: null
        }
    }).then(members => members.map(member => member.id));
    if (members.length < 3) throw new NotEnoughMembersToDrawError();

    const friends = chooseFriends(members);

    await Promise.all(members.map((member, index) => (
        prisma.member.update({
            data: {
                friendId: friends[index],
            },
            where: {
                id: member,
            }
        })
    )));

    await prisma.group.update({
        select: {},
        data: {
            drawDate: new Date(),
        },
        where: {
            id: req.params.group_id,
        }
    });
    res.json();
}

async function assertCanMutateGroup(groupId: string, ownerId?: string) {
    const group = await prisma.group.findUnique({
        select: {
            drawDate: true,
            ownerId: !ownerId,
        },
        where: {
            id: groupId,
            deletedAt: null
        }
    });
    if (!group) throw new GroupByIdNotFoundError();
    if (ownerId && group.ownerId != ownerId) throw new NotGroupOwnerError();
    if (group.drawDate) throw new GroupAlreadyDrawnError();
}

function chooseFriends(members: readonly string[]): string[] {
    const friends = Array.from(members);
    do {
        for (let i = friends.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = friends[i];
            friends[i] = friends[j];
            friends[j] = temp;
        }
    } while (members.some((member, index) => member == friends[index]));
    return friends;
}

class GroupByIdNotFoundError extends AppError {
    constructor(description?: string) {
        super(NOT_FOUND, "GroupByIdNotFound", description);
    }
}

class NotGroupOwnerError extends AppError {
    constructor(description?: string) {
        super(FORBIDDEN, "NotGroupOwnerError", description);
    }
}

class GroupAlreadyDrawnError extends AppError {
    constructor(description?: string) {
        super(CONFLICT, "GroupAlreadyDrawnError", description);
    }
}

class AlreadyInGroupError extends AppError {
    constructor(description?: string) {
        super(CONFLICT, "AlreadyInGroupError", description);
    }
}

class NotInGroupError extends AppError {
    constructor(description?: string) {
        super(CONFLICT, "NotInGroupError", description);
    }
}

class NotEnoughMembersToDrawError extends AppError {
    constructor(description?: string) {
        super(CONFLICT, "NotEnoughMembersToDrawError", description);
    }
}
