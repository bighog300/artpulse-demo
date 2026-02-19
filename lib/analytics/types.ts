export type AnalyticsEventName =
  | "events_list_viewed"
  | "events_filters_changed"
  | "event_viewed"
  | "event_saved_toggled"
  | "event_shared"
  | "event_add_to_calendar_clicked"
  | "entity_viewed"
  | "entity_follow_toggled"
  | "entity_unfollowed"
  | "following_viewed"
  | "calendar_viewed"
  | "calendar_event_opened"
  | "notifications_viewed"
  | "notification_marked_read"
  | "notifications_mark_all_read"
  | "digests_list_viewed"
  | "digest_opened"
  | "saved_searches_viewed"
  | "saved_search_preview_opened"
  | "saved_search_toggled"
  | "saved_search_frequency_changed"
  | "saved_search_run_now";

export type AnalyticsProps = {
  eventSlug?: string;
  eventId?: string;
  venueSlug?: string;
  artistSlug?: string;
  digestId?: string;
  savedSearchId?: string;
  source?: "events" | "nearby" | "following" | "digest" | "saved_search_preview" | "calendar" | string;
  ui?: "card" | "rail" | "row" | "detail" | "calendar_panel";
  filtersAppliedCount?: number;
  sort?: string;
  datePreset?: string;
  tagsCount?: number;
  queryLength?: number;
  hasQuery?: boolean;
  hasLocation?: boolean;
  nextState?: "saved" | "unsaved" | "followed" | "unfollowed" | "enabled" | "disabled";
  method?: "native" | "copy";
  type?: "artist" | "venue";
  slug?: string;
  mode?: "single" | "bulk";
  frequency?: string;
  notificationType?: string;
  hasTarget?: boolean;
};

export type AnalyticsPayload = {
  name: AnalyticsEventName;
  props?: AnalyticsProps;
  ts: string;
  path: string;
  referrer?: string;
  sid?: string;
};

export type AnalyticsProvider = {
  send: (event: AnalyticsPayload) => void | Promise<void>;
};
