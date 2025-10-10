import { query } from "../convex/_generated/server";

export const hello = query({
  args: {},
  handler: () => {
    return "Hello World!";
  },
});