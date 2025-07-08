const slugify = (text: string) => {
  return (text ?? "").trim().replace(/\s+/g, "-").toLowerCase();
};

export default slugify;
