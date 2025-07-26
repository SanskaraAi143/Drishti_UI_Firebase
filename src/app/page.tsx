
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Map, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen bg-background">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold font-headline mb-4">Drishti</h1>
        <p className="text-xl text-muted-foreground mb-12">Event Safety & Management Platform</p>
        <div className="flex justify-center gap-8">
            <Card className="w-80 text-left">
                <CardHeader>
                    <div className="flex items-center justify-center bg-primary/10 text-primary w-12 h-12 rounded-lg mb-4">
                        <Map className="w-6 h-6" />
                    </div>
                    <CardTitle>Pre-Event Planning</CardTitle>
                    <CardDescription>Plan camera placements, road closures, and traffic flow before your event begins.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/planning">Launch Planner</Link>
                    </Button>
                </CardContent>
            </Card>
             <Card className="w-80 text-left">
                <CardHeader>
                    <div className="flex items-center justify-center bg-accent/20 text-accent w-12 h-12 rounded-lg mb-4">
                        <Zap className="w-6 h-6" />
                    </div>
                    <CardTitle>Live Command Center</CardTitle>
                    <CardDescription>Monitor live feeds, track staff, and respond to incidents in real-time during your event.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button asChild className="w-full">
                        <Link href="/commander">Launch Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
