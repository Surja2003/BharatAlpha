"""initial

Revision ID: 0001_initial
Revises:
Create Date: 2026-03-21

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def _try_create_extension(ext_name: str) -> None:
    op.execute(
        sa.text(
            f"""
DO $$
BEGIN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "{ext_name}"';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping extension creation (%): insufficient privilege', '{ext_name}';
    WHEN undefined_file THEN
        RAISE NOTICE 'Skipping extension creation (%): not available', '{ext_name}';
    WHEN feature_not_supported THEN
        RAISE NOTICE 'Skipping extension creation (%): feature not supported', '{ext_name}';
END $$;
"""
        )
    )


def upgrade() -> None:
    _try_create_extension("pgcrypto")
    _try_create_extension("timescaledb")

    op.create_table(
        "stocks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("symbol", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("sector", sa.String(length=100), nullable=True),
        sa.Column("industry", sa.String(length=100), nullable=True),
        sa.Column("exchange", sa.String(length=10), nullable=False, server_default=sa.text("'NSE'")),
        sa.Column("series", sa.String(length=5), nullable=False, server_default=sa.text("'EQ'")),
        sa.Column("isin", sa.String(length=20), nullable=True),
        sa.Column("iifl_scrip_code", sa.String(length=20), nullable=True),
        sa.Column("market_cap", sa.BigInteger(), nullable=True),

        sa.Column("pe_ratio", sa.Numeric(10, 2), nullable=True),
        sa.Column("pb_ratio", sa.Numeric(10, 2), nullable=True),
        sa.Column("ev_ebitda", sa.Numeric(10, 2), nullable=True),
        sa.Column("roe", sa.Numeric(8, 2), nullable=True),
        sa.Column("roce", sa.Numeric(8, 2), nullable=True),
        sa.Column("debt_equity", sa.Numeric(8, 2), nullable=True),
        sa.Column("current_ratio", sa.Numeric(8, 2), nullable=True),
        sa.Column("eps", sa.Numeric(10, 2), nullable=True),
        sa.Column("book_value", sa.Numeric(10, 2), nullable=True),
        sa.Column("dividend_yield", sa.Numeric(6, 2), nullable=True),
        sa.Column("revenue_growth_yoy", sa.Numeric(8, 2), nullable=True),
        sa.Column("profit_growth_yoy", sa.Numeric(8, 2), nullable=True),
        sa.Column("sector_pe", sa.Numeric(10, 2), nullable=True),

        sa.Column("promoter_holding", sa.Numeric(6, 2), nullable=True),
        sa.Column("fii_holding", sa.Numeric(6, 2), nullable=True),
        sa.Column("dii_holding", sa.Numeric(6, 2), nullable=True),
        sa.Column("promoter_change_qoq", sa.Numeric(6, 2), nullable=True),
        sa.Column("fii_change_qoq", sa.Numeric(6, 2), nullable=True),
        sa.Column("shareholding_date", sa.Date(), nullable=True),

        sa.Column("bharatalpha_score", sa.Integer(), nullable=True),
        sa.Column("signal", sa.String(length=10), nullable=True),
        sa.Column("signal_confidence", sa.Integer(), nullable=True),
        sa.Column("risk_level", sa.String(length=10), nullable=True),

        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("listed_date", sa.Date(), nullable=True),
        sa.Column("fundamentals_updated_at", sa.DateTime(), nullable=True),
        sa.Column("signal_updated_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),

        sa.UniqueConstraint("symbol", name="uq_stocks_symbol"),
    )
    op.create_index("ix_stocks_symbol", "stocks", ["symbol"], unique=True)

    op.create_table(
        "prices",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("symbol", sa.String(length=20), nullable=False),
        sa.Column("open", sa.Numeric(12, 2), nullable=True),
        sa.Column("high", sa.Numeric(12, 2), nullable=True),
        sa.Column("low", sa.Numeric(12, 2), nullable=True),
        sa.Column("close", sa.Numeric(12, 2), nullable=True),
        sa.Column("volume", sa.BigInteger(), nullable=True),
        sa.Column("vwap", sa.Numeric(12, 2), nullable=True),
        sa.PrimaryKeyConstraint("time", "symbol", name="pk_prices"),
    )
    op.create_index("ix_prices_symbol_time", "prices", ["symbol", "time"], unique=False)

    op.execute(
        sa.text(
            """
DO $$
BEGIN
    PERFORM create_hypertable('prices', 'time', if_not_exists => TRUE);
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE 'Skipping hypertable creation: create_hypertable not available';
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping hypertable creation: insufficient privilege';
END $$;
"""
        )
    )

    op.create_table(
        "live_prices",
        sa.Column("symbol", sa.String(length=20), primary_key=True),
        sa.Column("ltp", sa.Numeric(12, 2), nullable=True),
        sa.Column("change", sa.Numeric(10, 2), nullable=True),
        sa.Column("change_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("open", sa.Numeric(12, 2), nullable=True),
        sa.Column("high", sa.Numeric(12, 2), nullable=True),
        sa.Column("low", sa.Numeric(12, 2), nullable=True),
        sa.Column("volume", sa.BigInteger(), nullable=True),
        sa.Column("bid", sa.Numeric(12, 2), nullable=True),
        sa.Column("ask", sa.Numeric(12, 2), nullable=True),
        sa.Column("week52_high", sa.Numeric(12, 2), nullable=True),
        sa.Column("week52_low", sa.Numeric(12, 2), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "signals",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("symbol", sa.String(length=20), nullable=False),
        sa.Column("signal", sa.String(length=10), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=True),
        sa.Column("risk_level", sa.String(length=10), nullable=True),
        sa.Column("reasoning_chain", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("targets", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("model_scores", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("market_regime", sa.String(length=20), nullable=True),
        sa.Column("ltp_at_signal", sa.Numeric(12, 2), nullable=True),
        sa.Column("bharatalpha_score", sa.Integer(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("backtest_sharpe", sa.Numeric(6, 3), nullable=True),
        sa.Column("backtest_winrate", sa.Numeric(6, 3), nullable=True),
        sa.Column("passed_backtest", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "disclaimer",
            sa.Text(),
            nullable=False,
            server_default=sa.text("'Not financial advice. Educational only.'"),
        ),
    )
    op.create_index("ix_signals_symbol_generated_at", "signals", ["symbol", "generated_at"], unique=False)

    op.create_table(
        "quarterly_results",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("symbol", sa.String(length=20), nullable=False),
        sa.Column("quarter", sa.String(length=20), nullable=False),
        sa.Column("revenue", sa.BigInteger(), nullable=True),
        sa.Column("net_profit", sa.BigInteger(), nullable=True),
        sa.Column("ebitda", sa.BigInteger(), nullable=True),
        sa.Column("eps", sa.Numeric(10, 2), nullable=True),
        sa.Column("margin_pct", sa.Numeric(6, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("symbol", "quarter", name="uq_quarterly_results_symbol_quarter"),
    )
    op.create_index("ix_quarterly_results_symbol", "quarterly_results", ["symbol"], unique=False)

    op.create_table(
        "mutual_funds",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("scheme_code", sa.String(length=20), nullable=False),
        sa.Column("isin", sa.String(length=20), nullable=True),
        sa.Column("name", sa.String(length=300), nullable=False),
        sa.Column("amc", sa.String(length=100), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("subcategory", sa.String(length=50), nullable=True),
        sa.Column("nav", sa.Numeric(12, 4), nullable=True),
        sa.Column("nav_change", sa.Numeric(10, 4), nullable=True),
        sa.Column("nav_change_pct", sa.Numeric(8, 4), nullable=True),
        sa.Column("aum", sa.BigInteger(), nullable=True),
        sa.Column("expense_ratio", sa.Numeric(6, 4), nullable=True),
        sa.Column("returns_1y", sa.Numeric(8, 2), nullable=True),
        sa.Column("returns_3y", sa.Numeric(8, 2), nullable=True),
        sa.Column("returns_5y", sa.Numeric(8, 2), nullable=True),
        sa.Column("benchmark", sa.String(length=100), nullable=True),
        sa.Column("benchmark_return_3y", sa.Numeric(8, 2), nullable=True),
        sa.Column("risk_level", sa.String(length=20), nullable=True),
        sa.Column("min_sip", sa.Integer(), nullable=True),
        sa.Column("min_lumpsum", sa.Integer(), nullable=True),
        sa.Column("bharatalpha_fund_score", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("nav_date", sa.Date(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("scheme_code", name="uq_mutual_funds_scheme_code"),
    )
    op.create_index("ix_mutual_funds_scheme_code", "mutual_funds", ["scheme_code"], unique=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=True),
        sa.Column("phone", sa.String(length=15), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("plan", sa.String(length=20), nullable=False, server_default=sa.text("'free'")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "watchlists",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("symbol", sa.String(length=20), nullable=False),
        sa.Column("added_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "symbol", name="uq_watchlists_user_symbol"),
    )

    op.create_table(
        "news",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source", sa.String(length=100), nullable=True),
        sa.Column("headline", sa.String(length=500), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("url", sa.String(length=1000), nullable=True),
        sa.Column("tickers", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("sentiment", sa.String(length=20), nullable=True),
        sa.Column("sentiment_score", sa.Numeric(6, 4), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_news_published_at", "news", ["published_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_news_published_at", table_name="news")
    op.drop_table("news")

    op.drop_table("watchlists")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_mutual_funds_scheme_code", table_name="mutual_funds")
    op.drop_table("mutual_funds")

    op.drop_index("ix_quarterly_results_symbol", table_name="quarterly_results")
    op.drop_table("quarterly_results")

    op.drop_index("ix_signals_symbol_generated_at", table_name="signals")
    op.drop_table("signals")

    op.drop_table("live_prices")

    op.drop_index("ix_prices_symbol_time", table_name="prices")
    op.drop_table("prices")

    op.drop_index("ix_stocks_symbol", table_name="stocks")
    op.drop_table("stocks")
