import { prisma } from "@/lib/db";

const ANONYMOUS_EMAIL =
  process.env.ANON_USER_EMAIL ?? "anonymous.reader@loreecho.local";

const ANONYMOUS_NAME = "Reader";

export async function getAnonymousUser() {
  let user = await prisma.user.findUnique({
    where: { email: ANONYMOUS_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: ANONYMOUS_EMAIL,
        name: ANONYMOUS_NAME,
        // Password is required by the schema but will never be used,
        // since authentication has been disabled.
        password: "anonymous-password",
      },
    });
  }

  return user;
}

export async function getAnonymousUserId() {
  const user = await getAnonymousUser();
  return user.id;
}

