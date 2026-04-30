import os
import smtplib
from email.message import EmailMessage
from datetime import datetime

SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587

ACCOUNTS = [
    {
        "user_env": "SMTP_USER_1",
        "pass_env": "SMTP_PASS_1",
        "from_addr": "ian-andrew@outlook.com",
        "to_addr": "ian-andrew@outlook.com",  # change if needed
    },
    {
        "user_env": "SMTP_USER_2",
        "pass_env": "SMTP_PASS_2",
        "from_addr": "jbo-b@outlook.com",
        "to_addr": "jbo-b@outlook.com",  # change if needed
    },
]


def send_email(username, password, from_addr, to_addr):
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    subject = f"Daily reminder from {from_addr}"
    body = f"""Hello,

This is your automated daily reminder email.

Sent from: {from_addr}
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
    for account in ACCOUNTS:
        user = os.getenv(account["user_env"])
        pwd = os.getenv(account["pass_env"])

        if not user or not pwd:
            print(f"Skipping {account['from_addr']} – missing env vars.")
            continue

        print(f"Sending email for {account['from_addr']}...")
        send_email(user, pwd, account["from_addr"], account["to_addr"])
        print(f"Done for {account['from_addr']}.")

if __name__ == "__main__":
    main()

