import { ConvexHttpClient } from "convex/browser";

const convexServerClient = new ConvexHttpClient(process.env.CONVEX_URL!);

export default convexServerClient;
