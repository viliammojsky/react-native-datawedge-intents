# API referencia

Kompletné verejné API modulu `react-native-datawedge-intents` (verzia `0.1.8`).
Zdrojom pravdy je `index.tsx` (JS/TS rozhranie) a `RNDataWedgeIntentsModule.java` (Android implementácia).

---

## 1. Import

Modul exportuje **named export** `DataWedgeIntents` (žiadny default export):

```tsx
// ✅ správne
import { DataWedgeIntents } from 'react-native-datawedge-intents';

// ⚠️ README ukážky používajú default import – ten nemusí fungovať,
//    pretože index.tsx nemá `export default`
import DataWedgeIntents from 'react-native-datawedge-intents';
```

Na platformách iných ako Android ostáva `DataWedgeIntents` `undefined` – pred použitím ošetri:

```tsx
import { Platform } from 'react-native';
import { DataWedgeIntents } from 'react-native-datawedge-intents';

if (Platform.OS === 'android' && DataWedgeIntents) {
  // ...
}
```

---

## 2. Typy (TypeScript)

Typy sú definované priamo v `index.tsx` (balík nemá samostatný `.d.ts` súbor).

### `DataWedgeIntents`

```ts
type DataWedgeIntents = {
    // konštanty (deprecated)
    ACTION_SOFTSCANTRIGGER: any;
    ACTION_SCANNERINPUTPLUGIN: any;
    ACTION_ENUMERATESCANNERS: any;
    ACTION_SETDEFAULTPROFILE: any;
    ACTION_RESETDEFAULTPROFILE: any;
    ACTION_SWITCHTOPROFILE: any;
    START_SCANNING: any;
    STOP_SCANNING: any;
    TOGGLE_SCANNING: any;
    ENABLE_PLUGIN: any;
    DISABLE_PLUGIN: any;

    // metódy
    sendIntent: ({ action, parameterValue }: SendIntent) => void;                 // deprecated
    sendBroadcastWithExtras: ({ action, extras }: ExtrasObject) => void;          // odporúčané
    registerBroadcastReceiver: ({ filterActions, filterCategories }: Filter) => void; // odporúčané
    registerReceiver: ({ action, category }: RegisterReceiver) => void;           // deprecated
};
```

### `SendIntent` (pre deprecated `sendIntent`)

```ts
type SendIntent = {
    action: string;
    parameterValue: string;
};
```

### `ExtrasObject` (pre `sendBroadcastWithExtras`)

```ts
type ExtrasObject = {
    action: string;
    extras: {
        [x: string]: string | object;
        ["SEND_RESULT"]: string;
    };
};
```

### `Filter` (pre `registerBroadcastReceiver`)

```ts
type Filter = {
    filterActions: string[];
    filterCategories: string[];
};
```

### `RegisterReceiver` (pre deprecated `registerReceiver`)

```ts
type RegisterReceiver = {
    action: string;
    category: string;
};
```

> **Poznámka k typom:** V TS type je `extras` povinné a kľúč `SEND_RESULT` je označený ako povinný.
> V Javke však `SEND_RESULT` povinný nie je – naopak, **chýbajúci objekt `extras` spôsobí
> `NullPointerException`**. Preto **vždy odosielaj objekt `extras`.**

---

## 3. Metódy

### 3.1 `registerBroadcastReceiver(filter)` ✅

Registruje dynamický `BroadcastReceiver` pre zadané actions a categories. Každý nový zavolaný
záznam predchádzajúci receiver odregistrová a zaregistruje nový.

**Parametre:**

| Meno | Typ | Povinný | Popis |
|---|---|---|---|
| `filter.filterActions` | `string[]` | ❌ | Zoznam action, na ktoré má receiver reagovať |
| `filter.filterCategories` | `string[]` | ❌ | Zoznam categories (typicky `android.intent.category.DEFAULT`) |

**Vracia:** nič (výsledok príde ako event).

**Event:** `datawedge_broadcast_intent` – mapa všetkých extras prijatého intentu (vrátane
pridaného `v2API: true`).

```tsx
DataWedgeIntents.registerBroadcastReceiver({
  filterActions: [
    'com.mojaapp.ACTION',
    'com.symbol.datawedge.api.RESULT_ACTION',
  ],
  filterCategories: ['android.intent.category.DEFAULT'],
});
```

**Správanie:**
- Receiver sa registruje s `RECEIVER_EXPORTED` (vyžadované od Android 14 / API 34).
- Receiver sa **neodregistrováva** pri pozastavení aplikácie – ostáva aktívny.
- Predchádzajúci `genericReceiver` sa odregistrová až pri ďalšom zavolaní tejto metódy.

---

### 3.2 `sendBroadcastWithExtras(obj)` ✅

Odošle broadcast intent (typicky DataWedge API príkaz).

**Parametre:**

| Meno | Typ | Povinný | Popis |
|---|---|---|---|
| `obj.action` | `string` | ❌ | Action intentu; ak chýba, action sa nenastaví |
| `obj.extras` | `object` | ⚠️ **áno** | Kľúč-hodnota extras; **bez neho modul spadne (NPE)** |

