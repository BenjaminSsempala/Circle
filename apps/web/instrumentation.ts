// instrumentation.ts or src/instrumentation.ts
import { logger } from "@/lib/axiom/server";
import { createOnRequestError } from "@axiomhq/nextjs";

// This globally catches all uncaught route, server component, and server action errors

export function register() {
  // You can leave this empty if you don't need initialization code
}

export const onRequestError = createOnRequestError(logger);