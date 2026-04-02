from __future__ import annotations

import pytest

from app.api.v1.health import _parse_iso_dt


def test_parse_iso_dt_handles_missing() -> None:
    assert _parse_iso_dt(None) is None
    assert _parse_iso_dt("") is None


def test_parse_iso_dt_parses_iso() -> None:
    dt = _parse_iso_dt("2026-03-22T10:00:00")
    assert dt is not None
    assert dt.year == 2026
