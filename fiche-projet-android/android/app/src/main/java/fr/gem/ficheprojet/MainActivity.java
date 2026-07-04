package fr.gem.ficheprojet;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    registerPlugin(NativePrintPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
