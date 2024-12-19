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
            password: "cFIW4y82EUus-nzhTbDZYXvN5rkHZdP-wPMVP0u_0-gbPbX1GjBvMGv-FlhftJegiXVy7Jy0M3N9OjKmPHoPKg",
            passwordSalt: "vvtR20gZrkg",
        }
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