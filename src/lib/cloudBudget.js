import { coerceBudgetState, createDefaultBudgetState } from './budget.js'

function mapEventFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date ?? '',
  }
}

function mapEventToRow(userId, event) {
  return {
    user_id: userId,
    title: event.title,
    amount: Number(event.amount),
    frequency: event.frequency,
    start_date: event.startDate,
    end_date: event.endDate || null,
  }
}

export async function fetchBudgetState(client, userId) {
  const fallback = createDefaultBudgetState()
  const [profileResult, eventsResult] = await Promise.all([
    client
      .from('budget_profiles')
      .select('opening_balance, opening_date')
      .eq('user_id', userId)
      .maybeSingle(),
    client
      .from('recurring_events')
      .select('id, title, amount, frequency, start_date, end_date')
      .eq('user_id', userId)
      .order('start_date', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  if (profileResult.error) {
    throw profileResult.error
  }

  if (eventsResult.error) {
    throw eventsResult.error
  }

  return coerceBudgetState({
    openingBalance: Number(profileResult.data?.opening_balance ?? fallback.openingBalance),
    openingDate: profileResult.data?.opening_date ?? fallback.openingDate,
    events: (eventsResult.data ?? []).map(mapEventFromRow),
  })
}

export async function saveOpeningSettings(client, userId, settings) {
  const payload = {
    user_id: userId,
    opening_balance: Number(settings.openingBalance),
    opening_date: settings.openingDate,
  }

  const { error } = await client.from('budget_profiles').upsert(payload, {
    onConflict: 'user_id',
  })

  if (error) {
    throw error
  }

  return {
    openingBalance: Number(payload.opening_balance),
    openingDate: payload.opening_date,
  }
}

export async function createRecurringEvent(client, userId, event) {
  const { data, error } = await client
    .from('recurring_events')
    .insert(mapEventToRow(userId, event))
    .select('id, title, amount, frequency, start_date, end_date')
    .single()

  if (error) {
    throw error
  }

  return mapEventFromRow(data)
}

export async function deleteRecurringEvent(client, userId, eventId) {
  const { error } = await client
    .from('recurring_events')
    .delete()
    .eq('user_id', userId)
    .eq('id', eventId)

  if (error) {
    throw error
  }
}

export async function replaceBudgetState(client, userId, budget) {
  const normalizedBudget = coerceBudgetState(budget)

  await saveOpeningSettings(client, userId, normalizedBudget)

  const { error: deleteError } = await client
    .from('recurring_events')
    .delete()
    .eq('user_id', userId)

  if (deleteError) {
    throw deleteError
  }

  if (normalizedBudget.events.length > 0) {
    const { error: insertError } = await client.from('recurring_events').insert(
      normalizedBudget.events.map((event) => mapEventToRow(userId, event)),
    )

    if (insertError) {
      throw insertError
    }
  }

  return normalizedBudget
}
