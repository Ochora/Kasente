package ug.kasente.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/** Bill and loan reminders as phone notifications, scheduled from the app's own data. */
public class Reminders {
    static final String PREFS = "kasente_reminders";
    static final String CHANNEL = "reminders";

    /** json: [{title, body, at (epoch millis)}]. Replaces everything scheduled before. */
    static void schedule(Context ctx, String json) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        int old = prefs.getInt("count", 0);
        for (int i = 0; i < old; i++) am.cancel(pending(ctx, i, null, null));
        int n = 0;
        try {
            JSONArray a = new JSONArray(json);
            long now = System.currentTimeMillis();
            for (int i = 0; i < a.length() && n < 64; i++) {
                JSONObject o = a.getJSONObject(i);
                long at = o.getLong("at");
                if (at <= now) continue;
                am.set(AlarmManager.RTC_WAKEUP, at, pending(ctx, n, o.optString("title"), o.optString("body")));
                n++;
            }
        } catch (Exception ignored) {
        }
        prefs.edit().putInt("count", n).putString("json", json).apply();
    }

    static PendingIntent pending(Context ctx, int id, String title, String body) {
        Intent i = new Intent(ctx, ReminderReceiver.class);
        i.setAction("ug.kasente.app.REMINDER." + id);
        i.putExtra("id", id);
        if (title != null) i.putExtra("title", title);
        if (body != null) i.putExtra("body", body);
        return PendingIntent.getBroadcast(ctx, id, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void notify(Context ctx, int id, String title, String body) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || title == null) return;
        if (Build.VERSION.SDK_INT >= 33
                && ctx.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Bill and loan reminders",
                    NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent open = new Intent(ctx, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent tap = PendingIntent.getActivity(ctx, 1000 + id, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(ctx, CHANNEL)
                : new Notification.Builder(ctx);
        String text = body == null ? "" : body;
        b.setSmallIcon(R.drawable.ic_stat_kasente)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setColor(0xFF0E6B66)
                .setContentIntent(tap)
                .setAutoCancel(true);
        nm.notify(2000 + id, b.build());
    }
}
