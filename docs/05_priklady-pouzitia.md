# Príklady použitia

Všetky príklady predpokladajú:

```tsx
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { DataWedgeIntents } from 'react-native-datawedge-intents';

// Inštanciu emittera vytvor raz, BEZ argumentu – modul nemá addListener/removeListeners
const datawedgeEmitter = new NativeEventEmitter();
```

a nakonfigurovaný profil v DataWedge ([nastavenie-datawedge.md](./nastavenie-datawedge.md)).

---

## 1. Základný príjem skenov (odporúčaná cesta)

```tsx
import { useEffect } from 'react';
import { NativeEventEmitter, View, Text } from 'react-native';
import { DataWedgeIntents } from 'react-native-datawedge-intents';

// bez argumentu – modul nemá addListener/removeListeners
const datawedgeEmitter = new NativeEventEmitter();

export default function ScannerScreen() {
  useEffect(() => {
    // 1) zaregistrovať prijímač broadcastov
    DataWedgeIntents.registerBroadcastReceiver({
      filterActions: [
        'com.mojaapp.ACTION',                     // action z profilu DataWedge
        'com.symbol.datawedge.api.RESULT_ACTION', // odpovede na príkazy
      ],
      filterCategories: ['android.intent.category.DEFAULT'],
    });

    // 2) počúvať udalosti
    const sub = datawedgeEmitter.addListener('datawedge_broadcast_intent', (intent) => {
      const data = intent['com.symbol.datawedge.data_string'];
      const labelType = intent['com.symbol.datawedge.label_type'];
      const source = intent['com.symbol.datawedge.source'];

      if (data) {
        console.log(`Sken: ${data} (${labelType}, zdroj: ${source})`);
      } else {
        console.log('Odpoveď DataWedge:', intent);
      }
    });

    // 3) odpočúvať pri unmount komponentu
    return () => sub.remove();
  }, []);

  return (
    <View>
      <Text>Stlač trigger na zariadení alebo skenuj kód</Text>
    </View>
  );
}
```

---

## 2. Soft trigger – spustenie skenovania z UI

```tsx
const toggleScan = () => {
  DataWedgeIntents.sendBroadcastWithExtras({
    action: 'com.symbol.datawedge.api.ACTION',
    extras: {
      'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER': 'TOGGLE_SCANNING',
    },
  });
};

const startScan = () => {
  DataWedgeIntents.sendBroadcastWithExtras({
    action: 'com.symbol.datawedge.api.ACTION',
    extras: {
      'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER': 'START_SCANNING',
    },
  });
};

const stopScan = () => {
  DataWedgeIntents.sendBroadcastWithExtras({
    action: 'com.symbol.datawedge.api.ACTION',
    extras: {
      'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER': 'STOP_SCANNING',
    },
  });
};
```

---

## 3. Univerzálna pomocná funkcia pre odoslanie príkazu

```tsx
function sendCommand(extraName: string, extraValue: string | boolean | object, withResult = true) {
  const extras: Record<string, unknown> = {
    [extraName]: extraValue,
  };
  if (withResult) {
    extras['SEND_RESULT'] = 'true';
  }

  DataWedgeIntents.sendBroadcastWithExtras({
    action: 'com.symbol.datawedge.api.ACTION',
    extras: extras as any,
  });
}

// Volania:
sendCommand('com.symbol.datawedge.api.SOFT_SCAN_TRIGGER', 'TOGGLE_SCANNING');
sendCommand('com.symbol.datawedge.api.SET_DEFAULT_PROFILE', 'MojProfil');
sendCommand('com.symbol.datawedge.api.SWITCH_TO_PROFILE', 'SkenovaciProfil');
sendCommand('com.symbol.datawedge.api.ENUMERATE_SCANNERS', undefined as any, true);
```

---

## 4. Očakávanie odpovede DataWedge (`SEND_RESULT`)

Odpoveď prichádza na action `com.symbol.datawedge.api.RESULT_ACTION`, preto ju musíš mať
v `filterActions`:

