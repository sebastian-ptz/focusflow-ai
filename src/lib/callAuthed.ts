import { supabase } from "@/integrations/supabase/client";

/**
 * Wrap a server-fn call to attach the current user's Bearer token,
 * required by `requireSupabaseAuth` middleware.
 */
export async function callAuthed<TInput, TOutput>(
  fn: (args: { data: TInput; headers?: Record<string, string> }) => Promise<TOutput>,
  data: TInput,
): Promise<TOutput> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in.");
  return fn({ data, headers: { Authorization: `Bearer ${token}` } });
}
