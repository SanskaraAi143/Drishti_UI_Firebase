
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { DrishtiLogo } from '../icons/drishti-logo';

interface PlanningHeaderProps {
  currentStep: number;
  planId?: string;
}

export function PlanningHeader({ currentStep, planId }: PlanningHeaderProps) {
  const pathname = usePathname();

  const steps = [
    { number: 1, name: 'My Plans', href: '/planning' },
    { number: 2, name: 'Intelligence Intake', href: planId ? `/planning/new?from=${planId}` : '/planning/new' },
    { number: 3, name: 'Planner Workspace', href: planId ? `/planning/${planId}/edit` : '#' },
    { number: 4, name: 'Operations Briefing', href: planId ? `/planning/${planId}/briefing` : '#' },
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-card border-b border-border">
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2">
            <DrishtiLogo className="h-8 w-8 text-accent" />
            <span className="font-headline text-xl font-bold">Drishti Planner</span>
        </Link>
      </div>
      <nav className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <Button
              variant={currentStep === step.number ? 'default' : 'ghost'}
              className={cn(
                "rounded-md",
                currentStep > step.number && "text-accent",
                currentStep < step.number && "text-muted-foreground pointer-events-none"
              )}
              disabled={currentStep < step.number}
              asChild
            >
              <Link href={step.href}>
                <span className={cn("hidden md:inline-flex items-center justify-center h-6 w-6 rounded-full mr-2",
                 currentStep >= step.number ? "bg-accent text-accent-foreground" : "bg-muted-foreground/20"
                )}>
                  {step.number}
                </span>
                {step.name}
              </Link>
            </Button>
            {index < steps.length - 1 && (
              <ChevronRight className="h-5 w-5 text-muted-foreground mx-2" />
            )}
          </div>
        ))}
      </nav>
      <div>
        {/* Placeholder for user avatar or other actions */}
      </div>
    </header>
  );
}
