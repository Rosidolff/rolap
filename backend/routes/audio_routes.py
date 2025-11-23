import os
import shutil
import uuid
from flask import Blueprint, jsonify, request, send_from_directory, current_app
import data_manager

audio_bp = Blueprint('audio_bp', __name__)

# Helper to get assets dir. 
# We assume assets is in the parent directory of this file's directory (backend/assets)
def get_assets_dir():
    # backend/routes/audio_routes.py -> backend/routes -> backend -> backend/assets
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, 'assets')

@audio_bp.route('/system/prune', methods=['POST'])
def prune_system():
    try:
        data_manager.prune_orphaned_data(get_assets_dir())
        return jsonify({"status": "success", "message": "System cleaned"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

                # Construct URL. Assuming app serves assets at /assets/
                # We might need to adjust this if we serve assets via a different route or static folder
                # For now, let's assume the main app will have a route for /assets/<path>
                # Or we can serve it via this blueprint if we want.
                # Let's use a relative URL or absolute based on request.host_url
                
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
    if request.form.get('is_global') == 'true': frame = 'Global'
    frame = safe_name(frame)
        
    category = safe_name(request.form.get('category', 'General'))
    subcategory = safe_name(request.form.get('subcategory', ''))

    assets_dir = get_assets_dir()
    save_path = os.path.join(assets_dir, frame, t_type, category, subcategory)
    os.makedirs(save_path, exist_ok=True)
    
    filename = f"{custom_name}{os.path.splitext(file.filename)[1]}"
    file.save(os.path.join(save_path, filename))
    
    rel_path = os.path.relpath(os.path.join(save_path, filename), assets_dir).replace('\\', '/')
    data_manager.save_track_metadata(rel_path, {'icon': icon})
    
    return jsonify({"status": "success"}), 201

@audio_bp.route('/tracks/move', methods=['POST'])
def move_track():
    data = request.json
    track_id = data.get('trackId')
    new_frame = data.get('newFrame', 'Global')
    new_category = data.get('newCategory')
    new_subcategory = data.get('newSubcategory')
    t_type = data.get('type', 'music') 

    if not track_id or not new_category: return jsonify({'error': 'Missing data'}), 400

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
