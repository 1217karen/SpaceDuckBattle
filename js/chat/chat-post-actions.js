//chat-post-actions.js

export function createPostActions(actions = {}) {
  return {
    onReply:
      typeof actions.onReply === "function"
        ? actions.onReply
        : null,
    onDelete:
      typeof actions.onDelete === "function"
        ? actions.onDelete
        : null,
    onOpenThread:
      typeof actions.onOpenThread === "function"
        ? actions.onOpenThread
        : null,
    onQuote:
      typeof actions.onQuote === "function"
        ? actions.onQuote
        : null,
    onHide:
      typeof actions.onHide === "function"
        ? actions.onHide
        : null
  };
}
