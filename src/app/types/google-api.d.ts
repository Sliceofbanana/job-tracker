// Google API type declarations

interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
  colorId?: string;
  htmlLink?: string;
}

interface CalendarEventParams {
  calendarId: string;
  resource: CalendarEvent;
}

interface CalendarEventUpdateParams extends CalendarEventParams {
  eventId: string;
}

interface CalendarEventDeleteParams {
  calendarId: string;
  eventId: string;
}

interface CalendarListParams {
  calendarId: string;
  timeMin?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: string;
  q?: string;
}

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: {
          apiKey?: string;
          clientId?: string;
          discoveryDocs?: string[];
          scope?: string;
        }) => Promise<void>;
        calendar: {
          events: {
            insert: (params: CalendarEventParams) => Promise<{ result: { id: string; htmlLink: string } }>;
            update: (params: CalendarEventUpdateParams) => Promise<{ result: CalendarEvent }>;
            delete: (params: CalendarEventDeleteParams) => Promise<Record<string, unknown>>;
            list: (params: CalendarListParams) => Promise<{ result: { items: CalendarEvent[] } }>;
          };
        };
      };
      auth2: {
        getAuthInstance: () => {
          isSignedIn: {
            get: () => boolean;
          };
          signIn: () => Promise<void>;
          signOut: () => Promise<void>;
        };
      };
    };
  }
}

export {};
