
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PlanningHeader } from '@/components/drishti/planning-header';

// Mock data for existing plans
const MOCK_PLANS = [
  { id: 'plan-1', name: 'Annual Music Fest 2024', location: 'City Park', date: '2024-08-15', status: 'Draft' },
  { id: 'plan-2', name: 'Marathon Championship', location: 'Downtown', date: '2024-09-05', status: 'Finalized' },
  { id: 'plan-3', name: 'Presidential Rally', location: 'National Plaza', date: '2024-10-22', status: 'Draft' },
];

export default function MyPlansDashboard() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <PlanningHeader currentStep={1} />
      <main className="p-8">
        <Card className="max-w-6xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Event Safety Plans</CardTitle>
              <CardDescription>Manage your existing plans or create a new one to get started.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/planning/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Plan
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Venue Location</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PLANS.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.location}</TableCell>
                    <TableCell>{plan.date}</TableCell>
                    <TableCell>
                      <Badge variant={plan.status === 'Draft' ? 'secondary' : 'default'}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                         <Link href={`/planning/${plan.id}/edit`}>
                           <Edit className="h-4 w-4" />
                         </Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
