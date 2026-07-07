import os
import json
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Check for GCP credentials or Firebase Project ID
GOOGLE_CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_CREDENTIALS_JSON")
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID")

class MockDocument:
    def __init__(self, doc_id: str, data: Dict[str, Any] = None):
        self.id = doc_id
        self._data = data or {}
        self.exists = len(self._data) > 0

    def to_dict(self) -> Dict[str, Any]:
        return self._data

class MockQuery:
    def __init__(self, docs: List[MockDocument]):
        self._docs = docs

    def stream(self):
        return self._docs

    def get(self):
        return self._docs

class MockCollectionReference:
    def __init__(self, db_instance, collection_name: str):
        self.db = db_instance
        self.name = collection_name

    def document(self, doc_id: str):
        return MockDocumentReference(self.db, self.name, doc_id)

    def get(self):
        docs_data = self.db._load_db().get(self.name, {})
        return [MockDocument(doc_id, data) for doc_id, data in docs_data.items()]

    def stream(self):
        return self.get()

class MockDocumentReference:
    def __init__(self, db_instance, collection_name: str, doc_id: str):
        self.db = db_instance
        self.collection_name = collection_name
        self.id = doc_id

    def get(self):
        db_data = self.db._load_db()
        doc_data = db_data.get(self.collection_name, {}).get(self.id, {})
        return MockDocument(self.id, doc_data)

    def set(self, data: Dict[str, Any], merge: bool = False):
        db_data = self.db._load_db()
        if self.collection_name not in db_data:
            db_data[self.collection_name] = {}
        
        if merge and self.id in db_data[self.collection_name]:
            db_data[self.collection_name][self.id].update(data)
        else:
            db_data[self.collection_name][self.id] = data
            
        self.db._save_db(db_data)
        logger.info(f"[Mock DB] Document {self.id} in collection '{self.collection_name}' set successfully.")

    def update(self, data: Dict[str, Any]):
        db_data = self.db._load_db()
        if self.collection_name in db_data and self.id in db_data[self.collection_name]:
            db_data[self.collection_name][self.id].update(data)
            self.db._save_db(db_data)
            logger.info(f"[Mock DB] Document {self.id} in collection '{self.collection_name}' updated successfully.")
        else:
            raise Exception(f"Document {self.id} does not exist in collection '{self.collection_name}'.")

    def delete(self):
        db_data = self.db._load_db()
        if self.collection_name in db_data and self.id in db_data[self.collection_name]:
            del db_data[self.collection_name][self.id]
            self.db._save_db(db_data)
            logger.info(f"[Mock DB] Document {self.id} in collection '{self.collection_name}' deleted.")

class MockFirestoreClient:
    def __init__(self, filepath: str = "db_mock.json"):
        # Make sure path is absolute inside the backend directory to avoid path mismatches
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.filepath = os.path.join(current_dir, filepath)
        if not os.path.exists(self.filepath):
            self._save_db({})

    def _load_db(self) -> Dict[str, Any]:
        try:
            with open(self.filepath, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading mock database file: {e}")
            return {}

    def _save_db(self, data: Dict[str, Any]):
        try:
            with open(self.filepath, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving mock database file: {e}")

    def collection(self, collection_name: str):
        return MockCollectionReference(self, collection_name)

# Initialize Client
db = None
is_mock = True

if GOOGLE_CREDENTIALS or GOOGLE_CREDENTIALS_JSON or FIREBASE_PROJECT_ID:
    try:
        from google.cloud import firestore
        
        if GOOGLE_CREDENTIALS_JSON:
            logger.info("Initializing Firestore using GOOGLE_CREDENTIALS_JSON env var.")
            creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
            from google.oauth2 import service_account
            creds = service_account.Credentials.from_service_account_info(creds_dict)
            project_id = creds_dict.get("project_id") or FIREBASE_PROJECT_ID
            db = firestore.Client(credentials=creds, project=project_id)
        else:
            logger.info("Initializing Firestore using default credentials or FIREBASE_PROJECT_ID.")
            db = firestore.Client()
            
        is_mock = False
        logger.info("Successfully initialized Google Cloud Firestore Client.")
    except Exception as e:
        logger.warning(f"Error importing or initializing Cloud Firestore: {e}. Falling back to Mock DB.")
        db = MockFirestoreClient()
        is_mock = True
else:
    logger.info("No Cloud credentials specified. Using Local Mock Firestore Database.")
    db = MockFirestoreClient()
    is_mock = True

def get_db():
    return db
