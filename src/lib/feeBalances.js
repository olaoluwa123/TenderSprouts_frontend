export function money(value) {
  const n = Number(value ?? 0)
  return n.toLocaleString(undefined, { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 })
}

export function splitFeeBalances(invoices) {
  const byParent = new Map()

  for (const inv of Array.isArray(invoices) ? invoices : []) {
    if (inv.status === 'CANCELLED') continue

    const key = inv.parentId != null ? `parent-${inv.parentId}` : `student-${inv.studentId}`
    if (!byParent.has(key)) {
      byParent.set(key, {
        parentId: inv.parentId ?? null,
        parentName: inv.parentName
          || (inv.studentName ? `No parent linked (${inv.studentName})` : 'No parent linked'),
        phone: inv.parentPhone || '—',
        classNames: new Set(),
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
      })
    }

    const row = byParent.get(key)
    const amount = Number(inv.amount || 0)
    row.totalAmount += amount
    if (inv.className) row.classNames.add(inv.className)

    if (inv.status === 'PAID') row.paidAmount += amount
    else if (inv.status === 'PENDING') row.outstandingAmount += amount
  }

  const all = [...byParent.values()]
    .map((row) => ({
      parentId: row.parentId,
      parentName: row.parentName,
      phone: row.phone,
      className: [...row.classNames].sort().join(', ') || '—',
      totalAmount: row.totalAmount,
      paidAmount: row.paidAmount,
      outstandingAmount: row.outstandingAmount,
    }))
    .sort((a, b) => String(a.parentName).localeCompare(String(b.parentName)))

  return {
    paidParents: all.filter((p) => p.outstandingAmount <= 0 && p.totalAmount > 0),
    owingParents: all.filter((p) => p.outstandingAmount > 0),
  }
}
