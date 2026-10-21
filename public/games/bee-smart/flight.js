export function createFlight(need = 4) {
  return { seconds: 150 + need * 15, stamina: 100, warned: false, rescued: false };
}
export function updateFlight(flight, dt, { active = true, moving = false, boost = false, wet = false, wind = false, shelter = false } = {}) {
  if (!active || flight.rescued) return null;
  const elapsed = Math.min(.1, Math.max(0, dt));
  flight.seconds = Math.max(0, flight.seconds - elapsed);
  const drain = (moving ? .5 : .1) + (boost && moving ? 12 : 0) + (!shelter && wet ? 1.2 : 0) + (!shelter && wind ? .6 : 0);
  flight.stamina = Math.max(0, Math.min(100, flight.stamina - drain * elapsed));
  if (flight.seconds === 0 || flight.stamina === 0) { flight.rescued = true; return 'rescue'; }
  if (!flight.warned && (flight.seconds <= 35 || flight.stamina <= 20)) { flight.warned = true; return 'warning'; }
  return null;
}
export function sipNectar(flight, amount = 15) { flight.stamina = Math.min(100, flight.stamina + amount); }
