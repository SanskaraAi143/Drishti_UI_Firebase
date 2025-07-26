import { PlanningHeader } from '@/components/drishti/planning-header';
import { OperationsBriefing } from '@/components/drishti/operations-briefing';

export default function BriefingPage({ params }: { params: { planId: string } }) {
  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <PlanningHeader currentStep={4} planId={params.planId} />
      <main className="p-8">
        <OperationsBriefing planId={params.planId} />
      </main>
    </div>
  );
}