```tsx
DataWedgeIntents.registerBroadcastReceiver({
  filterActions: ['com.symbol.datawedge.api.RESULT_ACTION'],
  filterCategories: ['android.intent.category.DEFAULT'],
});

datawedgeEmitter.addListener('datawedge_broadcast_intent', (intent) => {
  if (intent['com.symbol.datawedge.api.RESULT_STATUS'] === 'SUCCESS') {
    console.log('Príkaz úspešný:', intent);
  } else {
    console.log('Príkaz zlyhal:', intent);
  }
});

// Odošli príkaz so žiadosťou o odpoveď
DataWedgeIntents.sendBroadcastWithExtras({
  action: 'com.symbol.datawedge.api.ACTION',
  extras: {
    'com.symbol.datawedge.api.GET_VERSION_INFO': '',
    'SEND_RESULT': 'true',
  },
});
```

---

## 5. Práca s profilmi

```tsx
// 5.1 Prepnúť profil len počas behu aplikácie
DataWedgeIntents.sendBroadcastWithExtras({
  action: 'com.symbol.datawedge.api.ACTION',
  extras: { 'com.symbol.datawedge.api.SWITCH_TO_PROFILE': 'MojaAppSkenovanie' },
});

// 5.2 Nastaviť trvalý predvolený profil
DataWedgeIntents.sendBroadcastWithExtras({
  action: 'com.symbol.datawedge.api.ACTION',
  extras: { 'com.symbol.datawedge.api.SET_DEFAULT_PROFILE': 'MojaAppSkenovanie' },
});

// 5.3 Vrátiť sa na profil definovaný výrobcom
DataWedgeIntents.sendBroadcastWithExtras({
  action: 'com.symbol.datawedge.api.ACTION',
  extras: { 'com.symbol.datawedge.api.RESET_DEFAULT_PROFILE': '' },
});
```

---

## 6. Zapnutie / vypnutie pluginu skenera

```tsx
const setPlugin = (enabled: boolean) =>
  DataWedgeIntents.sendBroadcastWithExtras({
    action: 'com.symbol.datawedge.api.ACTION',
    extras: {
      'com.symbol.datawedge.api.SCANNER_INPUT_PLUGIN': enabled ? 'ENABLE_PLUGIN' : 'DISABLE_PLUGIN',
    },
  });
```

---

## 7. Vymenovanie skenerov (legacy cesta)

```tsx
// Odoslanie požiadavky
DataWedgeIntents.sendBroadcastWithExtras({
  action: 'com.symbol.datawedge.api.ACTION',
  extras: { 'com.symbol.datawedge.api.ENUMERATE_SCANNERS': '' },
});

// Príjem odpovede (legacy event)
const sub = datawedgeEmitter.addListener('enumerated_scanners', (payload) => {
  console.log('Dostupné skenery:', payload.Scanners);
});
```

