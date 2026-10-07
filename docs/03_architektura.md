# Architektúra modulu

Modul tvorí **tenký most** medzi JavaScriptom a Android Intent systémom. Neobsahuje žiadnu vlastnú
logiku skenovania – všetku prácu vykoná služba **Zebra DataWedge**, modul len:

- odosiela **broadcast intenty** do DataWedge (príkazy),
- **registruje broadcast receivers** a presmerováva prijaté intenty do JavaScriptu ako eventy.

---

## 1. Vrstvy riešenia

```mermaid
flowchart TB
    subgraph JS["JavaScript vrstva (React Native)"]
        A["index.tsx<br/>export DataWedgeIntents"]
        B["NativeEventEmitter<br/>('barcode_scan', 'datawedge_broadcast_intent', ...)"]
    end

    subgraph BRIDGE["React Native bridge"]
        C["NativeModules.DataWedgeIntents"]
    end

    subgraph JAVA["Android natívna vrstva (Java)"]
        D["RNDataWedgeIntentsModule<br/>@ReactMethod: sendBroadcastWithExtras,<br/>registerBroadcastReceiver, sendIntent, registerReceiver"]
        E["RNDataWedgeIntentsPackage<br/>registrácia modulu"]
        F["ObservableObject<br/>singleton, Observer vzor"]
        G["BroadcastReceivers<br/>genericReceiver / scannedData<br/>/ myEnumerateScanners"]
    end

    subgraph ANDROID["Android systém"]
        H["Context.sendBroadcast()"]
        I["Zebra DataWedge služba"]
    end

    A -->|"volania metód"| C
    C --> D
    E -.->|"vytvorí"| D
    D -->|"sendBroadcast"| H
    H --> I
    I -->|"broadcast výsledku"| G
    G --> F
    F -->|"notifyObservers"| D
    D -->|"sendEvent() RCTDeviceEventEmitter"| B
    B -->|"listener v aplikácii"| A
```

---

## 2. Súbory modulu

| Súbor | Úloha |
|---|---|
| `index.tsx` | JS/TS vstup modulu, typy, re-export konštánt a metód z `NativeModules.DataWedgeIntents`; na ne-Android platformách ostáva export `undefined` |
| `android/src/main/java/.../RNDataWedgeIntentsModule.java` | Jadro modulu – `@ReactMethod` metódy, receivers, konštanty, odosielanie eventov |
| `android/src/main/java/.../RNDataWedgeIntentsPackage.java` | `ReactPackage` – registrácia natívneho modulu do RN |
| `android/src/main/java/.../ObservableObject.java` | Singleton rozširujúci `java.util.Observable` – spája `BroadcastReceiver` (producent) s modulom (konzument) |
| `android/build.gradle` | Build konfigurácia knižnice |
| `android/src/main/AndroidManifest.xml` | Prázdny manifest (iba package declaration) |
| `package.json` | `main: index.tsx`, peer závislosť `react-native >= 0.56` |
| `screens/datawedge.png` | Obrázková príloha – snímka konfigurácie DataWedge (obsah sa v dokumentácii nepoužíva) |

---

## 3. Tok dát – soft trigger + skenovanie

```mermaid
sequenceDiagram
    autonumber
    participant APP as Aplikácia (JS)
    participant IDX as index.tsx
    participant MOD as RNDataWedgeIntentsModule (Java)
    participant SYS as Android Context
    participant DW as DataWedge
    participant OBS as ObservableObject
    participant EMIT as RCTDeviceEventEmitter

    APP->>IDX: sendBroadcastWithExtras({action, extras: SOFT_SCAN_TRIGGER})
    IDX->>MOD: NativeModules.DataWedgeIntents.sendBroadcastWithExtras(obj)
    MOD->>SYS: sendBroadcast(Intent)
    SYS->>DW: com.symbol.datawedge.api.ACTION (soft trigger)
    DW->>DW: aktivuje skener, čaká na kód
    DW-->>DW: naskenovaný kód
    DW->>SYS: broadcast s extras (data_string, label_type, source, ...)
    SYS->>MOD: genericReceiver.onReceive()
    MOD->>OBS: updateValue(intent)
    OBS->>MOD: update(observable, intent)
    MOD->>EMIT: emit("datawedge_broadcast_intent", map)
    EMIT-->>APP: NativeEventEmitter listener
```

---

## 4. Spracovanie prijatého intentu v module

Metóda `update(Observable, Object)` je srdcom spätnej cesty. Rozhoduje podľa typu intentu:

```mermaid
flowchart TD
    START[Prijatý Intent] --> Q1{Obsahuje extra<br/>v2API = true?}
    Q1 -->|Áno - cesta<br/>registerBroadcastReceiver| R1["Odstráni binárne polia a ArrayList<br/>(bridge ich nevie preniesť)"]
    R1 --> E1["emit('datawedge_broadcast_intent',<br/>Arguments.fromBundle(extras))"]
    E1 --> Q2{Action =<br/>ACTION_ENUMERATEDSCANNERLIST?}
    Q2 -->|Áno| E2["emit('enumerated_scanners',<br/>{Scanners: [...]})"]
    Q2 -->|Nie| E3["emit('barcode_scan',<br/>{source, data, labelType})"]

    Q1 -->|Nie - legacy cesta| Q3{Action =<br/>ACTION_ENUMERATEDSCANNERLIST?}
    Q3 -->|Áno| E2
    Q3 -->|Nie - ide o sken| E3
```

### Dôležité správanie

1. **Každý intent z cesty B sa dostane aj do `barcode_scan`** – modul po odoslaní
   `datawedge_broadcast_intent` ešte pokračuje v klasifikácii podľa action. Ak intent neobsahuje
   kľúče `com.symbol.datawedge.*`, event `barcode_scan` príde s hodnotami `null`.
