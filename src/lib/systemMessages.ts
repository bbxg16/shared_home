const READ_SYSTEM_MESSAGES_KEY = "youben-read-system-message-ids";

export function getReadSystemMessageIds() {
  try {
    const rawValue = localStorage.getItem(READ_SYSTEM_MESSAGES_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return new Set(Array.isArray(parsedValue) ? parsedValue.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function getUnreadSystemMessageIds(messages: { id: string }[]) {
  const readIds = getReadSystemMessageIds();
  return new Set(messages.filter((message) => !readIds.has(message.id)).map((message) => message.id));
}

export function markSystemMessagesRead(messageIds: string[]) {
  if (messageIds.length === 0) {
    return;
  }

  const nextReadIds = new Set([...getReadSystemMessageIds(), ...messageIds]);
  localStorage.setItem(READ_SYSTEM_MESSAGES_KEY, JSON.stringify([...nextReadIds]));
}
