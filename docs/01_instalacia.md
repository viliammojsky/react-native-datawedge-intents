# Inštalácia a nastavenie projektu

Modul `react-native-datawedge-intents` je klasický React Native natívny modul (Android, Java).
Neobsahuje žiadny Expo config plugin ani Codegen definíciu – preto sa inštaluje štandardným spôsobom
cez závislosti a **autolinking**.

---

## 1. Požiadavky

| Požiadavka | Hodnota |
|---|---|
| React Native | `>= 0.56` (peer dependency) |
| Expo SDK | ľubovoľný, ale **vyžaduje development build** (pozri kapitolu 3) |
| Platforma | Android (iOS nie je podporované) |
| `minSdkVersion` | 16 (default v `android/build.gradle`) |
| `compileSdkVersion` | prevzaté z `rootProject.ext`, fallback 27 – **odporúča sa zvýšiť** na úroveň projektu |
| Zariadenie | Zebra mobilný počítač so službou **DataWedge** |
| Služba DataWedge | nainštalovaná, povolená a nakonfigurovaná ([nastavenie-datawedge.md](./nastavenie-datawedge.md)) |

---

## 2. Inštalácia v React Native projekte (bare)

```bash
npm install react-native-datawedge-intents --save
# alebo
yarn add react-native-datawedge-intents
```

Od React Native **0.60** je spojenie automatické (autolinking). Manuálne
`react-native link` je zastarané a už sa nepoužíva.

### Overenie prepojenia

```bash
# Windows
npx react-native config | findstr /I datawedge

# macOS / Linux
npx react-native config | grep -i datawedge
```

alebo jednoducho skús import – ak sa modul nenašiel, Metro zahlási chybu
`Unable to resolve module react-native-datawedge-intents`.

### Prípadná manuálna registrácia (len pre veľmi staré RN verzie)

Ak autolinking nefunguje, je potrebné modul registrovať v `MainApplication`:

```java
import com.darryncampbell.rndatawedgeintents.RNDataWedgeIntentsPackage;

// v getPackages()
packages.add(new RNDataWedgeIntentsPackage());
```

---

## 3. Inštalácia v Expo projekte

Modul **nefunguje v Expo Go**, pretože Expo Go obsahuje len vopred kompilované natívne moduly.
Je potrebný **development build** (native dev client) alebo plná produkčná build verzia.

### 3.1 Nainštaluj balík

```bash
npm install react-native-datawedge-intents
```

### 3.2 Vytvorte development build

**Možnosť A – lokálny build (najrýchlejšie na vývoj):**

```bash
npx expo run:android
```

**Možnosť B – cloudový build cez EAS:**

```bash
npm install -g eas-cli
eas build --profile development --platform android
```

### 3.3 Prebuild (ak projekt používa CNG / `android/` priečinok je v `.gitignore`)

```bash
npx expo prebuild --platform android
```

Prebuild je potrebný opakovať pri zmene natívnych závislostí alebo konfigurácie `app.json` / `app.config.js`.

### 3.4 Konfigurácia `app.json` / `app.config.js`

Modul **nevyžaduje žiadny záznam v `app.json`** – nemá vlastný Expo config plugin.
Jediné, čo treba riešiť, sú prípadné vlastné Android permissie aplikácie (samotný modul žiadne nepridáva).

```json
{
  "expo": {
    "name": "Moja Zebra app",
    "platforms": ["android"],
    "android": {
      "package": "com.mojaapp"
    }
  }
}
```

### 3.5 Spustenie vývojného servera

```bash
npx expo start --dev-client
```

### 3.6 Expo – súhrn

| Krok | Príkaz |
|---|---|
| Inštalácia balíka | `npm install react-native-datawedge-intents` |
| Lokálny dev build | `npx expo run:android` |
| Cloudový dev build | `eas build --profile development --platform android` |
| Prebuild | `npx expo prebuild --platform android` |
| Štart vývoja | `npx expo start --dev-client` |

---

## 4. Android build konfigurácia

`android/build.gradle` modulu:

| Parametr | Hodnota | Poznámka |
|---|---|---|
| plugin | `com.android.library` | ide o knižnicu, nie aplikáciu |
| `compileSdkVersion` | z `rootProject.ext`, fallback `27` | projekt má definovať vlastnú hodnotu |
| `buildToolsVersion` | z `rootProject.ext`, fallback `27.0.3` | – |
| `minSdkVersion` | z `rootProject.ext`, fallback `16` | – |
| `targetSdkVersion` | z `rootProject.ext`, fallback `27` | – |
| závislosti | `com.facebook.react:react-native:+` | – |

Modul **nevyžaduje žiadne povolenia (permissions)** v `AndroidManifest.xml`
(súbor `android/src/main/AndroidManifest.xml` je prázdny – obsahuje len balík `com.darryncampbell.rndatawedgeintents`).

---

## 5. Overenie fungovania

Po nainštalovaní a nakonfigurovaní DataWedge otestuj základný príjem udalostí:

```tsx
import { useEffect } from 'react';
import { NativeEventEmitter, NativeModules, View, Text } from 'react-native';
import { DataWedgeIntents } from 'react-native-datawedge-intents';

// bez argumentu – modul nemá addListener/removeListeners
const datawedgeEmitter = new NativeEventEmitter();

export default function App() {
  useEffect(() => {
    console.log('Natívny modul:', NativeModules.DataWedgeIntents ? 'načítaný' : 'ERROR');

    DataWedgeIntents.registerBroadcastReceiver({
      filterActions: ['com.mojaapp.ACTION'],
      filterCategories: ['android.intent.category.DEFAULT'],
    });

    const sub = datawedgeEmitter.addListener('datawedge_broadcast_intent', (e) =>
      console.log('event:', e),
    );

    return () => sub.remove();
  }, []);

  return (
    <View>
      <Text>Skenuj kód tlačidlom na zariadení</Text>
    </View>
  );
}
```

Ak v logoch vidíš `event: {...}` s obsahom skenu, modul funguje. Ak nie, pokračuj na
[nastavenie-datawedge.md](./nastavenie-datawedge.md) a [troubleshooting.md](./troubleshooting.md).

---

## 6. Odinštalácia

```bash
npm uninstall react-native-datawedge-intents
npx expo prebuild --platform android   # len ak používaš CNG
```
