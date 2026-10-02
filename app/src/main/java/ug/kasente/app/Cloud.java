package ug.kasente.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Base64;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;

/**
 * Sign-in with a Microsoft account (personal or work) and storage in that person's own OneDrive,
 * inside the private app folder (OneDrive → Apps → Kasente). Uses the authorization-code flow with
 * PKCE, so no secret is kept in the app. Tokens stay in this app's private storage on the phone.
 */
public class Cloud {
    static final String PREFS = "kasente_cloud";
    static final String REDIRECT = "kasente://auth";
    static final String AUTH = "https://login.microsoftonline.com/common/oauth2/v2.0/";
    static final String GRAPH = "https://graph.microsoft.com/v1.0/";
    static final String SCOPES = "openid email profile offline_access User.Read Files.ReadWrite.AppFolder";

    static String clientId(Context ctx) {
        return ctx.getString(R.string.ms_client_id).trim();
    }

    static boolean configured(Context ctx) {
        return clientId(ctx).length() > 0;
    }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean signedIn(Context ctx) {
        return prefs(ctx).getString("refresh", null) != null;
    }

    static void signOut(Context ctx) {
        prefs(ctx).edit().clear().apply();
    }

    private static String b64url(byte[] b) {
        return Base64.encodeToString(b, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
    }

    private static String enc(String s) {
        try {
            return URLEncoder.encode(s, "UTF-8");
        } catch (Exception e) {
            return s;
        }
    }

    /** Opens the Microsoft sign-in page in the phone's browser. */
    static void startSignIn(MainActivity act) {
        try {
            SecureRandom r = new SecureRandom();
            byte[] v = new byte[48];
            r.nextBytes(v);
            String verifier = b64url(v);
            String challenge = b64url(MessageDigest.getInstance("SHA-256")
                    .digest(verifier.getBytes(StandardCharsets.US_ASCII)));
            byte[] st = new byte[16];
            r.nextBytes(st);
            String state = b64url(st);
            prefs(act).edit().putString("verifier", verifier).putString("state", state).apply();
            String url = AUTH + "authorize?client_id=" + enc(clientId(act))
                    + "&response_type=code&response_mode=query"
                    + "&redirect_uri=" + enc(REDIRECT)
                    + "&scope=" + enc(SCOPES)
                    + "&code_challenge=" + challenge + "&code_challenge_method=S256"
                    + "&state=" + state + "&prompt=select_account";
            act.selfLaunched = true;
            act.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception e) {
            act.js("window.kasenteOnSignIn&&kasenteOnSignIn(false," + JSONObject.quote("Couldn't open the sign-in page: " + e.getMessage()) + ")");
        }
    }

    /** Called when Microsoft sends the browser back to kasente://auth?code=… */
    static void handleRedirect(final MainActivity act, Uri data) {
        final String error = data.getQueryParameter("error");
        final String code = data.getQueryParameter("code");
        final String state = data.getQueryParameter("state");
        if (error != null || code == null) {
            String why = data.getQueryParameter("error_description");
            act.js("window.kasenteOnSignIn&&kasenteOnSignIn(false," + JSONObject.quote(why != null ? why : "Sign-in was cancelled.") + ")");
            return;
        }
        if (state == null || !state.equals(prefs(act).getString("state", ""))) {
            act.js("window.kasenteOnSignIn&&kasenteOnSignIn(false,\"The sign-in reply didn't match. Please try again.\")");
            return;
        }
        new Thread(() -> {
            try {
                String body = "client_id=" + enc(clientId(act))
                        + "&grant_type=authorization_code"
                        + "&code=" + enc(code)
                        + "&redirect_uri=" + enc(REDIRECT)
                        + "&code_verifier=" + enc(prefs(act).getString("verifier", ""))
                        + "&scope=" + enc(SCOPES);
                saveTokens(act, post(AUTH + "token", body));
                act.js("window.kasenteOnSignIn&&kasenteOnSignIn(true,'onedrive')");
            } catch (Exception e) {
                act.js("window.kasenteOnSignIn&&kasenteOnSignIn(false," + JSONObject.quote("Sign-in failed: " + e.getMessage()) + ")");
            }
        }).start();
    }

    private static void saveTokens(Context ctx, JSONObject t) throws Exception {
        if (!t.has("access_token")) throw new Exception(t.optString("error_description", "no token returned"));
        SharedPreferences.Editor e = prefs(ctx).edit()
                .putString("access", t.getString("access_token"))
                .putLong("expires", System.currentTimeMillis() + (t.optLong("expires_in", 3600) - 120) * 1000L)
                .remove("verifier").remove("state");
        if (t.has("refresh_token")) e.putString("refresh", t.getString("refresh_token"));
        e.apply();
    }

    /** A valid access token, refreshing it if needed. Must not run on the main thread. */
    static String token(Context ctx) throws Exception {
        SharedPreferences p = prefs(ctx);
        String access = p.getString("access", null);
        if (access != null && System.currentTimeMillis() < p.getLong("expires", 0)) return access;
        String refresh = p.getString("refresh", null);
        if (refresh == null) throw new IllegalStateException("signed_out");
        String body = "client_id=" + enc(clientId(ctx))
                + "&grant_type=refresh_token"
                + "&refresh_token=" + enc(refresh)
                + "&scope=" + enc(SCOPES);
        saveTokens(ctx, post(AUTH + "token", body));
        return p.getString("access", null);
    }

    private static JSONObject post(String url, String form) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setConnectTimeout(20000);
        c.setReadTimeout(30000);
        c.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        try (OutputStream os = c.getOutputStream()) {
            os.write(form.getBytes(StandardCharsets.UTF_8));
        }
        int code = c.getResponseCode();
        String text = read(code >= 400 ? c.getErrorStream() : c.getInputStream());
        c.disconnect();
        return new JSONObject(text.isEmpty() ? "{}" : text);
    }

