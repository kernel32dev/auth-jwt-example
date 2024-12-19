//@ts-check
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    await prisma.user.upsert({
        where: { id: "user1" },
        update: {},
        create: {
            id: "user1",
            email: "admin@gmail.com",
            name: "Administrador",
            // SENHA 12345
            password: "qq_qAfNlGDAW0eZI869pML_oXCYcztt_JuxQ8u8GnknWhIEN9iNGTn18vC4lAD_zMr86O2NaWrDvdyoM0nA10w",
            passwordSalt: "HFIPCp1pllQ",
        },
    });
    await prisma.user.upsert({
        where: { id: "user2" },
        update: {},
        create: {
            id: "user2",
            email: "alice@gmail.com",
            name: "Alice",
            // SENHA 12345
            password: "qq_qAfNlGDAW0eZI869pML_oXCYcztt_JuxQ8u8GnknWhIEN9iNGTn18vC4lAD_zMr86O2NaWrDvdyoM0nA10w",
            passwordSalt: "HFIPCp1pllQ",
        },
    });
    await prisma.user.upsert({
        where: { id: "user3" },
        update: {},
        create: {
            id: "user3",
            email: "bob@gmail.com",
            name: "Bob",
            // SENHA 12345
            password: "qq_qAfNlGDAW0eZI869pML_oXCYcztt_JuxQ8u8GnknWhIEN9iNGTn18vC4lAD_zMr86O2NaWrDvdyoM0nA10w",
            passwordSalt: "HFIPCp1pllQ",
        },
    });
    await prisma.user.upsert({
        where: { id: "user4" },
        update: {},
        create: {
            id: "user4",
            email: "charlie@gmail.com",
            name: "Charlie",
            // SENHA 12345
            password: "qq_qAfNlGDAW0eZI869pML_oXCYcztt_JuxQ8u8GnknWhIEN9iNGTn18vC4lAD_zMr86O2NaWrDvdyoM0nA10w",
            passwordSalt: "HFIPCp1pllQ",
        },
    });
    await prisma.group.upsert({
        where: { id: "group1" },
        update: {},
        create: {
            id: "group1",
            message: "Mensagem do Grupo #1",
            drawDate: null,
            maximumExpectedPrice: 100,
            minimumExpectedPrice: 30,
            ownerId: "user1"
        },
    });
    await prisma.member.upsert({
        where: { id: "member2" },
        update: {},
        create: {
            id: "member2",
            userId: "user2",
            groupId: "group1",
            wish: "Letra Grega Alpha",
            presentOffered: "Letra A",
        },
    });
    await prisma.member.upsert({
        where: { id: "member3" },
        update: {},
        create: {
            id: "member3",
            userId: "user3",
            groupId: "group1",
            wish: "Letra Grega Beta",
            presentOffered: "Letra B",
        },
    });
    await prisma.member.upsert({
        where: { id: "member4" },
        update: {},
        create: {
            id: "member4",
            userId: "user4",
            groupId: "group1",
            wish: "Letra Grega Gamma",
            presentOffered: "Letra C",
        },
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });