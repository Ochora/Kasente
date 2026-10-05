package ug.kasente.app;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** Small background web requests. Answers arrive in the page as kasenteCloud(id, ok, status, text). */
public class Net {
    static final String CLAUDE_MODEL = "claude-sonnet-5-5";

    static void get(final MainActivity act, final String url, final String id) {
        new Thread(() -> {
            int status = 0;
            String text = "";
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(15000);
                c.setReadTimeout(20000);
                status = c.getResponseCode();
                text = Cloud.read(status >= 400 ? c.getErrorStream() : c.getInputStream());
                c.disconnect();
            } catch (Exception e) {
                text = String.valueOf(e.getMessage());
            }
            answer(act, id, status, text);
        }).start();
    }

    /** One question to Claude with the person's own API key. Only the anonymised summary is sent. */
    static void claude(final MainActivity act, final String key, final String system, final String question, final String id) {
        new Thread(() -> {
            int status = 0;
            String text = "";
            try {
                if (key == null || key.length() < 10) throw new IllegalStateException("no_key");
                JSONObject body = new JSONObject()
                        .put("model", CLAUDE_MODEL)
                        .put("max_tokens", 1200)
                        .put("system", system)
                        .put("messages", new JSONArray().put(new JSONObject().put("role", "user").put("content", question)));
                HttpURLConnection c = (HttpURLConnection) new URL("https://api.anthropic.com/v1/messages").openConnection();
                c.setRequestMethod("POST");
                c.setDoOutput(true);
                c.setConnectTimeout(20000);
                c.setReadTimeout(90000);
                c.setRequestProperty("content-type", "application/json");
                c.setRequestProperty("x-api-key", key);
                c.setRequestProperty("anthropic-version", "2023-06-01");
                try (OutputStream os = c.getOutputStream()) {
                    os.write(body.toString().getBytes(StandardCharsets.UTF_8));
                }
                status = c.getResponseCode();
                String raw = Cloud.read(status >= 400 ? c.getErrorStream() : c.getInputStream());
                c.disconnect();
                if (status >= 200 && status < 300) {
                    JSONArray content = new JSONObject(raw).optJSONArray("content");
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; content != null && i < content.length(); i++) {
                        JSONObject part = content.getJSONObject(i);
                        if ("text".equals(part.optString("type"))) sb.append(part.optString("text"));
                    }
                    text = sb.toString();
                } else {
                    JSONObject err = new JSONObject(raw.isEmpty() ? "{}" : raw).optJSONObject("error");
                    text = err != null ? err.optString("message", raw) : raw;
                }
            } catch (IllegalStateException e) {
                status = 401;
                text = "Add your Claude API key in Settings first.";
            } catch (Exception e) {
                text = String.valueOf(e.getMessage());
            }
            answer(act, id, status, text);
        }).start();
    }

    private static void answer(MainActivity act, String id, int status, String text) {
        boolean ok = status >= 200 && status < 300;
        act.js("window.kasenteCloud&&kasenteCloud(" + JSONObject.quote(id) + "," + ok + "," + status + "," + JSONObject.quote(text) + ")");
    }
}
