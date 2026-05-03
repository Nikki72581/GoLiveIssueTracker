import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { status, assigned_to, notes } = body

  const updates: Record<string, unknown> = {}

  if (status !== undefined) {
    updates.status = status
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    } else {
      updates.resolved_at = null
    }
  }
  if (assigned_to !== undefined) updates.assigned_to = assigned_to
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase.from('issues').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