> Moderný spôsob enumerácie (priamo cez `datawedge_broadcast_intent` + `SEND_RESULT`) ukazuje
> ukážková aplikácia [DataWedgeReactNative](https://github.com/darryncampbell/DataWedgeReactNative).

---

## 8. Legacy cesta – `registerReceiver` + `sendIntent`

Ukážka pre staršie aplikácie (neodporúča sa pre nové riešenia):

```tsx
// Registrácia receivera pre skenovacie dáta
DataWedgeIntents.registerReceiver({ action: 'com.mojaapp.ACTION', category: '' });

// Počúvanie
const sub = datawedgeEmitter.addListener('barcode_scan', (scan) => {
  console.log('Zdroj:', scan.source);
  console.log('Dáta:', scan.data);
  console.log('Typ:', scan.labelType);
});

// Spustenie skenovania cez zastarané API
DataWedgeIntents.sendIntent({
  action: DataWedgeIntents.ACTION_SOFTSCANTRIGGER,
  parameterValue: DataWedgeIntents.START_SCANNING,
});
```

---

## 9. Kompletný príklad komponentu

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button, NativeEventEmitter, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { DataWedgeIntents } from 'react-native-datawedge-intents';

const APP_ACTION = 'com.mojaapp.ACTION';

// bez argumentu – modul nemá addListener/removeListeners
const datawedgeEmitter = new NativeEventEmitter();

export default function App() {
  const [scans, setScans] = useState<string[]>([]);
  const [status, setStatus] = useState('Inicializácia…');

  const addScan = (entry: string) => setScans((prev) => [entry, ...prev].slice(0, 50));

  useEffect(() => {
    if (Platform.OS !== 'android' || !DataWedgeIntents) {
      setStatus('Modul je podporovaný len na Androide');
      return;
    }

    DataWedgeIntents.registerBroadcastReceiver({
      filterActions: [APP_ACTION, 'com.symbol.datawedge.api.RESULT_ACTION'],
      filterCategories: ['android.intent.category.DEFAULT'],
    });

    const subs = [
      datawedgeEmitter.addListener('datawedge_broadcast_intent', (intent) => {
        const data = intent['com.symbol.datawedge.data_string'];
        if (data) {
          addScan(`${data} (${intent['com.symbol.datawedge.label_type'] ?? '?'})`);
        } else if (intent['com.symbol.datawedge.api.RESULT_STATUS']) {
          setStatus(`DW: ${intent['com.symbol.datawedge.api.RESULT_STATUS']}`);
        }
      }),
      datawedgeEmitter.addListener('barcode_scan', (scan) => {
        if (scan?.data) addScan(`${scan.data} (${scan.labelType ?? '?'})`);
      }),
    ];

    setStatus('Pripravený – skenuj kód');

    return () => subs.forEach((s) => s.remove());
  }, []);

  const toggleScan = () =>
    DataWedgeIntents?.sendBroadcastWithExtras({
      action: 'com.symbol.datawedge.api.ACTION',
      extras: { 'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER': 'TOGGLE_SCANNING' },
    });

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{status}</Text>
      <Button title="Spustiť / zastaviť skenovanie" onPress={toggleScan} />
      <FlatList
        data={scans}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 64 },
  status: { marginBottom: 12, fontWeight: '600' },
  item: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
});
```

---

## 10. Prehľad – čo poslať pre konkrétnu funkciu

| Funkcia | `action` | Extra | Hodnota |
|---|---|---|---|
| Spustiť sken | `com.symbol.datawedge.api.ACTION` | `com.symbol.datawedge.api.SOFT_SCAN_TRIGGER` | `START_SCANNING` |
| Zastaviť sken | `com.symbol.datawedge.api.ACTION` | `com.symbol.datawedge.api.SOFT_SCAN_TRIGGER` | `STOP_SCANNING` |
| Prepínať sken | `com.symbol.datawedge.api.ACTION` | `com.symbol.datawedge.api.SOFT_SCAN_TRIGGER` | `TOGGLE_SCANNING` |
| Zapnúť plugin | `com.symbol.datawedge.api.ACTION` | `com.symbol.datawedge.api.SCANNER_INPUT_PLUGIN` | `ENABLE_PLUGIN` |
| Vypnúť plugin | `com.symbol.datawedge.api.ACTION` | `com.symbol.datawedge.api.SCANNER_INPUT_PLUGIN` | `DISABLE_PLUGIN` |
| Prepnúť profil | `com.symbol.datawedge.api.ACTION` | `com.symbol.datawedge.api.SWITCH_TO_PROFILE` | názov profilu |
| Predvolený profil | `com.symbol.datawedge.api.ACTION` | `com.symbol.datawedge.api.SET_DEFAULT_PROFILE` | názov profilu |
| Reset profilu | `com.symbol.datawedge.api.ACTION` | `com.symbol.datawedge.api.RESET_DEFAULT_PROFILE` | – |
| Zoznam skenerov | `com.symbol.datawedge.api.ACTION` | `com.symbol.datawedge.api.ENUMERATE_SCANNERS` | – |
| Vyžiadať odpoveď | – | `SEND_RESULT` | `true` |

Ďalšie príklady: <https://github.com/darryncampbell/DataWedgeReactNative/blob/master/App.js>
