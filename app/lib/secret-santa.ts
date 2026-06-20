/** Tirage Secret Santa : chaque participant reçoit exactement un autre (dérivation Fisher-Yates). */
export function drawSecretSanta(names: string[]): { giver: string; receiver: string }[] {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (clean.length < 2) throw new Error("Au moins 2 participants sont requis.");

  const receivers = [...clean];
  for (let i = receivers.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    if (receivers[i] === clean[i]) {
      j = j === i ? (i + 1) % receivers.length : j;
      if (receivers[j] === clean[i]) {
        const swap = (a: number, b: number) => {
          const t = receivers[a];
          receivers[a] = receivers[b];
          receivers[b] = t;
        };
        swap(i, (i + 1) % receivers.length);
        continue;
      }
    }
    const tmp = receivers[i];
    receivers[i] = receivers[j]!;
    receivers[j] = tmp!;
  }
  for (let k = 0; k < clean.length; k++) {
    if (receivers[k] === clean[k]) {
      const next = (k + 1) % clean.length;
      const tmp = receivers[k];
      receivers[k] = receivers[next]!;
      receivers[next] = tmp!;
    }
  }

  return clean.map((giver, idx) => ({ giver, receiver: receivers[idx]! }));
}
