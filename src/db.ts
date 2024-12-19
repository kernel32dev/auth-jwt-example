import { Prisma, PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

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
