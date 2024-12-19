import { prisma } from "../db";

export async function userWithEmailExists(email: string): Promise<boolean> {
    return await prisma.user.count({
        where: {
            email,
            deletedAt: null
        },
    }) != 0;
}

export async function getUserByEmail(email: string): Promise<{
    id: string,
    email: string,
    name: string,
    password: string,
    passwordSalt: string,
    createdAt: Date,
    updatedAt: Date,
} | null> {
    return await prisma.user.findFirst({
        select: {
            id: true,
            email: true,
            name: true,
            password: true,
            passwordSalt: true,
            createdAt: true,
            updatedAt: true,
        },
        where: {
            email,
            deletedAt: null,
        },
    });
}

export async function deleteUser(userId: string): Promise<void> {
    console.log(userId);
    await prisma.user.update({
        data: {
            deletedAt: new Date()
        },
        where: {
            id: userId,
        },
    });
}
