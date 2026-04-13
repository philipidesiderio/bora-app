import "server-only";
import { createCaller } from "./root";
import { createTRPCContext } from "./trpc";
import { headers } from "next/headers";

export const api = createCaller(
  async () => createTRPCContext({ req: { headers: await headers() } as any })
);
