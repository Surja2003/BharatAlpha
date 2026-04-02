from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.redis_client import get_redis

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/prices")
async def prices_ws(websocket: WebSocket):
	await websocket.accept()
	try:
		redis_client = await get_redis()
		pubsub = redis_client.pubsub()
		await pubsub.subscribe("prices")
	except Exception:  # noqa: BLE001
		await websocket.send_text('{"type":"error","code":"REDIS_UNAVAILABLE"}')
		await websocket.close(code=1011)
		return
	try:
		while True:
			message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
			if message and message.get("type") == "message":
				data = message.get("data")
				if isinstance(data, str):
					await websocket.send_text(data)
				else:
					await websocket.send_text(str(data))
			await asyncio.sleep(0.05)
	except WebSocketDisconnect:
		return
	finally:
		try:
			await pubsub.unsubscribe("prices")
		except Exception:  # noqa: BLE001
			pass
		await pubsub.close()


@router.websocket("/market")
async def market_ws(websocket: WebSocket):
	"""Symbol-based streaming over Redis pubsub.

	Client messages:
	- {"type":"subscribe","symbols":["SBIN","TCS"]}
	- {"type":"unsubscribe","symbols":["TCS"]}
	- {"type":"ping"}

	Server messages:
	- ticks as JSON (as published on Redis channel `prices`)
	- {"type":"subscribed","symbols":[...]}
	- {"type":"unsubscribed","symbols":[...]}
	- {"type":"pong"}
	"""

	await websocket.accept()
	subscribed: set[str] = set()

	try:
		redis_client = await get_redis()
		pubsub = redis_client.pubsub()
		await pubsub.subscribe("prices")
	except Exception:  # noqa: BLE001
		await websocket.send_text('{"type":"error","code":"REDIS_UNAVAILABLE"}')
		await websocket.close(code=1011)
		return

	async def _recv_loop() -> None:
		nonlocal subscribed
		while True:
			raw = await websocket.receive_text()
			try:
				msg = json.loads(raw)
			except Exception:  # noqa: BLE001
				await websocket.send_text('{"type":"error","code":"BAD_JSON"}')
				continue

			mtype = (msg.get("type") or "").strip().lower()
			if mtype == "ping":
				await websocket.send_text('{"type":"pong"}')
				continue

			syms = msg.get("symbols") or []
			if not isinstance(syms, list):
				syms = []
			clean = {str(s).strip().upper() for s in syms if str(s).strip()}

			if mtype == "subscribe":
				subscribed |= clean
				await websocket.send_text(json.dumps({"type": "subscribed", "symbols": sorted(subscribed)}))
			elif mtype == "unsubscribe":
				subscribed -= clean
				await websocket.send_text(json.dumps({"type": "unsubscribed", "symbols": sorted(subscribed)}))
			else:
				await websocket.send_text('{"type":"error","code":"UNKNOWN_MESSAGE"}')

	async def _send_loop() -> None:
		while True:
			message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
			if message and message.get("type") == "message":
				data = message.get("data")
				text = data if isinstance(data, str) else str(data)
				if subscribed:
					try:
						obj = json.loads(text)
						sym = (obj.get("symbol") or "").strip().upper()
						if sym and sym not in subscribed:
							continue
					except Exception:  # noqa: BLE001
						# If tick isn't JSON, forward only when no subscriptions.
						continue
				await websocket.send_text(text)
			await asyncio.sleep(0.01)

	t_recv = asyncio.create_task(_recv_loop())
	t_send = asyncio.create_task(_send_loop())
	try:
		await asyncio.wait({t_recv, t_send}, return_when=asyncio.FIRST_EXCEPTION)
	except WebSocketDisconnect:
		return
	finally:
		for t in (t_recv, t_send):
			if not t.done():
				t.cancel()
		try:
			await pubsub.unsubscribe("prices")
		except Exception:  # noqa: BLE001
			pass
		await pubsub.close()
