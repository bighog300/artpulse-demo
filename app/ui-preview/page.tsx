import { ChevronDown, Paintbrush, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { Separator } from '@/components/ui/separator';
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UIPreviewPage() {
  return (
    <PageShell className="space-y-8">
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
        Internal UI preview
      </div>

      <PageHeader
        title="UI Foundations"
        subtitle="Phase 0 baseline for tokens, typography, and core components"
        actions={<Badge variant="secondary">Preview only</Badge>}
      />

      <section className="space-y-3">
        <SectionHeader title="Typography" />
        <div className="space-y-2 rounded-xl border border-border bg-card p-5">
          <p className="type-display">Display text style</p>
          <h1 className="type-h1">Heading one</h1>
          <h2 className="type-h2">Heading two</h2>
          <h3 className="type-h3">Heading three</h3>
          <p className="type-body">Body text is optimized for readability across the app.</p>
          <p className="type-caption">Caption text for metadata and helper copy.</p>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Buttons" />
        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-5">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Inputs & badges" />
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <Input placeholder="Default input" />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Input with icon" />
          </div>
          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Card, tabs, dropdown" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Semantic card token usage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="type-caption">Cards are used for grouped content blocks.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interactive examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="first" className="w-full">
                <TabsList>
                  <TabsTrigger value="first">First</TabsTrigger>
                  <TabsTrigger value="second">Second</TabsTrigger>
                </TabsList>
                <TabsContent value="first" className="type-caption">
                  First tab panel content.
                </TabsContent>
                <TabsContent value="second" className="type-caption">
                  Second tab panel content.
                </TabsContent>
              </Tabs>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Menu <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Open</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Skeletons & empty state" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-5 w-1/3" />
            <SkeletonList />
            <Separator />
            <SkeletonCard />
          </div>
          <EmptyState
            icon={<Paintbrush className="h-5 w-5" />}
            title="No curated elements yet"
            body="Use this baseline to keep future UI additions cohesive and token-driven."
            actions={[{ label: 'Learn more', href: '/', variant: 'secondary' }]}
          />
        </div>
      </section>
    </PageShell>
  );
}