    static String read(InputStream in) throws Exception {
        if (in == null) return "";
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        in.close();
        return out.toString("UTF-8");
    }

    /**
     * op: "me" (who is signed in), "get" (read a file from the app folder), "put" (write one).
     * Runs in the background and answers through window.kasenteCloud(id, ok, status, text).
     */
    static void call(final MainActivity act, final String op, final String name, final String body, final String id) {
        new Thread(() -> {
            int status = 0;
            String text = "";
            try {
                String tok = token(act);
                String path;
                String method = "GET";
                if ("me".equals(op)) path = "me?$select=displayName,mail,userPrincipalName";
                else path = "me/drive/special/approot:/" + enc(name).replace("+", "%20") + ":/content";
                if ("put".equals(op)) method = "PUT";
                HttpURLConnection c = (HttpURLConnection) new URL(GRAPH + path).openConnection();
                c.setRequestMethod(method);
                c.setConnectTimeout(20000);
                c.setReadTimeout(60000);
                c.setInstanceFollowRedirects(false);
                c.setRequestProperty("Authorization", "Bearer " + tok);
                if ("put".equals(op)) {
                    c.setDoOutput(true);
                    c.setRequestProperty("Content-Type", "application/json");
                    try (OutputStream os = c.getOutputStream()) {
                        os.write(body.getBytes(StandardCharsets.UTF_8));
                    }
                }
                status = c.getResponseCode();
                if (status >= 300 && status < 400 && c.getHeaderField("Location") != null) {
                    // File contents come from a pre-signed download link that must not get the token.
                    String loc = c.getHeaderField("Location");
                    c.disconnect();
                    c = (HttpURLConnection) new URL(loc).openConnection();
                    c.setConnectTimeout(20000);
                    c.setReadTimeout(60000);
                    status = c.getResponseCode();
                }
                text = read(status >= 400 ? c.getErrorStream() : c.getInputStream());
                c.disconnect();
            } catch (IllegalStateException e) {
                status = 401;
                text = "signed_out";
            } catch (Exception e) {
                text = String.valueOf(e.getMessage());
            }
            boolean ok = status >= 200 && status < 300;
            act.js("window.kasenteCloud&&kasenteCloud(" + JSONObject.quote(id) + "," + ok + "," + status + "," + JSONObject.quote(text) + ")");
        }).start();
    }
}
