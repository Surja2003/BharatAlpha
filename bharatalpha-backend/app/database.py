from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings


def create_engine() -> AsyncEngine:
    return create_async_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        future=True,
    )


engine: AsyncEngine = create_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def close_engine() -> None:
    await engine.dispose()
