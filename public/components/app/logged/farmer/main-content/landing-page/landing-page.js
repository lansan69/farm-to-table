import { farmerCache } from '../../farmer.js';

const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40 → ≈ 251.33

// ── Date helpers ──────────────────────────────────────────────────────────────

function startOfWeek() {
  const now = new Date();
  const day = now.getDay();                   // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;     // Monday as first day
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) >= startOfWeek();
}

// ── SVG ring renderer ─────────────────────────────────────────────────────────

function renderRing(container, selector, value, max) {
  const svg = container.querySelector(selector);
  if (!svg) return;

  const arc   = svg.querySelector('.ring-arc');
  const label = svg.querySelector('.ring-value');
  const pct   = max > 0 ? Math.min(value / max, 1) : 0;

  if (arc)   arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - pct);
  if (label) label.textContent = value;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function init(container) {
  const negs = farmerCache.negociaciones;

  const total      = negs.length;
  const semana     = negs.filter(n => isThisWeek(n.fecha_creacion)).length;
  const completadas = negs.filter(n =>
    n.estado_negociacion === 'aceptada' || n.estado_negociacion === 'completada'
  ).length;

  // Subtitles
  const setSub = (id, text) => {
    const el = container.querySelector(id);
    if (el) el.textContent = text;
  };

  setSub('#sub-semana',      total > 0 ? `${Math.round(semana / total * 100)}% del total` : '—');
  setSub('#sub-total',       total === 1 ? '1 negociación registrada' : `${total} negociaciones registradas`);
  setSub('#sub-completadas', total > 0 ? `${Math.round(completadas / total * 100)}% de tasa de éxito` : '—');

  renderRing(container, '#ring-semana',      semana,      Math.max(total, 1));
  renderRing(container, '#ring-total',       total,       Math.max(total, 1));
  renderRing(container, '#ring-completadas', completadas, Math.max(total, 1));
}

export function cleanup() {}
