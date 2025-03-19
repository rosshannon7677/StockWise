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