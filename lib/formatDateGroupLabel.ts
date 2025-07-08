import { format, isToday, isYesterday } from "date-fns";

const formatDateGroupLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
};

export default formatDateGroupLabel;
