let app = angular.module('calc', [])
app.controller('parts', function ($scope) {
  var assoc = $scope.assoc = {}
  $scope.add = function (type, n) {
    var t = assoc[type]
    if (!n) {
      n = 1
    }
    t.count = t.count + n
  }
  $scope.subtract = function (type) {
    var t = assoc[type]
    if (t.count === t.min) {
      return
    }
    t.count -= 1
  }
  $scope.parts = [
    {type: 'TOUGH', price: 10, count: 0, mul: -1},
    {type: 'MOVE', price: 50, count: 1, mul: -1, min: 1},
    {type: 'WORK', price: 100, count: 0, mul: -1},
    {type: 'CARRY', price: 50, count: 0, mul: -1},
    {type: 'ATTACK', price: 80, count: 0, mul: -1},
    {type: 'RANGED_ATTACK', price: 150, count: 0, mul: -1},
    {type: 'HEAL', price: 250, count: 0, mul: -1},
    {type: 'CLAIM', price: 600, count: 0, mul: -1},
    {type: 'spawn', price: 300, count: 1, mul: 1, min: 1},
    {type: 'extension', price: 50, count: 0, mul: 1}
  ]
  for (var t of $scope.parts) {
    assoc[t.type] = t
    t.min = t.min || 0
  }
  $scope.getBalance = function () {
    var s = 0
    for (var t of $scope.parts) {
      s += t.count * t.price * t.mul
    }
    return s
  }
  $scope.getSum = function () {
    var s = 0
    for (var t of $scope.parts) {
      if (t.mul < 0) {
        s += t.count * t.price
      }
    }
    return s
  }
  $scope.getPartsCount = function () {
    var c = 0
    for (var t of $scope.parts) {
      if (t.mul < 0) {
        c += +t.count
      }
    }
    return c
  }
  $scope.getParts = function (hm) {
    if (hm) {
      return $scope.parts
        .filter(function (part) { return part.count > 0 && part.mul < 0 })
        .map(function (part) { return part.type + '*' + part.count })
        .join(',')
    }
    var out = []
    for (var t of $scope.parts) {
      if (t.mul > 0) {
        continue
      }
      for (var j = 0; j < t.count; ++j) {
        out.push(t.type)
      }
    }
    return '[' + out.join(',') + ']'
  }
  $scope.reset = function () {
    for (var i in $scope.parts) {
      if ($scope.parts[i].mul < 0) {
        $scope.parts[i].count = $scope.parts[i].min
      }
    }
  }
  $scope.parseInput = function () {
    for (var p of $scope.parts) {
      p.boostPower = 0
      if (p.mul < 0) {
        var match = $scope.inputText.match(new RegExp('\\b' + p.type + '\\b', 'g'))
        p.count = match ? Math.max(match.length, p.min) : p.min
      }
    }
  }
  $scope.boosts = {
    'MOVE': [
      { text: '-' },
      { text: 'ZO' },
      { text: 'ZHO2' },
      { text: 'XZHO2' }
    ],
    'TOUGH': [
      { text: '-' },
      { text: 'GO' },
      { text: 'GHO2' },
      { text: 'XGHO2' }
    ],
    'WORK': [
      { text: '-' },
      { text: 'GH' },
      { text: 'GH2O' },
      { text: 'XGH2O' },
      { text: 'LH' },
      { text: 'GL2O' },
      { text: 'XLH2O' }
    ],
    'CARRY': [
      { text: '-' },
      { text: 'KH' },
      { text: 'KH2O' },
      { text: 'XKH2O' }
    ],
    'ATTACK': [
      { text: '-' },
      { text: 'UH' },
      { text: 'UH2O' },
      { text: 'XUH2O' }
    ],
    'RANGED_ATTACK': [
      { text: '-' },
      { text: 'KO' },
      { text: 'KHO2' },
      { text: 'XKHO2' }
    ],
    'HEAL': [
      { text: '-' },
      { text: 'LO' },
      { text: 'LHO2' },
      { text: 'XLHO2' }
    ]
  }
  $scope.controllerLevels = [
    {spawns: 0, extensions: 0, extensionCapacity: 0, text: 'no (='},
    {spawns: 1, extensions: 0, extensionCapacity: 50, text: '1'},
    {spawns: 1, extensions: 5, extensionCapacity: 50, text: '2'},
    {spawns: 1, extensions: 10, extensionCapacity: 50, text: '3'},
    {spawns: 1, extensions: 20, extensionCapacity: 50, text: '4'},
    {spawns: 1, extensions: 30, extensionCapacity: 50, text: '5'},
    {spawns: 1, extensions: 40, extensionCapacity: 50, text: '6'},
    {spawns: 2, extensions: 50, extensionCapacity: 100, text: '7'},
    {spawns: 3, extensions: 60, extensionCapacity: 200, text: '8'}
  ]
  $scope.controllerLevel = $scope.controllerLevels['1']
  $scope.$watch('controllerLevel', function (val) {
    if (!val) {
      return
    }
    assoc['spawn'].count = val.spawns
    assoc['extension'].count = val.extensions
    assoc['extension'].price = val.extensionCapacity
  })
  $scope.maxHarvest = function (mul) {
    return Math.min(60 * 60 / 300 * 1500 * mul, assoc['WORK'].count * 5 * 60 * 60 * mul)
  }
  /*
  t = ceil(k * W / M)

  Where:
      t = time (game ticks)
      k = terrain factor (1x for plain, 0.5x for road, 5x for swamp)
      W = creep weight (Number of body parts, excluding MOVE and empty CARRY parts)
      M = number of MOVE parts
  */
  $scope.getWait = function (k, full) {
    var W = $scope.getPartsCount() - +assoc['MOVE'].count - (full ? 0 : +assoc['CARRY'].count)
    var M = +assoc['MOVE'].count
    var speed = Math.ceil(k * W / M)
    return Math.max(1, speed)
  }
})

.filter('num', function () {
  return function (n, w) {
    if (w === undefined) {
      w = 3
    }
    if (n < 1000) {
      return n.toFixed(w)
    } else if (n < 1000000) {
      return (n / 1000).toFixed(w) + 'K'
    } else {
      return (n / 1000000).toFixed(w) + 'M'
    }
  }
})
