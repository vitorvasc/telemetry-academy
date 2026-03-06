// Type declarations for YAML imports via vite-plugin-yaml
declare module '*.yaml' {
  const data: Record<string, unknown>;
  export default data;
}

declare module '*.yml' {
  const data: Record<string, unknown>;
  export default data;
}
