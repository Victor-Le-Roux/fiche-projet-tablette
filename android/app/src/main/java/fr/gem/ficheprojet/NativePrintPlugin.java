package fr.gem.ficheprojet;

import android.annotation.SuppressLint;
import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativePrint")
public class NativePrintPlugin extends Plugin {
    private WebView printWebView;

    @SuppressLint("SetJavaScriptEnabled")
    @PluginMethod
    public void printHtml(PluginCall call) {
        String title = call.getString("title", "Fiche projet");
        String html = call.getString("html", "");

        if (html.trim().isEmpty()) {
            call.reject("Aucun contenu a imprimer.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            printWebView = new WebView(getContext());
            printWebView.getSettings().setJavaScriptEnabled(false);
            printWebView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
                    if (printManager == null) {
                        call.reject("Service d'impression indisponible.");
                        return;
                    }

                    PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(title);
                    PrintAttributes attributes = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build();

                    printManager.print(title, adapter, attributes);

                    JSObject result = new JSObject();
                    result.put("started", true);
                    call.resolve(result);
                }
            });
            printWebView.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
        });
    }
}
