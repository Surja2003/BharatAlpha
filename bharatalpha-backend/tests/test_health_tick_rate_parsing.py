from __future__ import annotations

import pytest


def _parse_tick_count(raw) -> int:
    return int(raw) if raw and str(raw).strip().isdigit() else 0


@pytest.mark.parametrize(
    "raw,expected",
    [
        (None, 0),
        ("", 0),
        ("abc", 0),
        ("  12 ", 12),
        ("001", 1),
    ],
)
def test_tick_rate_counter_parsing(raw, expected) -> None:
    assert _parse_tick_count(raw) == expected
