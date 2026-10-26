/**
 * Preload for the mock-provider network test.
 * Replaces socket connect, HTTP entry points, DNS lookup, and fetch
 * before the evaluated module runs. A call throws NETWORK_BLOCKED.
 */
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";

const blocked = (name) =>
  function networkBlocked() {
    const error = new Error(`Network call blocked: ${name}`);
    error.code = "NETWORK_BLOCKED";
    throw error;
  };

net.Socket.prototype.connect = blocked("Socket.connect");
net.connect = blocked("net.connect");
net.createConnection = blocked("net.createConnection");

if (tls.TLSSocket?.prototype) {
  tls.TLSSocket.prototype.connect = blocked("TLSSocket.connect");
}

http.request = blocked("http.request");
http.get = blocked("http.get");
https.request = blocked("https.request");
https.get = blocked("https.get");

dns.lookup = blocked("dns.lookup");
if (dns.promises) {
  dns.promises.lookup = blocked("dns.promises.lookup");
}

globalThis.fetch = blocked("fetch");
