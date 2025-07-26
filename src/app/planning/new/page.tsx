import { PlanningHeader } from '@/components/drishti/planning-header';
import { IntelligenceIntakeForm } from '@/components/drishti/intelligence-intake-form';

export default function NewPlanPage() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <PlanningHeader currentStep={2} />
      <main className="p-8">
        <IntelligenceIntakeForm />
      </main>
    </div>
  );
}
