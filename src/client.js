var Client;

Client = (function() {
  function Client(serverFps) {
    this.serverFps = serverFps;
    this.userCommands = [];
  }

  Client.prototype.run = function(fps, callback) {
    var frameLength, gameLoop, ref, serverFrameLength, time;
    frameLength = 1000 / fps;
    serverFrameLength = 1000 / this.serverFps;
    time = ((ref = this.oldSnap) != null ? ref.time : void 0) || 0;
    gameLoop = (function(_this) {
      return function() {
        var command, entities, t1, t2;
        t1 = new Date().getTime();
        time += _this.serverFps / fps;
        if ((_this.oldSnap != null) && _this.oldSnap.time > time) {
          time = _this.oldSnap.time;
        }
        entities = _this.renderFrame(time, _this.readInput());
        command = _this.userCommands[_this.userCommands.length - 1];
        callback(entities, command);
        t2 = new Date().getTime();
        return _this.timeout = setTimeout(gameLoop, frameLength - (t2 - t1));
      };
    })(this);
    return gameLoop();
  };

  Client.prototype.receiveSnapshot = function(snapshot) {
    if ((this.oldSnap != null) && (this.nextSnap != null)) {
      this.oldSnap = this.nextSnap;
      this.nextSnap = snapshot;
    } else if (this.oldSnap != null) {
      this.nextSnap = snapshot;
    } else {
      this.oldSnap = snapshot;
    }
    return this.expireUserCommands(snapshot);
  };

  Client.prototype.expireUserCommands = function(latestSnap) {
    var lastAckTime;
    if (latestSnap.players[this.localPlayer.name]) {
      lastAckTime = latestSnap.players[this.localPlayer.name].time;
      return this.userCommands = this.userCommands.filter(function(command) {
        return command.time > lastAckTime;
      });
    }
  };

  Client.prototype.renderFrame = function(time, input) {
    var entities, ref;
    if (input == null) {
      input = {};
    }
    if (time >= ((ref = this.nextSnap) != null ? ref.time : void 0)) {
      this.oldSnap = this.nextSnap;
      this.nextSnap = null;
    }
    if (time === this.oldSnap.time) {
      entities = this.oldSnap.players;
    } else if ((this.oldSnap != null) && (this.nextSnap != null)) {
      entities = this.interpolate(this.oldSnap, this.nextSnap, time);
    } else {
      entities = this.extrapolate(this.oldSnap, time);
    }
    if (this.userCommands.length > 0) {
      this.predict(this.nextSnap || this.oldSnap, this.userCommands);
    }
    entities[this.localPlayer.name].position = this.localPlayer.position;
    this.userCommands.push({
      time: time,
      inputs: input
    });
    return entities;
  };

  Client.prototype.interpolate = function(snap0, snap1, time) {
    var entities, interp, name, p0, p1, player, ref;
    entities = {};
    interp = (time - snap0.time) / (snap1.time - snap0.time);
    ref = snap0.players;
    for (name in ref) {
      player = ref[name];
      p0 = player.position;
      p1 = snap1.players[name].position;
      entities[name] = {
        position: {
          x: p0.x + (p1.x - p0.x) * interp,
          y: p0.y + (p1.y - p0.y) * interp
        }
      };
    }
    return entities;
  };

  Client.prototype.extrapolate = function(snap, time) {
    var entities, extrap, name, p, player, ref, v;
    entities = {};
    extrap = time - snap.time;
    ref = snap.players;
    for (name in ref) {
      player = ref[name];
      p = player.position;
      v = player.velocity;
      entities[name] = {
        position: {
          x: p.x + v.x * extrap,
          y: p.y + v.y * extrap
        }
      };
    }
    return entities;
  };

  Client.prototype.predict = function(snap, commands) {
    var command, dt, i, lastAckTime, len, results, t;
    if (snap.players[this.localPlayer.name]) {
      this.localPlayer.position.x = snap.players[this.localPlayer.name].position.x;
      this.localPlayer.position.y = snap.players[this.localPlayer.name].position.y;
      this.localPlayer.velocity.x = snap.players[this.localPlayer.name].velocity.x;
      this.localPlayer.velocity.y = snap.players[this.localPlayer.name].velocity.y;
      t = lastAckTime = snap.players[this.localPlayer.name].time;
      results = [];
      for (i = 0, len = commands.length; i < len; i++) {
        command = commands[i];
        if (command.time > lastAckTime) {
          dt = this.frameTimeInSeconds(command.time - t);
          this.localPlayer.calculatePhysics(dt, command.inputs);
          results.push(t = command.time);
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  Client.prototype.frameTimeInSeconds = function(time) {
    return time / this.serverFps;
  };

  return Client;

})();

if (typeof module !== "undefined" && module !== null) {
  module.exports = Client;
} else {
  window.Client = Client;
}
