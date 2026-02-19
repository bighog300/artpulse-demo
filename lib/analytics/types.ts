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
  | "saved_search_run_now"
  | "onboarding_banner_shown"
  | "onboarding_sheet_opened"
  | "onboarding_dismissed"
  | "onboarding_step_clicked"
  | "onboarding_completed"
  | "recommended_follows_shown"
  | "recommended_follow_clicked"
  | "saved_search_cta_shown"
  | "saved_search_created"
  | "saved_search_cta_preview_clicked"
  | "location_education_shown"
  | "location_enable_clicked"
  | "location_enable_result"
  | "start_pack_shown"
  | "start_pack_opened"
  | "start_pack_follow_all_clicked"
  | "start_pack_follow_result"
  | "start_pack_entity_follow_clicked"
  | "post_activation_tip_shown"
  | "post_activation_tip_dismissed"
  | "post_activation_tip_clicked"
  | "setup_checklist_shown"
  | "setup_checklist_item_clicked"
  | "setup_checklist_dismissed"
;

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
  type?: "artist" | "venue";
  slug?: string;
  mode?: "single" | "bulk";
  frequency?: string;
  notificationType?: string;
  hasTarget?: boolean;
  page?: string;
  step?: "follow" | "saved_search" | "saved_event" | "location" | "done";
  destination?: string;
  method?: "native" | "copy" | "follow" | "saved_search" | "saved_event" | "location" | "search_cta";
  result?: "granted" | "denied" | "error";
  packId?: string;
  count?: number;
  attempted?: number;
  succeeded?: number;
  failed?: number;
  tipId?: string;
  itemId?: string;
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
