# SPECS – Aktuálny kontext projektu

> **Súbor:** `SPECS.md` (koreň projektu)  
> **Účel:** Jednotný zdroj aktuálneho kontextu projektu pre ďalšiu prácu (dokumentáciu, údržbu, rozširovanie).  
> **Posledná aktualizácia:** 2026-10-07  
> **Jazyk dokumentácie:** slovenčina

---

## 1. Identifikácia projektu

| Položka | Hodnota |
|---|---|
| Názov balíka | `react-native-datawedge-intents` |
| Verzia | `0.1.8` |
| Popis | React Native Android modul pre komunikáciu so Zebra DataWedge cez Android Intents |
| Licencia | MIT |
| Autor | Darryn Campbell |
| Repozitár | <https://github.com/darryncampbell/react-native-datawedge-intents> |
| Issues | <https://github.com/darryncampbell/react-native-datawedge-intents/issues> |
| Hlavný vstup (`main`) | `index.tsx` |
| Peer dependency | `react-native >= 0.56` |
| Pracovný priečinok | `C:\development\rnApps\packages\react-native-datawedge-intents` |
| Git repo | áno |

**Úloha modulu:** most medzi JavaScriptom a službou **Zebra DataWedge** – odosielanie príkazov
(soft trigger, profily, plugin) ako broadcast intentov a prijímanie výsledkov skenovania späť
ako eventov do JS.

---

## 2. Stav projektu

