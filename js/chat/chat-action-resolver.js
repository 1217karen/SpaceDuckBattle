// chat-action-resolver.js

import { chatActionDefinitions } from "./chat-action-data.js";

export function getAvailableChatActions({
  place,
  character
} = {}) {
  if (!place || !character) {
    return [];
  }

  return chatActionDefinitions.filter(action => {
    if (action.type === "common") {
      return true;
    }

    return false;
  });
}
