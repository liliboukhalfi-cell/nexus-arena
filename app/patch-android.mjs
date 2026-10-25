// Ajuste le projet Android généré par Capacitor (dossier android/, recréé à chaque build) :
// paysage, vibrations, numéro de version, et une activité plein écran immersif qui garde l'écran allumé.
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const AND = join(HERE, 'android', 'app');
const PKG = 'com.liliboukhalfi.zonehostile';

// 1. Manifeste : jeu en paysage, permission de vibrer
const manPath = join(AND, 'src', 'main', 'AndroidManifest.xml');
let man = await readFile(manPath, 'utf8');
if (!man.includes('android.permission.VIBRATE'))
  man = man.replace('</manifest>', '    <uses-permission android:name="android.permission.VIBRATE" />\n</manifest>');
if (!man.includes('screenOrientation')) man = man.replace(/<activity\b/, '<activity\n            android:screenOrientation="sensorLandscape"');
await writeFile(manPath, man);

// 2. Numéro de version (versionCode = numéro du build GitHub, toujours croissant : les mises à jour s'installent par-dessus)
const gradlePath = join(AND, 'build.gradle');
let gradle = await readFile(gradlePath, 'utf8');
const code = parseInt(process.env.VERSION_CODE || '1', 10), name = process.env.VERSION_NAME || '1.0.' + code;
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode ' + code).replace(/versionName\s+"[^"]*"/, 'versionName "' + name + '"');
await writeFile(gradlePath, gradle);

// 3. Activité : barres système cachées (réapparaissent d'un glissement puis repartent), écran toujours allumé
const javaDir = join(AND, 'src', 'main', 'java', ...PKG.split('.'));
await mkdir(javaDir, { recursive: true });
for (const f of await readdir(javaDir)) if (f.startsWith('MainActivity')) await rm(join(javaDir, f));
await writeFile(join(javaDir, 'MainActivity.java'), `package ${PKG};

import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    hideBars();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) hideBars();
  }

  private void hideBars() {
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    c.hide(WindowInsetsCompat.Type.systemBars());
    c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
  }
}
`);
console.log('Projet Android ajusté : version', name, '(' + code + ')');
