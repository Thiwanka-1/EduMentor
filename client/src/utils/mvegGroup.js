export function groupByDay(items = []) {
  const groups = {};
  const now = new Date();

  function labelFor(d) {
    const day = new Date(d);
    const diff = Math.floor((now - day) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return "Earlier";
  }

  for (const it of items) {
    const label = labelFor(it.createdAt || Date.now());
    groups[label] = groups[label] || [];
    groups[label].push(it);
  }

  return groups;
}
