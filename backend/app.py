from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv # Importar dotenv
from routes.campaign_routes import campaign_bp
from routes.vault_routes import vault_bp
from routes.session_routes import session_bp
from routes.ai_routes import ai_bp
from routes.audio_routes import audio_bp

# Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__)
CORS(app)

DATA_STORAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data_storage'))
app.config['DATA_STORAGE_PATH'] = DATA_STORAGE_PATH

app.register_blueprint(campaign_bp, url_prefix='/api/campaigns')
app.register_blueprint(vault_bp, url_prefix='/api/campaigns')
app.register_blueprint(session_bp, url_prefix='/api/campaigns')
app.register_blueprint(ai_bp, url_prefix='/api/campaigns')
app.register_blueprint(audio_bp, url_prefix='/api')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "storage_path": DATA_STORAGE_PATH})

@app.route('/assets/<path:path>')
def serve_asset(path):
    assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')
    return send_from_directory(assets_dir, path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)