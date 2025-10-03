from backend.extensions import db  # noqa: F401
from .user import User
from .document import Document     # ya no trae Tag
from .tag import Tag
from .shared_link import SharedLink
from .audit_v2 import AuditV2, AuditV2Existence, AuditV2Updates
from .document_comment import DocumentComment  # noqa: F401
