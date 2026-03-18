'use client'

import { PageHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, type Column } from '@/components/ui/table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useTeamMembers, type TeamMemberView } from '@/features/team/hooks/use-team'

export default function TeamPage() {
  const { data: members, isLoading } = useTeamMembers()

  const columns: Column<TeamMemberView>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-text-primary">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge variant={row.role === 'admin' ? 'primary' : 'info'}>
          {row.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : row.status === 'invited' ? 'warning' : 'muted'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => (
        <span className="text-xs text-text-secondary">{row.phone ?? '—'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => (
        <span className="text-xs text-text-muted font-mono">
          {new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage counsellors and admin accounts."
        actions={
          <Button size="sm" icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }>
            Invite Member
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
          <Table
            columns={columns}
            data={members ?? []}
            rowKey={(row) => row.id}
          />
        </div>
      )}
    </div>
  )
}
