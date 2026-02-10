"use client";

import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

type CalendarItem = {
  id: string;
  title: string;
  slug: string;
  start: string;
  end: string | null;
};

export function CalendarClient({ events }: { events: CalendarItem[] }) {
  const router = useRouter();

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listWeek" }}
      height="auto"
      events={events.map((event) => ({ id: event.id, title: event.title, start: event.start, end: event.end ?? undefined, extendedProps: { slug: event.slug } }))}
      eventClick={(info) => {
        info.jsEvent.preventDefault();
        router.push(`/events/${info.event.extendedProps.slug}`);
      }}
    />
  );
}
