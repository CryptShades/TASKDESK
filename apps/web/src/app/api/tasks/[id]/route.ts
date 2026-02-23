import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { updateTask, deleteTask, getTaskById } from '@/services/task.service';
import { withErrorHandler } from '@/lib/api-handler';

type Params = { params: { id: string } };

export const GET = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const currentUser = await getCurrentUser();
  const result = await getTaskById(params.id, currentUser.org_id);
  return NextResponse.json({ data: result, error: null }, { status: 200 });
});

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const body = await request.json();
  const currentUser = await getCurrentUser();
  const result = await updateTask(params.id, body, currentUser.org_id, currentUser.id);
  return NextResponse.json({ data: result, error: null }, { status: 200 });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const currentUser = await getCurrentUser();
  const result = await deleteTask(params.id, currentUser.org_id, currentUser.id);
  return NextResponse.json({ data: result, error: null }, { status: 200 });
});
