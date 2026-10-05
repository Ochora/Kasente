package ug.kasente.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.media.ExifInterface;
import android.net.Uri;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

/**
 * Reads a receipt photo on the phone with Google ML Kit text recognition (no internet needed),
 * keeps a smaller copy of the photo inside the app, and hands the text lines with their
 * positions to the app screens, which work out the shop, date, items and total.
 */
public class Receipts {

    static String error(String message) {
        try {
            return new JSONObject().put("ok", false).put("error", message).toString();
        } catch (Exception e) {
            return "{\"ok\":false}";
        }
    }

    static void read(final MainActivity act, final Uri src) {
        new Thread(() -> {
            final Bitmap bmp;
            final String saved;
            try {
                bmp = load(act, src, 2000);
                if (bmp == null) throw new Exception("The photo couldn't be opened.");
                saved = keepCopy(act, bmp);
            } catch (Exception e) {
                act.deliverReceipt(error(e.getMessage()));
                return;
            }
            act.runOnUiThread(() -> {
                try {
                    TextRecognizer rec = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
                    rec.process(InputImage.fromBitmap(bmp, 0))
                            .addOnSuccessListener(text -> act.deliverReceipt(toJson(text, saved, bmp.getWidth(), bmp.getHeight())))
                            .addOnFailureListener(e -> act.deliverReceipt(withImage(error("The text couldn't be read: " + e.getMessage()), saved)));
                } catch (Exception e) {
                    act.deliverReceipt(withImage(error("Text reading isn't available on this phone."), saved));
                }
            });
        }).start();
    }

    private static String withImage(String json, String img) {
        try {
            return new JSONObject(json).put("img", img).toString();
        } catch (Exception e) {
            return json;
        }
    }

    private static String toJson(Text text, String img, int w, int h) {
        try {
            JSONArray lines = new JSONArray();
            for (Text.TextBlock b : text.getTextBlocks()) {
                for (Text.Line l : b.getLines()) {
                    Rect r = l.getBoundingBox();
                    JSONObject o = new JSONObject().put("t", l.getText());
                    if (r != null) o.put("x", r.left).put("y", r.top).put("w", r.width()).put("h", r.height());
                    lines.put(o);
                }
            }
            return new JSONObject().put("ok", true).put("text", text.getText()).put("lines", lines)
                    .put("img", img).put("w", w).put("h", h).toString();
        } catch (Exception e) {
            return error(e.getMessage());
        }
    }

    /** Decodes the photo at most maxSide pixels on its longest side, turned the right way up. */
    static Bitmap load(MainActivity act, Uri uri, int maxSide) throws Exception {
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        try (InputStream in = act.getContentResolver().openInputStream(uri)) {
            BitmapFactory.decodeStream(in, null, o);
        }
        int side = Math.max(o.outWidth, o.outHeight), sample = 1;
        while (side / (sample * 2) >= maxSide) sample *= 2;
        BitmapFactory.Options d = new BitmapFactory.Options();
        d.inSampleSize = sample;
        Bitmap b;
        try (InputStream in = act.getContentResolver().openInputStream(uri)) {
            b = BitmapFactory.decodeStream(in, null, d);
        }
        if (b == null) return null;
        int rotate = 0;
        try (InputStream in = act.getContentResolver().openInputStream(uri)) {
            int ori = new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            if (ori == ExifInterface.ORIENTATION_ROTATE_90) rotate = 90;
            else if (ori == ExifInterface.ORIENTATION_ROTATE_180) rotate = 180;
            else if (ori == ExifInterface.ORIENTATION_ROTATE_270) rotate = 270;
        } catch (Exception ignored) {
        }
        float scale = Math.min(1f, maxSide / (float) Math.max(b.getWidth(), b.getHeight()));
        if (rotate != 0 || scale < 1f) {
            Matrix m = new Matrix();
            m.postScale(scale, scale);
            m.postRotate(rotate);
            Bitmap r = Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true);
            if (r != b) b.recycle();
            b = r;
        }
        return b;
    }

    /** Saves a smaller JPEG in the app's own storage and returns its path, e.g. receipts/r1696.jpg */
    private static String keepCopy(MainActivity act, Bitmap b) {
        try {
            File dir = new File(act.getFilesDir(), "receipts");
            dir.mkdirs();
            float scale = Math.min(1f, 1280f / Math.max(b.getWidth(), b.getHeight()));
            Bitmap s = scale < 1f ? Bitmap.createScaledBitmap(b, Math.round(b.getWidth() * scale), Math.round(b.getHeight() * scale), true) : b;
            String name = "r" + System.currentTimeMillis() + ".jpg";
            try (FileOutputStream out = new FileOutputStream(new File(dir, name))) {
                s.compress(Bitmap.CompressFormat.JPEG, 78, out);
            }
            if (s != b) s.recycle();
            return "receipts/" + name;
        } catch (Exception e) {
            return "";
        }
    }
}
