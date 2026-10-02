package ug.kasente.app;

import android.Manifest;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.net.Uri;
import android.os.Build;
import android.os.CancellationSignal;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Methods the app screens can call as window.KasenteNative.*. */
public class Bridge {
    private static final String NOTIF = "android.permission.POST_NOTIFICATIONS";
    private final MainActivity act;

    Bridge(MainActivity activity) {
        act = activity;
    }

    @JavascriptInterface
    public String appVersion() {
        try {
            return act.getPackageManager().getPackageInfo(act.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "test";
        }
    }

    /* ---------- SMS ---------- */

    @JavascriptInterface
    public boolean hasSmsPermission() {
        return act.checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public void requestSmsPermission() {
        act.runOnUiThread(() -> {
            act.selfLaunched = true;
            act.requestPermissions(new String[]{Manifest.permission.READ_SMS}, MainActivity.REQ_SMS);
        });
    }

    /** Inbox messages newer than sinceMillis that mention an amount in shillings. */
    @JavascriptInterface
    public String readSms(String sinceMillis) {
        JSONArray out = new JSONArray();
        if (!hasSmsPermission()) return "[]";
        long since;
        try {
            since = Long.parseLong(sinceMillis);
        } catch (Exception e) {
            since = 0;
        }
        Cursor c = null;
        try {
            c = act.getContentResolver().query(Uri.parse("content://sms/inbox"),
                    new String[]{"address", "body", "date"}, "date > ?",
                    new String[]{String.valueOf(since)}, "date ASC");
            if (c != null) {
                int n = 0;
                while (c.moveToNext() && n < 3000) {
                    String body = c.getString(1);
                    if (body == null) continue;
                    String low = body.toLowerCase();
                    if (!(low.contains("ugx") || low.contains("shs") || low.contains("ush"))) continue;
                    JSONObject o = new JSONObject();
                    String address = c.getString(0);
                    o.put("address", address == null ? "" : address);
                    o.put("body", body);
                    o.put("date", c.getLong(2));
                    out.put(o);
                    n++;
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (c != null) c.close();
        }
        return out.toString();
    }

    /* ---------- notifications ---------- */

    @JavascriptInterface
    public void requestNotifications() {
        if (Build.VERSION.SDK_INT < 33) return;
        if (act.checkSelfPermission(NOTIF) == PackageManager.PERMISSION_GRANTED) return;
        act.runOnUiThread(() -> {
            act.selfLaunched = true;
            act.requestPermissions(new String[]{NOTIF}, MainActivity.REQ_NOTIF);
        });
    }

    @JavascriptInterface
    public void schedule(String json) {
        Reminders.schedule(act.getApplicationContext(), json);
    }

    /* ---------- files ---------- */

    @JavascriptInterface
    public boolean saveFile(String name, String mime, String text) {
        if (Build.VERSION.SDK_INT < 29) return false;
        try {
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            Uri u = act.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (u == null) return false;
            try (OutputStream os = act.getContentResolver().openOutputStream(u)) {
                if (os == null) return false;
                os.write(text.getBytes(StandardCharsets.UTF_8));
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @JavascriptInterface
    public void share(String text, String name) {
        act.runOnUiThread(() -> {
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            i.putExtra(Intent.EXTRA_SUBJECT, name);
            i.putExtra(Intent.EXTRA_TEXT, text);
            act.selfLaunched = true;
            act.startActivity(Intent.createChooser(i, "Save or send " + name));
        });
    }

    /* ---------- account and OneDrive ---------- */

    @JavascriptInterface
    public boolean cloudConfigured() {
        return Cloud.configured(act);
    }

    @JavascriptInterface
    public boolean cloudSignedIn() {
        return Cloud.signedIn(act);
    }

    @JavascriptInterface
    public void cloudSignIn() {
        act.runOnUiThread(() -> Cloud.startSignIn(act));
    }

    @JavascriptInterface
    public void cloudSignOut() {
        Cloud.signOut(act);
    }

    @JavascriptInterface
    public void cloudCall(String op, String name, String body, String id) {
        Cloud.call(act, op, name, body, id);
    }

    /* ---------- look ---------- */

    @JavascriptInterface
    public void setBars(String hex, boolean lightBackground) {
        act.setBars(hex, lightBackground);
    }

    /* ---------- fingerprint / face ---------- */

    @JavascriptInterface
    public boolean canBiometric() {
        if (Build.VERSION.SDK_INT < 29) return false;
        try {
            BiometricManager m = act.getSystemService(BiometricManager.class);
            return m != null && m.canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS;
        } catch (Exception e) {
            return false;
        }
    }

    @JavascriptInterface
    public void biometric() {
        if (Build.VERSION.SDK_INT < 29) {
            act.js("kasenteOnBiometric(false)");
            return;
        }
        act.runOnUiThread(() -> {
            try {
                BiometricPrompt prompt = new BiometricPrompt.Builder(act)
                        .setTitle("Unlock Kasente")
                        .setNegativeButton("Use PIN", act.getMainExecutor(),
                                (dialog, which) -> act.js("kasenteOnBiometric(false)"))
                        .build();
                act.selfLaunched = true;
                prompt.authenticate(new CancellationSignal(), act.getMainExecutor(),
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                                act.js("kasenteOnBiometric(true)");
                            }

                            @Override
                            public void onAuthenticationError(int code, CharSequence message) {
                                act.js("kasenteOnBiometric(false)");
                            }
                        });
            } catch (Exception e) {
                act.js("kasenteOnBiometric(false)");
            }
        });
    }
}