**Vracia:** nič.

**Typy hodnôt v `extras`:**

| Typ JS hodnoty | Ako sa prenesie do Intentu |
|---|---|
| `boolean` | `putExtra(key, boolean)` |
| `number` (int) | `putExtra(key, int)` |
| `number` (long) | `putExtra(key, long)` |
| `number` (double) | `putExtra(key, double)` |
| `string` | `putExtra(key, String)` |
| objekt/JSON (reťazec začínajúci `{`) | `JSONObject` → `Bundle` → `putExtra(key, Bundle)` |
| vnorený objekt / pole | rekurzívne spracované |

```tsx
DataWedgeIntents.sendBroadcastWithExtras({
  action: 'com.symbol.datawedge.api.ACTION',
  extras: {
    'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER': 'TOGGLE_SCANNING',
    'SEND_RESULT': 'true',
  },
});
```

**Kľúč `SEND_RESULT`:** ak ho nastavíš, DataWedge odošle odpoveď späť na akciu
`com.symbol.datawedge.api.RESULT_ACTION` (musí byť v `filterActions`).

---

### 3.3 `registerReceiver(filter)` ⚠️ deprecated

Registruje legacy receiver pre **jedinú** action. Výsledok skenovania príde ako event
`barcode_scan` v tvare `{source, data, labelType}`.

**Parametre:**

| Meno | Typ | Povinný | Popis |
|---|---|---|---|
| `action` | `string` | ✅ | Action, ktorú DataWedge používa pri broadcaste skenu |
| `category` | `string` | ❌ | Category intentu; prázdny reťazec = žiadna category |

**Event:** `barcode_scan`

```tsx
DataWedgeIntents.registerReceiver({ action: 'com.mojaapp.ACTION', category: '' });
```

**Správanie:**
- Receiver sa **odregistrováva pri `onHostPause()`** a **opätovne registruje pri `onHostResume()`**
  (modul si pamätá poslednú `registeredAction` / `registeredCategory`).
- Používa `RECEIVER_EXPORTED`.

> Uprednostni metódu `registerBroadcastReceiver` (kapitola 3.1).

---

### 3.4 `sendIntent(filter)` ⚠️ deprecated

Jednoduché odoslanie intentu s jedným parametrom. Zastarané API – nahraď metódou
`sendBroadcastWithExtras` (kapitola 3.2).

**Parametre:**

| Meno | Typ | Povinný | Popis |
|---|---|---|---|
| `action` | `string` | ✅ | Action intentu |
| `parameterValue` | `string` | ❌ | Hodnota parametra; prázdny reťazec = extra sa nepridá |

**Automatický výber kľúča extras:**

| Akcia | Kľúč, pod ktorým sa odošle `parameterValue` |
|---|---|
| `ACTION_SETDEFAULTPROFILE`, `ACTION_RESETDEFAULTPROFILE`, `ACTION_SWITCHTOPROFILE` | `com.symbol.datawedge.api.EXTRA_PROFILENAME` |
| všetky ostatné | `com.symbol.datawedge.api.EXTRA_PARAMETER` |

```tsx
DataWedgeIntents.sendIntent({
  action: 'com.symbol.datawedge.api.ACTION_SOFTSCANTRIGGER',
  parameterValue: 'START_SCANNING',
});
```

---

## 4. Konštanty ⚠️ deprecated

Konštanty sú prebraté z natívneho modulu (`getConstants()`). Označené ako zastarané –
**nesledujú aktuálny DataWedge API**, preto uprednostňuj priame hodnoty z DP API.

| Konštanta | Hodnota | Význam |
|---|---|---|
| `ACTION_SOFTSCANTRIGGER` | `com.symbol.datawedge.api.ACTION_SOFTSCANTRIGGER` | Akcia pre soft trigger |
| `ACTION_SCANNERINPUTPLUGIN` | `com.symbol.datawedge.api.ACTION_SCANNERINPUTPLUGIN` | Akcia pre plugin skenera |
| `ACTION_ENUMERATESCANNERS` | `com.symbol.datawedge.api.ACTION_ENUMERATESCANNERS` | Akcia pre vymenovanie skenerov |
| `ACTION_SETDEFAULTPROFILE` | `com.symbol.datawedge.api.ACTION_SETDEFAULTPROFILE` | Nastaviť predvolený profil |
| `ACTION_RESETDEFAULTPROFILE` | `com.symbol.datawedge.api.ACTION_RESETDEFAULTPROFILE` | Resetovať predvolený profil |
| `ACTION_SWITCHTOPROFILE` | `com.symbol.datawedge.api.ACTION_SWITCHTOPROFILE` | Prepnúť na profil |
| `START_SCANNING` | `START_SCANNING` | Spustiť skenovanie |
| `STOP_SCANNING` | `STOP_SCANNING` | Zastaviť skenovanie |
| `TOGGLE_SCANNING` | `TOGGLE_SCANNING` | Prepínať skenovanie |
| `ENABLE_PLUGIN` | `ENABLE_PLUGIN` | Zapnúť scanner input plugin |
| `DISABLE_PLUGIN` | `DISABLE_PLUGIN` | Vypnúť scanner input plugin |

