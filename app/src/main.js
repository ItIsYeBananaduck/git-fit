import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import convexConfig from "../convex/_generated/client";

const convex = new ConvexReactClient(convexConfig);

// Wrap your app with ConvexProvider
<ConvexProvider client={convex}>
  {/* Your app components */}
</ConvexProvider>;