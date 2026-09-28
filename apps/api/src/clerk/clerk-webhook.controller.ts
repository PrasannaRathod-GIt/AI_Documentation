import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Webhook } from 'svix';
import { eq, sql } from 'drizzle-orm';
import { db, memberships, organizations, users } from '@ai-docs/database';

@Controller('webhooks/clerk')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  @Post()
  async handleClerkWebhook(
    @Req() req: any,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ): Promise<{ received: true }> {
    this.logger.log('🔥 CLERK WEBHOOK HIT');
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing Svix headers');
    }

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

    try {
      const payload = wh.verify(req.rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as any;

      const eventType = payload?.type as string | undefined;
      const data = payload?.data as any;

      if (eventType === 'user.created') {
        const id = data?.id as string | undefined;
        const email = data?.email_addresses?.[0]?.email_address as string | undefined;
        const firstName = data?.first_name as string | undefined;
        const lastName = data?.last_name as string | undefined;
        const imageUrl = data?.image_url as string | undefined;

        if (!id || !email) {
          throw new BadRequestException('Missing Clerk user payload data');
        }

        const existingUser = await db.query.users.findFirst({
          where: eq(users.authProviderId, id),
        });

        if (!existingUser) {
          await db.insert(users).values({
            authProviderId: id,
            email,
            fullName: [firstName, lastName].filter(Boolean).join(' ') || null,
            avatarUrl: imageUrl || null,
          });
        }

        this.logger.log(`✅ User created: ${email}`);
      } else if (eventType === 'organization.created') {
        const id = data?.id as string | undefined;
        const name = data?.name as string | undefined;
        const slug = data?.slug as string | undefined;

        if (!id || !name || !slug) {
          throw new BadRequestException('Missing Clerk organization payload data');
        }

        const existingOrganizationRows = await db
          .select()
          .from(organizations)
          .where(sql`clerk_org_id = ${id}`)
          .limit(1);

        if (existingOrganizationRows.length === 0) {
          await db.execute(
            sql`INSERT INTO organizations (name, slug, clerk_org_id) VALUES (${name}, ${slug}, ${id})`
          );
        }

        this.logger.log(`✅ Organization created: ${name}`);
      } else if (eventType === 'organizationMembership.created') {
        const organizationId = data?.organization?.id as string | undefined;
        const authProviderUserId = data?.public_user_data?.user_id as string | undefined;
        const role = data?.role as string | undefined;

        if (!organizationId || !authProviderUserId || !role) {
          throw new BadRequestException('Missing Clerk membership payload data');
        }

        const existingUser = await db.query.users.findFirst({
          where: eq(users.authProviderId, authProviderUserId),
        });

        const existingOrganizationRows = await db
          .select()
          .from(organizations)
          .where(sql`clerk_org_id = ${organizationId}`)
          .limit(1);

        if (existingUser && existingOrganizationRows.length > 0) {
          const existingOrganization = existingOrganizationRows[0];

          const existingMembershipRows = await db
            .select()
            .from(memberships)
            .where(
              sql`user_id = ${existingUser.id} AND organization_id = ${existingOrganization.id}`
            )
            .limit(1);

          if (existingMembershipRows.length === 0) {
            const membershipRole =
              role === 'org:admin' ? 'admin' : role === 'org:owner' ? 'owner' : 'member';

            await db.execute(
              sql`INSERT INTO memberships (user_id, organization_id, role) VALUES (${existingUser.id}, ${existingOrganization.id}, ${membershipRole})`
            );

            this.logger.log(
              `✅ Membership created: ${existingUser.email || existingUser.id} → ${existingOrganization.name || existingOrganization.clerkOrgId}`
            );
          }
        } else {
          this.logger.warn(
            `Membership event received before user/org exists: user=${authProviderUserId} org=${organizationId}`
          );
          return { received: true };
        }
      } else {
        this.logger.log(`Received Clerk event ${eventType} and ignored it`);
      }

      return { received: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'WebhookVerificationError') {
        throw new BadRequestException('Invalid Clerk webhook signature');
      }
      throw error;
    }
  }
}
