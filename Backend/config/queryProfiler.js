const DEFAULT_SLOW_QUERY_MS = 150;
let mongooseExecPatched = false;

const toSafeJSON = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
};

export const configureMongoQueryProfiler = (connection) => {
  const thresholdMs = Number(process.env.SLOW_QUERY_MS || DEFAULT_SLOW_QUERY_MS);
  const enableProfiler = process.env.ENABLE_DB_PROFILING !== 'false';

  if (!enableProfiler || !connection?.getClient) {
    return;
  }

  // Always patch Mongoose exec as a reliable fallback for slow-query visibility.
  if (!mongooseExecPatched && connection.base?.Query?.prototype?.exec) {
    const queryProto = connection.base.Query.prototype;
    const originalExec = queryProto.exec;

    queryProto.exec = async function patchedExec(...args) {
      const startedAt = Date.now();

      try {
        return await originalExec.apply(this, args);
      } finally {
        const elapsedMs = Date.now() - startedAt;
        if (elapsedMs >= thresholdMs) {
          const modelName = this.model?.modelName || 'UnknownModel';
          const op = this.op || 'unknownOp';
          const filter = toSafeJSON(this.getQuery ? this.getQuery() : this._conditions);
          const projection = toSafeJSON(this._fields || {});

          console.warn(`[SLOW-QUERY] Mongoose ${modelName}.${op} took ${elapsedMs.toFixed(2)}ms`, {
            filter,
            projection
          });
        }
      }
    };

    mongooseExecPatched = true;
  }

  const client = connection.getClient();
  const inFlight = new Map();

  client.on('commandStarted', (event) => {
    inFlight.set(event.requestId, {
      commandName: event.commandName,
      command: event.command,
      startedAt: Date.now()
    });
  });

  client.on('commandSucceeded', (event) => {
    const started = inFlight.get(event.requestId);
    inFlight.delete(event.requestId);

    const driverElapsedMs = Number(event.duration || 0) / 1000;
    const fallbackElapsedMs = started?.startedAt ? (Date.now() - started.startedAt) : 0;
    const elapsedMs = driverElapsedMs > 0 ? driverElapsedMs : fallbackElapsedMs;
    if (elapsedMs < thresholdMs) {
      return;
    }

    console.warn(`[SLOW-QUERY] ${started?.commandName || event.commandName} took ${elapsedMs.toFixed(2)}ms`, {
      command: toSafeJSON(started?.command),
      reply: toSafeJSON(event.reply)
    });
  });

  client.on('commandFailed', (event) => {
    inFlight.delete(event.requestId);
  });

  console.log(`[SLOW-QUERY] profiler enabled (threshold=${thresholdMs}ms)`);
};
