package ug.kasente.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarms are cleared when the phone restarts, so put the reminders back. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent i) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(i.getAction())) return;
        String json = ctx.getSharedPreferences(Reminders.PREFS, Context.MODE_PRIVATE).getString("json", "[]");
        Reminders.schedule(ctx, json);
    }
}
