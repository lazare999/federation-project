const DASH = '—';

function isPresent(value) {
  return value != null && value !== '';
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeCompetitionResult(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      status: null,
      statusCode: null,
      statusDisplay: null,
      place: null,
      faults: null,
      time: null,
      jumpoff: false,
      jumpoffFaults: null,
      jumpoffTime: null,
      points: null,
      jokerPoints: null,
      notes: '',
    };
  }

  const status =
    raw.status ||
    raw.result_status ||
    (isPresent(raw.place) ? 'classified' : null);

  const jumpoffFaults = isPresent(raw.jumpoff_faults)
    ? raw.jumpoff_faults
    : isPresent(raw.jumpoffFaults)
      ? raw.jumpoffFaults
      : null;
  const jumpoffTime = isPresent(raw.jumpoff_time)
    ? raw.jumpoff_time
    : isPresent(raw.jumpoffTime)
      ? raw.jumpoffTime
      : null;
  const jokerPoints = isPresent(raw.joker_points)
    ? raw.joker_points
    : isPresent(raw.jokerPoints)
      ? raw.jokerPoints
      : null;

  return {
    status,
    statusCode:
      raw.status_code || raw.result_status_code || raw.statusCode || null,
    statusDisplay:
      raw.status_display ||
      raw.result_status_display ||
      raw.statusDisplay ||
      null,
    place: isPresent(raw.place) ? raw.place : null,
    faults: isPresent(raw.faults) ? raw.faults : null,
    time: isPresent(raw.time) ? raw.time : null,
    jumpoff: Boolean(raw.jumpoff),
    jumpoffFaults,
    jumpoffTime,
    points: isPresent(raw.points) ? raw.points : null,
    jokerPoints,
    notes: String(raw.notes || '').trim(),
  };
}

export function isClassifiedResult(result) {
  if (result?.status) return result.status === 'classified';
  return isPresent(result?.place);
}

export function hasRecordedResult(raw) {
  const result = normalizeCompetitionResult(raw);
  return Boolean(
    result.status ||
      result.statusCode ||
      isPresent(result.place) ||
      isPresent(result.faults) ||
      isPresent(result.time) ||
      isPresent(result.points) ||
      isPresent(result.jokerPoints) ||
      result.jumpoff
  );
}

export function formatPlaceOrStatus(result) {
  if (!isClassifiedResult(result)) {
    return result.statusCode || result.statusDisplay || DASH;
  }
  if (isPresent(result.place)) return String(result.place);
  return result.statusCode || DASH;
}

export function formatResultTime(value, secondsLabel = '') {
  const n = toNumber(value);
  if (n == null) return DASH;
  const formatted = n.toFixed(2);
  return secondsLabel ? `${formatted} ${secondsLabel}` : formatted;
}

export function formatFaults(value) {
  return isPresent(value) ? String(value) : DASH;
}

export function formatJumpoff(result, secondsLabel = '') {
  if (!isPresent(result?.jumpoffFaults) && !isPresent(result?.jumpoffTime)) {
    return DASH;
  }
  const faults = isPresent(result.jumpoffFaults)
    ? String(result.jumpoffFaults)
    : DASH;
  const time = formatResultTime(result.jumpoffTime, secondsLabel);
  return `${faults} / ${time}`;
}

export function formatJoker(jokerPoints) {
  const n = toNumber(jokerPoints);
  if (n == null) return '';
  const sign = n > 0 ? '+' : '';
  return `J${sign}${n}`;
}

export function formatPoints(result) {
  const hasPoints = isPresent(result?.points);
  const joker = formatJoker(result?.jokerPoints);
  if (!hasPoints && !joker) return DASH;
  return [hasPoints ? String(result.points) : null, joker || null]
    .filter(Boolean)
    .join(' ');
}

export function getVisibleResultColumns(scoringFormat, results = []) {
  const format = String(scoringFormat || 'table_a');
  const list = results.map((item) => normalizeCompetitionResult(item));

  const jumpoffByData = list.some((item) => item.jumpoff === true);
  const pointsByData = list.some(
    (item) => isPresent(item.points) || isPresent(item.jokerPoints)
  );

  return {
    faults: format === 'table_a' || format === 'table_a_jumpoff',
    time:
      format === 'table_a' ||
      format === 'table_a_jumpoff' ||
      format === 'table_c',
    jumpoff: format === 'table_a_jumpoff' || jumpoffByData,
    points:
      format === 'accumulator_joker' || format === 'table_c' || pointsByData,
  };
}

export function sortCompetitionResults(results) {
  return [...(results || [])].sort((a, b) => {
    const left = normalizeCompetitionResult(a);
    const right = normalizeCompetitionResult(b);
    const leftClassified = isClassifiedResult(left);
    const rightClassified = isClassifiedResult(right);
    if (leftClassified && rightClassified) {
      return (toNumber(left.place) ?? 9999) - (toNumber(right.place) ?? 9999);
    }
    if (leftClassified) return -1;
    if (rightClassified) return 1;
    return 0;
  });
}

export function resultCell(result, kind, secondsLabel) {
  if (!isClassifiedResult(result)) {
    if (kind === 'place') return formatPlaceOrStatus(result);
    return DASH;
  }

  switch (kind) {
    case 'place':
      return formatPlaceOrStatus(result);
    case 'faults':
      return formatFaults(result.faults);
    case 'time':
      return formatResultTime(result.time, secondsLabel);
    case 'jumpoff':
      return formatJumpoff(result, secondsLabel);
    case 'points':
      return formatPoints(result);
    default:
      return DASH;
  }
}

export function resultGridTemplate(columns) {
  const parts = ['0.45fr', 'minmax(7rem, 2fr)', 'minmax(7rem, 2fr)', '0.8fr'];
  if (columns.faults) parts.push('0.7fr');
  if (columns.time) parts.push('1fr');
  if (columns.jumpoff) parts.push('1.3fr');
  if (columns.points) parts.push('1.1fr');
  return parts.join(' ');
}
