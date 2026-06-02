export const Preferences = {
  get: async (_: { key: string }) => ({ value: null as string | null }),
  set: async (_: { key: string; value: string }) => {},
  remove: async (_: { key: string }) => {},
}