| Oblasť | Stav |
|---|---|
| Zdrojový kód modulu | ✅ hotový (bez zmien v rámci tejto úlohy) |
| Dokumentácia (`docs/`) | ✅ vytvorená (7 súborov, slovensky) |
| `SPECS.md` | ✅ tento súbor (aktuálny kontext) |
| `AGENTS.md` | ✅ vytvorený – inštrukcie agenta, načítava sa automaticky pri štarte OpenCode |
| Testy | ❌ žiadne (`npm test` len vypíše chybu „no test specified") |
| Expo config plugin | ❌ súčasťou balíka nie je |
| Codegen / TurboModule | ❌ klasický `ReactContextBaseJavaModule` |
| iOS implementácia | ❌ neexistuje |

---

## 3. Štruktúra repozitára

```
react-native-datawedge-intents/
├── index.tsx                      # JS/TS API – named export DataWedgeIntents, typy
├── package.json                   # main: index.tsx, peer RN >= 0.56
├── README.md                      # pôvodné README (EN) – čiastočne neaktuálne
├── SPECS.md                       # aktuálny kontext projektu
├── AGENTS.md                      # inštrukcie agenta (načítava OpenCode pri štarte)
├── LICENSE                        # MIT
├── .eslintrc.json
├── screens/
│   └── datawedge.png              # snímka konfigurácie DataWedge (obsah sa v docs nepoužíva)
├── android/
│   ├── build.gradle               # com.android.library, fallback compileSdk 27, minSdk 16
│   └── src/main/
│       ├── AndroidManifest.xml    # prázdny (len package declaration)
│       └── java/com/darryncampbell/rndatawedgeintents/
│           ├── RNDataWedgeIntentsModule.java    # jadro – @ReactMethod, receivers, eventy
│           ├── RNDataWedgeIntentsPackage.java   # ReactPackage registrácia
│           └── ObservableObject.java            # singleton, Observer vzor
├── docs/                          # ⬅ vytvorená dokumentácia
│   ├── README.md
│   ├── instalacia.md
│   ├── nastavenie-datawedge.md
│   ├── architektura.md
│   ├── api-referencia.md
│   ├── priklady-pouzitia.md
│   └── troubleshooting.md
└── node_modules/
```

---

## 4. Verejné API (aktuálny stav)

### Import

```tsx
// ✅ správne – modul má IBA named export
import { DataWedgeIntents } from 'react-native-datawedge-intents';

// ⚠️ default import z README nemusí fungovať (index.tsx nemá `export default`)
```

### Metódy

| Metóda | Stav | Event |
|---|---|---|
| `registerBroadcastReceiver({filterActions, filterCategories})` | ✅ aktuálne | `datawedge_broadcast_intent` |
| `sendBroadcastWithExtras({action, extras})` | ✅ aktuálne | – (vyžaduje `extras`, inak NPE) |
| `registerReceiver({action, category})` | ⚠️ deprecated | `barcode_scan` |
| `sendIntent({action, parameterValue})` | ⚠️ deprecated | – |

### Eventy (prijímať cez `NativeEventEmitter` – vždy bez argumentu konštruktora)

| Event | Payload |
|---|---|
| `datawedge_broadcast_intent` | všetky extras intentu + `v2API: true` |
| `barcode_scan` | `{ source, data, labelType }` |
| `enumerated_scanners` | `{ Scanners: string[] }` |

### Konštanty (všetky deprecated)

`ACTION_SOFTSCANTRIGGER`, `ACTION_SCANNERINPUTPLUGIN`, `ACTION_ENUMERATESCANNERS`,
`ACTION_SETDEFAULTPROFILE`, `ACTION_RESETDEFAULTPROFILE`, `ACTION_SWITCHTOPROFILE`,
`START_SCANNING`, `STOP_SCANNING`, `TOGGLE_SCANNING`, `ENABLE_PLUGIN`, `DISABLE_PLUGIN`.

---

## 5. Kľúčové fakty a rozhodnutia

1. **Android-only** – na iných platformách je `DataWedgeIntents` `undefined`.
2. **Bez Expo pluginu** – v `app.json` sa nič nepridáva; pre Expo je nutný **development build**
   (`npx expo run:android` / EAS), **Expo Go nefunguje**.
3. **Dokumentácia je v slovenčine** (potvrdené používateľom); pôvodný `README.md` ostáva po anglicky.
4. **Obrázky sa v dokumentácii nepoužívajú** – `screens/datawedge.png` je zmienený len názvom.
5. **Mermaid** sa používa na diagramy, tabuľky sú v GFM formáte.
6. Receivery sa registrujú s **`RECEIVER_EXPORTED`** (kód) – README spomína `RECEIVER_NOT_EXPORTED`,
   dokumentácia sa riadi podľa kódu.
7. `genericReceiver` (nová cesta) sa **neodregistrováva pri pause** aplikácie.
8. Modul **neposkytuje `addListener`/`removeListeners`** → `new NativeEventEmitter()` sa volá
   **bez argumentu** (s `NativeModules.DataWedgeIntents` ako argumentom by RN vypísalo varovanie);
   eventy aj tak prichádzajú cez globálny `RCTDeviceEventEmitter`.
9. **Pôvodný `README.md` v koreni ostáva s `DeviceEventEmitter`** (nemení sa) – zmena
   na `NativeEventEmitter` sa týka len dokumentácie v `docs/` a tohto súboru.

---

## 6. Známe obmedzenia / technický dlh

- Zastarané API: `sendIntent()`, `registerReceiver()`, konštanty `ACTION_*`.
- `java.util.Observable` / `Observer` sú v Jave deprecované.
- `@providesModule` hlavička v `index.tsx` (zastaraná haste direktíva).
- Bez `codegenConfig` – na New Architecture funguje len cez interop vrstvu.
- `android/build.gradle` má nízke fallback hodnoty (`compileSdk 27`, `buildTools 27.0.3`).
- 3-argové `registerReceiver(receiver, filter, flags)` existuje až od **API 26** – na starších
  zariadeniach hrozí crash.
- `byte[]` a `ArrayList` extras sa z intentu odstraňujú (bridge ich nevie preniesť).
- Žiadne automatické testy.

---

## 7. Dokumentácia – obsah a vzťahy

| Súbor | Pokrýva | Odkazuje na |
|---|---|---|
| `docs/README.md` | vstup, rýchly štart, prehľad prostredí | všetky ostatné |
| `docs/instalacia.md` | inštalácia RN + Expo, overenie | nastavenie, troubleshooting |
| `docs/nastavenie-datawedge.md` | profily, Intent output, DP API | api-referencia, priklady |
| `docs/architektura.md` | vrstvy, toky, životný cyklus, Observer | troubleshooting, api-referencia |
| `docs/api-referencia.md` | metódy, konštanty, eventy, typy | – |
| `docs/priklady-pouzitia.md` | 10 ukážok + kompletná komponenta | nastavenie, api-referencia |
| `docs/troubleshooting.md` | diagnostika, checklist, obmedzenia | instalacia, nastavenie |

Všetky vnútorné odkazy v dokumentácii sú relativné (`./subor.md`) a overené – smerujú na
existujúce súbory.

---

## 8. Externé odkazy (použité v dokumentácii)

- DataWedge API: <https://techdocs.zebra.com/datawedge/latest/guide/api/>
- Zebra tech docs: <https://techdocs.zebra.com/>
- Ukážka (plná): <https://github.com/darryncampbell/DataWedgeReactNative>
- Ukážka (základná): <https://github.com/darryncampbell/RNDataWedgeIntentDemo>
- Keyboard output téma: <https://developer.zebra.com/message/95397>

---

## 9. Možné ďalšie kroky

- [ ] Doplniť README.md odkazom na `docs/` (aktuálne je pôvodné anglické README bez navigácie).
- [ ] Pridať `export default` do `index.tsx` alebo opraviť README import.
- [ ] Pridať `.d.ts` alebo explicitné typy pre externých spotrebiteľov.
- [ ] Pridať `codegenConfig` / podporu New Architecture.
- [ ] Pridať Expo config plugin (ak bude modul potrebovať Android úpravy cez prebuild).
- [ ] Nastaviť fungujúci testovací skript.
- [ ] Aktualizovať `compileSdkVersion` fallback v `android/build.gradle`.
