import os
import shutil
import uuid
from flask import Blueprint, jsonify, request, current_app
import data_manager

audio_bp = Blueprint('audio_bp', __name__)

def get_assets_dir():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, 'assets')

@audio_bp.route('/system/prune', methods=['POST'])
def prune_system():
    try:
        data_manager.prune_orphaned_data(get_assets_dir())
        return jsonify({"status": "success", "message": "System cleaned"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@audio_bp.route('/structure', methods=['GET'])
def get_structure():
    assets_dir = get_assets_dir()
    structure = {}
    
    if not os.path.exists(assets_dir):
        return jsonify(structure)

    for frame in os.listdir(assets_dir):
        frame_path = os.path.join(assets_dir, frame)
        if not os.path.isdir(frame_path) or frame == 'mocks': continue
        
        structure[frame] = {}
        for t_type in os.listdir(frame_path):
            type_path = os.path.join(frame_path, t_type)
            if not os.path.isdir(type_path): continue
            
            structure[frame][t_type] = {}
            for cat in os.listdir(type_path):
                cat_path = os.path.join(type_path, cat)
                if not os.path.isdir(cat_path): continue
                
                subcats = [
                    sub for sub in os.listdir(cat_path) 
                    if os.path.isdir(os.path.join(cat_path, sub))
                ]
                structure[frame][t_type][cat] = subcats
                
    return jsonify(structure)

@audio_bp.route('/tracks', methods=['GET'])
def get_tracks():
    tracks = []
    assets_dir = get_assets_dir()
    metadata = data_manager.get_all_metadata()
    
    if not os.path.exists(assets_dir):
        os.makedirs(assets_dir)

    for root, dirs, files in os.walk(assets_dir):
        for file in files:
            if file.lower().endswith(('.mp3', '.wav', '.ogg')):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, assets_dir).replace('\\', '/')
                parts = rel_path.split('/')
                
                frame = "Global"
                t_type = "sfx"
                category = "General"
                subcategory = ""
                
                if len(parts) > 0:
                    frame = parts[0] if parts[0] != 'mocks' else 'Global'
                if len(parts) > 1: t_type = parts[1]
                if len(parts) > 2: category = parts[2]
                if len(parts) > 3 and parts[3] != file: subcategory = parts[3]

                if t_type not in ['music', 'ambience', 'sfx']: t_type = 'sfx'

                track_meta = metadata.get(rel_path, {})
                default_icon = 'CloudRain' if t_type == 'ambience' else 'Music'
                icon = track_meta.get('icon', default_icon)
                
                tracks.append({
                    "id": rel_path,
                    "name": os.path.splitext(file)[0].replace('_', ' ').replace('-', ' ').title(),
                    "url": f"{request.host_url}assets/{rel_path}",
                    "filename": rel_path,
                    "type": t_type,
                    "frame": frame if frame != "Global" else None,
                    "category": category,
                    "subcategory": subcategory,
                    "icon": icon
                })
    return jsonify(tracks)

@audio_bp.route('/tracks', methods=['POST'])
def upload_track():
    if 'file' not in request.files: return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    
    def safe_name(txt): return os.path.basename(txt).strip() if txt else ""

    custom_name = safe_name(request.form.get('name', 'track'))
    t_type = safe_name(request.form.get('type', 'sfx'))
    icon = request.form.get('icon', 'CloudRain')
    
    frame = request.form.get('frame', 'Global')
    if t_type == 'music':
        if frame == 'Global': frame = 'Fantasy' 
    else:
        if request.form.get('is_global') == 'true': frame = 'Global'
    
    frame = safe_name(frame)
    category = safe_name(request.form.get('category', 'General'))
    subcategory = safe_name(request.form.get('subcategory', ''))

    if t_type == 'music' and not subcategory:
        subcategory = 'General'

    assets_dir = get_assets_dir()
    save_path = os.path.join(assets_dir, frame, t_type, category, subcategory)
    os.makedirs(save_path, exist_ok=True)
    
    filename = f"{custom_name}{os.path.splitext(file.filename)[1]}"
    file.save(os.path.join(save_path, filename))
    
    rel_path = os.path.relpath(os.path.join(save_path, filename), assets_dir).replace('\\', '/')
    data_manager.save_track_metadata(rel_path, {'icon': icon})
    
    return jsonify({"status": "success"}), 201

@audio_bp.route('/tracks', methods=['DELETE'])
def delete_track():
    track_id = request.args.get('id')
    if not track_id: return jsonify({'error': 'Missing id'}), 400
    
    assets_dir = get_assets_dir()
    full_path = os.path.join(assets_dir, track_id.replace('/', os.sep))
    
    if os.path.exists(full_path):
        os.remove(full_path)
        return jsonify({"status": "deleted"})
    return jsonify({"error": "File not found"}), 404

@audio_bp.route('/tracks/move', methods=['POST'])
def move_track():
    data = request.json
    track_id = data.get('trackId')
    new_frame = data.get('newFrame', 'Global')
    new_category = data.get('newCategory')
    new_subcategory = data.get('newSubcategory', '')
    t_type = data.get('type', 'music') 

    if not track_id or not new_category: return jsonify({'error': 'Missing data'}), 400

    if t_type == 'music' and not new_subcategory:
        new_subcategory = 'General'

    assets_dir = get_assets_dir()
    src_path = os.path.join(assets_dir, track_id.replace('/', os.sep))
    filename = os.path.basename(src_path)
    dest_dir = os.path.join(assets_dir, new_frame, t_type, new_category, new_subcategory)
    dest_path = os.path.join(dest_dir, filename)

    if not os.path.exists(src_path): return jsonify({'error': 'File not found'}), 404

    try:
        os.makedirs(dest_dir, exist_ok=True)
        shutil.move(src_path, dest_path)
        new_rel_path = os.path.relpath(dest_path, assets_dir).replace('\\', '/')
        data_manager.update_metadata_id(track_id, new_rel_path)
        return jsonify({'status': 'moved'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/tracks/rename', methods=['POST'])
def rename_track():
    data = request.json
    track_id = data.get('trackId')
    new_name = data.get('newName')
    if not track_id or not new_name: return jsonify({'error': 'Missing data'}), 400

    assets_dir = get_assets_dir()
    src_path = os.path.join(assets_dir, track_id.replace('/', os.sep))
    if not os.path.exists(src_path): return jsonify({'error': 'File not found'}), 404
        
    folder = os.path.dirname(src_path)
    ext = os.path.splitext(src_path)[1]
    new_filename = f"{os.path.basename(new_name).strip()}{ext}"
    dest_path = os.path.join(folder, new_filename)
    
    try:
        os.rename(src_path, dest_path)
        new_rel_path = os.path.relpath(dest_path, assets_dir).replace('\\', '/')
        data_manager.update_metadata_id(track_id, new_rel_path)
        return jsonify({'status': 'renamed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/tracks/metadata', methods=['PATCH'])
def update_track_metadata():
    data = request.json
    track_id = data.get('trackId')
    icon = data.get('icon')
    if not track_id: return jsonify({'error': 'Missing trackId'}), 400
    updates = {}
    if icon: updates['icon'] = icon
    if updates:
        data_manager.save_track_metadata(track_id, updates)
        return jsonify({'status': 'updated'})
    return jsonify({'status': 'no changes'})

@audio_bp.route('/categories/rename', methods=['POST'])
def rename_category():
    data = request.json
    frame = data.get('frame', 'Global')
    t_type = data.get('type', 'music')
    old_name = data.get('oldName')
    new_name = data.get('newName')
    parent_cat = data.get('parent') # CORRECCIÓN: Usar 'parent' consistentemente

    if not old_name or not new_name: return jsonify({'error': 'Missing names'}), 400

    assets_dir = get_assets_dir()
    
    if parent_cat:
        base_path = os.path.join(assets_dir, frame, t_type, parent_cat)
        rel_base = f"{frame}/{t_type}/{parent_cat}"
    else:
        base_path = os.path.join(assets_dir, frame, t_type)
        rel_base = f"{frame}/{t_type}"
    
    src = os.path.join(base_path, old_name)
    dst = os.path.join(base_path, new_name)

    if os.path.exists(src):
        try:
            os.rename(src, dst)
            
            old_rel_prefix = f"{rel_base}/{old_name}/".replace('\\', '/')
            new_rel_prefix = f"{rel_base}/{new_name}/".replace('\\', '/')
            
            meta = data_manager.get_all_metadata()
            keys_to_update = [k for k in meta.keys() if k.startswith(old_rel_prefix)]
            
            for old_key in keys_to_update:
                new_key = old_key.replace(old_rel_prefix, new_rel_prefix, 1)
                data_manager.update_metadata_id(old_key, new_key)

            return jsonify({'status': 'renamed'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    return jsonify({'error': 'Category not found', 'path': src}), 404

@audio_bp.route('/categories', methods=['DELETE'])
def delete_category():
    frame = request.args.get('frame', 'Global')
    t_type = request.args.get('type', 'music')
    name = request.args.get('name')
    parent = request.args.get('parent')

    if not name: return jsonify({'error': 'Missing name'}), 400

    assets_dir = get_assets_dir()
    path = os.path.join(assets_dir, frame, t_type)
    if parent: path = os.path.join(path, parent)
    path = os.path.join(path, name)

    if os.path.exists(path):
        try:
            shutil.rmtree(path)
            return jsonify({'status': 'deleted'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Not found'}), 404

@audio_bp.route('/categories', methods=['POST'])
def create_category():
    data = request.json
    frame = data.get('frame', 'Global')
    t_type = data.get('type', 'music')
    name = data.get('name')
    parent = data.get('parent')

    if not name: return jsonify({'error': 'Missing name'}), 400

    assets_dir = get_assets_dir()
    path = os.path.join(assets_dir, frame, t_type)
    if parent: path = os.path.join(path, parent)
    path = os.path.join(path, name)

    os.makedirs(path, exist_ok=True)
    if t_type == 'music' and not parent:
        os.makedirs(os.path.join(path, "General"), exist_ok=True)

    return jsonify({'status': 'created'})

@audio_bp.route('/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'POST':
        data_manager.save_settings(request.json)
        return jsonify({"status": "saved"})
    return jsonify(data_manager.get_settings())

@audio_bp.route('/presets', methods=['GET', 'POST'])
def handle_presets():
    if request.method == 'POST':
        data = request.json
        preset = {
            "id": data.get('id') or str(uuid.uuid4()),
            "name": data.get('name', 'Nuevo Preset'),
            "frame": data.get('frame', 'Global'),
            "tracks": data.get('tracks', []) 
        }
        data_manager.save_preset(preset)
        return jsonify(preset)
    return jsonify(data_manager.get_presets())

@audio_bp.route('/presets/<preset_id>', methods=['DELETE'])
def delete_preset_endpoint(preset_id):
    data_manager.delete_preset(preset_id)
    return jsonify({"status": "deleted"})

@audio_bp.route('/playlist/order', methods=['POST'])
def save_playlist_order():
    data = request.json
    key = data.get('key')
    track_ids = data.get('trackIds', [])
    if key:
        data_manager.save_order(key, track_ids)
        return jsonify({"status": "saved"})
    return jsonify({"error": "missing key"}), 400

@audio_bp.route('/playlist/orders', methods=['GET'])
def get_playlist_orders():
    return jsonify(data_manager.get_orders())