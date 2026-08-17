import { admissionEnquiriesApi } from '@/api'
import { Alert, Badge, EmptyState, Loading, PageHeader, Table, Td, Th } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdmissionEnquiriesPage() {
  const { data, loading, error } = useAsync(() => admissionEnquiriesApi.list(), [])
  const enquiries = Array.isArray(data) ? data : []

  return (
    <div>
      <PageHeader
        title="Admission Enquiries"
        subtitle="Enquiries submitted through the public admissions page"
      />

      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Loading />
      ) : enquiries.length === 0 ? (
        <EmptyState
          title="No admission enquiries"
          description="New enquiries from the website will appear here."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Enquirer</Th>
              <Th>Contact</Th>
              <Th>Child age / class</Th>
              <Th>Message</Th>
              <Th>Status</Th>
              <Th>Received</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blossom-100">
            {enquiries.map((item) => (
              <tr key={item.id}>
                <Td className="font-medium">{item.enquirerName}</Td>
                <Td>
                  <a className="block text-brand-700 hover:underline" href={`mailto:${item.email}`}>
                    {item.email}
                  </a>
                  {item.phone && <span className="mt-1 block text-xs text-muted">{item.phone}</span>}
                </Td>
                <Td>{item.childAgeOrClass || '—'}</Td>
                <Td>
                  <p className="max-w-sm whitespace-pre-wrap text-sm">{item.message}</p>
                </Td>
                <Td>
                  <Badge tone={item.status === 'PENDING' ? 'warning' : 'success'}>{item.status}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-xs">{formatDate(item.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
