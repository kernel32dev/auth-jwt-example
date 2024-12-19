import { AlreadyInGroupError, GroupAlreadyDrawnError, GroupByIdNotFoundError, GroupNotDrawnError, NotEnoughMembersToDrawError, NotGroupOwnerError } from "./error";
import { GroupSelected } from "../db";
import { repository as defaultRepository } from "./4-repository";

//#region dependencies
export interface ListGroupRepository {
    (search: { message?: string }): Promise<GroupSelected[]>
}
export interface CreateGroupRepository {
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
export interface GetGroupRepository {
    (groupId: string): Promise<GroupSelected>
}
export interface UpdateGroupRepository {
    (
        groupId: string,
        data: {
            message?: string,
            minimumExpectedPrice?: number | null,
            maximumExpectedPrice?: number | null,
        },
    ): Promise<void>
}
export interface DeleteGroupRepository {
    (groupId: string): Promise<void>
}
export interface IsMemberRepository {
    (userId: string, groupId: string): Promise<boolean>
}
export interface CreateMemberRelationshipRepository {
    (
        userId: string,
        groupId: string,
        data: {
            wish: string,
            presentOffered: string,
        },
    ): Promise<void>
}
export interface DeleteMemberRepository {
    (userId: string, groupId: string): Promise<void>
}
export interface ListMemberIdsOfGroupRepository {
    (groupId: string): Promise<string[]>
}
export interface UpdateMemberFriendRepository {
    (friendId: string, memberId: string): Promise<void>
}
export interface UpdateDrawDateRepository {
    (groupId: string): Promise<void>
}
export interface GetOwnerIdAndDrawDateRepository {
    (groupId: string): Promise<{ drawDate: Date | null; ownerId: string; }>
}
export interface GetFriendPresentOfMemberRepository {
    (userId: string, groupId: string): Promise<string | null>
}
//#endregion

export function service(repository: {
    listGroup: ListGroupRepository,
    createGroup: CreateGroupRepository,
    getGroup: GetGroupRepository,
    updateGroup: UpdateGroupRepository,
    deleteGroup: DeleteGroupRepository,
    isMember: IsMemberRepository,
    createMemberRelationship: CreateMemberRelationshipRepository,
    deleteMember: DeleteMemberRepository,
    listMemberIdsOfGroup: ListMemberIdsOfGroupRepository,
    updateMemberFriend: UpdateMemberFriendRepository,
    updateDrawDate: UpdateDrawDateRepository,
    getOwnerIdAndDrawDate: GetOwnerIdAndDrawDateRepository,
    getFriendPresentOfMember: GetFriendPresentOfMemberRepository
} = defaultRepository) {
    return {
        listGroup: listGroup.bind(null, repository.listGroup),
        createGroup: createGroup.bind(null, repository.createGroup),
        getGroup: getGroup.bind(null, repository.getGroup),
        updateGroup: updateGroup.bind(null, repository.getOwnerIdAndDrawDate, repository.updateDrawDate, repository.getGroup),
        deleteGroup: deleteGroup.bind(null, repository.getOwnerIdAndDrawDate, repository.deleteGroup),
        getPresent: getPresent.bind(null, repository.getFriendPresentOfMember),
        joinGroup: joinGroup.bind(null, repository.getOwnerIdAndDrawDate, repository.isMember, repository.createMemberRelationship),
        leaveGroup: leaveGroup.bind(null, repository.getOwnerIdAndDrawDate, repository.deleteMember),
        drawGroup: drawGroup.bind(null, repository.getOwnerIdAndDrawDate, repository.listMemberIdsOfGroup, repository.updateMemberFriend, repository.updateDrawDate),
    }
}

export async function listGroup(listGroup: ListGroupRepository, search: { message?: string }): Promise<GroupSelected[]> {
    return await listGroup(search);
}

export async function createGroup(
    createGroup: CreateGroupRepository,
    user: {
        id: string,
    },
    data: {
        message: string,
        minimumExpectedPrice: number | null,
        maximumExpectedPrice: number | null,
    },
): Promise<GroupSelected> {
    return await createGroup(user, data);
}

export async function getGroup(getGroup: GetGroupRepository, groupId: string): Promise<GroupSelected> {
    return await getGroup(groupId);
}

export async function updateGroup(
    getOwnerIdAndDrawDate: GetOwnerIdAndDrawDateRepository,
    updateGroup: UpdateGroupRepository,
    getGroup: GetGroupRepository,
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
    const { drawDate, ownerId } = await getOwnerIdAndDrawDate(groupId);
    if (drawDate) throw new GroupAlreadyDrawnError();
    if (ownerId != user.id) throw new NotGroupOwnerError();
    await updateGroup(groupId, data);
    return await getGroup(groupId);
}

export async function deleteGroup(
    getOwnerIdAndDrawDate: GetOwnerIdAndDrawDateRepository,
    deleteGroup: DeleteGroupRepository,
    user: {
        id: string,
    },
    groupId: string,
): Promise<void> {
    const { ownerId } = await getOwnerIdAndDrawDate(groupId);
    if (ownerId != user.id) throw new NotGroupOwnerError();
    await deleteGroup(groupId);
}

export async function getPresent(
    getFriendPresentOfMember: GetFriendPresentOfMemberRepository,
    user: {
        id: string,
    },
    groupId: string,
): Promise<string> {
    const present = await getFriendPresentOfMember(user.id, groupId);
    if (present === null) throw new GroupNotDrawnError();
    return present;
}

export async function joinGroup(
    getOwnerIdAndDrawDate: GetOwnerIdAndDrawDateRepository,
    isMember: IsMemberRepository,
    createMemberRelationship: CreateMemberRelationshipRepository,
    user: {
        id: string,
    },
    groupId: string,
    data: {
        wish: string,
        presentOffered: string,
    },
): Promise<void> {
    const { drawDate } = await getOwnerIdAndDrawDate(groupId);
    if (drawDate) throw new GroupAlreadyDrawnError();
    if (await isMember(user.id, groupId)) {
        throw new AlreadyInGroupError();
    }
    await createMemberRelationship(user.id, groupId, data);
}

export async function leaveGroup(
    getOwnerIdAndDrawDate: GetOwnerIdAndDrawDateRepository,
    deleteMember: DeleteMemberRepository,
    user: {
        id: string,
    },
    groupId: string,
): Promise<void> {
    const { drawDate } = await getOwnerIdAndDrawDate(groupId);
    if (drawDate) throw new GroupAlreadyDrawnError();
    await deleteMember(user.id, groupId);
}

export async function drawGroup(
    getOwnerIdAndDrawDate: GetOwnerIdAndDrawDateRepository,
    listMemberIdsOfGroup: ListMemberIdsOfGroupRepository,
    updateMemberFriend: UpdateMemberFriendRepository,
    updateDrawDate: UpdateDrawDateRepository,
    user: {
        id: string,
    },
    groupId: string,
): Promise<void> {
    const { drawDate, ownerId } = await getOwnerIdAndDrawDate(groupId);
    if (drawDate) throw new GroupAlreadyDrawnError();
    if (ownerId != user.id) throw new NotGroupOwnerError();
    const memberIds = await listMemberIdsOfGroup(groupId);
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
        updateMemberFriend(memberId, friends[index])
    )));

    await updateDrawDate(groupId);
}
