import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")

if not MONGO_URI:
    logger.error("MONGODB_URI environment variable not set.")
    client = None
    db = None
else:
    logger.info("MONGODB_URI found, attempting to connect...")
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client.founder_clarity_compass
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        client = None
        db = None

async def ping_server():
    if not client:
        return False
    try:
        await client.admin.command('ping')
        logger.info("MongoDB ping successful.")
        return True
    except Exception as e:
        logger.error(f"MongoDB ping failed: {e}")
        return False