> V Javke sú definované aj `EXTRA_PARAMETER` (`com.symbol.datawedge.api.EXTRA_PARAMETER`) a
> `EXTRA_PROFILENAME` (`com.symbol.datawedge.api.EXTRA_PROFILENAME`), tie **nie sú** exportované do JS.

---

## 5. Udalosti (events)

Prijímajú sa cez **`NativeEventEmitter`** (aktuálny React Native syntax):

```tsx
import { NativeEventEmitter } from 'react-native';

// emitter vždy vytvor BEZ argumentu (pozri poznámku nižšie)
const datawedgeEmitter = new NativeEventEmitter();

const subscription = datawedgeEmitter.addListener('barcode_scan', (event) => {
  console.log(event);
});

// pri odchode z obrazovky
subscription.remove();
```

> **Poznámka:** `new NativeEventEmitter()` volaj **bez argumentu**. Modul neimplementuje
> metódy `addListener()` / `removeListeners()`, takže odovzdanie `NativeModules.DataWedgeIntents`
> by vo vývojom režime vypísalo varovanie
> *„new NativeEventEmitter() was called with a non-null argument without the required addListener method"*.
> Natívne eventy aj tak prichádzajú cez globálny `RCTDeviceEventEmitter`, preto je
> bezargumentové vytvorenie emittera plne funkčné.

| Event | Kedy prichádza | Payload | Spúšťač |
|---|---|---|---|
| `barcode_scan` | Po skenovaní | `{ source: string \| null, data: string \| null, labelType: string \| null }` | legacy `registerReceiver()`, prípadne aj `registerBroadcastReceiver()` ak intent obsahuje `com.symbol.datawedge.*` kľúče |
| `datawedge_broadcast_intent` | Po každom intente zachytenom cez `registerBroadcastReceiver()` | `object` – všetky extras intentu + `v2API: true` | odporúčaná cesta |
| `enumerated_scanners` | Odpoveď na `ENUMERATE_SCANNERS` (legacy cesta) | `{ Scanners: string[] }` | `ACTION_ENUMERATEDLISET` receiver |

### Detail payloadu `barcode_scan`

| Pole | Zdrojové extra | Popis |
|---|---|---|
| `source` | `com.symbol.datawedge.source` | Zdroj skenu (napr. `HARDWARE_SCANNER`, `IMAGER`) |
| `data` | `com.symbol.datawedge.data_string` | Naskenovaný reťazec |
| `labelType` | `com.symbol.datawedge.label_type` | Typ kódu (napr. `CODE_128`, `EAN_13`) |

### Detail payloadu `datawedge_broadcast_intent`

Obsahuje **všetky** extras prijatého intentu, ktoré neprešli filtrom:

- `byte[]` a `ArrayList` kľúče sú z intentu **odstránené** (React Native ich nevie preniesť),
- kľúč `v2API: true` pridaný modulom,
- plus všetky extras z DataWedge podľa nastavenia profilu.

---

## 6. Prehľad metód

| Metóda | Stav | Event, ktorý vznikne | Poznámka |
|---|---|---|---|
| `registerBroadcastReceiver(filter)` | ✅ aktuálne | `datawedge_broadcast_intent` | viacero actions naraz |
| `sendBroadcastWithExtras(obj)` | ✅ aktuálne | – | vyžaduje `extras` |
| `registerReceiver({action, category})` | ⚠️ deprecated | `barcode_scan` | 1 action, receiver sa odpája pri pause |
| `sendIntent({action, parameterValue})` | ⚠️ deprecated | – | iba 1 parameter |

---

## 7. Príklad typickej integrácie

```tsx
import { useEffect, useRef } from 'react';
import { NativeEventEmitter, Platform } from 'react-native';
import { DataWedgeIntents } from 'react-native-datawedge-intents';

const ACTIONS = ['com.mojaapp.ACTION', 'com.symbol.datawedge.api.RESULT_ACTION'];

// bez argumentu – modul nemá addListener/removeListeners
const datawedgeEmitter = new NativeEventEmitter();

export function useDataWedge(onScan: (data: string) => void) {
  const scanRef = useRef(onScan);
  scanRef.current = onScan;

  useEffect(() => {
    if (Platform.OS !== 'android' || !DataWedgeIntents) return;

    DataWedgeIntents.registerBroadcastReceiver({
      filterActions: ACTIONS,
      filterCategories: ['android.intent.category.DEFAULT'],
    });

    const subs = [
      datawedgeEmitter.addListener('datawedge_broadcast_intent', (intent) => {
        const data = intent['com.symbol.datawedge.data_string'];
        if (data) scanRef.current(data);
      }),
      datawedgeEmitter.addListener('barcode_scan', (scan) => {
        if (scan?.data) scanRef.current(scan.data);
      }),
    ];

    return () => subs.forEach((s) => s.remove());
  }, []);
}

// Použitie:
// useDataWedge((code) => console.log('Naskenované:', code));
```
