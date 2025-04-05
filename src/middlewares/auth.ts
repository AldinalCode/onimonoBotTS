import { Context, MiddlewareFn } from "telegraf";
import { supabase } from "../lib/supabase";

export const getUserRole: MiddlewareFn<Context> = async (ctx, next) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      ctx.state.role = "Guest";
      return next();
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error || !user) {
      ctx.state.role = "Guest"; // Default role jika pengguna tidak ditemukan
    } else {
      ctx.state.role = user.role; // Simpan role pengguna di `ctx.state`
    }

    return next();
  } catch (error) {
    console.error("Error in getUserRole middleware:", error);
    ctx.state.role = "Guest"; // Default role jika terjadi error
    return next();
  }
};
