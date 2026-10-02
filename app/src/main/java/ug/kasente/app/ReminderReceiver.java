package ug.kasente.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Shows a scheduled reminder. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent i) {
        Reminders.notify(ctx, i.getIntExtra("id", 0), i.getStringExtra("title"), i.getStringExtra("body"));
    }
}
