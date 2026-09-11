export type Friend = { name: string; active: boolean };

export const FRIEND_ROSTER: Friend[] = [
  { name: 'Elizabeth', active: true },
  { name: 'Mario', active: true },
  { name: 'Maya', active: true },
  { name: 'Priya', active: true },
  { name: 'Leo', active: true },
  { name: 'Jordan', active: false },
  { name: 'Sam', active: false },
  { name: 'Aisha', active: false },
];

const SCRIPTED: Record<string, string> = {
  Elizabeth: 'I love that dress on you!',
  Mario: "I love it and I don't like a lot of things.",
};

const GENERIC = [
  'This looks amazing on you!',
  'Get it, no question.',
  "I'd wear this in a heartbeat.",
  "Yes! That's the one.",
];

function nameSeed(name: string) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function friendLine(name: string): string {
  if (SCRIPTED[name]) return SCRIPTED[name];
  return GENERIC[nameSeed(name) % GENERIC.length];
}
