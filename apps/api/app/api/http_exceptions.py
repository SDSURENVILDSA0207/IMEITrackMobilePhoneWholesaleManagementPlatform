"""Shared HTTP error factories so routes stay consistent and DRY."""

from fastapi import HTTPException, status


def bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def not_found(entity: str) -> HTTPException:
    """Raise 404 with ``{entity} not found`` (e.g. entity ``"Sales order"``)."""
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{entity} not found")


def conflict(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
