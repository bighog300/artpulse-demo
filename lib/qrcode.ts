const TRANSPARENT_1PX_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

export function toDataURL(input: string) {
  const payload = Buffer.from(input, "utf8").toString("base64");
  return `data:image/png;base64,${TRANSPARENT_1PX_PNG_BASE64}${payload}`;
}
