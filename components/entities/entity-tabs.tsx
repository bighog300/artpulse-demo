"use client";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EntityTabsProps = { upcoming: ReactNode; about: ReactNode };

export function EntityTabs({ upcoming, about }: EntityTabsProps) {
  return (
    <Tabs defaultValue="upcoming" className="space-y-4">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">{upcoming}</TabsContent>
      <TabsContent value="about">{about}</TabsContent>
    </Tabs>
  );
}
