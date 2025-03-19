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

    def send_low_stock_alert(self, items):
        try:
            creds = self.get_credentials()
            service = build('gmail', 'v1', credentials=creds)

            message = MIMEMultipart()
            message["From"] = self.sender_email
            message["To"] = self.sender_email
            message["Subject"] = "StockWise: Low Stock Alert"

            # Create HTML table for low stock items
            html_content = """
            <h2>Low Stock Alert</h2>
            <table border="1">
                <tr>
                    <th>Item Name</th>
                    <th>Current Quantity</th>
                    <th>Days Until Low</th>
                </tr>
            """

            for item in items:
                html_content += f"""
                <tr>
                    <td>{item['name']}</td>
                    <td>{item['current_quantity']}</td>
                    <td>{item['predicted_days_until_low']}</td>
                </tr>
                """

            html_content += "</table>"
            message.attach(MIMEText(html_content, "html"))

            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            message_body = {'raw': raw_message}

            send_message = (service.users().messages().send(userId="me", body=message_body).execute())
            logger.debug(f"Message Id: {send_message['id']}")

            return True
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}", exc_info=True)
            return False