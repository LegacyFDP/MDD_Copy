import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGetFetes } from '../hooks/backend/fete'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { CalendarDays, MapPin, RefreshCw, Tent, Clock3 } from 'lucide-react'
import type { AppUser } from './Login'

interface Props { currentUser: AppUser }

type Fete = {
  id: number
  name: string
  event_date: string
  description: string
  notes: string
  status: 'planned' | 'active' | 'completed'
  location_name: string | null
}

const STATUS_LABELS: Record<Fete['status'], string> = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
}

const STATUS_STYLES: Record<Fete['status'], 'secondary' | 'default' | 'outline'> = {
  planned: 'secondary',
  active: 'default',
  completed: 'outline',
}

function formatEventDate(eventDate: string) {
  return new Date(eventDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function monthKey(eventDate: string) {
  const date = new Date(eventDate)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(eventDate: string) {
  return new Date(eventDate).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

function shortDate(eventDate: string) {
  return new Date(eventDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export default function FeteEventsPage({ currentUser }: Props) {
  const { data: fetesRaw, trigger: loadFetes, loading } = useGetFetes()

  useEffect(() => {
    void loadFetes({})
  }, [])

  const fetes = (fetesRaw ?? []) as Fete[]

  const summary = useMemo(() => ({
    total: fetes.length,
    active: fetes.filter((fete) => fete.status === 'active').length,
    planned: fetes.filter((fete) => fete.status === 'planned').length,
    completed: fetes.filter((fete) => fete.status === 'completed').length,
  }), [fetes])

  const sortedFetes = useMemo(
    () => [...fetes].sort((left, right) => left.event_date.localeCompare(right.event_date)),
    [fetes],
  )

  const groupedByMonth = useMemo(() => {
    const grouped = new Map<string, Fete[]>()

    for (const fete of sortedFetes) {
      const key = monthKey(fete.event_date)
      const existing = grouped.get(key) ?? []
      existing.push(fete)
      grouped.set(key, existing)
    }

    return [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, items]) => ({
        label: monthLabel(items[0]!.event_date),
        items,
      }))
  }, [sortedFetes])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Tent className="w-4 h-4 text-primary" />
            Fete events overview
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Upcoming and past fetes</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Browse all fete events, see their status, and check the venue and date at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" asChild>
            <Link to="/fetes">Manage fetes</Link>
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={() => void loadFetes({})}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock3 className="w-4 h-4" /> Planned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">{summary.planned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tent className="w-4 h-4" /> Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{summary.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.completed}</p>
          </CardContent>
        </Card>
      </div>

      {groupedByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Calendar view
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {groupedByMonth.map((month) => (
                <div key={month.label} className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">{month.label}</h2>
                    <Badge variant="outline">{month.items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {month.items.map((fete) => (
                      <div key={fete.id} className="flex items-start gap-3 rounded-md bg-background/80 p-3 border">
                        <div className="min-w-14 text-center rounded-md bg-primary/10 px-2 py-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {new Date(fete.event_date).toLocaleDateString('en-GB', { weekday: 'short' })}
                          </div>
                          <div className="text-sm font-semibold leading-none">{shortDate(fete.event_date)}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{fete.name}</span>
                            <Badge variant={STATUS_STYLES[fete.status]}>{STATUS_LABELS[fete.status]}</Badge>
                          </div>
                          {fete.location_name && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {fete.location_name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {sortedFetes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No fete events found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {sortedFetes.map((fete) => (
            <Card key={fete.id} className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0">
                    <CardTitle className="text-xl leading-tight">{fete.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_STYLES[fete.status]}>{STATUS_LABELS[fete.status]}</Badge>
                      {fete.location_name && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {fete.location_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground shrink-0">
                    {formatEventDate(fete.event_date)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {fete.description && (
                  <p className="text-sm leading-6 text-foreground/90">{fete.description}</p>
                )}
                {fete.notes && (
                  <p className="text-sm text-muted-foreground rounded-md bg-muted/40 p-3">
                    {fete.notes}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
                  <span>Viewed by {currentUser.name}</span>
                  <span>Event #{fete.id}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}