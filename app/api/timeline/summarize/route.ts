import { NextRequest } from "next/server";
import { handleTimelineSummarizePost } from "@/lib/timeline-summarize-route";

export async function POST(request: NextRequest) {
  return handleTimelineSummarizePost(request);
}
