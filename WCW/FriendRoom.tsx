import { FriendInfluenceResult, CatalogItem, BudgetResult } from "../types";

interface Props {
  friendInfluence: FriendInfluenceResult;
  items: CatalogItem[];
  budgetCheck: BudgetResult;
}

const AVATARS = ["🧑", "👩", "🧔", "👨", "🧕", "👱", "🧒", "👧"];

export function FriendRoom({ friendInfluence, items, budgetCheck }: Props) {
  const sortedVotes = Object.entries(friendInfluence.votes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="friend-room">
      <div className="friend-header">
        <div className="friend-avatars">
          {AVATARS.slice(0, Math.min(friendInfluence.friendCount, 8)).map((a, i) => (
            <span key={i} className="friend-avatar">{a}</span>
          ))}
        </div>
        <p className="friend-count">
          {friendInfluence.friendCount} friends shopped for the same occasion
        </p>
      </div>

      <div className="friend-top-pick">
        <span className="friend-star">★</span>
        <span>Most popular among your circle: <strong>{friendInfluence.topPick}</strong></span>
      </div>

      <div className="friend-votes">
        {sortedVotes.map(([itemId, votes]) => {
          const item = items.find((i) => i.id === itemId);
          if (!item) return null;
          const maxVotes = sortedVotes[0][1];
          const pct = Math.round((votes / maxVotes) * 100);
          return (
            <div key={itemId} className="vote-row">
              <span className="vote-item-name">{item.name}</span>
              <div className="vote-bar-wrap">
                <div className="vote-bar" style={{ width: `${pct}%` }} />
              </div>
              <span className="vote-count">{votes}</span>
            </div>
          );
        })}
      </div>

      <div className={`budget-badge ${budgetCheck.approved ? "budget-ok" : "budget-warn"}`}>
        {budgetCheck.approved ? "✓" : "!"} {budgetCheck.message}
      </div>
    </div>
  );
}
