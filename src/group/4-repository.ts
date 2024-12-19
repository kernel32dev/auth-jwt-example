import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { GroupByIdNotFoundError, NotInGroupError } from "./error";

export const groupSelect = {
    id: true,
    drawDate: true,
    owner: {
        select: {
            name: true,
        },
    },
    members: {
        select: {
            user: {
                select: {
                    name: true,
                },
            },
        },
        where: {
            deletedAt: null
        },
    },
    message: true,
    maximumExpectedPrice: true,
    minimumExpectedPrice: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.GroupSelect;

export type GroupSelected = {
    id: string,
    drawDate: Date | null,
    owner: {
        name: string,
    },
    members: {
        user: {
            name: string,
        },
    }[],
    message: string,
    maximumExpectedPrice: number | null,
    minimumExpectedPrice: number | null,
    createdAt: Date,
    updatedAt: Date,
};

export async function listGroup(search: { message?: string }): Promise<GroupSelected[]> {
    return await prisma.group.findMany({
        select: groupSelect,
        where: {
            message: search.message,
            deletedAt: null
        },
    });
}

export async function createGroup(
    user: {
        id: string,
    },
    data: {
        message: string,
        minimumExpectedPrice: number | null,
        maximumExpectedPrice: number | null,
    },
): Promise<GroupSelected> {
    return await prisma.group.create({
        select: groupSelect,
        data: {
            ownerId: user.id,
            message: data.message,
            minimumExpectedPrice: data.minimumExpectedPrice,
            maximumExpectedPrice: data.maximumExpectedPrice,
        }
    });
}

export async function getGroup(groupId: string): Promise<GroupSelected> {
    const group = await prisma.group.findUnique({
        select: groupSelect,
        where: {
            id: groupId,
            deletedAt: null
        },
    });
    if (!group) throw new GroupByIdNotFoundError();
    return group;
}

export async function updateGroup(
    groupId: string,
    data: {
        message?: string,
        minimumExpectedPrice?: number | null,
        maximumExpectedPrice?: number | null,
    },
): Promise<void> {
    const { count } = await prisma.group.updateMany({
        data,
        where: {
            id: groupId,
            deletedAt: null
        },
    });
    if (count == 0) throw new GroupByIdNotFoundError();
}

export async function deleteGroup(
    groupId: string,
): Promise<void> {
    const { count } = await prisma.group.updateMany({
        data: {
            deletedAt: new Date()
        },
        where: {
            id: groupId,
            deletedAt: null
        },
    });
    if (count == 0) throw new GroupByIdNotFoundError();
}

export async function isMember(userId: string, groupId: string): Promise<boolean> {
    return await prisma.member.count({
        where: {
            userId: userId,
            groupId,
            deletedAt: null
        }
    }) != 0;
}

export async function createMemberRelationship(
    userId: string,
    groupId: string,
    data: {
        wish: string,
        presentOffered: string,
    },
): Promise<void> {
    await prisma.member.create({
        select: {},
        data: {
            userId,
            groupId,
            wish: data.wish,
            presentOffered: data.presentOffered,
        }
    });
}

export async function deleteMember(userId: string, groupId: string): Promise<void> {
    const { count } = await prisma.member.updateMany({
        data: {
            deletedAt: null
        },
        where: {
            userId,
            groupId,
            deletedAt: null
        }
    });
    if (count == 0) throw new NotInGroupError();
}

export async function listMemberIdsOfGroup(groupId: string): Promise<string[]> {
    const members = await prisma.member.findMany({
        select: {
            id: true,
        },
        where: {
            groupId: groupId,
            deletedAt: null
        }
    });
    return members.map(x => x.id);
}

export async function updateMemberFriend(friendId: string, memberId: string): Promise<void> {
    await prisma.member.update({
        data: {
            friendId: friendId,
        },
        where: {
            id: memberId,
        }
    });
}

export async function updateDrawDate(groupId: string): Promise<void> {
    await prisma.group.update({
        select: {},
        data: {
            drawDate: new Date(),
        },
        where: {
            id: groupId,
        }
    });
}

export async function getOwnerIdAndDrawDate(groupId: string): Promise<{ drawDate: Date | null; ownerId: string; } | null> {
    return await prisma.group.findUnique({
        select: {
            drawDate: true,
            ownerId: true,
        },
        where: {
            id: groupId,
            deletedAt: null
        }
    });
}