import { handleCaptureLead } from "./handler.ts";

console.info("capture-lead function started");

Deno.serve(handleCaptureLead);
