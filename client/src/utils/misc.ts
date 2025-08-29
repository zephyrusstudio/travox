export const formatDate = (d: string) => {
  console.log("🚀 ~ formatDate ~ d:", d);
  return new Date(d).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};
