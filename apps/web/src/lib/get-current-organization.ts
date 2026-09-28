export type CurrentOrganization = {
  id: string;
  name: string | null;
  slug: string | null;
};

async function loadClerkAuth() {
  return (await new Function('return import("@clerk/nextjs/server")')()) as {
    auth: () => Promise<{ orgId: string | null }>;
  };
}

async function loadDatabase() {
  return (await new Function('return import("@ai-docs/database")')()) as {
    db: any;
    organizations: any;
  };
}

export async function getCurrentOrganization(): Promise<CurrentOrganization | null> {
  if (typeof window !== 'undefined') {
    return null;
  }

  const { auth } = await loadClerkAuth();
  const { orgId } = await auth();

  if (!orgId) {
    return null;
  }

  const { db, organizations } = await loadDatabase();
  const { eq } = await new Function('return import("drizzle-orm")')() as {
    eq: (column: any, value: string) => any;
  };

  const [organization] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, orgId))
    .limit(1);

  if (!organization) {
    throw new Error(
      `Clerk organization ${orgId} is authenticated but no matching row exists in the organizations table. The organization.created webhook may not have fired yet.`
    );
  }

  return organization;
}
