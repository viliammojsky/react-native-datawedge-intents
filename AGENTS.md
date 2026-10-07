# AGENTS.md – Inštrukcie agenta (OpenCode)

Tento súbor sa načítava automaticky pri inicializácii OpenCode v tejto zložke
(`react-native-datawedge-intents`) a vzťahuje sa na **všetky úlohy** v projekte.

---

## 0. Povinné načítanie kontextu na začiatku úlohy

**Pred akoukoľvek prácou v tomto projekte si agent MUSÍ načítať kontext v tomto poradí:**

1. **`SPECS.md`** (koreň projektu) – aktuálny stav, API, obmedzenia, rozpracované kroky.
2. **`docs/README.md`** – vstup do dokumentácie a prehľad súborov.
3. **Podľa typu úlohy ďalšie súbory z `docs/`** podľa tabuľky nižšie.

Načítanie kontextu je **povinné**, nie voliteľné – agent nesmie pracovať „naslepo"
ani sa spoliehať len na svoju pamäť alebo na obsah `README.md` (ten je pôvodný,
anglický a čiastočne neaktuálny).

### Ktoré dokumenty načítať podľa úlohy

| Typ úlohy | Povinné súbory |
|---|---|
| Akákoľvek úloha (minimum) | `SPECS.md`, `docs/README.md` |
| Inštalácia, nastavenie projektu, Expo, build | `docs/instalacia.md` + `docs/troubleshooting.md` (sekcia Expo) |
| Konfigurácia DataWedge, profily, intent output | `docs/nastavenie-datawedge.md` |
| Práca s API modulu, metódy, eventy, typy | `docs/api-referencia.md` |
| Príklady kódu, integrácia do aplikácie | `docs/priklady-pouzitia.md` + `docs/api-referencia.md` |
| Zmena natívneho kódu (Java/Gradle) alebo architektúry | `docs/architektura.md` + `docs/api-referencia.md` |
| Hlásenie chyby, debugovanie, „nefunguje to" | `docs/troubleshooting.md` + `docs/nastavenie-datawedge.md` |
| Údržba dokumentácie | všetkých 7 súborov v `docs/` + `SPECS.md` |
| Príkaz **„Aktualizuj dokumentáciu"** | celé `docs/` + `SPECS.md` + `AGENTS.md` (postup v kapitole 4) |

Ak úloha spadá do viacerých kategórií, načítaj všetky príslušné súbory.

---

## 1. Fakty o projekte (skratka – overiť v `SPECS.md`)

- Modul `react-native-datawedge-intents` v0.1.8 – **Android-only** RN natívny modul pre Zebra DataWedge.
- Hlavný vstup `index.tsx` – iba **named export** `DataWedgeIntents` (žiadny default export).
- Odporúčané API: `registerBroadcastReceiver()` + `sendBroadcastWithExtras()`; eventy prijímať cez **`NativeEventEmitter`** (vždy **bez argumentu** – modul nemá `addListener`/`removeListeners`; pôvodný `README.md` v koreni ponecháva `DeviceEventEmitter`).
- Deprecated: `registerReceiver()`, `sendIntent()`, konštanty `ACTION_*`.
- Bez Expo config pluginu a bez Codegen – pre Expo je nutný **development build** (Expo Go nefunguje).
- Žiadne testy; dokumentácia v slovenčine v `docs/`.

---

## 2. Pravidlá práce so zdrojovým kódom

- **Nemen verejné API** (`registerBroadcastReceiver`, `sendBroadcastWithExtras`, eventy `barcode_scan`, `datawedge_broadcast_intent`, `enumerated_scanners`) bez explicitného súhlasu používateľa.
- Deprecated časti **neodstraňuj** – dokumentuj ich a navrhni náhradu.
- Zachovaj existujúce štýly a štruktúru (`index.tsx`, `android/src/main/java/com/darryncampbell/rndatawedgeintents/`).
- Po akejkoľvek zmene kódu **aktuálnizuj `SPECS.md`** a dotknuté súbory v `docs/`.
- Pri zmenách Android časti počítaj s `RECEIVER_EXPORTED` (Android 14+) a s tým, že `genericReceiver` sa pri pause neodregistrováva.

---

## 3. Pravidlá pre dokumentáciu

- Dokumentácia je v **slovenčine**; kód, identifikátory a názvy API zostávajú v angličtine.
- Nové dokumenty patria do **`docs/`**; prehľad a navigácia sa udržiava v `docs/README.md`.
- **Diagramy** – syntax **mermaid**; **tabuľky** – štandardný GFM formát (`| a | b |`).
- **Obsah obrázkov ignoruj.** Ak je potrebné obrázok zmieniť, uveď len **názov súboru**
  (napr. `screens/datawedge.png`), nikdy neobsah ani nepokús sa ho interpretovať.
- Medzi súbormi používaj relativné odkazy (`./subor.md`) a over, že cieľ existuje.
- Nepoužívaj krehké kotvy (`#sekcia-...`) – odkazuj na súbory ako celok.
- Pôvodný `README.md` v koreni je anglický a prenechaný – **neprepisuj ho**; ak treba,
  doplň doň len odkaz na `docs/`.

---

## 4. Príkaz „Aktualizuj dokumentáciu"

