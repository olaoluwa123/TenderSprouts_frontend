import { parentsApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Card, Loading, PageHeader } from '@/components/ui'

export function ChildrenPage() {
  const { data, loading } = useAsync(() => parentsApi.me(), [])

  return (
    <div>
      <PageHeader title="My Children" />
      {loading ? <Loading /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.children.map((child) => (
            <Card key={child.id}>
              <h3 className="font-semibold">{child.firstName} {child.lastName}</h3>
              <p className="text-sm text-muted mt-1">Admission: {child.admissionNumber}</p>
              <p className="text-sm text-muted">Class ID: {child.classId ?? '—'}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
