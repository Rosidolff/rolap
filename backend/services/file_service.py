import json
import os
import shutil

class FileService:
    def __init__(self, storage_path):
        self.storage_path = storage_path

    def _get_campaign_path(self, campaign_id):
        return os.path.join(self.storage_path, f"campaign_{campaign_id}")

    def create_campaign_structure(self, campaign_id):
        base_path = self._get_campaign_path(campaign_id)
        os.makedirs(base_path, exist_ok=True)
        os.makedirs(os.path.join(base_path, "vault"), exist_ok=True)
        os.makedirs(os.path.join(base_path, "sessions"), exist_ok=True)
        return base_path

    def save_json(self, path, data):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def load_json(self, path):
        if not os.path.exists(path):
            return None
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def list_campaigns(self):
        campaigns = []
        if not os.path.exists(self.storage_path):
            return campaigns
            
        for item in os.listdir(self.storage_path):
            if item.startswith("campaign_") and os.path.isdir(os.path.join(self.storage_path, item)):
                campaign_id = item.replace("campaign_", "")
                metadata_path = os.path.join(self.storage_path, item, "metadata.json")
                metadata = self.load_json(metadata_path)
                if metadata:
                    campaigns.append(metadata)
        return campaigns

    def delete_campaign(self, campaign_id):
        path = self._get_campaign_path(campaign_id)
        if os.path.exists(path):
            shutil.rmtree(path)
            return True
        return False
