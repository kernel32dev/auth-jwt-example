import { prisma } from "../db";
import { AlreadyInGroupError, GroupAlreadyDrawnError, GroupByIdNotFoundError, NotEnoughMembersToDrawError, NotGroupOwnerError } from "./error";
import * as repository from "./4-repository";
import type { GroupSelected } from "./4-repository";

export async function listGroup(search: { message?: string }): Promise<GroupSelected[]> {
    return await repository.listGroup(search);
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
    return await repository.createGroup(user, data);
}

export async function getGroup(groupId: string): Promise<GroupSelected> {
    return await repository.getGroup(groupId);
}

export async function updateGroup(
    user: {
        id: string,
    },
    groupId: string,
    data: {
        message?: string,
        minimumExpectedPrice?: number | null,
        maximumExpectedPrice?: number | null,
    },
): Promise<GroupSelected> {
    await assertCanMutateAndIsOwnerOfGroup(groupId, user.id);
    await repository.updateGroup(groupId, data);
    return await repository.getGroup(groupId);
}

export async function deleteGroup(
    user: {
        id: string,
    },
    groupId: string,
): Promise<void> {
    await assertIsOwnerOfGroup(groupId, user.id);
    await repository.deleteGroup(groupId);
}

export async function joinGroup(
    user: {
        id: string,
    },
    groupId: string,
    data: {
        wish: string,
        presentOffered: string,
    },
): Promise<void> {
    await assertCanMutateGroup(groupId);
    if (await repository.isMember(user.id, groupId)) {
        throw new AlreadyInGroupError();
    }
    await repository.createMemberRelationship(user.id, groupId, data);
}

export async function leaveGroup(
    user: {
        id: string,
    },
    groupId: string,
): Promise<void> {
    await assertCanMutateGroup(groupId);
    await repository.deleteMember(user.id, groupId);
}

export async function drawGroup(
    user: {
        id: string,
    },
    groupId: string,
): Promise<void> {
    await assertCanMutateAndIsOwnerOfGroup(groupId, user.id);
    const memberIds = await repository.listMemberIdsOfGroup(groupId);
    if (memberIds.length < 3) throw new NotEnoughMembersToDrawError();

    const friends = Array.from(memberIds);
    do {
        for (let i = friends.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = friends[i];
            friends[i] = friends[j];
            friends[j] = temp;
        }
    } while (memberIds.some((member, index) => member == friends[index]));

    await Promise.all(memberIds.map((memberId, index) => (
        repository.updateMemberFriend(memberId, friends[index])
    )));

    await repository.updateDrawDate(groupId);
}

async function assertCanMutateGroup(groupId: string) {
    const group = await prisma.group.findUnique({
        select: {
            drawDate: true,
        },
        where: {
            id: groupId,
            deletedAt: null
        }
    });
    if (!group) throw new GroupByIdNotFoundError();
    if (group.drawDate) throw new GroupAlreadyDrawnError();
}

async function assertIsOwnerOfGroup(groupId: string, ownerId: string) {
    const group = await repository.getOwnerIdAndDrawDate(groupId);
    if (!group) throw new GroupByIdNotFoundError();
    if (group.ownerId != ownerId) throw new NotGroupOwnerError();
}

async function assertCanMutateAndIsOwnerOfGroup(groupId: string, ownerId: string) {
    const group = await repository.getOwnerIdAndDrawDate(groupId);
    if (!group) throw new GroupByIdNotFoundError();
    if (group.ownerId != ownerId) throw new NotGroupOwnerError();
    if (group.drawDate) throw new GroupAlreadyDrawnError();
}
