import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
SETTINGS_FILE = os.path.join(DATA_DIR, 'settings.json')
PRESETS_FILE = os.path.join(DATA_DIR, 'presets.json')
ORDERS_FILE = os.path.join(DATA_DIR, 'playlist_orders.json')
METADATA_FILE = os.path.join(DATA_DIR, 'track_metadata.json')

# Asegurar que el directorio data existe
os.makedirs(DATA_DIR, exist_ok=True)

def load_json(filepath, default):
    if not os.path.exists(filepath): return default
    try:
        with open(filepath, 'r', encoding='utf-8') as f: return json.load(f)
    except: return default

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f: json.dump(data, f, indent=4)

# --- API Settings ---
def get_settings(): return load_json(SETTINGS_FILE, {"masterVolume": 50, "lastFrame": "Fantasy"})
def save_settings(s): 
    curr = get_settings()
    curr.update(s)
    save_json(SETTINGS_FILE, curr)

# --- API Presets ---
def get_presets(): return load_json(PRESETS_FILE, [])
def save_preset(p):
    presets = get_presets()
    found = False
    for idx, existing in enumerate(presets):
        if existing['id'] == p['id']:
            presets[idx] = p
            found = True
            break
    if not found: presets.append(p)
    save_json(PRESETS_FILE, presets)
def delete_preset(pid):
    presets = [p for p in get_presets() if p['id'] != pid]
    save_json(PRESETS_FILE, presets)

# --- API Playlist Orders ---
def get_orders(): return load_json(ORDERS_FILE, {})
def save_order(key, track_ids):
    orders = get_orders()
    orders[key] = track_ids
    save_json(ORDERS_FILE, orders)

# --- Track Metadata ---
def get_all_metadata(): return load_json(METADATA_FILE, {})
def save_track_metadata(track_id, metadata):
    data = get_all_metadata()
    if track_id not in data: data[track_id] = {}
    data[track_id].update(metadata)
    save_json(METADATA_FILE, data)
def update_metadata_id(old_id, new_id):
    data = get_all_metadata()
    if old_id in data:
        data[new_id] = data.pop(old_id)
        save_json(METADATA_FILE, data)

# --- MANTENIMIENTO (CORREGIDO) ---
def prune_orphaned_data(assets_dir):
    """Elimina referencias en JSONs de archivos que ya no existen en disco."""
    
    # 1. Escanear todos los archivos reales existentes
    actual_files = set()
    for root, dirs, files in os.walk(assets_dir):
        for file in files:
            if file.lower().endswith(('.mp3', '.wav', '.ogg')):
                rel_path = os.path.relpath(os.path.join(root, file), assets_dir).replace('\\', '/')
                actual_files.add(rel_path)
    
    print(f"Mantenimiento: {len(actual_files)} archivos de audio detectados.")

    # 2. Limpiar Metadata (Iconos)
    meta = get_all_metadata()
    meta_keys = list(meta.keys())
    meta_deleted = 0
    for k in meta_keys:
        if k not in actual_files:
            del meta[k]
            meta_deleted += 1
    if meta_deleted > 0:
        save_json(METADATA_FILE, meta)
        print(f" - Eliminados {meta_deleted} metadatos huérfanos.")

    # 3. Limpiar Presets (CORREGIDO)
    presets = get_presets()
    valid_presets = []
    presets_changed = False
    
    for p in presets:
        original_tracks = p['tracks']
        # Filtramos: solo nos quedamos con las pistas que existen en 'actual_files'
        valid_tracks = [t for t in original_tracks if t['trackId'] in actual_files]
        
        # Detectamos si ha habido cambios en las pistas de este preset
        if len(valid_tracks) != len(original_tracks):
            presets_changed = True
            
        # LÓGICA NUEVA: Solo guardamos el preset si todavía le queda alguna pista
        if len(valid_tracks) > 0:
            p['tracks'] = valid_tracks
            valid_presets.append(p)
        else:
            # Si el preset se queda vacío (0 pistas), NO lo añadimos a valid_presets
            # Esto efectivamente elimina el preset
            presets_changed = True
            print(f" - Preset '{p.get('name', 'unnamed')}' eliminado por quedarse vacío.")

    if presets_changed:
        save_json(PRESETS_FILE, valid_presets)
        print(f" - Presets actualizados y limpiados.")

    # 4. Limpiar Orden de Listas
    orders = get_orders()
    orders_changed = False
    for key in orders:
        original_len = len(orders[key])
        orders[key] = [tid for tid in orders[key] if tid in actual_files]
        if len(orders[key]) != original_len:
            orders_changed = True
    if orders_changed:
        save_json(ORDERS_FILE, orders)
        print(f" - Listas de reproducción limpiadas.")