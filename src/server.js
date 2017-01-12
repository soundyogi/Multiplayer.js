var Server;

Server = (function() {
  function Server() {
    this.fps = 20;
    this.players = {};
    this.time = 0;
  }

  Server.prototype.addPlayer = function(name, player) {
    this.players[name] = player;
    return player.time = this.time;
  };

  Server.prototype.run = function(callback) {
    var frameLength, gameLoop;
    frameLength = 1000 / this.fps;
    gameLoop = (function(_this) {
      return function() {
        var t1, t2;
        t1 = new Date().getTime();
        _this.time += 1;
        callback(_this.snapshot());
        t2 = new Date().getTime();
        return _this.timeout = setTimeout(gameLoop, frameLength - (t2 - t1));
      };
    })(this);
    return gameLoop();
  };

  Server.prototype.stop = function() {
    if (this.timeout != null) {
      return clearTimeout(this.timeout);
    }
  };

  Server.prototype.input = function(name, command) {
    var dt;
    if (command.time < this.players[name].time) {
      return;
    }
    dt = this.frameTimeInSeconds(command.time - this.players[name].time);
    if (dt < 1) {
      this.players[name].updatePhysics(dt, command.inputs);
    }
    return this.players[name].time = command.time;
  };

  Server.prototype.frameTimeInSeconds = function(time) {
    return time / this.fps;
  };

  Server.prototype.snapshot = function() {
    var name, player, ref, snapshot;
    snapshot = {
      time: this.time,
      players: {}
    };
    ref = this.players;
    for (name in ref) {
      player = ref[name];
      snapshot.players[name] = this.playerSnapshot(player);
    }
    return snapshot;
  };

  Server.prototype.playerSnapshot = function(player) {
    return {
      time: player.time,
      position: player.position,
      velocity: player.velocity
    };
  };

  return Server;

})();

if (typeof module !== "undefined" && module !== null) {
  module.exports = Server;
} else {
  window.Server = Server;
}
