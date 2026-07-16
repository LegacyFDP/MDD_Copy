import { useEffect, useState } from 'react'
import { useGetVolunteers, useSaveVolunteer, useDeleteVolunteer } from '../hooks/backend/fete'
import { Button } from '../lib/shadcn/button'
import { Input } from '../lib/shadcn/input'
import { Label } from '../lib/shadcn/label'
import { Textarea } from '../lib/shadcn/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../lib/shadcn/dialog'
import { Plus, Pencil, Trash2, Handshake, Mail, Phone } from 'lucide-react'
import type { AppUser } from './Login'

interface Props { currentUser: AppUser }

type Volunteer = {
  id: number
  name: string
  email: string
  address_line1: string
  address_line2: string
  town_city: string
  county: string
  postcode: string
  phone_home: string
  phone_mobile: string
  skills: string
  notes: string
}

const emptyVolunteer = (): Partial<Volunteer> => ({
  name: '',
  email: '',
  address_line1: '',
  address_line2: '',
  town_city: '',
  county: '',
  postcode: '',
  phone_home: '',
  phone_mobile: '',
  skills: '',
  notes: '',
})

export default function VolunteersPage({ currentUser }: Props) {
  const { data: volunteersRaw, trigger: loadVolunteers } = useGetVolunteers()
  const { trigger: saveVolunteer, loading: saving } = useSaveVolunteer()
  const { trigger: deleteVolunteer } = useDeleteVolunteer()

  const volunteers = (volunteersRaw ?? []) as Volunteer[]

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState<Partial<Volunteer>>(emptyVolunteer())

  useEffect(() => { void loadVolunteers({}) }, [])

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    )
  }

  function openNew() {
    setSaveError('')
    setForm(emptyVolunteer())
    setEditId(null)
    setOpen(true)
  }

  function openEdit(volunteer: Volunteer) {
    setSaveError('')
    setForm({ ...volunteer })
    setEditId(volunteer.id)
    setOpen(true)
  }

  async function handleSave() {
    setSaveError('')
    try {
      await saveVolunteer({
        ...(editId ? { id: editId } : {}),
        name: form.name ?? '',
        email: form.email ?? '',
        address_line1: form.address_line1 ?? '',
        address_line2: form.address_line2 ?? '',
        town_city: form.town_city ?? '',
        county: form.county ?? '',
        postcode: form.postcode ?? '',
        phone_home: form.phone_home ?? '',
        phone_mobile: form.phone_mobile ?? '',
        skills: form.skills ?? '',
        notes: form.notes ?? '',
      })
      setOpen(false)
      void loadVolunteers({})
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save volunteer')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this volunteer?')) return
    await deleteVolunteer({ id })
    void loadVolunteers({})
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Volunteers</h1>
          <p className="text-muted-foreground text-sm">Administer your volunteer contact list</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Volunteer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {volunteers.map(volunteer => (
          <div key={volunteer.id} className="border rounded-lg p-4 bg-card text-card-foreground space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                <Handshake className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{volunteer.name}</p>
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {volunteer.email}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => openEdit(volunteer)} aria-label="Edit volunteer">
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(volunteer.id)}
                  aria-label="Delete volunteer">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {(volunteer.phone_home || volunteer.phone_mobile) && (
              <div className="text-sm text-muted-foreground space-y-1">
                {volunteer.phone_home && (
                  <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Home: {volunteer.phone_home}</p>
                )}
                {volunteer.phone_mobile && (
                  <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Mobile: {volunteer.phone_mobile}</p>
                )}
              </div>
            )}

            {(volunteer.address_line1 || volunteer.address_line2 || volunteer.town_city || volunteer.county || volunteer.postcode) && (
              <div className="text-sm text-muted-foreground space-y-0.5 border-t border-border pt-2">
                {volunteer.address_line1 && <p>{volunteer.address_line1}</p>}
                {volunteer.address_line2 && <p>{volunteer.address_line2}</p>}
                {(volunteer.town_city || volunteer.county) && (
                  <p>{[volunteer.town_city, volunteer.county].filter(Boolean).join(', ')}</p>
                )}
                {volunteer.postcode && <p className="font-medium text-foreground/80">{volunteer.postcode}</p>}
              </div>
            )}

            {volunteer.skills && (
              <p className="text-sm"><span className="font-medium">Skills:</span> {volunteer.skills}</p>
            )}
            {volunteer.notes && (
              <p className="text-xs text-muted-foreground"><span className="font-medium">Notes:</span> {volunteer.notes}</p>
            )}
          </div>
        ))}
        {volunteers.length === 0 && (
          <p className="text-muted-foreground col-span-full">No volunteers yet.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Volunteer' : 'Add Volunteer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={form.name ?? ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email ?? ''}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Address Line 1</Label>
              <Input value={form.address_line1 ?? ''}
                onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))}
                placeholder="e.g. 10 Market Street" />
            </div>
            <div className="space-y-1">
              <Label>Address Line 2</Label>
              <Input value={form.address_line2 ?? ''}
                onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))}
                placeholder="Optional" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Town / City</Label>
                <Input value={form.town_city ?? ''}
                  onChange={e => setForm(f => ({ ...f, town_city: e.target.value }))}
                  placeholder="e.g. Oxford" />
              </div>
              <div className="space-y-1">
                <Label>County</Label>
                <Input value={form.county ?? ''}
                  onChange={e => setForm(f => ({ ...f, county: e.target.value }))}
                  placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Postcode (UK)</Label>
              <Input value={form.postcode ?? ''}
                onChange={e => setForm(f => ({ ...f, postcode: e.target.value.toUpperCase() }))}
                placeholder="e.g. OX1 1AA" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Home Phone</Label>
                <Input value={form.phone_home ?? ''}
                  onChange={e => setForm(f => ({ ...f, phone_home: e.target.value }))}
                  placeholder="e.g. 01865 123456" />
              </div>
              <div className="space-y-1">
                <Label>Mobile Phone</Label>
                <Input value={form.phone_mobile ?? ''}
                  onChange={e => setForm(f => ({ ...f, phone_mobile: e.target.value }))}
                  placeholder="e.g. 07700 900123" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Skills</Label>
              <Textarea value={form.skills ?? ''}
                onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                placeholder="e.g. setup, till, first aid, baking" />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes ?? ''}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any availability or accessibility notes" />
            </div>

            {saveError && (
              <p className="text-sm text-red-600">{saveError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.email}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
