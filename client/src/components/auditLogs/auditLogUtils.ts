import { User as UserType } from "../../services";

/**
 * Format a timestamp string into a readable date/time format
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const shortYear = String(date.getFullYear()).slice(-2);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const time = `${String(displayHours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;

  return `${day}/${month}/${shortYear} - ${time}`;
};

/**
 * Get the Badge variant for an action type
 */
export const getActionVariant = (
  action: string
): "default" | "success" | "info" | "danger" => {
  switch (action) {
    case "CREATE":
      return "success";
    case "UPDATE":
      return "info";
    case "DELETE":
      return "danger";
    case "VIEW":
      return "default";
    default:
      return "default";
  }
};

/**
 * Get user display name from user map
 */
export const getUserDisplayName = (
  actorId: string,
  users: Map<string, UserType>
): { name: string; email?: string } => {
  const user = users.get(actorId);
  if (user) {
    return {
      name: user.name || user.email || "Unknown User",
      email: user.email,
    };
  }
  return { name: "Unknown User" };
};

/**
 * Format JSON or object for display
 */
export const formatJsonForDisplay = (
  value: string | object | null | undefined
): string => {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }

  return String(value);
};
