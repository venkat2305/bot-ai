export function setChatData(sessionData) {
  const existing = localStorage.getItem("chatBotData");
  let parsed = [];
  if (existing) {
    parsed = JSON.parse(existing);
  }
  parsed.push(sessionData);
  localStorage.setItem("chatBotData", JSON.stringify(parsed));
}

export function getChatData() {
  const existing = localStorage.getItem("chatBotData");
  if (existing) {
    return JSON.parse(existing);
  }
  return [];
}