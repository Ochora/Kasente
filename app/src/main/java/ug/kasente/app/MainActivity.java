package ug.kasente.app;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.view.Window;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

/**
 * Kasente test build: hosts the app screens (assets/index.html) in a WebView and
 * gives them access to SMS, the camera, fingerprint unlock, reminders and file saving
 * through the "KasenteNative" bridge.
 */
public class MainActivity extends Activity {
    static final String HOST = "appassets.androidplatform.net";
    static final String START = "https://" + HOST + "/index.html";
    static final int REQ_SMS = 11, REQ_FILE = 12, REQ_NOTIF = 13, REQ_RECEIPT = 14;

    WebView web;
    ValueCallback<Uri[]> fileCallback;
    Uri cameraUri;
    long pausedAt = 0;
    boolean selfLaunched = false;
    /** Photo the camera is writing to for a receipt; survives Android closing the app meanwhile. */
    Uri receiptUri;
    /** Result waiting for the page to collect with KasenteNative.takeReceipt(). */
    volatile String pendingReceipt = null;
    android.webkit.WebView printView;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (state != null && state.getString("receiptUri") != null) receiptUri = Uri.parse(state.getString("receiptUri"));
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(true);

        web.addJavascriptInterface(new Bridge(this), "KasenteNative");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || path.equals("/")) path = "/index.html";
                String type = mime(path);
                try {
                    InputStream in;
                    if (path.startsWith("/receipts/") && !path.contains("..")) {
                        in = new java.io.FileInputStream(new java.io.File(getFilesDir(), path.substring(1)));
                    } else {
                        in = getAssets().open(path.substring(1));
                    }
                    return new WebResourceResponse(type, type.startsWith("text") ? "utf-8" : null, in);
                } catch (Exception e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not found", null,
                            new ByteArrayInputStream(new byte[0]));
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try {
                    selfLaunched = true;
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                return openChooser(callback, params);
            }
        });

        web.loadUrl(START);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    /** Microsoft sign-in comes back here as kasente://auth?code=… */
    void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data != null && "kasente".equals(data.getScheme()) && "auth".equals(data.getHost())) {
            selfLaunched = true;
            Cloud.handleRedirect(this, data);
        }
    }

    static String mime(String p) {
        p = p.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    /** File picker for receipt photos and backup files; offers the camera for images. */
    boolean openChooser(ValueCallback<Uri[]> callback, WebChromeClient.FileChooserParams params) {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileCallback = callback;
        cameraUri = null;

        Intent pick;
        try {
            pick = params.createIntent();
        } catch (Exception e) {
            pick = new Intent(Intent.ACTION_GET_CONTENT);
            pick.setType("*/*");
            pick.addCategory(Intent.CATEGORY_OPENABLE);
        }
        boolean image = false;
        String[] types = params.getAcceptTypes();
        if (types != null) {
            for (String t : types) {
                if (t != null && t.startsWith("image")) image = true;
            }
        }
        Intent chooser = Intent.createChooser(pick, image ? "Add a receipt photo" : "Choose a file");
        if (image && Build.VERSION.SDK_INT >= 29) {
            try {
                ContentValues v = new ContentValues();
                v.put(MediaStore.Images.Media.DISPLAY_NAME, "kasente_receipt_" + System.currentTimeMillis() + ".jpg");
                v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                v.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Kasente");
                cameraUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                if (cameraUri != null) {
                    Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                    cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
                }
            } catch (Exception e) {
                cameraUri = null;
            }
        }
        try {
            selfLaunched = true;
            startActivityForResult(chooser, REQ_FILE);
        } catch (Exception e) {
            fileCallback = null;
            return false;
        }
        return true;
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (receiptUri != null) out.putString("receiptUri", receiptUri.toString());
    }

    /** Opens the camera (or the gallery) for a receipt. The result is read with on-device text recognition. */
    void scanReceipt(boolean camera) {
        try {
            Intent i;
            receiptUri = null;
            if (camera) {
                java.io.File dir = new java.io.File(getCacheDir(), "camera");
                dir.mkdirs();
                java.io.File f = new java.io.File(dir, "receipt_" + System.currentTimeMillis() + ".jpg");
                receiptUri = androidx.core.content.FileProvider.getUriForFile(this, getPackageName() + ".files", f);
                i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                i.putExtra(MediaStore.EXTRA_OUTPUT, receiptUri);
                i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } else {
                i = new Intent(Intent.ACTION_GET_CONTENT);
                i.setType("image/*");
                i.addCategory(Intent.CATEGORY_OPENABLE);
            }
            selfLaunched = true;
            startActivityForResult(i, REQ_RECEIPT);
        } catch (Exception e) {
            receiptUri = null;
            deliverReceipt(Receipts.error(camera ? "Couldn't open the camera: " + e.getMessage() : "Couldn't open your photos."));
        }
    }

    void deliverReceipt(String json) {
        pendingReceipt = json;
        js("window.kasenteReceiptReady&&kasenteReceiptReady()");
    }

    @Override
    protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        if (req == REQ_RECEIPT) {
            Uri src = null;
            if (result == RESULT_OK) src = (data != null && data.getData() != null) ? data.getData() : receiptUri;
            receiptUri = null;
            if (src == null) {
                deliverReceipt(Receipts.error("cancelled"));
                return;
            }
            js("window.kasenteReceiptReading&&kasenteReceiptReading()");
            Receipts.read(this, src);
            return;
        }
        if (req != REQ_FILE || fileCallback == null) return;
        Uri[] out = null;
        if (result == RESULT_OK) {
            if (data != null && data.getData() != null) out = new Uri[]{data.getData()};
            else if (cameraUri != null) out = new Uri[]{cameraUri};
        }
        if (cameraUri != null && (out == null || !out[0].equals(cameraUri))) {
            try {
                getContentResolver().delete(cameraUri, null, null);
            } catch (Exception ignored) {
            }
        }
        fileCallback.onReceiveValue(out);
        fileCallback = null;
        cameraUri = null;
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
        if (req == REQ_SMS) js("window.kasenteOnPermission&&kasenteOnPermission('sms'," + ok + ")");
    }

    void js(final String code) {
        runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript(code, null);
        });
    }

    void setBars(final String hex, final boolean lightBackground) {
        runOnUiThread(() -> {
            try {
                int c = Color.parseColor(hex.trim());
                Window w = getWindow();
                w.setStatusBarColor(c);
                w.setNavigationBarColor(c);
                web.setBackgroundColor(c);
                int f = w.getDecorView().getSystemUiVisibility();
                if (lightBackground) f |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                else f &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= 26) {
                    if (lightBackground) f |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    else f &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
                w.getDecorView().setSystemUiVisibility(f);
            } catch (Exception ignored) {
            }
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        pausedAt = System.currentTimeMillis();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (pausedAt == 0) return;
        long away = selfLaunched ? 0 : System.currentTimeMillis() - pausedAt;
        selfLaunched = false;
        js("window.kasenteOnResume&&kasenteOnResume(" + away + ")");
    }

    @Override
    public void onBackPressed() {
        if (web == null) {
            finish();
            return;
        }
        web.evaluateJavascript("window.kasenteBack?kasenteBack():false", v -> {
            if (!"true".equals(v)) finish();
        });
    }
}
