import { PlanningHeader } from '@/components/drishti/planning-header';
import { PlannerWorkspace } from '@/components/drishti/planner-workspace';

export default function PlannerWorkspacePage({ params }: { params: { planId: string } }) {
  return (
    <div className="w-full h-screen flex flex-col bg-background text-foreground">
      <PlanningHeader currentStep={3} planId={params.planId} />
      <PlannerWorkspace planId={params.planId} />
    </div>
  );
}
