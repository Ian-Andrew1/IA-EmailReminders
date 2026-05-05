import os
import smtplib
from email.message import EmailMessage
from datetime import datetime

SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587

SENDER = "ian-andrew@outlook.com"

RECIPIENTS = [
    "ian-andrew@outlook.com",
    "jbo-b@outlook.com"
]

def send_email(username, password, from_addr, to_addr):
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    subject = "Daily reminder"
    body = f"""Hello,

This is your automated daily reminder email.

Sent from: {from_addr}
To: {to_addr}
Time (UTC): {now}

You can adjust the content of this message in mailer.py.
"""

    msg = EmailMessage()
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(username, password)
        server.send_message(msg)

def main():
    username = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")

    if not username or not password:
        print("Missing SMTP_USER or SMTP_PASS environment variables.")
        return

    for recipient in RECIPIENTS:
        print(f"Sending email to {recipient}...")
        send_email(username, password, SENDER, recipient)
        print(f"Done for {recipient}.")

if __name__ == "__main__":
    main()