Toto pravidlo sa aktivuje, keď používateľ pošle príkaz v zmysle **„Aktualizuj dokumentáciu"**
(rovnako „aktualizuj docs", „update documentation", „prever dokumentáciu").
Agent je v takom prípade **povinný vykonať kontrolu a podľa potreby zapracovať zmeny** –
nesmie len odpovedať, že dokumentácia je hotová.

### Postup (v tomto poradí)

1. **Inventarizácia súborov dokumentácie**
   - Overí existenciu všetkých súborov uvedených v `docs/README.md` a v stromčeku `SPECS.md`
     (`docs/README.md`, `docs/instalacia.md`, `docs/nastavenie-datawedge.md`, `docs/architektura.md`,
     `docs/api-referencia.md`, `docs/priklady-pouzitia.md`, `docs/troubleshooting.md`,
     `SPECS.md`, `AGENTS.md`).
   - Chýbajúci súbor buď vytvorí, alebo odstráni odkaz naň z `docs/README.md` a `SPECS.md`.

2. **Porovnanie časov zmien (projekt vs. dokumentácia)**
   - Základňa dokumentácie = **najnovší čas poslednej zmeny** ľubovoľného súboru
     `docs/*.md`, `SPECS.md`, `AGENTS.md`.
   - Porovná sa s časom poslednej zmeny **projektových súborov**: `index.tsx`, `package.json`,
     `README.md`, `android/**` (java, gradle, manifest), `screens/**`.
   - Primárny zdroj je **git** (odolný voči checkoutu/clone), ako doplnok `LastWriteTime`:

     ```bash
     # zmenené (nekommitnuté) súbory
     git status --porcelain
     # čas poslednej zmeny súboru v git
     git log -1 --format=%ci -- <subor>
     ```

     ```powershell
     # doplnková kontrola – najnovší súbor dokumentácie
     (Get-ChildItem docs\*.md, SPECS.md, AGENTS.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
     # projektové súbory novšie ako dokumentácia
     $base = (Get-ChildItem docs\*.md, SPECS.md, AGENTS.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
     Get-ChildItem index.tsx, package.json, README.md, android -Recurse -File | Where-Object LastWriteTime -gt $base
     ```

3. **Analýza zmien**
   - Ak bol niektorý projektový súbor zmenený **neskôr ako dokumentácia**, agent súbor prečíta
     (prípadne `git diff` / `git diff --staged` voči poslednej známej verzii) a vyhodnotí,
     či zmena ovplyvňuje popisované správanie: API, eventy, konštanty, inštaláciu,
     konfiguráciu DataWedge, architektúru, štruktúru repozitára alebo obmedzenia.

4. **Zapracovanie zmien**
   - Ak je zmena relevantná → upraví **všetky dotknuté** súbory v `docs/` + `SPECS.md`
     (sekcie „Stav projektu", „Štruktúra", „Verejné API", „Známe obmedzenia",
     „Možné ďalšie kroky") tak, aby dokumentácia zodpovedala kódu.
   - Ak dokumentáciu nijako neovplyvňuje (napr. formátovanie, závislosti, komentáre) →
     **nič nemení** a oznámmi to s uvedením dôvodu.
   - Ak je dokumentácia novšia ako projekt → vykoná len **kontrolu konzistency**
     (existujúce súbory, platnosť relativných odkazov, párny počet code fence, platnosť mermaid).

5. **Výkaz o kontrole**
   - Agent na konci uvedie: skontrolované súbory, zistené zmeny (ak boli),
     zoznam upravených dokumentov, prípadne konštatovanie „dokumentácia je aktuálna".

### Pravidlá k tomuto príkazu

- Kontrola je **povinná vždy** – bez ohľadu na to, ako dávno bola dokumentácia vytvorená.
- Nikdy **nemaž** existujúci dokument; iba pridávaj alebo upravuj.
- Po akejkoľvek úspešnej aktualizácii **zmeň dátum „Posledná aktualizácia"** v `SPECS.md`.
- Ak sa nedá zistiť poradie zmien (žiadny git, chýbajúce časy), vykonaj **plnú revíziu**
  všetkých súborov `docs/` voči aktuálnemu kódu.
- Výsledok komunikuj po slovensky, v súlade s kapitolou 3.

---

## 5. Overenie na konci úlohy

Pred ukončením úlohy skontroluj:

- [ ] Kontext zo `SPECS.md` a príslušných `docs/*.md` bol načítaný a použitý.
- [ ] Zmeny sú konzistentné s API popísaným v `docs/api-referencia.md`.
- [ ] `SPECS.md` odráža aktuálny stav (verzia, štruktúra, TODO).
- [ ] `docs/README.md` obsahuje odkaz na každý nový dokument v `docs/`.
- [ ] Všetky vnútorné odkazy v dokumentácii smerujú na existujúce súbory.
- [ ] Mermaid bloky sú syntakticky platné a fence ```` ``` ```` sú uzavreté (párny počet).

---

## 6. Externé zdroje

- DataWedge API: <https://techdocs.zebra.com/datawedge/latest/guide/api/>
- Ukážková aplikácia: <https://github.com/darryncampbell/DataWedgeReactNative>
- Repozitár: <https://github.com/darryncampbell/react-native-datawedge-intents>
