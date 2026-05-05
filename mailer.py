import os
import json
import smtplib
from email.message import EmailMessage
from datetime import datetime

SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587

SENDER = "ian-andrew@outlook.com"
RECIPIENT = "ian-andrew@outlook.com"  # Only one email now

def load_list():
    with open("list.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("items", [])

def build_html(items):
    list_items = "".join(f"<li>{item}</li>" for item in items)
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #222;">
        <h2>Today's Tasks</h2>
        <ul>
            {list_items}
        </ul>
        <p style="font-size: 12px; color: #666;">
            Sent automatically at 04:00 UK time.<br>
            Generated at {now}.
        </p>
    </body>
    </html>
    """

def send_email(username, password, from_addr, to_addr, html_body):
    msg = EmailMessage()
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg["Subject"] = "Today's Tasks"
    msg.add_alternative(html_body, subtype="html")

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

    items = load_list()
    html_body = build_html(items)

    print(f"Sending email to {RECIPIENT}...")
    send_email(username, password, SENDER, RECIPIENT, html_body)
    print("Done.")

if __name__ == "__main__":
    main()
