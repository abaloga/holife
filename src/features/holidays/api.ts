import { AppError } from '@/lib/errors';
import { parseDateKey, type DateKey } from '@/lib/date';

/**
 * checkiday.com: a free, keyless "National ___ Day" calendar — the novelty,
 * fun-to-celebrate days (National Coffee Day, Neighbor Day, and the like),
 * not government public holidays. CORS-open and read-only, so it's called
 * straight from the browser; nothing here is a secret.
 */
const HOLIDAYS_URL = 'https://www.checkiday.com/api/3/';
const COUNTRIES_URL = 'https://date.nager.at/api/v3/AvailableCountries';
const ON_THIS_DAY_URL = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected';

export interface NationalDay {
  name: string;
  url: string;
}

interface CheckidayResponse {
  error: string;
  date: string;
  holidays: NationalDay[];
}

export async function fetchNationalDays(date: DateKey, timezone: string): Promise<NationalDay[]> {
  const { year, month, day } = parseDateKey(date);
  const params = new URLSearchParams({ d: `${month}/${day}/${year}`, tz: timezone });

  let response: Response;
  try {
    response = await fetch(`${HOLIDAYS_URL}?${params.toString()}`);
  } catch (cause) {
    throw new AppError('Could not reach the holiday calendar. Check your connection.', cause);
  }

  if (!response.ok) {
    throw new AppError('Could not reach the holiday calendar. Try again later.');
  }

  const payload = (await response.json()) as CheckidayResponse;
  if (payload.error !== 'none') {
    throw new AppError('Could not reach the holiday calendar. Try again later.');
  }

  return payload.holidays;
}

export interface HistoricalEvent {
  year: number;
  /** The event itself, e.g. "Fleming discovered penicillin". */
  text: string;
  /** The subject article's title, used as the short collapsed label. */
  title: string | null;
  /** Link to the subject article, for "read more". */
  url: string | null;
}

interface OnThisDayResponsePage {
  titles?: { normalized?: string };
  content_urls?: { desktop?: { page?: string } };
}

interface OnThisDayResponse {
  selected: { year: number; text: string; pages?: OnThisDayResponsePage[] }[];
}

/**
 * Wikipedia's "On this day" feed: free, keyless, CORS-open. `selected` is the
 * same hand-curated list their editors feature on the homepage — a much
 * better "meaningful" signal than the `events` category, which is every
 * logged event for the date (often dozens, sorted newest-first) with no
 * ranking by significance at all.
 */
export async function fetchOnThisDay(month: number, day: number): Promise<HistoricalEvent[]> {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  let response: Response;
  try {
    response = await fetch(`${ON_THIS_DAY_URL}/${mm}/${dd}`);
  } catch (cause) {
    throw new AppError('Could not reach the history calendar. Check your connection.', cause);
  }

  if (!response.ok) {
    throw new AppError('Could not reach the history calendar. Try again later.');
  }

  const payload = (await response.json()) as OnThisDayResponse;
  return payload.selected.map((event) => {
    const page = event.pages?.[0];
    return {
      year: event.year,
      text: event.text,
      title: page?.titles?.normalized ?? null,
      url: page?.content_urls?.desktop?.page ?? null,
    };
  });
}

export interface CountryOption {
  countryCode: string;
  name: string;
}

/**
 * Only used to populate the Settings country list — a separate, unrelated
 * free API, since checkiday has no country list of its own. The holidays
 * widget itself does not filter by country yet (checkiday's free endpoint is
 * US-only), so this setting is forward-looking rather than load-bearing today.
 */
export async function fetchAvailableCountries(): Promise<CountryOption[]> {
  let response: Response;
  try {
    response = await fetch(COUNTRIES_URL);
  } catch (cause) {
    throw new AppError('Could not reach the country list. Check your connection.', cause);
  }

  if (!response.ok) throw new AppError('Could not reach the country list. Try again later.');
  return response.json() as Promise<CountryOption[]>;
}
