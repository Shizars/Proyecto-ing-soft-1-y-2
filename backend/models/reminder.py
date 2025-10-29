from datetime import datetime
from backend.extensions import db


class Reminder(db.Model):
    __tablename__ = "reminders"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    due_at = db.Column(db.DateTime, nullable=False, index=True)  # UTC
    done = db.Column(db.Boolean, nullable=False,
                     server_default="0", index=True)
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)

    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    owner = db.relationship("User", backref=db.backref("reminders", lazy=True))

    def __repr__(self):
        return f"<Reminder {self.id} {self.title} due={self.due_at.isoformat()}>"
