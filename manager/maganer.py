from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New connection: {len(self.active_connections)} total")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Disconnected: {len(self.active_connections)} remaining")

    async def broadcast(self, message: str, sender: WebSocket):
        for connection in self.active_connections:
            if connection != sender:
                await connection.send_text(message)
