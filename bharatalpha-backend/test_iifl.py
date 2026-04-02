import asyncio
from app.services.data_pipeline.iifl_fetcher import IIFLFetcher
from redis.asyncio import Redis

async def main():
    redis = Redis.from_url("redis://127.0.0.1:6379/0")
    p = IIFLFetcher(redis_client=redis)
    try:
        res = await p.get_live_quote('RELIANCE')
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", repr(e))
    finally:
        await redis.close()

if __name__ == '__main__':
    asyncio.run(main())