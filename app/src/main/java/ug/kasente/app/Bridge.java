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
    /** Messages that mention an amount in an African currency (or US dollars). */
    private static final java.util.regex.Pattern MONEY = java.util.regex.Pattern.compile(
            "(?i)(ugx|ush|shs|ksh|kes|tsh|tzs|rwf|frw|bif|fbu|cdf|ngn|\u20a6|ghs|gh\u20b5|ghc|zmw|mwk|etb|birr|xof|xaf|fcfa|cfa|usd|us\\$|zar|\\bR\\s?\\d)");

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
                    if (!MONEY.matcher(body).find()) continue;
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
    public String saveFile(String name, String mime, String text) {
        return write(name, mime, text.getBytes(StandardCharsets.UTF_8));
    }

    /** Same as saveFile, for binary files such as Excel workbooks (content passed as base64). */
    @JavascriptInterface
    public String saveFileB64(String name, String mime, String b64) {
        try {
            return write(name, mime, android.util.Base64.decode(b64, android.util.Base64.DEFAULT));
        } catch (Exception e) {
            return "";
        }
    }

    /** Writes to the phone's Downloads folder and returns the file's address, or "" if it failed. */
    private String write(String name, String mime, byte[] bytes) {
        if (Build.VERSION.SDK_INT < 29) {
            try {
                java.io.File dir = new java.io.File(act.getExternalFilesDir(null), "exports");
                dir.mkdirs();
                java.io.File f = new java.io.File(dir, name);
                try (java.io.FileOutputStream os = new java.io.FileOutputStream(f)) {
                    os.write(bytes);
                }
                return androidx.core.content.FileProvider.getUriForFile(act, act.getPackageName() + ".files", f).toString();
            } catch (Exception e) {
                return "";
            }
        }
        try {
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            Uri u = act.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (u == null) return "";
            try (OutputStream os = act.getContentResolver().openOutputStream(u)) {
                if (os == null) return "";
                os.write(bytes);
            }
            return u.toString();
        } catch (Exception e) {
            return "";
        }
    }

    /** Opens a saved file in another app (Excel, Sheets, a PDF viewer…). */
    @JavascriptInterface
    public boolean openUri(String uri, String mime) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(Uri.parse(uri), mime);
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            act.selfLaunched = true;
            act.startActivity(Intent.createChooser(i, "Open with"));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Sends a saved file through WhatsApp, email, Drive… */
    @JavascriptInterface
    public void shareUri(String uri, String mime) {
        act.runOnUiThread(() -> {
            try {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType(mime);
                i.putExtra(Intent.EXTRA_STREAM, Uri.parse(uri));
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                act.selfLaunched = true;
                act.startActivity(Intent.createChooser(i, "Share"));
            } catch (Exception ignored) {
            }
        });
    }

    /** Hands an HTML report to Android's print system, where "Save as PDF" makes the PDF. */
    @JavascriptInterface
    public void printHtml(String title, String html) {
        act.runOnUiThread(() -> {
            try {
                final android.webkit.WebView pv = new android.webkit.WebView(act);
                act.printView = pv;
                pv.setWebViewClient(new android.webkit.WebViewClient() {
                    @Override
                    public void onPageFinished(android.webkit.WebView view, String url) {
                        android.print.PrintManager pm = (android.print.PrintManager) act.getSystemService(android.content.Context.PRINT_SERVICE);
                        android.print.PrintAttributes attrs = new android.print.PrintAttributes.Builder()
                                .setMediaSize(android.print.PrintAttributes.MediaSize.ISO_A4).build();
                        act.selfLaunched = true;
                        pm.print(title, view.createPrintDocumentAdapter(title), attrs);
                    }
                });
                pv.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
            } catch (Exception e) {
                act.js("window.toast&&toast('PDF reports need Android 5 or newer.','alert')");
            }
        });
    }

    /* ---------- receipts ---------- */

    @JavascriptInterface
    public void scanReceipt(boolean camera) {
        act.runOnUiThread(() -> act.scanReceipt(camera));
    }

    @JavascriptInterface
    public String takeReceipt() {
        String r = act.pendingReceipt;
        act.pendingReceipt = null;
        return r == null ? "" : r;
    }

    @JavascriptInterface
    public void deleteReceipt(String path) {
        if (path == null || !path.startsWith("receipts/") || path.contains("..")) return;
        new java.io.File(act.getFilesDir(), path).delete();
    }

    /* ---------- internet helpers: exchange rates and the optional Claude advisor ---------- */

    @JavascriptInterface
    public void fetchRates(String id) {
        Net.get(act, "https://open.er-api.com/v6/latest/USD", id);
    }

    @JavascriptInterface
    public void setAiKey(String key) {
        act.getSharedPreferences("kasente_ai", 0).edit().putString("key", key == null ? "" : key.trim()).apply();
    }

    @JavascriptInterface
    public boolean hasAiKey() {
        return act.getSharedPreferences("kasente_ai", 0).getString("key", "").length() > 10;
    }

    @JavascriptInterface
    public void aiAsk(String system, String question, String id) {
        String key = act.getSharedPreferences("kasente_ai", 0).getString("key", "");
        Net.claude(act, key, system, question, id);
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
