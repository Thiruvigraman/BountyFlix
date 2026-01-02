import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const PORT = Number(Deno.env.get("PORT") || 8000);

console.log(`Listening on 0.0.0.0:${PORT}`);

serve(
  () => new Response("BountyFlix is live ✅"),
  {
    port: PORT,
    hostname: "0.0.0.0" // 🔥 THIS IS THE FIX
  }
);