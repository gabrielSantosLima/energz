#!/usr/bin/env python
"""Short happy-path regression for the energz dev build (adb + uiautomator)."""
import json
import os
import re
import shutil
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

BOUNDS = re.compile(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")
results = []


def repo_root():
    path = Path(__file__).resolve()
    for parent in path.parents:
        if (parent / "app.json").exists():
            return parent
    sys.exit("Could not find app.json above the script.")


def resolve_adb():
    env = os.environ.get("ADB")
    if env and Path(env).exists():
        return env
    found = shutil.which("adb")
    if found:
        return found
    local = os.environ.get("LOCALAPPDATA")
    if local:
        name = "adb.exe" if os.name == "nt" else "adb"
        candidate = Path(local) / "Android" / "Sdk" / "platform-tools" / name
        if candidate.exists():
            return str(candidate)
    sys.exit("adb not found. Set the ADB environment variable.")


ROOT = repo_root()
ADB = resolve_adb()
PKG = json.loads((ROOT / "app.json").read_text(encoding="utf-8"))["expo"][
    "android"
]["package"]


def adb(*args, timeout=90):
    return subprocess.run(
        [ADB, *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )


def dump():
    adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    xml = adb("shell", "cat", "/sdcard/ui.xml").stdout
    start = xml.find("<?xml")
    if start < 0:
        return None
    return ET.fromstring(xml[start:])


def nodes(root):
    for node in root.iter("node"):
        bounds = BOUNDS.search(node.get("bounds", ""))
        if not bounds:
            continue
        x1, y1, x2, y2 = map(int, bounds.groups())
        yield {
            "text": node.get("text", ""),
            "desc": node.get("content-desc", ""),
            "class": node.get("class", ""),
            "enabled": node.get("enabled", "false") == "true",
            "x": (x1 + x2) // 2,
            "y": (y1 + y2) // 2,
            "top": y1,
        }


def find(root, text=None, desc=None, exact=True):
    for node in nodes(root):
        value = node["text"] if text is not None else node["desc"]
        target = text if text is not None else desc
        if not value:
            continue
        if (value == target) if exact else (target in value):
            return node
    return None


def tap(node):
    adb("shell", "input", "tap", str(node["x"]), str(node["y"]))
    time.sleep(1.2)


def wait_text(text, timeout=12, exact=True):
    deadline = time.time() + timeout
    while time.time() < deadline:
        root = dump()
        if root is not None and find(root, text=text, exact=exact):
            return True
        time.sleep(0.8)
    return False


def check(name, ok, note=""):
    results.append({"check": name, "ok": bool(ok), "note": note if not ok else ""})
    print(("PASS " if ok else "FAIL ") + name)
    if not ok:
        root = dump()
        if root is not None:
            texts = [n["text"] for n in nodes(root) if n["text"]][:30]
            print("  current texts:", texts)
    return ok


def type_ascii(value):
    adb("shell", "input", "text", value)


def ensure_no_keyboard():
    out = adb("shell", "dumpsys", "input_method").stdout
    if "mInputShown=true" in out:
        adb("shell", "input", "keyevent", "4")
        time.sleep(1.2)


def fill_field(label, value):
    root = dump()
    label_node = find(root, text=label, exact=False)
    if label_node is None:
        return False

    below = [n for n in nodes(root) if n["top"] > label_node["top"]]
    edits = sorted(
        [n for n in below if n["class"] == "android.widget.EditText"],
        key=lambda n: n["top"],
    )
    if edits:
        target = edits[0]
    else:
        nums = sorted(
            [n for n in below if n["text"] and re.match(r"^[0-9]", n["text"])],
            key=lambda n: n["top"],
        )
        if not nums:
            return False
        target = nums[0]

    tap(target)

    root = dump()
    edits = [n for n in nodes(root) if n["class"] == "android.widget.EditText"]
    current = edits[0]["text"] if edits else ""
    if current:
        adb("shell", "input", "keyevent", *(["67"] * len(current)))
    type_ascii(value)
    time.sleep(0.4)
    adb("shell", "input", "keyevent", "66")
    time.sleep(0.8)
    return True


def go(url):
    adb(
        "shell",
        "am",
        "start",
        "-W",
        "-a",
        "android.intent.action.VIEW",
        "-d",
        url,
        PKG,
    )
    time.sleep(3)


def nav(desc):
    node = find(dump(), desc=desc)
    if node is None:
        return False
    tap(node)
    return True


def tap_text(text, exact=True):
    node = find(dump(), text=text, exact=exact)
    if node is None:
        return False
    tap(node)
    return True


def preflight():
    device = adb("devices").stdout
    if not re.search(r"\tdevice\r?$", device, re.MULTILINE):
        sys.exit("No authorized Android device connected.")

    package = adb("shell", "dumpsys", "package", PKG).stdout
    if "DEBUGGABLE" not in package:
        sys.exit(
            "The installed app is not a debug build. Install the debug APK "
            "from android/app/build/outputs/apk/debug/app-debug.apk first."
        )

    adb("reverse", "tcp:8081", "tcp:8081")


print("== short regression: energz ==")
preflight()
adb("logcat", "-c")

# 1. Home
go("energz:///")
root = dump()
home_ok = (
    root is not None
    and find(root, text="Registrar leitura de hoje") is not None
    and find(root, text="Relatórios") is not None
    and find(root, text="Contas e Medições") is not None
)
if not home_ok:
    sys.exit(
        "Home did not load in Portuguese. Set the app language to Português "
        "and make sure Metro is serving the latest bundle."
    )
check("home loads", True)

# 2. Quick measurement (values relative to the last reading)
tap_text("Registrar leitura de hoje")
check("quick sheet opens", wait_text("Nova medição"))

root = dump()
last = find(root, text="Última leitura", exact=False)
last_consumption, last_production = 0, 0
if last is not None:
    match = re.search(r"([0-9.,]+) . ([0-9.,]+) kWh", last["text"])
    if match:
        last_consumption = int(match.group(1).replace(".", "").replace(",", ""))
        last_production = int(match.group(2).replace(".", "").replace(",", ""))
next_consumption = last_consumption + 5
next_production = last_production + 7
print(f"  last reading {last_consumption}/{last_production} -> {next_consumption}/{next_production}")

check("consumption field", fill_field("Consumo (kWh)", str(next_consumption)))
check("production field", fill_field("Produção (kWh)", str(next_production)))
root = dump()
save = find(root, text="Salvar medição")
check("quick save enabled", save is not None and save["enabled"], "button disabled")
if save is not None:
    tap(save)
check("measurement saved", wait_text("Medição registrada"))
tap_text("Concluir")
check("quick sheet closes", wait_text("Registrar leitura de hoje"))

# 3. Measurements list
check("measurements tab opens", nav("Contas e Medições"))
check("new measurement listed", wait_text(f"{next_consumption} kWh"))

# 4. Manual bill form (opening + filling; persisting is covered by real data)
contas = find(dump(), desc="Contas")
if contas is not None:
    tap(contas)
time.sleep(2)
root = dump()
add = find(root, desc="Adicionar conta manualmente")
check("bills tab opens", add is not None)
if add is not None:
    tap(add)
check("manual bill form opens", wait_text("Nova conta"))
check("amount field", fill_field("Valor total (R$)", "123,45"))
check("active kwh field", fill_field("En Ativa (kWh)", "100"))
check("injected kwh field", fill_field("En Injetado (kWh)", "60"))
root = dump()
check(
    "bill form values",
    find(root, text="123,45") is not None
    and find(root, text="100") is not None
    and find(root, text="60") is not None,
)
ensure_no_keyboard()
adb("shell", "input", "keyevent", "4")
time.sleep(2)

# 5. Reports
check("reports hub opens", nav("Relatórios"))
check(
    "hub shows both reports",
    wait_text("Relatório de medições") and wait_text("Relatório de contas"),
)
tap_text("Relatório de medições")
check("measurements report renders", wait_text("Período") and wait_text("Produção"))
adb("shell", "input", "keyevent", "4")
time.sleep(1.5)
tap_text("Relatório de contas")
check(
    "bills report renders",
    wait_text("Totais") and wait_text("Valor") and wait_text("Data"),
)
adb("shell", "input", "keyevent", "4")
time.sleep(1.5)

# 6. Cycles
go("energz://cycles")
check("cycles screen opens", wait_text("Ciclo atual"))
adb("shell", "input", "keyevent", "4")
time.sleep(1.5)

# 7. Nearby send + receive
go("energz://sync")
check("sync screen opens", wait_text("Sincronizar dados"))
tap_text("Enviar")
check("send mode opens", wait_text("Enviar por perto"))
tap_text("Enviar por perto")
check("advertising starts", wait_text("Aguardando um aparelho se conectar...", timeout=15))
tap_text("Cancelar")
time.sleep(1)
tap_text("Trocar modo")
time.sleep(1)
tap_text("Receber")
check("receive mode opens", wait_text("Buscar aparelhos por perto"))
tap_text("Buscar aparelhos por perto")
check("discovery starts", wait_text("Procurando aparelhos por perto...", timeout=20))
tap_text("Cancelar")
time.sleep(1)
adb("shell", "input", "keyevent", "4")
time.sleep(1.5)

# 8. Settings
go("energz:///")
check("home before settings", wait_text("Registrar leitura de hoje"))
check("settings opens", nav("Configurações") and wait_text("Versão"))

# 9. Logs
log = adb("logcat", "-d").stdout
bad = [
    line
    for line in log.splitlines()
    if "FATAL EXCEPTION" in line
    or ("ReactNativeJS" in line and re.search(r"\bError\b|Unhandled", line))
]
check("no fatal js errors", not bad, bad[-3:] if bad else "")

passed = sum(1 for r in results if r["ok"])
failed = len(results) - passed

print("\n| # | Check | Result |")
print("| --- | --- | --- |")
for index, item in enumerate(results, start=1):
    print(f"| {index} | {item['check']} | {'PASS' if item['ok'] else 'FAIL'} |")

print("\nSUMMARY " + json.dumps({"passed": passed, "failed": failed}))
print(f"== done: {passed} passed, {failed} failed ==")
sys.exit(1 if failed else 0)
