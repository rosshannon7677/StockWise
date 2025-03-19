from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow # type: ignore
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64
import os
import pickle
import logging
from google.oauth2 import service_account
from pathlib import Path
from googleapiclient.discovery import build  # Add this import at the top
from dotenv import load_dotenv # type: ignore

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

class EmailService:
    def __init__(self):
        self.SCOPES = ['https://www.googleapis.com/auth/gmail.send']
        self.sender_email = "rosshannonty@gmail.com"
        
    def get_credentials(self):
        try:
            creds = None
            current_dir = os.path.dirname(os.path.abspath(__file__))
            token_path = os.path.join(current_dir, 'token.pickle')
            credentials_path = os.path.join(current_dir, 'credentials.json')

            if os.path.exists(token_path):
                logger.debug("Loading existing credentials from token.pickle")
                with open(token_path, 'rb') as token:
                    creds = pickle.load(token)

            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    logger.debug("Refreshing expired credentials")
                    creds.refresh(Request())
                else:
                    logger.debug("Starting new OAuth flow")
                    flow = InstalledAppFlow.from_client_secrets_file(
                        credentials_path, 
                        self.SCOPES,
                        redirect_uri='http://localhost'
                    )
                    creds = flow.run_local_server(
                        port=0,
                        authorization_prompt_message="Please authorize StockWise to send emails",
                        success_message="Authorization successful! You can close this window."
                    )
                    logger.debug("OAuth flow completed successfully")
                
                logger.debug("Saving new credentials to token.pickle")
                with open(token_path, 'wb') as token:
                    pickle.dump(creds, token)

            return creds
        except Exception as e:
            logger.error(f"Error in get_credentials: {str(e)}", exc_info=True)
            raise