# Dokumentácia – react-native-datawedge-intents

> Dokumentácia modulu **react-native-datawedge-intents** (verzia `0.1.8`, licencia MIT, autor: Darryn Campbell).
> Modul je klasický React Native **natívny modul pre Android**, ktorý umožňuje komunikáciu so službou
> **Zebra DataWedge** prostredníctvom Android Intentov – ovládanie čítačky kódov a prijímanie naskenovaných dát.

Modul je určený pre mobilné terminály **Zebra** (TC5x, TC7x, TC8000, MC40 a ďalšie), na ktorých beží
Android a služba DataWedge.

---

## Prehľad dokumentácie

| Dokument | Obsah |
|---|---|
| [instalacia.md](./instalacia.md) | Inštalácia a nastavenie projektu – bare React Native aj **Expo (development build)** |
| [nastavenie-datawedge.md](./nastavenie-datawedge.md) | Konfigurácia služby DataWedge, profilov, intent outputu a DP API príkazov |
| [architektura.md](./architektura.md) | Architektúra modulu, vnútorný chod, tok dát, životný cyklus receiverov |
| [api-referencia.md](./api-referencia.md) | Kompletná referencia API – metódy, konštanty, eventy, TypeScript typy |
| [priklady-pouzitia.md](./priklady-pouzitia.md) | Praktické ukážky kódu – skenovanie, soft trigger, profily, odpovede |
| [troubleshooting.md](./troubleshooting.md) | Riešenie problémov, časté otázky, známe obmedzenia a zastarané API |

---

## Rýchly štart

```tsx
import { NativeEventEmitter } from 'react-native';
import { DataWedgeIntents } from 'react-native-datawedge-intents';

// Emitter vždy vytvor BEZ argumentu – modul neimplementuje addListener/removeListeners
const datawedgeEmitter = new NativeEventEmitter();

// 1. Registrácia prijímača broadcastov z DataWedge
DataWedgeIntents.registerBroadcastReceiver({
  filterActions: [
    'com.myapp.ACTION',
    'com.symbol.datawedge.api.RESULT_ACTION',
  ],
  filterCategories: ['android.intent.category.DEFAULT'],
});

// 2. Počúvanie udalostí
const sub = datawedgeEmitter.addListener('datawedge_broadcast_intent', (intent) => {
  console.log('Broadcast z DataWedge:', intent);
});

// 3. Spustenie skenovania (soft trigger)
DataWedgeIntents.sendBroadcastWithExtras({
  action: 'com.symbol.datawedge.api.ACTION',
  extras: {
    'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER': 'TOGGLE_SCANNING',
  },
});

// 4. Odpočúvanie pri unmount
// sub.remove();
```

> **Poznámka:** Modul je **Android-only**. Na iOS je export `DataWedgeIntents` `undefined`.

> **Poznámka k `NativeEventEmitter`:** vytváraj ho **bez argumentu** (`new NativeEventEmitter()`).
> Natívny modul neimplementuje metódy `addListener()` / `removeListeners()`, takže odovzdanie
> `NativeModules.DataWedgeIntents` by vo vývojom režime vypísalo varovanie. Eventy aj tak
> prichádzajú cez globálny `RCTDeviceEventEmitter`, takže bezargumentové volanie funguje spoľahlivo.

---

## Súvisiaci obrázok

V repozitári sa nachádza snímka obrazovky konfigurácie DataWedge:

- `screens/datawedge.png` – ukážka nastavenia intent outputu v DataWedge (obsah obrázka nie je súčasťou tohto textu)

---

## Podporné prostredie

| Prostredie | Podpora | Poznámka |
|---|---|---|
| React Native (bare, CLI) | ✅ | Autolinking od RN 0.60 |
| Expo development build / dev client | ✅ | Vyžaduje natívny build (`npx expo run:android` alebo EAS Build) |
| Expo Go | ❌ | Obsahuje len natívne moduly dodávané s Expo Go |
| Android | ✅ | Minimálne `minSdkVersion 16` (funkčnosť overená na moderných zariadeniach Zebra) |
| iOS | ❌ | Modul nemá iOS implementáciu |
| New Architecture (Fabric/TurboModules) | ⚠️ | Modul nepoužíva Codegen – funguje cez interop vrstvu legacy natívnych modulov |

---

## Uvedenie na prevádzku – 3 kroky

1. Nainštaluj modul podľa [instalacia.md](./instalacia.md).
2. Nastav profil v DataWedge podľa [nastavenie-datawedge.md](./nastavenie-datawedge.md).
3. Zapoj API podľa [api-referencia.md](./api-referencia.md) a [priklady-pouzitia.md](./priklady-pouzitia.md).

Ak niečo nefunguje, pozri [troubleshooting.md](./troubleshooting.md).
