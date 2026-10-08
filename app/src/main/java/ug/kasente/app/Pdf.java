package ug.kasente.app;

import android.content.ContentValues;
import android.graphics.Canvas;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Turns an HTML page (an invoice, receipt or report) into a real A4 PDF file in Downloads,
 * without the print screen, so it can be sent straight to a client on WhatsApp or email.
 * The page is laid out 794 CSS pixels wide (A4 at 96 dpi) and drawn page by page.
 */
public class Pdf {
    static final int CSS_W = 794, CSS_H = 1123;      // A4 in CSS pixels
    static final int PT_W = 595, PT_H = 842;         // A4 in PDF points

    static void make(final MainActivity act, final String name, final String html, final String id) {
        act.runOnUiThread(() -> {
            try {
                final float density = act.getResources().getDisplayMetrics().density;
                final int pxW = Math.round(CSS_W * density);
                final WebView w = new WebView(act);
                w.getSettings().setJavaScriptEnabled(false);
                w.setVerticalScrollBarEnabled(false);
                w.setAlpha(0.01f);
                final FrameLayout root = act.root;
                root.addView(w, 0, new FrameLayout.LayoutParams(pxW, Math.round(CSS_H * density)));
                w.setWebViewClient(new WebViewClient() {
                    boolean done = false;

                    @Override
                    public void onPageFinished(final WebView view, String url) {
                        if (done) return;
                        done = true;
                        view.postDelayed(() -> {
                            int cssH = Math.max(CSS_H, view.getContentHeight());
                            ViewGroup.LayoutParams lp = view.getLayoutParams();
                            lp.height = Math.round(cssH * density);
                            view.setLayoutParams(lp);
                            view.measure(View.MeasureSpec.makeMeasureSpec(pxW, View.MeasureSpec.EXACTLY),
                                    View.MeasureSpec.makeMeasureSpec(lp.height, View.MeasureSpec.EXACTLY));
                            view.layout(0, 0, pxW, lp.height);
                            view.postDelayed(() -> render(act, view, name, cssH, density, id), 450);
                        }, 350);
                    }
                });
                w.loadDataWithBaseURL("https://" + MainActivity.HOST + "/", html, "text/html", "utf-8", null);
            } catch (Exception e) {
                answer(act, id, false, String.valueOf(e.getMessage()));
            }
        });
    }

    private static void render(MainActivity act, WebView view, String name, int cssH, float density, String id) {
        PdfDocument doc = new PdfDocument();
        try {
            int pages = Math.max(1, (int) Math.ceil(cssH / (double) CSS_H - 0.02));
            float scale = PT_W / (CSS_W * density);
            for (int i = 0; i < pages; i++) {
                PdfDocument.Page page = doc.startPage(new PdfDocument.PageInfo.Builder(PT_W, PT_H, i + 1).create());
                Canvas c = page.getCanvas();
                c.scale(scale, scale);
                c.translate(0, -i * CSS_H * density);
                view.draw(c);
                doc.finishPage(page);
            }
            String uri = save(act, name, doc);
            answer(act, id, uri.length() > 0, uri);
        } catch (Exception e) {
            answer(act, id, false, String.valueOf(e.getMessage()));
        } finally {
            doc.close();
            act.root.removeView(view);
            view.destroy();
        }
    }

    private static String save(MainActivity act, String name, PdfDocument doc) throws Exception {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Kasente");
            Uri u = act.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (u == null) return "";
            try (OutputStream os = act.getContentResolver().openOutputStream(u)) {
                doc.writeTo(os);
            }
            return u.toString();
        }
        File dir = new File(act.getExternalFilesDir(null), "exports");
        dir.mkdirs();
        File f = new File(dir, name);
        try (FileOutputStream os = new FileOutputStream(f)) {
            doc.writeTo(os);
        }
        return androidx.core.content.FileProvider.getUriForFile(act, act.getPackageName() + ".files", f).toString();
    }

    private static void answer(MainActivity act, String id, boolean ok, String text) {
        act.js("window.kasenteCloud&&kasenteCloud(" + JSONObject.quote(id) + "," + ok + "," + (ok ? 200 : 0) + "," + JSONObject.quote(text) + ")");
    }
}
