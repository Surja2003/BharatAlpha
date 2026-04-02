from __future__ import annotations


class DataSourceError(Exception):
    """Base class for data-source failures."""


class UpstreamUnavailable(DataSourceError):
    """Raised when an upstream provider is unreachable or rate-limited."""


class InvalidUpstreamResponse(DataSourceError):
    """Raised when the upstream response shape is unexpected."""


class CredentialsMissing(DataSourceError):
    """Raised when required credentials are not configured."""
