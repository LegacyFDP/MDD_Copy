type Params = { id: number }

export default async function (req: { params: Params; user: User }) {
  const { id } = req.params

  await retoolDb.query('DELETE FROM volunteers WHERE id = $1', [id])
  return { success: true }
}
