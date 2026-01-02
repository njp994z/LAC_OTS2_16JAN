import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface SessionConnection {
  ws: WebSocket;
  sessionId: string;
}

class SessionWebSocketServer {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, Set<WebSocket>> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket) => {
      let sessionId: string | null = null;

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'JOIN_SESSION') {
            sessionId = message.sessionId;
            if (sessionId) {
              this.addConnection(sessionId, ws);
              ws.send(JSON.stringify({
                type: 'SESSION_JOINED',
                sessionId,
                timestamp: Date.now()
              }));
            }
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      });

      ws.on('close', () => {
        if (sessionId) {
          this.removeConnection(sessionId, ws);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (sessionId) {
          this.removeConnection(sessionId, ws);
        }
      });
    });

    console.log('WebSocket server initialized on /ws');
  }

  private addConnection(sessionId: string, ws: WebSocket) {
    if (!this.connections.has(sessionId)) {
      this.connections.set(sessionId, new Set());
    }
    this.connections.get(sessionId)!.add(ws);
    console.log(`WebSocket client joined session ${sessionId.substring(0, 8)}... (${this.connections.get(sessionId)!.size} clients)`);
  }

  private removeConnection(sessionId: string, ws: WebSocket) {
    const sessionConnections = this.connections.get(sessionId);
    if (sessionConnections) {
      sessionConnections.delete(ws);
      if (sessionConnections.size === 0) {
        this.connections.delete(sessionId);
      }
      console.log(`WebSocket client left session ${sessionId.substring(0, 8)}... (${sessionConnections.size} clients remaining)`);
    }
  }

  broadcastToSession(sessionId: string, eventType: string, data: any) {
    const sessionConnections = this.connections.get(sessionId);
    if (!sessionConnections || sessionConnections.size === 0) {
      return 0;
    }

    const message = JSON.stringify({
      type: eventType,
      data,
      timestamp: Date.now()
    });

    let sentCount = 0;
    sessionConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    console.log(`Broadcast ${eventType} to session ${sessionId.substring(0, 8)}... (${sentCount} clients)`);
    return sentCount;
  }

  getSessionClientCount(sessionId: string): number {
    return this.connections.get(sessionId)?.size || 0;
  }
}

export const sessionWS = new SessionWebSocketServer();
