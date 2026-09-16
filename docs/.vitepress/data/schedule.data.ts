import fs from 'node:fs';
import { defineLoader } from 'vitepress';

export type TrainingWeek = {
  week: number;
  title: string;
  start: string;
  end: string;
  href: string;
  focus: string;
  lectures?: string[];
  highlights: string[];
};

export type ScheduleData = {
  $schema: string;
  season: string;
  weeks: TrainingWeek[];
};

declare const data: ScheduleData;
export { data };

const schemaRef = './schedule.schema.json';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertStringArray(
  value: unknown,
  index: number,
  field: string,
  required: boolean,
): asserts value is string[] | undefined {
  if (value === undefined) {
    if (required) {
      throw new Error(`schedule.json: weeks[${index}].${field} is required`);
    }
    return;
  }

  if (!Array.isArray(value) || (required && value.length === 0)) {
    throw new Error(
      `schedule.json: weeks[${index}].${field} must be a non-empty array`,
    );
  }

  for (const item of value) {
    if (!isNonEmptyString(item)) {
      throw new Error(
        `schedule.json: weeks[${index}].${field} has an empty item`,
      );
    }
  }
}

function assertWeek(
  value: unknown,
  index: number,
): asserts value is TrainingWeek {
  if (!value || typeof value !== 'object') {
    throw new Error(`schedule.json: weeks[${index}] is not an object`);
  }

  const record = value as Record<string, unknown>;
  const allowedKeys = new Set([
    'week',
    'title',
    'start',
    'end',
    'href',
    'focus',
    'lectures',
    'highlights',
  ]);

  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      throw new Error(
        `schedule.json: weeks[${index}] has unexpected key: ${key}`,
      );
    }
  }

  if (typeof record.week !== 'number' || !Number.isInteger(record.week)) {
    throw new Error(`schedule.json: weeks[${index}].week must be an integer`);
  }

  for (const field of ['title', 'href', 'focus'] as const) {
    if (!isNonEmptyString(record[field])) {
      throw new Error(`schedule.json: weeks[${index}].${field} is required`);
    }
  }

  for (const field of ['start', 'end'] as const) {
    if (!isNonEmptyString(record[field]) || !datePattern.test(record[field])) {
      throw new Error(
        `schedule.json: weeks[${index}].${field} must look like YYYY-MM-DD`,
      );
    }
  }

  if (record.start > record.end) {
    throw new Error(`schedule.json: weeks[${index}].start is later than .end`);
  }

  assertStringArray(record.lectures, index, 'lectures', false);
  assertStringArray(record.highlights, index, 'highlights', true);
}

function assertScheduleData(value: unknown): asserts value is ScheduleData {
  if (!value || typeof value !== 'object') {
    throw new Error('schedule.json: root must be an object');
  }

  const record = value as Record<string, unknown>;

  if (record.$schema !== schemaRef) {
    throw new Error(`schedule.json: $schema must be ${schemaRef}`);
  }

  if (!isNonEmptyString(record.season)) {
    throw new Error('schedule.json: season is required');
  }

  if (!Array.isArray(record.weeks) || record.weeks.length === 0) {
    throw new Error('schedule.json: weeks must be a non-empty array');
  }

  record.weeks.forEach(assertWeek);

  const numbers = record.weeks.map((w) => (w as TrainingWeek).week);
  if (new Set(numbers).size !== numbers.length) {
    throw new Error('schedule.json: weeks[].week must be unique');
  }
}

export default defineLoader({
  watch: ['./schedule.json', './schedule.schema.json'],
  load(): ScheduleData {
    const raw = fs.readFileSync(
      new URL('./schedule.json', import.meta.url),
      'utf-8',
    );
    const parsed = JSON.parse(raw) as unknown;
    assertScheduleData(parsed);
    return parsed;
  },
});
