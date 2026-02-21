import { RiskBadge } from '@/components/ui/risk-badge';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { StatusSelector } from '@/components/ui/status-selector';
import { Avatar } from '@/components/ui/avatar';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Taskdesk Design System</h1>
          <p className="mt-2 text-foreground-muted">
            Complete component library for the Taskdesk application.
          </p>
        </div>

        {/* RiskBadge */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">RiskBadge</h2>
          <div className="flex flex-wrap gap-4">
            <RiskBadge variant="normal" />
            <RiskBadge variant="soft" />
            <RiskBadge variant="hard" />
            <RiskBadge variant="blocked" />
            <RiskBadge variant="normal" size="sm" />
            <RiskBadge variant="soft" size="sm" />
          </div>
        </section>

        {/* MetricCard */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">MetricCard</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Active Campaigns" value={12} variant="primary" />
            <MetricCard label="At Risk" value={3} variant="soft" />
            <MetricCard label="High Risk" value={1} variant="hard" />
            <MetricCard label="Stalled Tasks" value={8} variant="normal" />
            <MetricCard label="Loading" value={0} loading />
          </div>
        </section>

        {/* Button */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Button</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Input */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Input</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Email" placeholder="Enter your email" />
            <Input label="Password" type="password" placeholder="Enter password" />
            <Input label="With Error" error="This field is required" />
            <Input label="With Hint" hint="This is a helpful hint" />
          </div>
        </section>

        {/* Skeleton */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Skeleton</h2>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-12 w-full" />
          </div>
        </section>

        {/* Badge */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Badge</h2>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="active">Active</Badge>
            <Badge variant="completed">Completed</Badge>
            <Badge variant="pending">Pending</Badge>
          </div>
        </section>

        {/* Table */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Table</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>John Doe</TableCell>
                <TableCell>
                  <Badge variant="active">Active</Badge>
                </TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Jane Smith</TableCell>
                <TableCell>
                  <Badge variant="completed">Completed</Badge>
                </TableCell>
                <TableCell>Member</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        {/* StatusSelector */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">StatusSelector</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Not Started</label>
              <StatusSelector
                currentStatus="not_started"
                onChange={() => {}}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">In Progress</label>
              <StatusSelector
                currentStatus="in_progress"
                onChange={() => {}}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Completed</label>
              <StatusSelector
                currentStatus="completed"
                onChange={() => {}}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Blocked</label>
              <StatusSelector
                currentStatus="blocked"
                onChange={() => {}}
              />
            </div>
          </div>
        </section>

        {/* Avatar */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Avatar</h2>
          <div className="flex flex-wrap gap-4">
            <Avatar name="John Doe" size="sm" />
            <Avatar name="Jane Smith" size="md" />
            <Avatar name="Alice Johnson" size="lg" />
            <Avatar name="Bob Wilson" />
          </div>
        </section>
      </div>
    </div>
  );
}