2. **Polia sú odstránené** – `byte[]` a `ArrayList` extra kľúče sa z intentu odstránia, pretože
   React Native bridge nevie preniesť binárne polia. Očakávaj teda len skalárne hodnoty a objekty.
3. **`v2API` extra** je vnútorný príznak pridaný modulom, nie odoslaný DataWedge.

---

## 5. Model odosielania – Observer

`BroadcastReceiver` beží na Android strane a nemá priamy prístup k React contextu prenosu udalostí.
Modul preto používa jednoduchý **Observer vzor** cez singleton `ObservableObject`:

```mermaid
classDiagram
    class ObservableObject {
        -static ObservableObject instance
        -ObservableObject()
        +static getInstance() ObservableObject
        +updateValue(Object data) void
    }
    class RNDataWedgeIntentsModule {
        +update(Observable, Object) void
        +sendEvent(...) void
    }
    class BroadcastReceiver_1 {
        +onReceive(Context, Intent)
    }
    class BroadcastReceiver_2 {
        +onReceive(Context, Intent)
    }
    BroadcastReceiver_1 ..> ObservableObject : updateValue()
    BroadcastReceiver_2 ..> ObservableObject : updateValue()
    ObservableObject ..> RNDataWedgeIntentsModule : notifyObservers()
```

Poznámky k implementácii:

- `ObservableObject` je **thread-safe** (`synchronized` v `updateValue`).
- Do singletonu sa modul **registruje vo svojom konštruktore** (`addObserver(this)`).
- Keďže `Observable` je **deprecovaná trieda v Jave**, je to miesto, ktoré môže v budúcnosti
  vyžadovať úpravu (napr. prechod na `LiveData` alebo vlastný listener).

---

## 6. Životný cyklus a registry receiverov

Modul implementuje `LifecycleEventListener` (`onHostResume` / `onHostPause` / `onHostDestroy`)
a `onCatalystInstanceDestroy`.

```mermaid
stateDiagram-v2
    [*] --> Vytvorený: konštrukcia modulu
    Vytvorený --> Aktívny: onHostResume()<br/>zaregistruje enumerate receiver<br/>+ obnoví legacy scannedData receiver
    Aktívny --> Neaktívny: onHostPause()<br/>unregisterReceivers() - len legacy receivers
    Neaktívny --> Aktívny: onHostResume()
    Aktívny --> Zničený: onCatalystInstanceDestroy()
    Neaktívny --> Zničený: onCatalystInstanceDestroy()
    Zničený --> [*]: unregisterReceivers()
```

| Receiver | Používa ho | Registruje | Odregistrováva pri pause |
|---|---|---|---|
| `myEnumerateScannersBroadcastReceiver` | `ACTION_ENUMERATEDLISET` (legacy) | `onHostResume()` | ✅ áno |
| `scannedDataBroadcastReceiver` | legacy `registerReceiver()` | `registerReceiver()` | ✅ áno (a opätovne pri resume) |
| `genericReceiver` | `registerBroadcastReceiver()` (odporúčané) | `registerBroadcastReceiver()` | ❌ **nie** – ostáva registrovaný |

> Všetky receivers sa registrujú s príznakom **`RECEIVER_EXPORTED`** – to je vyžadované od
> **Android 14 (API 34)** a zároveň umožňuje prijímať broadcasty z DataWedge (iná aplikácia).
> Pozri aj [troubleshooting.md](./troubleshooting.md).

---

## 7. Typ konvertácie extras pri odosielaní

`sendBroadcastWithExtras` dekonštruuje JS objekt na Android `Intent`:

```mermaid
flowchart LR
    JS[JS hodnota] --> T{Typ}
    T -->|Boolean| B1["Intent.putExtra(key, boolean)"]
    T -->|Integer| B2["Intent.putExtra(key, int)"]
    T -->|Long| B3["Intent.putExtra(key, long)"]
    T -->|Double| B4["Intent.putExtra(key, double)"]
    T -->|"reťazec začínajúci '{'"| B5["JSONObject → Bundle<br/>Intent.putExtra(key, Bundle)"]
    T -->|iný reťazec| B6["Intent.putExtra(key, String)"]
    T -->|pole / objekt| B7["rekurzívne spracovanie<br/>ReadableArray / ReadableMap"]
```

JSON objekty sa konvertujú na `Bundle` cez `toBundle()` – podporuje reťazce, booleany, čísla,
polia reťazcov/čísel a vnoorené objekty.

---

## 8. Obmedzenia návrhu

| Obmedzenie | Popis |
|---|---|
| Android-only | iOS implementácia neexistuje, `DataWedgeIntents` je `undefined` |
| Bez Codegen / TurboModule | modul je klasický `ReactContextBaseJavaModule`; na New Architecture funguje cez interop vrstvu |
| Bez `addListener` / `removeListeners` | `new NativeEventEmitter()` volaj **bez argumentu** (s `NativeModules.DataWedgeIntents` ako argumentom by RN vypísalo varovanie) – eventy idú cez globálny `RCTDeviceEventEmitter` |
| Callbacky sa nedajú opakovať | modul preto posiela skeny ako **eventy**, nie cez `Callback` |
| Zastarané API | konštanty `ACTION_*`, `sendIntent()`, `registerReceiver()` – pozri [api-referencia.md](./api-referencia.md) |
| Zastaraná Javadoc trieda | `java.util.Observable` / `Observer` |
| `@providesModule` hlavička | `index.tsx` obsahuje zastaranú haste direktívu, ktorá nemá v modernom RN význam |
