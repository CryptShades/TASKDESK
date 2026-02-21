import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { getTasksByCampaign, createTask } from '@/services/task.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    const result = await getTasksByCampaign(params.id, currentUser.org_id);

    return NextResponse.json(
      { data: result, error: null },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, owner_id, due_date, dependency_id, risk_flag } = body;

    if (!title || !owner_id || !due_date) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_FIELDS', message: 'Title, owner ID, and due date are required' } },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    const result = await createTask(
      { title, owner_id, due_date, dependency_id, risk_flag },
      params.id,
      currentUser.org_id,
      currentUser.id
    );

    return NextResponse.json(
      { data: result, error: null },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}