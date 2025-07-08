const hasTextContent = (text: string) =>
  !!text.replace(/<(.|\n)*?>/g, "").trim();

export default hasTextContent;
