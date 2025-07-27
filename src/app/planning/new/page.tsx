import { PlanningHeader } from '@/components/drishti/planning-header';
import { IntelligenceIntakeForm } from '@/components/drishti/intelligence-intake-form';
import React, { Suspense } from 'react';

// This is a client component that will use useSearchParams
function PlanningPageClient() {
  return <IntelligenceIntakeForm />;
}

export default function NewPlanPage() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <PlanningHeader currentStep={2} />
      <main className="p-8">
        <Suspense fallback={<p>Loading planner...</p>}>
          <PlanningPageClient />
        </Suspense>
      </main>
    </div>
  );
}
