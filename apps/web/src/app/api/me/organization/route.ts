import { NextResponse } from 'next/server';
import { getCurrentOrganization } from '../../../../lib/get-current-organization';

export async function GET() {
  try {
    const organization = await getCurrentOrganization();
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }
    return NextResponse.json(organization);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}