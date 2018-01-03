(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cola = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./src/adaptor"));
__export(require("./src/d3adaptor"));
__export(require("./src/descent"));
__export(require("./src/geom"));
__export(require("./src/gridrouter"));
__export(require("./src/handledisconnected"));
__export(require("./src/layout"));
__export(require("./src/layout3d"));
__export(require("./src/linklengths"));
__export(require("./src/powergraph"));
__export(require("./src/pqueue"));
__export(require("./src/rbtree"));
__export(require("./src/rectangle"));
__export(require("./src/shortestpaths"));
__export(require("./src/vpsc"));
__export(require("./src/batch"));

},{"./src/adaptor":2,"./src/batch":3,"./src/d3adaptor":4,"./src/descent":7,"./src/geom":8,"./src/gridrouter":9,"./src/handledisconnected":10,"./src/layout":11,"./src/layout3d":12,"./src/linklengths":13,"./src/powergraph":14,"./src/pqueue":15,"./src/rbtree":16,"./src/rectangle":17,"./src/shortestpaths":18,"./src/vpsc":19}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var LayoutAdaptor = (function (_super) {
    __extends(LayoutAdaptor, _super);
    function LayoutAdaptor(options) {
        var _this = _super.call(this) || this;
        var self = _this;
        var o = options;
        if (o.trigger) {
            _this.trigger = o.trigger;
        }
        if (o.kick) {
            _this.kick = o.kick;
        }
        if (o.drag) {
            _this.drag = o.drag;
        }
        if (o.on) {
            _this.on = o.on;
        }
        _this.dragstart = _this.dragStart = layout_1.Layout.dragStart;
        _this.dragend = _this.dragEnd = layout_1.Layout.dragEnd;
        return _this;
    }
    LayoutAdaptor.prototype.trigger = function (e) { };
    ;
    LayoutAdaptor.prototype.kick = function () { };
    ;
    LayoutAdaptor.prototype.drag = function () { };
    ;
    LayoutAdaptor.prototype.on = function (eventType, listener) { return this; };
    ;
    return LayoutAdaptor;
}(layout_1.Layout));
exports.LayoutAdaptor = LayoutAdaptor;
function adaptor(options) {
    return new LayoutAdaptor(options);
}
exports.adaptor = adaptor;

},{"./layout":11}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var gridrouter_1 = require("./gridrouter");
function gridify(pgLayout, nudgeGap, margin, groupMargin) {
    pgLayout.cola.start(0, 0, 0, 10, false);
    var gridrouter = route(pgLayout.cola.nodes(), pgLayout.cola.groups(), margin, groupMargin);
    return gridrouter.routeEdges(pgLayout.powerGraph.powerEdges, nudgeGap, function (e) { return e.source.routerNode.id; }, function (e) { return e.target.routerNode.id; });
}
exports.gridify = gridify;
function route(nodes, groups, margin, groupMargin) {
    nodes.forEach(function (d) {
        d.routerNode = {
            name: d.name,
            bounds: d.bounds.inflate(-margin)
        };
    });
    groups.forEach(function (d) {
        d.routerNode = {
            bounds: d.bounds.inflate(-groupMargin),
            children: (typeof d.groups !== 'undefined' ? d.groups.map(function (c) { return nodes.length + c.id; }) : [])
                .concat(typeof d.leaves !== 'undefined' ? d.leaves.map(function (c) { return c.index; }) : [])
        };
    });
    var gridRouterNodes = nodes.concat(groups).map(function (d, i) {
        d.routerNode.id = i;
        return d.routerNode;
    });
    return new gridrouter_1.GridRouter(gridRouterNodes, {
        getChildren: function (v) { return v.children; },
        getBounds: function (v) { return v.bounds; }
    }, margin - groupMargin);
}
function powerGraphGridLayout(graph, size, grouppadding) {
    var powerGraph;
    graph.nodes.forEach(function (v, i) { return v.index = i; });
    new layout_1.Layout()
        .avoidOverlaps(false)
        .nodes(graph.nodes)
        .links(graph.links)
        .powerGraphGroups(function (d) {
        powerGraph = d;
        powerGraph.groups.forEach(function (v) { return v.padding = grouppadding; });
    });
    var n = graph.nodes.length;
    var edges = [];
    var vs = graph.nodes.slice(0);
    vs.forEach(function (v, i) { return v.index = i; });
    powerGraph.groups.forEach(function (g) {
        var sourceInd = g.index = g.id + n;
        vs.push(g);
        if (typeof g.leaves !== 'undefined')
            g.leaves.forEach(function (v) { return edges.push({ source: sourceInd, target: v.index }); });
        if (typeof g.groups !== 'undefined')
            g.groups.forEach(function (gg) { return edges.push({ source: sourceInd, target: gg.id + n }); });
    });
    powerGraph.powerEdges.forEach(function (e) {
        edges.push({ source: e.source.index, target: e.target.index });
    });
    new layout_1.Layout()
        .size(size)
        .nodes(vs)
        .links(edges)
        .avoidOverlaps(false)
        .linkDistance(30)
        .symmetricDiffLinkLengths(5)
        .convergenceThreshold(1e-4)
        .start(100, 0, 0, 0, false);
    return {
        cola: new layout_1.Layout()
            .convergenceThreshold(1e-3)
            .size(size)
            .avoidOverlaps(true)
            .nodes(graph.nodes)
            .links(graph.links)
            .groupCompactness(1e-4)
            .linkDistance(30)
            .symmetricDiffLinkLengths(5)
            .powerGraphGroups(function (d) {
            powerGraph = d;
            powerGraph.groups.forEach(function (v) {
                v.padding = grouppadding;
            });
        }).start(50, 0, 100, 0, false),
        powerGraph: powerGraph
    };
}
exports.powerGraphGridLayout = powerGraphGridLayout;

},{"./gridrouter":9,"./layout":11}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3v3 = require("./d3v3adaptor");
var d3v4 = require("./d3v4adaptor");
function d3adaptor(d3Context) {
    if (!d3Context || isD3V3(d3Context)) {
        return new d3v3.D3StyleLayoutAdaptor();
    }
    return new d3v4.D3StyleLayoutAdaptor(d3Context);
}
exports.d3adaptor = d3adaptor;
function isD3V3(d3Context) {
    var v3exp = /^3\./;
    return d3Context.version && d3Context.version.match(v3exp) !== null;
}

},{"./d3v3adaptor":5,"./d3v4adaptor":6}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor() {
        var _this = _super.call(this) || this;
        _this.event = d3.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3.behavior.drag()
                    .origin(layout_1.Layout.dragOrigin)
                    .on("dragstart.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3.event);
                    d3layout.resume();
                })
                    .on("dragend.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            this
                .call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event[d3event.type](d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        d3.timer(function () { return _super.prototype.tick.call(_this); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;
function d3adaptor() {
    return new D3StyleLayoutAdaptor();
}
exports.d3adaptor = d3adaptor;

},{"./layout":11}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor(d3Context) {
        var _this = _super.call(this) || this;
        _this.d3Context = d3Context;
        _this.event = d3Context.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3Context.drag()
                    .subject(layout_1.Layout.dragOrigin)
                    .on("start.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3Context.event);
                    d3layout.resume();
                })
                    .on("end.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            arguments[0].call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event.call(d3event.type, d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        var t = this.d3Context.timer(function () { return _super.prototype.tick.call(_this) && t.stop(); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;

},{"./layout":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Locks = (function () {
    function Locks() {
        this.locks = {};
    }
    Locks.prototype.add = function (id, x) {
        this.locks[id] = x;
    };
    Locks.prototype.clear = function () {
        this.locks = {};
    };
    Locks.prototype.isEmpty = function () {
        for (var l in this.locks)
            return false;
        return true;
    };
    Locks.prototype.apply = function (f) {
        for (var l in this.locks) {
            f(Number(l), this.locks[l]);
        }
    };
    return Locks;
}());
exports.Locks = Locks;
var Descent = (function () {
    function Descent(x, D, G) {
        if (G === void 0) { G = null; }
        this.D = D;
        this.G = G;
        this.threshold = 0.0001;
        this.numGridSnapNodes = 0;
        this.snapGridSize = 100;
        this.snapStrength = 1000;
        this.scaleSnapByMaxH = false;
        this.random = new PseudoRandom();
        this.project = null;
        this.x = x;
        this.k = x.length;
        var n = this.n = x[0].length;
        this.H = new Array(this.k);
        this.g = new Array(this.k);
        this.Hd = new Array(this.k);
        this.a = new Array(this.k);
        this.b = new Array(this.k);
        this.c = new Array(this.k);
        this.d = new Array(this.k);
        this.e = new Array(this.k);
        this.ia = new Array(this.k);
        this.ib = new Array(this.k);
        this.xtmp = new Array(this.k);
        this.locks = new Locks();
        this.minD = Number.MAX_VALUE;
        var i = n, j;
        while (i--) {
            j = n;
            while (--j > i) {
                var d = D[i][j];
                if (d > 0 && d < this.minD) {
                    this.minD = d;
                }
            }
        }
        if (this.minD === Number.MAX_VALUE)
            this.minD = 1;
        i = this.k;
        while (i--) {
            this.g[i] = new Array(n);
            this.H[i] = new Array(n);
            j = n;
            while (j--) {
                this.H[i][j] = new Array(n);
            }
            this.Hd[i] = new Array(n);
            this.a[i] = new Array(n);
            this.b[i] = new Array(n);
            this.c[i] = new Array(n);
            this.d[i] = new Array(n);
            this.e[i] = new Array(n);
            this.ia[i] = new Array(n);
            this.ib[i] = new Array(n);
            this.xtmp[i] = new Array(n);
        }
    }
    Descent.createSquareMatrix = function (n, f) {
        var M = new Array(n);
        for (var i = 0; i < n; ++i) {
            M[i] = new Array(n);
            for (var j = 0; j < n; ++j) {
                M[i][j] = f(i, j);
            }
        }
        return M;
    };
    Descent.prototype.offsetDir = function () {
        var _this = this;
        var u = new Array(this.k);
        var l = 0;
        for (var i = 0; i < this.k; ++i) {
            var x = u[i] = this.random.getNextBetween(0.01, 1) - 0.5;
            l += x * x;
        }
        l = Math.sqrt(l);
        return u.map(function (x) { return x *= _this.minD / l; });
    };
    Descent.prototype.computeDerivatives = function (x) {
        var _this = this;
        var n = this.n;
        if (n < 1)
            return;
        var i;
        var d = new Array(this.k);
        var d2 = new Array(this.k);
        var Huu = new Array(this.k);
        var maxH = 0;
        for (var u = 0; u < n; ++u) {
            for (i = 0; i < this.k; ++i)
                Huu[i] = this.g[i][u] = 0;
            for (var v = 0; v < n; ++v) {
                if (u === v)
                    continue;
                var maxDisplaces = n;
                while (maxDisplaces--) {
                    var sd2 = 0;
                    for (i = 0; i < this.k; ++i) {
                        var dx = d[i] = x[i][u] - x[i][v];
                        sd2 += d2[i] = dx * dx;
                    }
                    if (sd2 > 1e-9)
                        break;
                    var rd = this.offsetDir();
                    for (i = 0; i < this.k; ++i)
                        x[i][v] += rd[i];
                }
                var l = Math.sqrt(sd2);
                var D = this.D[u][v];
                var weight = this.G != null ? this.G[u][v] : 1;
                if (weight > 1 && l > D || !isFinite(D)) {
                    for (i = 0; i < this.k; ++i)
                        this.H[i][u][v] = 0;
                    continue;
                }
                if (weight > 1) {
                    weight = 1;
                }
                var D2 = D * D;
                var gs = 2 * weight * (l - D) / (D2 * l);
                var l3 = l * l * l;
                var hs = 2 * -weight / (D2 * l3);
                if (!isFinite(gs))
                    console.log(gs);
                for (i = 0; i < this.k; ++i) {
                    this.g[i][u] += d[i] * gs;
                    Huu[i] -= this.H[i][u][v] = hs * (l3 + D * (d2[i] - sd2) + l * sd2);
                }
            }
            for (i = 0; i < this.k; ++i)
                maxH = Math.max(maxH, this.H[i][u][u] = Huu[i]);
        }
        var r = this.snapGridSize / 2;
        var g = this.snapGridSize;
        var w = this.snapStrength;
        var k = w / (r * r);
        var numNodes = this.numGridSnapNodes;
        for (var u = 0; u < numNodes; ++u) {
            for (i = 0; i < this.k; ++i) {
                var xiu = this.x[i][u];
                var m = xiu / g;
                var f = m % 1;
                var q = m - f;
                var a = Math.abs(f);
                var dx = (a <= 0.5) ? xiu - q * g :
                    (xiu > 0) ? xiu - (q + 1) * g : xiu - (q - 1) * g;
                if (-r < dx && dx <= r) {
                    if (this.scaleSnapByMaxH) {
                        this.g[i][u] += maxH * k * dx;
                        this.H[i][u][u] += maxH * k;
                    }
                    else {
                        this.g[i][u] += k * dx;
                        this.H[i][u][u] += k;
                    }
                }
            }
        }
        if (!this.locks.isEmpty()) {
            this.locks.apply(function (u, p) {
                for (i = 0; i < _this.k; ++i) {
                    _this.H[i][u][u] += maxH;
                    _this.g[i][u] -= maxH * (p[i] - x[i][u]);
                }
            });
        }
    };
    Descent.dotProd = function (a, b) {
        var x = 0, i = a.length;
        while (i--)
            x += a[i] * b[i];
        return x;
    };
    Descent.rightMultiply = function (m, v, r) {
        var i = m.length;
        while (i--)
            r[i] = Descent.dotProd(m[i], v);
    };
    Descent.prototype.computeStepSize = function (d) {
        var numerator = 0, denominator = 0;
        for (var i = 0; i < this.k; ++i) {
            numerator += Descent.dotProd(this.g[i], d[i]);
            Descent.rightMultiply(this.H[i], d[i], this.Hd[i]);
            denominator += Descent.dotProd(d[i], this.Hd[i]);
        }
        if (denominator === 0 || !isFinite(denominator))
            return 0;
        return 1 * numerator / denominator;
    };
    Descent.prototype.reduceStress = function () {
        this.computeDerivatives(this.x);
        var alpha = this.computeStepSize(this.g);
        for (var i = 0; i < this.k; ++i) {
            this.takeDescentStep(this.x[i], this.g[i], alpha);
        }
        return this.computeStress();
    };
    Descent.copy = function (a, b) {
        var m = a.length, n = b[0].length;
        for (var i = 0; i < m; ++i) {
            for (var j = 0; j < n; ++j) {
                b[i][j] = a[i][j];
            }
        }
    };
    Descent.prototype.stepAndProject = function (x0, r, d, stepSize) {
        Descent.copy(x0, r);
        this.takeDescentStep(r[0], d[0], stepSize);
        if (this.project)
            this.project[0](x0[0], x0[1], r[0]);
        this.takeDescentStep(r[1], d[1], stepSize);
        if (this.project)
            this.project[1](r[0], x0[1], r[1]);
        for (var i = 2; i < this.k; i++)
            this.takeDescentStep(r[i], d[i], stepSize);
    };
    Descent.mApply = function (m, n, f) {
        var i = m;
        while (i-- > 0) {
            var j = n;
            while (j-- > 0)
                f(i, j);
        }
    };
    Descent.prototype.matrixApply = function (f) {
        Descent.mApply(this.k, this.n, f);
    };
    Descent.prototype.computeNextPosition = function (x0, r) {
        var _this = this;
        this.computeDerivatives(x0);
        var alpha = this.computeStepSize(this.g);
        this.stepAndProject(x0, r, this.g, alpha);
        if (this.project) {
            this.matrixApply(function (i, j) { return _this.e[i][j] = x0[i][j] - r[i][j]; });
            var beta = this.computeStepSize(this.e);
            beta = Math.max(0.2, Math.min(beta, 1));
            this.stepAndProject(x0, r, this.e, beta);
        }
    };
    Descent.prototype.run = function (iterations) {
        var stress = Number.MAX_VALUE, converged = false;
        while (!converged && iterations-- > 0) {
            var s = this.rungeKutta();
            converged = Math.abs(stress / s - 1) < this.threshold;
            stress = s;
        }
        return stress;
    };
    Descent.prototype.rungeKutta = function () {
        var _this = this;
        this.computeNextPosition(this.x, this.a);
        Descent.mid(this.x, this.a, this.ia);
        this.computeNextPosition(this.ia, this.b);
        Descent.mid(this.x, this.b, this.ib);
        this.computeNextPosition(this.ib, this.c);
        this.computeNextPosition(this.c, this.d);
        var disp = 0;
        this.matrixApply(function (i, j) {
            var x = (_this.a[i][j] + 2.0 * _this.b[i][j] + 2.0 * _this.c[i][j] + _this.d[i][j]) / 6.0, d = _this.x[i][j] - x;
            disp += d * d;
            _this.x[i][j] = x;
        });
        return disp;
    };
    Descent.mid = function (a, b, m) {
        Descent.mApply(a.length, a[0].length, function (i, j) {
            return m[i][j] = a[i][j] + (b[i][j] - a[i][j]) / 2.0;
        });
    };
    Descent.prototype.takeDescentStep = function (x, d, stepSize) {
        for (var i = 0; i < this.n; ++i) {
            x[i] = x[i] - stepSize * d[i];
        }
    };
    Descent.prototype.computeStress = function () {
        var stress = 0;
        for (var u = 0, nMinus1 = this.n - 1; u < nMinus1; ++u) {
            for (var v = u + 1, n = this.n; v < n; ++v) {
                var l = 0;
                for (var i = 0; i < this.k; ++i) {
                    var dx = this.x[i][u] - this.x[i][v];
                    l += dx * dx;
                }
                l = Math.sqrt(l);
                var d = this.D[u][v];
                if (!isFinite(d))
                    continue;
                var rl = d - l;
                var d2 = d * d;
                stress += rl * rl / d2;
            }
        }
        return stress;
    };
    Descent.zeroDistance = 1e-10;
    return Descent;
}());
exports.Descent = Descent;
var PseudoRandom = (function () {
    function PseudoRandom(seed) {
        if (seed === void 0) { seed = 1; }
        this.seed = seed;
        this.a = 214013;
        this.c = 2531011;
        this.m = 2147483648;
        this.range = 32767;
    }
    PseudoRandom.prototype.getNext = function () {
        this.seed = (this.seed * this.a + this.c) % this.m;
        return (this.seed >> 16) / this.range;
    };
    PseudoRandom.prototype.getNextBetween = function (min, max) {
        return min + this.getNext() * (max - min);
    };
    return PseudoRandom;
}());
exports.PseudoRandom = PseudoRandom;

},{}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var Point = (function () {
    function Point() {
    }
    return Point;
}());
exports.Point = Point;
var LineSegment = (function () {
    function LineSegment(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    return LineSegment;
}());
exports.LineSegment = LineSegment;
var PolyPoint = (function (_super) {
    __extends(PolyPoint, _super);
    function PolyPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PolyPoint;
}(Point));
exports.PolyPoint = PolyPoint;
function isLeft(P0, P1, P2) {
    return (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);
}
exports.isLeft = isLeft;
function above(p, vi, vj) {
    return isLeft(p, vi, vj) > 0;
}
function below(p, vi, vj) {
    return isLeft(p, vi, vj) < 0;
}
function ConvexHull(S) {
    var P = S.slice(0).sort(function (a, b) { return a.x !== b.x ? b.x - a.x : b.y - a.y; });
    var n = S.length, i;
    var minmin = 0;
    var xmin = P[0].x;
    for (i = 1; i < n; ++i) {
        if (P[i].x !== xmin)
            break;
    }
    var minmax = i - 1;
    var H = [];
    H.push(P[minmin]);
    if (minmax === n - 1) {
        if (P[minmax].y !== P[minmin].y)
            H.push(P[minmax]);
    }
    else {
        var maxmin, maxmax = n - 1;
        var xmax = P[n - 1].x;
        for (i = n - 2; i >= 0; i--)
            if (P[i].x !== xmax)
                break;
        maxmin = i + 1;
        i = minmax;
        while (++i <= maxmin) {
            if (isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin)
                continue;
            while (H.length > 1) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
        if (maxmax != maxmin)
            H.push(P[maxmax]);
        var bot = H.length;
        i = maxmin;
        while (--i >= minmax) {
            if (isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax)
                continue;
            while (H.length > bot) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
    }
    return H;
}
exports.ConvexHull = ConvexHull;
function clockwiseRadialSweep(p, P, f) {
    P.slice(0).sort(function (a, b) { return Math.atan2(a.y - p.y, a.x - p.x) - Math.atan2(b.y - p.y, b.x - p.x); }).forEach(f);
}
exports.clockwiseRadialSweep = clockwiseRadialSweep;
function nextPolyPoint(p, ps) {
    if (p.polyIndex === ps.length - 1)
        return ps[0];
    return ps[p.polyIndex + 1];
}
function prevPolyPoint(p, ps) {
    if (p.polyIndex === 0)
        return ps[ps.length - 1];
    return ps[p.polyIndex - 1];
}
function tangent_PointPolyC(P, V) {
    return { rtan: Rtangent_PointPolyC(P, V), ltan: Ltangent_PointPolyC(P, V) };
}
function Rtangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var upA, dnC;
    if (below(P, V[1], V[0]) && !above(P, V[n - 1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (above(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (dnC && !above(P, V[c - 1], V[c]))
            return c;
        upA = above(P, V[a + 1], V[a]);
        if (upA) {
            if (dnC)
                b = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (!dnC)
                a = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function Ltangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var dnA, dnC;
    if (above(P, V[n - 1], V[0]) && !below(P, V[1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (below(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (above(P, V[c - 1], V[c]) && !dnC)
            return c;
        dnA = below(P, V[a + 1], V[a]);
        if (dnA) {
            if (!dnC)
                b = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (dnC)
                a = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function tangent_PolyPolyC(V, W, t1, t2, cmp1, cmp2) {
    var ix1, ix2;
    ix1 = t1(W[0], V);
    ix2 = t2(V[ix1], W);
    var done = false;
    while (!done) {
        done = true;
        while (true) {
            if (ix1 === V.length - 1)
                ix1 = 0;
            if (cmp1(W[ix2], V[ix1], V[ix1 + 1]))
                break;
            ++ix1;
        }
        while (true) {
            if (ix2 === 0)
                ix2 = W.length - 1;
            if (cmp2(V[ix1], W[ix2], W[ix2 - 1]))
                break;
            --ix2;
            done = false;
        }
    }
    return { t1: ix1, t2: ix2 };
}
exports.tangent_PolyPolyC = tangent_PolyPolyC;
function LRtangent_PolyPolyC(V, W) {
    var rl = RLtangent_PolyPolyC(W, V);
    return { t1: rl.t2, t2: rl.t1 };
}
exports.LRtangent_PolyPolyC = LRtangent_PolyPolyC;
function RLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Ltangent_PointPolyC, above, below);
}
exports.RLtangent_PolyPolyC = RLtangent_PolyPolyC;
function LLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Ltangent_PointPolyC, Ltangent_PointPolyC, below, below);
}
exports.LLtangent_PolyPolyC = LLtangent_PolyPolyC;
function RRtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Rtangent_PointPolyC, above, above);
}
exports.RRtangent_PolyPolyC = RRtangent_PolyPolyC;
var BiTangent = (function () {
    function BiTangent(t1, t2) {
        this.t1 = t1;
        this.t2 = t2;
    }
    return BiTangent;
}());
exports.BiTangent = BiTangent;
var BiTangents = (function () {
    function BiTangents() {
    }
    return BiTangents;
}());
exports.BiTangents = BiTangents;
var TVGPoint = (function (_super) {
    __extends(TVGPoint, _super);
    function TVGPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TVGPoint;
}(Point));
exports.TVGPoint = TVGPoint;
var VisibilityVertex = (function () {
    function VisibilityVertex(id, polyid, polyvertid, p) {
        this.id = id;
        this.polyid = polyid;
        this.polyvertid = polyvertid;
        this.p = p;
        p.vv = this;
    }
    return VisibilityVertex;
}());
exports.VisibilityVertex = VisibilityVertex;
var VisibilityEdge = (function () {
    function VisibilityEdge(source, target) {
        this.source = source;
        this.target = target;
    }
    VisibilityEdge.prototype.length = function () {
        var dx = this.source.p.x - this.target.p.x;
        var dy = this.source.p.y - this.target.p.y;
        return Math.sqrt(dx * dx + dy * dy);
    };
    return VisibilityEdge;
}());
exports.VisibilityEdge = VisibilityEdge;
var TangentVisibilityGraph = (function () {
    function TangentVisibilityGraph(P, g0) {
        this.P = P;
        this.V = [];
        this.E = [];
        if (!g0) {
            var n = P.length;
            for (var i = 0; i < n; i++) {
                var p = P[i];
                for (var j = 0; j < p.length; ++j) {
                    var pj = p[j], vv = new VisibilityVertex(this.V.length, i, j, pj);
                    this.V.push(vv);
                    if (j > 0)
                        this.E.push(new VisibilityEdge(p[j - 1].vv, vv));
                }
            }
            for (var i = 0; i < n - 1; i++) {
                var Pi = P[i];
                for (var j = i + 1; j < n; j++) {
                    var Pj = P[j], t = tangents(Pi, Pj);
                    for (var q in t) {
                        var c = t[q], source = Pi[c.t1], target = Pj[c.t2];
                        this.addEdgeIfVisible(source, target, i, j);
                    }
                }
            }
        }
        else {
            this.V = g0.V.slice(0);
            this.E = g0.E.slice(0);
        }
    }
    TangentVisibilityGraph.prototype.addEdgeIfVisible = function (u, v, i1, i2) {
        if (!this.intersectsPolys(new LineSegment(u.x, u.y, v.x, v.y), i1, i2)) {
            this.E.push(new VisibilityEdge(u.vv, v.vv));
        }
    };
    TangentVisibilityGraph.prototype.addPoint = function (p, i1) {
        var n = this.P.length;
        this.V.push(new VisibilityVertex(this.V.length, n, 0, p));
        for (var i = 0; i < n; ++i) {
            if (i === i1)
                continue;
            var poly = this.P[i], t = tangent_PointPolyC(p, poly);
            this.addEdgeIfVisible(p, poly[t.ltan], i1, i);
            this.addEdgeIfVisible(p, poly[t.rtan], i1, i);
        }
        return p.vv;
    };
    TangentVisibilityGraph.prototype.intersectsPolys = function (l, i1, i2) {
        for (var i = 0, n = this.P.length; i < n; ++i) {
            if (i != i1 && i != i2 && intersects(l, this.P[i]).length > 0) {
                return true;
            }
        }
        return false;
    };
    return TangentVisibilityGraph;
}());
exports.TangentVisibilityGraph = TangentVisibilityGraph;
function intersects(l, P) {
    var ints = [];
    for (var i = 1, n = P.length; i < n; ++i) {
        var int = rectangle_1.Rectangle.lineIntersection(l.x1, l.y1, l.x2, l.y2, P[i - 1].x, P[i - 1].y, P[i].x, P[i].y);
        if (int)
            ints.push(int);
    }
    return ints;
}
function tangents(V, W) {
    var m = V.length - 1, n = W.length - 1;
    var bt = new BiTangents();
    for (var i = 0; i < m; ++i) {
        for (var j = 0; j < n; ++j) {
            var v1 = V[i == 0 ? m - 1 : i - 1];
            var v2 = V[i];
            var v3 = V[i + 1];
            var w1 = W[j == 0 ? n - 1 : j - 1];
            var w2 = W[j];
            var w3 = W[j + 1];
            var v1v2w2 = isLeft(v1, v2, w2);
            var v2w1w2 = isLeft(v2, w1, w2);
            var v2w2w3 = isLeft(v2, w2, w3);
            var w1w2v2 = isLeft(w1, w2, v2);
            var w2v1v2 = isLeft(w2, v1, v2);
            var w2v2v3 = isLeft(w2, v2, v3);
            if (v1v2w2 >= 0 && v2w1w2 >= 0 && v2w2w3 < 0
                && w1w2v2 >= 0 && w2v1v2 >= 0 && w2v2v3 < 0) {
                bt.ll = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 <= 0 && v2w2w3 > 0
                && w1w2v2 <= 0 && w2v1v2 <= 0 && w2v2v3 > 0) {
                bt.rr = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 > 0 && v2w2w3 <= 0
                && w1w2v2 >= 0 && w2v1v2 < 0 && w2v2v3 >= 0) {
                bt.rl = new BiTangent(i, j);
            }
            else if (v1v2w2 >= 0 && v2w1w2 < 0 && v2w2w3 >= 0
                && w1w2v2 <= 0 && w2v1v2 > 0 && w2v2v3 <= 0) {
                bt.lr = new BiTangent(i, j);
            }
        }
    }
    return bt;
}
exports.tangents = tangents;
function isPointInsidePoly(p, poly) {
    for (var i = 1, n = poly.length; i < n; ++i)
        if (below(poly[i - 1], poly[i], p))
            return false;
    return true;
}
function isAnyPInQ(p, q) {
    return !p.every(function (v) { return !isPointInsidePoly(v, q); });
}
function polysOverlap(p, q) {
    if (isAnyPInQ(p, q))
        return true;
    if (isAnyPInQ(q, p))
        return true;
    for (var i = 1, n = p.length; i < n; ++i) {
        var v = p[i], u = p[i - 1];
        if (intersects(new LineSegment(u.x, u.y, v.x, v.y), q).length > 0)
            return true;
    }
    return false;
}
exports.polysOverlap = polysOverlap;

},{"./rectangle":17}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var vpsc_1 = require("./vpsc");
var shortestpaths_1 = require("./shortestpaths");
var NodeWrapper = (function () {
    function NodeWrapper(id, rect, children) {
        this.id = id;
        this.rect = rect;
        this.children = children;
        this.leaf = typeof children === 'undefined' || children.length === 0;
    }
    return NodeWrapper;
}());
exports.NodeWrapper = NodeWrapper;
var Vert = (function () {
    function Vert(id, x, y, node, line) {
        if (node === void 0) { node = null; }
        if (line === void 0) { line = null; }
        this.id = id;
        this.x = x;
        this.y = y;
        this.node = node;
        this.line = line;
    }
    return Vert;
}());
exports.Vert = Vert;
var LongestCommonSubsequence = (function () {
    function LongestCommonSubsequence(s, t) {
        this.s = s;
        this.t = t;
        var mf = LongestCommonSubsequence.findMatch(s, t);
        var tr = t.slice(0).reverse();
        var mr = LongestCommonSubsequence.findMatch(s, tr);
        if (mf.length >= mr.length) {
            this.length = mf.length;
            this.si = mf.si;
            this.ti = mf.ti;
            this.reversed = false;
        }
        else {
            this.length = mr.length;
            this.si = mr.si;
            this.ti = t.length - mr.ti - mr.length;
            this.reversed = true;
        }
    }
    LongestCommonSubsequence.findMatch = function (s, t) {
        var m = s.length;
        var n = t.length;
        var match = { length: 0, si: -1, ti: -1 };
        var l = new Array(m);
        for (var i = 0; i < m; i++) {
            l[i] = new Array(n);
            for (var j = 0; j < n; j++)
                if (s[i] === t[j]) {
                    var v = l[i][j] = (i === 0 || j === 0) ? 1 : l[i - 1][j - 1] + 1;
                    if (v > match.length) {
                        match.length = v;
                        match.si = i - v + 1;
                        match.ti = j - v + 1;
                    }
                }
                else
                    l[i][j] = 0;
        }
        return match;
    };
    LongestCommonSubsequence.prototype.getSequence = function () {
        return this.length >= 0 ? this.s.slice(this.si, this.si + this.length) : [];
    };
    return LongestCommonSubsequence;
}());
exports.LongestCommonSubsequence = LongestCommonSubsequence;
var GridRouter = (function () {
    function GridRouter(originalnodes, accessor, groupPadding) {
        if (groupPadding === void 0) { groupPadding = 12; }
        var _this = this;
        this.originalnodes = originalnodes;
        this.groupPadding = groupPadding;
        this.leaves = null;
        this.nodes = originalnodes.map(function (v, i) { return new NodeWrapper(i, accessor.getBounds(v), accessor.getChildren(v)); });
        this.leaves = this.nodes.filter(function (v) { return v.leaf; });
        this.groups = this.nodes.filter(function (g) { return !g.leaf; });
        this.cols = this.getGridLines('x');
        this.rows = this.getGridLines('y');
        this.groups.forEach(function (v) {
            return v.children.forEach(function (c) { return _this.nodes[c].parent = v; });
        });
        this.root = { children: [] };
        this.nodes.forEach(function (v) {
            if (typeof v.parent === 'undefined') {
                v.parent = _this.root;
                _this.root.children.push(v.id);
            }
            v.ports = [];
        });
        this.backToFront = this.nodes.slice(0);
        this.backToFront.sort(function (x, y) { return _this.getDepth(x) - _this.getDepth(y); });
        var frontToBackGroups = this.backToFront.slice(0).reverse().filter(function (g) { return !g.leaf; });
        frontToBackGroups.forEach(function (v) {
            var r = rectangle_1.Rectangle.empty();
            v.children.forEach(function (c) { return r = r.union(_this.nodes[c].rect); });
            v.rect = r.inflate(_this.groupPadding);
        });
        var colMids = this.midPoints(this.cols.map(function (r) { return r.pos; }));
        var rowMids = this.midPoints(this.rows.map(function (r) { return r.pos; }));
        var rowx = colMids[0], rowX = colMids[colMids.length - 1];
        var coly = rowMids[0], colY = rowMids[rowMids.length - 1];
        var hlines = this.rows.map(function (r) { return ({ x1: rowx, x2: rowX, y1: r.pos, y2: r.pos }); })
            .concat(rowMids.map(function (m) { return ({ x1: rowx, x2: rowX, y1: m, y2: m }); }));
        var vlines = this.cols.map(function (c) { return ({ x1: c.pos, x2: c.pos, y1: coly, y2: colY }); })
            .concat(colMids.map(function (m) { return ({ x1: m, x2: m, y1: coly, y2: colY }); }));
        var lines = hlines.concat(vlines);
        lines.forEach(function (l) { return l.verts = []; });
        this.verts = [];
        this.edges = [];
        hlines.forEach(function (h) {
            return vlines.forEach(function (v) {
                var p = new Vert(_this.verts.length, v.x1, h.y1);
                h.verts.push(p);
                v.verts.push(p);
                _this.verts.push(p);
                var i = _this.backToFront.length;
                while (i-- > 0) {
                    var node = _this.backToFront[i], r = node.rect;
                    var dx = Math.abs(p.x - r.cx()), dy = Math.abs(p.y - r.cy());
                    if (dx < r.width() / 2 && dy < r.height() / 2) {
                        p.node = node;
                        break;
                    }
                }
            });
        });
        lines.forEach(function (l, li) {
            _this.nodes.forEach(function (v, i) {
                v.rect.lineIntersections(l.x1, l.y1, l.x2, l.y2).forEach(function (intersect, j) {
                    var p = new Vert(_this.verts.length, intersect.x, intersect.y, v, l);
                    _this.verts.push(p);
                    l.verts.push(p);
                    v.ports.push(p);
                });
            });
            var isHoriz = Math.abs(l.y1 - l.y2) < 0.1;
            var delta = function (a, b) { return isHoriz ? b.x - a.x : b.y - a.y; };
            l.verts.sort(delta);
            for (var i = 1; i < l.verts.length; i++) {
                var u = l.verts[i - 1], v = l.verts[i];
                if (u.node && u.node === v.node && u.node.leaf)
                    continue;
                _this.edges.push({ source: u.id, target: v.id, length: Math.abs(delta(u, v)) });
            }
        });
    }
    GridRouter.prototype.avg = function (a) { return a.reduce(function (x, y) { return x + y; }) / a.length; };
    GridRouter.prototype.getGridLines = function (axis) {
        var columns = [];
        var ls = this.leaves.slice(0, this.leaves.length);
        while (ls.length > 0) {
            var overlapping = ls.filter(function (v) { return v.rect['overlap' + axis.toUpperCase()](ls[0].rect); });
            var col = {
                nodes: overlapping,
                pos: this.avg(overlapping.map(function (v) { return v.rect['c' + axis](); }))
            };
            columns.push(col);
            col.nodes.forEach(function (v) { return ls.splice(ls.indexOf(v), 1); });
        }
        columns.sort(function (a, b) { return a.pos - b.pos; });
        return columns;
    };
    GridRouter.prototype.getDepth = function (v) {
        var depth = 0;
        while (v.parent !== this.root) {
            depth++;
            v = v.parent;
        }
        return depth;
    };
    GridRouter.prototype.midPoints = function (a) {
        var gap = a[1] - a[0];
        var mids = [a[0] - gap / 2];
        for (var i = 1; i < a.length; i++) {
            mids.push((a[i] + a[i - 1]) / 2);
        }
        mids.push(a[a.length - 1] + gap / 2);
        return mids;
    };
    GridRouter.prototype.findLineage = function (v) {
        var lineage = [v];
        do {
            v = v.parent;
            lineage.push(v);
        } while (v !== this.root);
        return lineage.reverse();
    };
    GridRouter.prototype.findAncestorPathBetween = function (a, b) {
        var aa = this.findLineage(a), ba = this.findLineage(b), i = 0;
        while (aa[i] === ba[i])
            i++;
        return { commonAncestor: aa[i - 1], lineages: aa.slice(i).concat(ba.slice(i)) };
    };
    GridRouter.prototype.siblingObstacles = function (a, b) {
        var _this = this;
        var path = this.findAncestorPathBetween(a, b);
        var lineageLookup = {};
        path.lineages.forEach(function (v) { return lineageLookup[v.id] = {}; });
        var obstacles = path.commonAncestor.children.filter(function (v) { return !(v in lineageLookup); });
        path.lineages
            .filter(function (v) { return v.parent !== path.commonAncestor; })
            .forEach(function (v) { return obstacles = obstacles.concat(v.parent.children.filter(function (c) { return c !== v.id; })); });
        return obstacles.map(function (v) { return _this.nodes[v]; });
    };
    GridRouter.getSegmentSets = function (routes, x, y) {
        var vsegments = [];
        for (var ei = 0; ei < routes.length; ei++) {
            var route = routes[ei];
            for (var si = 0; si < route.length; si++) {
                var s = route[si];
                s.edgeid = ei;
                s.i = si;
                var sdx = s[1][x] - s[0][x];
                if (Math.abs(sdx) < 0.1) {
                    vsegments.push(s);
                }
            }
        }
        vsegments.sort(function (a, b) { return a[0][x] - b[0][x]; });
        var vsegmentsets = [];
        var segmentset = null;
        for (var i = 0; i < vsegments.length; i++) {
            var s = vsegments[i];
            if (!segmentset || Math.abs(s[0][x] - segmentset.pos) > 0.1) {
                segmentset = { pos: s[0][x], segments: [] };
                vsegmentsets.push(segmentset);
            }
            segmentset.segments.push(s);
        }
        return vsegmentsets;
    };
    GridRouter.nudgeSegs = function (x, y, routes, segments, leftOf, gap) {
        var n = segments.length;
        if (n <= 1)
            return;
        var vs = segments.map(function (s) { return new vpsc_1.Variable(s[0][x]); });
        var cs = [];
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                if (i === j)
                    continue;
                var s1 = segments[i], s2 = segments[j], e1 = s1.edgeid, e2 = s2.edgeid, lind = -1, rind = -1;
                if (x == 'x') {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = j, rind = i;
                        }
                        else {
                            lind = i, rind = j;
                        }
                    }
                }
                else {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = i, rind = j;
                        }
                        else {
                            lind = j, rind = i;
                        }
                    }
                }
                if (lind >= 0) {
                    cs.push(new vpsc_1.Constraint(vs[lind], vs[rind], gap));
                }
            }
        }
        var solver = new vpsc_1.Solver(vs, cs);
        solver.solve();
        vs.forEach(function (v, i) {
            var s = segments[i];
            var pos = v.position();
            s[0][x] = s[1][x] = pos;
            var route = routes[s.edgeid];
            if (s.i > 0)
                route[s.i - 1][1][x] = pos;
            if (s.i < route.length - 1)
                route[s.i + 1][0][x] = pos;
        });
    };
    GridRouter.nudgeSegments = function (routes, x, y, leftOf, gap) {
        var vsegmentsets = GridRouter.getSegmentSets(routes, x, y);
        for (var i = 0; i < vsegmentsets.length; i++) {
            var ss = vsegmentsets[i];
            var events = [];
            for (var j = 0; j < ss.segments.length; j++) {
                var s = ss.segments[j];
                events.push({ type: 0, s: s, pos: Math.min(s[0][y], s[1][y]) });
                events.push({ type: 1, s: s, pos: Math.max(s[0][y], s[1][y]) });
            }
            events.sort(function (a, b) { return a.pos - b.pos + a.type - b.type; });
            var open = [];
            var openCount = 0;
            events.forEach(function (e) {
                if (e.type === 0) {
                    open.push(e.s);
                    openCount++;
                }
                else {
                    openCount--;
                }
                if (openCount == 0) {
                    GridRouter.nudgeSegs(x, y, routes, open, leftOf, gap);
                    open = [];
                }
            });
        }
    };
    GridRouter.prototype.routeEdges = function (edges, nudgeGap, source, target) {
        var _this = this;
        var routePaths = edges.map(function (e) { return _this.route(source(e), target(e)); });
        var order = GridRouter.orderEdges(routePaths);
        var routes = routePaths.map(function (e) { return GridRouter.makeSegments(e); });
        GridRouter.nudgeSegments(routes, 'x', 'y', order, nudgeGap);
        GridRouter.nudgeSegments(routes, 'y', 'x', order, nudgeGap);
        GridRouter.unreverseEdges(routes, routePaths);
        return routes;
    };
    GridRouter.unreverseEdges = function (routes, routePaths) {
        routes.forEach(function (segments, i) {
            var path = routePaths[i];
            if (path.reversed) {
                segments.reverse();
                segments.forEach(function (segment) {
                    segment.reverse();
                });
            }
        });
    };
    GridRouter.angleBetween2Lines = function (line1, line2) {
        var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x);
        var angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x);
        var diff = angle1 - angle2;
        if (diff > Math.PI || diff < -Math.PI) {
            diff = angle2 - angle1;
        }
        return diff;
    };
    GridRouter.isLeft = function (a, b, c) {
        return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) <= 0;
    };
    GridRouter.getOrder = function (pairs) {
        var outgoing = {};
        for (var i = 0; i < pairs.length; i++) {
            var p = pairs[i];
            if (typeof outgoing[p.l] === 'undefined')
                outgoing[p.l] = {};
            outgoing[p.l][p.r] = true;
        }
        return function (l, r) { return typeof outgoing[l] !== 'undefined' && outgoing[l][r]; };
    };
    GridRouter.orderEdges = function (edges) {
        var edgeOrder = [];
        for (var i = 0; i < edges.length - 1; i++) {
            for (var j = i + 1; j < edges.length; j++) {
                var e = edges[i], f = edges[j], lcs = new LongestCommonSubsequence(e, f);
                var u, vi, vj;
                if (lcs.length === 0)
                    continue;
                if (lcs.reversed) {
                    f.reverse();
                    f.reversed = true;
                    lcs = new LongestCommonSubsequence(e, f);
                }
                if ((lcs.si <= 0 || lcs.ti <= 0) &&
                    (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length)) {
                    edgeOrder.push({ l: i, r: j });
                    continue;
                }
                if (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length) {
                    u = e[lcs.si + 1];
                    vj = e[lcs.si - 1];
                    vi = f[lcs.ti - 1];
                }
                else {
                    u = e[lcs.si + lcs.length - 2];
                    vi = e[lcs.si + lcs.length];
                    vj = f[lcs.ti + lcs.length];
                }
                if (GridRouter.isLeft(u, vi, vj)) {
                    edgeOrder.push({ l: j, r: i });
                }
                else {
                    edgeOrder.push({ l: i, r: j });
                }
            }
        }
        return GridRouter.getOrder(edgeOrder);
    };
    GridRouter.makeSegments = function (path) {
        function copyPoint(p) {
            return { x: p.x, y: p.y };
        }
        var isStraight = function (a, b, c) { return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0.001; };
        var segments = [];
        var a = copyPoint(path[0]);
        for (var i = 1; i < path.length; i++) {
            var b = copyPoint(path[i]), c = i < path.length - 1 ? path[i + 1] : null;
            if (!c || !isStraight(a, b, c)) {
                segments.push([a, b]);
                a = b;
            }
        }
        return segments;
    };
    GridRouter.prototype.route = function (s, t) {
        var _this = this;
        var source = this.nodes[s], target = this.nodes[t];
        this.obstacles = this.siblingObstacles(source, target);
        var obstacleLookup = {};
        this.obstacles.forEach(function (o) { return obstacleLookup[o.id] = o; });
        this.passableEdges = this.edges.filter(function (e) {
            var u = _this.verts[e.source], v = _this.verts[e.target];
            return !(u.node && u.node.id in obstacleLookup
                || v.node && v.node.id in obstacleLookup);
        });
        for (var i = 1; i < source.ports.length; i++) {
            var u = source.ports[0].id;
            var v = source.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        for (var i = 1; i < target.ports.length; i++) {
            var u = target.ports[0].id;
            var v = target.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        var getSource = function (e) { return e.source; }, getTarget = function (e) { return e.target; }, getLength = function (e) { return e.length; };
        var shortestPathCalculator = new shortestpaths_1.Calculator(this.verts.length, this.passableEdges, getSource, getTarget, getLength);
        var bendPenalty = function (u, v, w) {
            var a = _this.verts[u], b = _this.verts[v], c = _this.verts[w];
            var dx = Math.abs(c.x - a.x), dy = Math.abs(c.y - a.y);
            if (a.node === source && a.node === b.node || b.node === target && b.node === c.node)
                return 0;
            return dx > 1 && dy > 1 ? 1000 : 0;
        };
        var shortestPath = shortestPathCalculator.PathFromNodeToNodeWithPrevCost(source.ports[0].id, target.ports[0].id, bendPenalty);
        var pathPoints = shortestPath.reverse().map(function (vi) { return _this.verts[vi]; });
        pathPoints.push(this.nodes[target.id].ports[0]);
        return pathPoints.filter(function (v, i) {
            return !(i < pathPoints.length - 1 && pathPoints[i + 1].node === source && v.node === source
                || i > 0 && v.node === target && pathPoints[i - 1].node === target);
        });
    };
    GridRouter.getRoutePath = function (route, cornerradius, arrowwidth, arrowheight) {
        var result = {
            routepath: 'M ' + route[0][0].x + ' ' + route[0][0].y + ' ',
            arrowpath: ''
        };
        if (route.length > 1) {
            for (var i = 0; i < route.length; i++) {
                var li = route[i];
                var x = li[1].x, y = li[1].y;
                var dx = x - li[0].x;
                var dy = y - li[0].y;
                if (i < route.length - 1) {
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * cornerradius;
                    }
                    else {
                        y -= dy / Math.abs(dy) * cornerradius;
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    var l = route[i + 1];
                    var x0 = l[0].x, y0 = l[0].y;
                    var x1 = l[1].x;
                    var y1 = l[1].y;
                    dx = x1 - x0;
                    dy = y1 - y0;
                    var angle = GridRouter.angleBetween2Lines(li, l) < 0 ? 1 : 0;
                    var x2, y2;
                    if (Math.abs(dx) > 0) {
                        x2 = x0 + dx / Math.abs(dx) * cornerradius;
                        y2 = y0;
                    }
                    else {
                        x2 = x0;
                        y2 = y0 + dy / Math.abs(dy) * cornerradius;
                    }
                    var cx = Math.abs(x2 - x);
                    var cy = Math.abs(y2 - y);
                    result.routepath += 'A ' + cx + ' ' + cy + ' 0 0 ' + angle + ' ' + x2 + ' ' + y2 + ' ';
                }
                else {
                    var arrowtip = [x, y];
                    var arrowcorner1, arrowcorner2;
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * arrowheight;
                        arrowcorner1 = [x, y + arrowwidth];
                        arrowcorner2 = [x, y - arrowwidth];
                    }
                    else {
                        y -= dy / Math.abs(dy) * arrowheight;
                        arrowcorner1 = [x + arrowwidth, y];
                        arrowcorner2 = [x - arrowwidth, y];
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    if (arrowheight > 0) {
                        result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                            + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
                    }
                }
            }
        }
        else {
            var li = route[0];
            var x = li[1].x, y = li[1].y;
            var dx = x - li[0].x;
            var dy = y - li[0].y;
            var arrowtip = [x, y];
            var arrowcorner1, arrowcorner2;
            if (Math.abs(dx) > 0) {
                x -= dx / Math.abs(dx) * arrowheight;
                arrowcorner1 = [x, y + arrowwidth];
                arrowcorner2 = [x, y - arrowwidth];
            }
            else {
                y -= dy / Math.abs(dy) * arrowheight;
                arrowcorner1 = [x + arrowwidth, y];
                arrowcorner2 = [x - arrowwidth, y];
            }
            result.routepath += 'L ' + x + ' ' + y + ' ';
            if (arrowheight > 0) {
                result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                    + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
            }
        }
        return result;
    };
    return GridRouter;
}());
exports.GridRouter = GridRouter;

},{"./rectangle":17,"./shortestpaths":18,"./vpsc":19}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var packingOptions = {
    PADDING: 10,
    GOLDEN_SECTION: (1 + Math.sqrt(5)) / 2,
    FLOAT_EPSILON: 0.0001,
    MAX_INERATIONS: 100
};
function applyPacking(graphs, w, h, node_size, desired_ratio) {
    if (desired_ratio === void 0) { desired_ratio = 1; }
    var init_x = 0, init_y = 0, svg_width = w, svg_height = h, desired_ratio = typeof desired_ratio !== 'undefined' ? desired_ratio : 1, node_size = typeof node_size !== 'undefined' ? node_size : 0, real_width = 0, real_height = 0, min_width = 0, global_bottom = 0, line = [];
    if (graphs.length == 0)
        return;
    calculate_bb(graphs);
    apply(graphs, desired_ratio);
    put_nodes_to_right_positions(graphs);
    function calculate_bb(graphs) {
        graphs.forEach(function (g) {
            calculate_single_bb(g);
        });
        function calculate_single_bb(graph) {
            var min_x = Number.MAX_VALUE, min_y = Number.MAX_VALUE, max_x = 0, max_y = 0;
            graph.array.forEach(function (v) {
                var w = typeof v.width !== 'undefined' ? v.width : node_size;
                var h = typeof v.height !== 'undefined' ? v.height : node_size;
                w /= 2;
                h /= 2;
                max_x = Math.max(v.x + w, max_x);
                min_x = Math.min(v.x - w, min_x);
                max_y = Math.max(v.y + h, max_y);
                min_y = Math.min(v.y - h, min_y);
            });
            graph.width = max_x - min_x;
            graph.height = max_y - min_y;
        }
    }
    function put_nodes_to_right_positions(graphs) {
        graphs.forEach(function (g) {
            var center = { x: 0, y: 0 };
            g.array.forEach(function (node) {
                center.x += node.x;
                center.y += node.y;
            });
            center.x /= g.array.length;
            center.y /= g.array.length;
            var corner = { x: center.x - g.width / 2, y: center.y - g.height / 2 };
            var offset = { x: g.x - corner.x + svg_width / 2 - real_width / 2, y: g.y - corner.y + svg_height / 2 - real_height / 2 };
            g.array.forEach(function (node) {
                node.x += offset.x;
                node.y += offset.y;
            });
        });
    }
    function apply(data, desired_ratio) {
        var curr_best_f = Number.POSITIVE_INFINITY;
        var curr_best = 0;
        data.sort(function (a, b) { return b.height - a.height; });
        min_width = data.reduce(function (a, b) {
            return a.width < b.width ? a.width : b.width;
        });
        var left = x1 = min_width;
        var right = x2 = get_entire_width(data);
        var iterationCounter = 0;
        var f_x1 = Number.MAX_VALUE;
        var f_x2 = Number.MAX_VALUE;
        var flag = -1;
        var dx = Number.MAX_VALUE;
        var df = Number.MAX_VALUE;
        while ((dx > min_width) || df > packingOptions.FLOAT_EPSILON) {
            if (flag != 1) {
                var x1 = right - (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x1 = step(data, x1);
            }
            if (flag != 0) {
                var x2 = left + (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x2 = step(data, x2);
            }
            dx = Math.abs(x1 - x2);
            df = Math.abs(f_x1 - f_x2);
            if (f_x1 < curr_best_f) {
                curr_best_f = f_x1;
                curr_best = x1;
            }
            if (f_x2 < curr_best_f) {
                curr_best_f = f_x2;
                curr_best = x2;
            }
            if (f_x1 > f_x2) {
                left = x1;
                x1 = x2;
                f_x1 = f_x2;
                flag = 1;
            }
            else {
                right = x2;
                x2 = x1;
                f_x2 = f_x1;
                flag = 0;
            }
            if (iterationCounter++ > 100) {
                break;
            }
        }
        step(data, curr_best);
    }
    function step(data, max_width) {
        line = [];
        real_width = 0;
        real_height = 0;
        global_bottom = init_y;
        for (var i = 0; i < data.length; i++) {
            var o = data[i];
            put_rect(o, max_width);
        }
        return Math.abs(get_real_ratio() - desired_ratio);
    }
    function put_rect(rect, max_width) {
        var parent = undefined;
        for (var i = 0; i < line.length; i++) {
            if ((line[i].space_left >= rect.height) && (line[i].x + line[i].width + rect.width + packingOptions.PADDING - max_width) <= packingOptions.FLOAT_EPSILON) {
                parent = line[i];
                break;
            }
        }
        line.push(rect);
        if (parent !== undefined) {
            rect.x = parent.x + parent.width + packingOptions.PADDING;
            rect.y = parent.bottom;
            rect.space_left = rect.height;
            rect.bottom = rect.y;
            parent.space_left -= rect.height + packingOptions.PADDING;
            parent.bottom += rect.height + packingOptions.PADDING;
        }
        else {
            rect.y = global_bottom;
            global_bottom += rect.height + packingOptions.PADDING;
            rect.x = init_x;
            rect.bottom = rect.y;
            rect.space_left = rect.height;
        }
        if (rect.y + rect.height - real_height > -packingOptions.FLOAT_EPSILON)
            real_height = rect.y + rect.height - init_y;
        if (rect.x + rect.width - real_width > -packingOptions.FLOAT_EPSILON)
            real_width = rect.x + rect.width - init_x;
    }
    function get_entire_width(data) {
        var width = 0;
        data.forEach(function (d) { return width += d.width + packingOptions.PADDING; });
        return width;
    }
    function get_real_ratio() {
        return (real_width / real_height);
    }
}
exports.applyPacking = applyPacking;
function separateGraphs(nodes, links) {
    var marks = {};
    var ways = {};
    var graphs = [];
    var clusters = 0;
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var n1 = link.source;
        var n2 = link.target;
        if (ways[n1.index])
            ways[n1.index].push(n2);
        else
            ways[n1.index] = [n2];
        if (ways[n2.index])
            ways[n2.index].push(n1);
        else
            ways[n2.index] = [n1];
    }
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (marks[node.index])
            continue;
        explore_node(node, true);
    }
    function explore_node(n, is_new) {
        if (marks[n.index] !== undefined)
            return;
        if (is_new) {
            clusters++;
            graphs.push({ array: [] });
        }
        marks[n.index] = clusters;
        graphs[clusters - 1].array.push(n);
        var adjacent = ways[n.index];
        if (!adjacent)
            return;
        for (var j = 0; j < adjacent.length; j++) {
            explore_node(adjacent[j], false);
        }
    }
    return graphs;
}
exports.separateGraphs = separateGraphs;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var powergraph = require("./powergraph");
var linklengths_1 = require("./linklengths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var shortestpaths_1 = require("./shortestpaths");
var geom_1 = require("./geom");
var handledisconnected_1 = require("./handledisconnected");
var EventType;
(function (EventType) {
    EventType[EventType["start"] = 0] = "start";
    EventType[EventType["tick"] = 1] = "tick";
    EventType[EventType["end"] = 2] = "end";
})(EventType = exports.EventType || (exports.EventType = {}));
function isGroup(g) {
    return typeof g.leaves !== 'undefined' || typeof g.groups !== 'undefined';
}
var Layout = (function () {
    function Layout() {
        var _this = this;
        this._canvasSize = [1, 1];
        this._linkDistance = 20;
        this._defaultNodeSize = 10;
        this._linkLengthCalculator = null;
        this._linkType = null;
        this._avoidOverlaps = false;
        this._handleDisconnected = true;
        this._running = false;
        this._nodes = [];
        this._groups = [];
        this._rootGroup = null;
        this._links = [];
        this._constraints = [];
        this._distanceMatrix = null;
        this._descent = null;
        this._directedLinkConstraints = null;
        this._threshold = 0.01;
        this._visibilityGraph = null;
        this._groupCompactness = 1e-6;
        this.event = null;
        this.linkAccessor = {
            getSourceIndex: Layout.getSourceIndex,
            getTargetIndex: Layout.getTargetIndex,
            setLength: Layout.setLinkLength,
            getType: function (l) { return typeof _this._linkType === "function" ? _this._linkType(l) : 0; }
        };
    }
    Layout.prototype.on = function (e, listener) {
        if (!this.event)
            this.event = {};
        if (typeof e === 'string') {
            this.event[EventType[e]] = listener;
        }
        else {
            this.event[e] = listener;
        }
        return this;
    };
    Layout.prototype.trigger = function (e) {
        if (this.event && typeof this.event[e.type] !== 'undefined') {
            this.event[e.type](e);
        }
    };
    Layout.prototype.kick = function () {
        while (!this.tick())
            ;
    };
    Layout.prototype.tick = function () {
        if (this._alpha < this._threshold) {
            this._running = false;
            this.trigger({ type: EventType.end, alpha: this._alpha = 0, stress: this._lastStress });
            return true;
        }
        var n = this._nodes.length, m = this._links.length;
        var o, i;
        this._descent.locks.clear();
        for (i = 0; i < n; ++i) {
            o = this._nodes[i];
            if (o.fixed) {
                if (typeof o.px === 'undefined' || typeof o.py === 'undefined') {
                    o.px = o.x;
                    o.py = o.y;
                }
                var p = [o.px, o.py];
                this._descent.locks.add(i, p);
            }
        }
        var s1 = this._descent.rungeKutta();
        if (s1 === 0) {
            this._alpha = 0;
        }
        else if (typeof this._lastStress !== 'undefined') {
            this._alpha = s1;
        }
        this._lastStress = s1;
        this.updateNodePositions();
        this.trigger({ type: EventType.tick, alpha: this._alpha, stress: this._lastStress });
        return false;
    };
    Layout.prototype.updateNodePositions = function () {
        var x = this._descent.x[0], y = this._descent.x[1];
        var o, i = this._nodes.length;
        while (i--) {
            o = this._nodes[i];
            o.x = x[i];
            o.y = y[i];
        }
    };
    Layout.prototype.nodes = function (v) {
        if (!v) {
            if (this._nodes.length === 0 && this._links.length > 0) {
                var n = 0;
                this._links.forEach(function (l) {
                    n = Math.max(n, l.source, l.target);
                });
                this._nodes = new Array(++n);
                for (var i = 0; i < n; ++i) {
                    this._nodes[i] = {};
                }
            }
            return this._nodes;
        }
        this._nodes = v;
        return this;
    };
    Layout.prototype.groups = function (x) {
        var _this = this;
        if (!x)
            return this._groups;
        this._groups = x;
        this._rootGroup = {};
        this._groups.forEach(function (g) {
            if (typeof g.padding === "undefined")
                g.padding = 1;
            if (typeof g.leaves !== "undefined") {
                g.leaves.forEach(function (v, i) {
                    if (typeof v === 'number')
                        (g.leaves[i] = _this._nodes[v]).parent = g;
                });
            }
            if (typeof g.groups !== "undefined") {
                g.groups.forEach(function (gi, i) {
                    if (typeof gi === 'number')
                        (g.groups[i] = _this._groups[gi]).parent = g;
                });
            }
        });
        this._rootGroup.leaves = this._nodes.filter(function (v) { return typeof v.parent === 'undefined'; });
        this._rootGroup.groups = this._groups.filter(function (g) { return typeof g.parent === 'undefined'; });
        return this;
    };
    Layout.prototype.powerGraphGroups = function (f) {
        var g = powergraph.getGroups(this._nodes, this._links, this.linkAccessor, this._rootGroup);
        this.groups(g.groups);
        f(g);
        return this;
    };
    Layout.prototype.avoidOverlaps = function (v) {
        if (!arguments.length)
            return this._avoidOverlaps;
        this._avoidOverlaps = v;
        return this;
    };
    Layout.prototype.handleDisconnected = function (v) {
        if (!arguments.length)
            return this._handleDisconnected;
        this._handleDisconnected = v;
        return this;
    };
    Layout.prototype.flowLayout = function (axis, minSeparation) {
        if (!arguments.length)
            axis = 'y';
        this._directedLinkConstraints = {
            axis: axis,
            getMinSeparation: typeof minSeparation === 'number' ? function () { return minSeparation; } : minSeparation
        };
        return this;
    };
    Layout.prototype.links = function (x) {
        if (!arguments.length)
            return this._links;
        this._links = x;
        return this;
    };
    Layout.prototype.constraints = function (c) {
        if (!arguments.length)
            return this._constraints;
        this._constraints = c;
        return this;
    };
    Layout.prototype.distanceMatrix = function (d) {
        if (!arguments.length)
            return this._distanceMatrix;
        this._distanceMatrix = d;
        return this;
    };
    Layout.prototype.size = function (x) {
        if (!x)
            return this._canvasSize;
        this._canvasSize = x;
        return this;
    };
    Layout.prototype.defaultNodeSize = function (x) {
        if (!x)
            return this._defaultNodeSize;
        this._defaultNodeSize = x;
        return this;
    };
    Layout.prototype.groupCompactness = function (x) {
        if (!x)
            return this._groupCompactness;
        this._groupCompactness = x;
        return this;
    };
    Layout.prototype.linkDistance = function (x) {
        if (!x) {
            return this._linkDistance;
        }
        this._linkDistance = typeof x === "function" ? x : +x;
        this._linkLengthCalculator = null;
        return this;
    };
    Layout.prototype.linkType = function (f) {
        this._linkType = f;
        return this;
    };
    Layout.prototype.convergenceThreshold = function (x) {
        if (!x)
            return this._threshold;
        this._threshold = typeof x === "function" ? x : +x;
        return this;
    };
    Layout.prototype.alpha = function (x) {
        if (!arguments.length)
            return this._alpha;
        else {
            x = +x;
            if (this._alpha) {
                if (x > 0)
                    this._alpha = x;
                else
                    this._alpha = 0;
            }
            else if (x > 0) {
                if (!this._running) {
                    this._running = true;
                    this.trigger({ type: EventType.start, alpha: this._alpha = x });
                    this.kick();
                }
            }
            return this;
        }
    };
    Layout.prototype.getLinkLength = function (link) {
        return typeof this._linkDistance === "function" ? +(this._linkDistance(link)) : this._linkDistance;
    };
    Layout.setLinkLength = function (link, length) {
        link.length = length;
    };
    Layout.prototype.getLinkType = function (link) {
        return typeof this._linkType === "function" ? this._linkType(link) : 0;
    };
    Layout.prototype.symmetricDiffLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.symmetricDiffLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.jaccardLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.jaccardLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.start = function (initialUnconstrainedIterations, initialUserConstraintIterations, initialAllConstraintsIterations, gridSnapIterations, keepRunning) {
        var _this = this;
        if (initialUnconstrainedIterations === void 0) { initialUnconstrainedIterations = 0; }
        if (initialUserConstraintIterations === void 0) { initialUserConstraintIterations = 0; }
        if (initialAllConstraintsIterations === void 0) { initialAllConstraintsIterations = 0; }
        if (gridSnapIterations === void 0) { gridSnapIterations = 0; }
        if (keepRunning === void 0) { keepRunning = true; }
        var i, j, n = this.nodes().length, N = n + 2 * this._groups.length, m = this._links.length, w = this._canvasSize[0], h = this._canvasSize[1];
        var x = new Array(N), y = new Array(N);
        var G = null;
        var ao = this._avoidOverlaps;
        this._nodes.forEach(function (v, i) {
            v.index = i;
            if (typeof v.x === 'undefined') {
                v.x = w / 2, v.y = h / 2;
            }
            x[i] = v.x, y[i] = v.y;
        });
        if (this._linkLengthCalculator)
            this._linkLengthCalculator();
        var distances;
        if (this._distanceMatrix) {
            distances = this._distanceMatrix;
        }
        else {
            distances = (new shortestpaths_1.Calculator(N, this._links, Layout.getSourceIndex, Layout.getTargetIndex, function (l) { return _this.getLinkLength(l); })).DistanceMatrix();
            G = descent_1.Descent.createSquareMatrix(N, function () { return 2; });
            this._links.forEach(function (l) {
                if (typeof l.source == "number")
                    l.source = _this._nodes[l.source];
                if (typeof l.target == "number")
                    l.target = _this._nodes[l.target];
            });
            this._links.forEach(function (e) {
                var u = Layout.getSourceIndex(e), v = Layout.getTargetIndex(e);
                G[u][v] = G[v][u] = e.weight || 1;
            });
        }
        var D = descent_1.Descent.createSquareMatrix(N, function (i, j) {
            return distances[i][j];
        });
        if (this._rootGroup && typeof this._rootGroup.groups !== 'undefined') {
            var i = n;
            var addAttraction = function (i, j, strength, idealDistance) {
                G[i][j] = G[j][i] = strength;
                D[i][j] = D[j][i] = idealDistance;
            };
            this._groups.forEach(function (g) {
                addAttraction(i, i + 1, _this._groupCompactness, 0.1);
                x[i] = 0, y[i++] = 0;
                x[i] = 0, y[i++] = 0;
            });
        }
        else
            this._rootGroup = { leaves: this._nodes, groups: [] };
        var curConstraints = this._constraints || [];
        if (this._directedLinkConstraints) {
            this.linkAccessor.getMinSeparation = this._directedLinkConstraints.getMinSeparation;
            curConstraints = curConstraints.concat(linklengths_1.generateDirectedEdgeConstraints(n, this._links, this._directedLinkConstraints.axis, (this.linkAccessor)));
        }
        this.avoidOverlaps(false);
        this._descent = new descent_1.Descent([x, y], D);
        this._descent.locks.clear();
        for (var i = 0; i < n; ++i) {
            var o = this._nodes[i];
            if (o.fixed) {
                o.px = o.x;
                o.py = o.y;
                var p = [o.x, o.y];
                this._descent.locks.add(i, p);
            }
        }
        this._descent.threshold = this._threshold;
        this.initialLayout(initialUnconstrainedIterations, x, y);
        if (curConstraints.length > 0)
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints).projectFunctions();
        this._descent.run(initialUserConstraintIterations);
        this.separateOverlappingComponents(w, h);
        this.avoidOverlaps(ao);
        if (ao) {
            this._nodes.forEach(function (v, i) { v.x = x[i], v.y = y[i]; });
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints, true).projectFunctions();
            this._nodes.forEach(function (v, i) { x[i] = v.x, y[i] = v.y; });
        }
        this._descent.G = G;
        this._descent.run(initialAllConstraintsIterations);
        if (gridSnapIterations) {
            this._descent.snapStrength = 1000;
            this._descent.snapGridSize = this._nodes[0].width;
            this._descent.numGridSnapNodes = n;
            this._descent.scaleSnapByMaxH = n != N;
            var G0 = descent_1.Descent.createSquareMatrix(N, function (i, j) {
                if (i >= n || j >= n)
                    return G[i][j];
                return 0;
            });
            this._descent.G = G0;
            this._descent.run(gridSnapIterations);
        }
        this.updateNodePositions();
        this.separateOverlappingComponents(w, h);
        return keepRunning ? this.resume() : this;
    };
    Layout.prototype.initialLayout = function (iterations, x, y) {
        if (this._groups.length > 0 && iterations > 0) {
            var n = this._nodes.length;
            var edges = this._links.map(function (e) { return ({ source: e.source.index, target: e.target.index }); });
            var vs = this._nodes.map(function (v) { return ({ index: v.index }); });
            this._groups.forEach(function (g, i) {
                vs.push({ index: g.index = n + i });
            });
            this._groups.forEach(function (g, i) {
                if (typeof g.leaves !== 'undefined')
                    g.leaves.forEach(function (v) { return edges.push({ source: g.index, target: v.index }); });
                if (typeof g.groups !== 'undefined')
                    g.groups.forEach(function (gg) { return edges.push({ source: g.index, target: gg.index }); });
            });
            new Layout()
                .size(this.size())
                .nodes(vs)
                .links(edges)
                .avoidOverlaps(false)
                .linkDistance(this.linkDistance())
                .symmetricDiffLinkLengths(5)
                .convergenceThreshold(1e-4)
                .start(iterations, 0, 0, 0, false);
            this._nodes.forEach(function (v) {
                x[v.index] = vs[v.index].x;
                y[v.index] = vs[v.index].y;
            });
        }
        else {
            this._descent.run(iterations);
        }
    };
    Layout.prototype.separateOverlappingComponents = function (width, height) {
        var _this = this;
        if (!this._distanceMatrix && this._handleDisconnected) {
            var x_1 = this._descent.x[0], y_1 = this._descent.x[1];
            this._nodes.forEach(function (v, i) { v.x = x_1[i], v.y = y_1[i]; });
            var graphs = handledisconnected_1.separateGraphs(this._nodes, this._links);
            handledisconnected_1.applyPacking(graphs, width, height, this._defaultNodeSize);
            this._nodes.forEach(function (v, i) {
                _this._descent.x[0][i] = v.x, _this._descent.x[1][i] = v.y;
                if (v.bounds) {
                    v.bounds.setXCentre(v.x);
                    v.bounds.setYCentre(v.y);
                }
            });
        }
    };
    Layout.prototype.resume = function () {
        return this.alpha(0.1);
    };
    Layout.prototype.stop = function () {
        return this.alpha(0);
    };
    Layout.prototype.prepareEdgeRouting = function (nodeMargin) {
        if (nodeMargin === void 0) { nodeMargin = 0; }
        this._visibilityGraph = new geom_1.TangentVisibilityGraph(this._nodes.map(function (v) {
            return v.bounds.inflate(-nodeMargin).vertices();
        }));
    };
    Layout.prototype.routeEdge = function (edge, draw) {
        var lineData = [];
        var vg2 = new geom_1.TangentVisibilityGraph(this._visibilityGraph.P, { V: this._visibilityGraph.V, E: this._visibilityGraph.E }), port1 = { x: edge.source.x, y: edge.source.y }, port2 = { x: edge.target.x, y: edge.target.y }, start = vg2.addPoint(port1, edge.source.index), end = vg2.addPoint(port2, edge.target.index);
        vg2.addEdgeIfVisible(port1, port2, edge.source.index, edge.target.index);
        if (typeof draw !== 'undefined') {
            draw(vg2);
        }
        var sourceInd = function (e) { return e.source.id; }, targetInd = function (e) { return e.target.id; }, length = function (e) { return e.length(); }, spCalc = new shortestpaths_1.Calculator(vg2.V.length, vg2.E, sourceInd, targetInd, length), shortestPath = spCalc.PathFromNodeToNode(start.id, end.id);
        if (shortestPath.length === 1 || shortestPath.length === vg2.V.length) {
            var route = rectangle_1.makeEdgeBetween(edge.source.innerBounds, edge.target.innerBounds, 5);
            lineData = [route.sourceIntersection, route.arrowStart];
        }
        else {
            var n = shortestPath.length - 2, p = vg2.V[shortestPath[n]].p, q = vg2.V[shortestPath[0]].p, lineData = [edge.source.innerBounds.rayIntersection(p.x, p.y)];
            for (var i = n; i >= 0; --i)
                lineData.push(vg2.V[shortestPath[i]].p);
            lineData.push(rectangle_1.makeEdgeTo(q, edge.target.innerBounds, 5));
        }
        return lineData;
    };
    Layout.getSourceIndex = function (e) {
        return typeof e.source === 'number' ? e.source : e.source.index;
    };
    Layout.getTargetIndex = function (e) {
        return typeof e.target === 'number' ? e.target : e.target.index;
    };
    Layout.linkId = function (e) {
        return Layout.getSourceIndex(e) + "-" + Layout.getTargetIndex(e);
    };
    Layout.dragStart = function (d) {
        if (isGroup(d)) {
            Layout.storeOffset(d, Layout.dragOrigin(d));
        }
        else {
            Layout.stopNode(d);
            d.fixed |= 2;
        }
    };
    Layout.stopNode = function (v) {
        v.px = v.x;
        v.py = v.y;
    };
    Layout.storeOffset = function (d, origin) {
        if (typeof d.leaves !== 'undefined') {
            d.leaves.forEach(function (v) {
                v.fixed |= 2;
                Layout.stopNode(v);
                v._dragGroupOffsetX = v.x - origin.x;
                v._dragGroupOffsetY = v.y - origin.y;
            });
        }
        if (typeof d.groups !== 'undefined') {
            d.groups.forEach(function (g) { return Layout.storeOffset(g, origin); });
        }
    };
    Layout.dragOrigin = function (d) {
        if (isGroup(d)) {
            return {
                x: d.bounds.cx(),
                y: d.bounds.cy()
            };
        }
        else {
            return d;
        }
    };
    Layout.drag = function (d, position) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    d.bounds.setXCentre(position.x);
                    d.bounds.setYCentre(position.y);
                    v.px = v._dragGroupOffsetX + position.x;
                    v.py = v._dragGroupOffsetY + position.y;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(function (g) { return Layout.drag(g, position); });
            }
        }
        else {
            d.px = position.x;
            d.py = position.y;
        }
    };
    Layout.dragEnd = function (d) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    Layout.dragEnd(v);
                    delete v._dragGroupOffsetX;
                    delete v._dragGroupOffsetY;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(Layout.dragEnd);
            }
        }
        else {
            d.fixed &= ~6;
        }
    };
    Layout.mouseOver = function (d) {
        d.fixed |= 4;
        d.px = d.x, d.py = d.y;
    };
    Layout.mouseOut = function (d) {
        d.fixed &= ~4;
    };
    return Layout;
}());
exports.Layout = Layout;

},{"./descent":7,"./geom":8,"./handledisconnected":10,"./linklengths":13,"./powergraph":14,"./rectangle":17,"./shortestpaths":18}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var shortestpaths_1 = require("./shortestpaths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var linklengths_1 = require("./linklengths");
var Link3D = (function () {
    function Link3D(source, target) {
        this.source = source;
        this.target = target;
    }
    Link3D.prototype.actualLength = function (x) {
        var _this = this;
        return Math.sqrt(x.reduce(function (c, v) {
            var dx = v[_this.target] - v[_this.source];
            return c + dx * dx;
        }, 0));
    };
    return Link3D;
}());
exports.Link3D = Link3D;
var Node3D = (function () {
    function Node3D(x, y, z) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (z === void 0) { z = 0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Node3D;
}());
exports.Node3D = Node3D;
var Layout3D = (function () {
    function Layout3D(nodes, links, idealLinkLength) {
        if (idealLinkLength === void 0) { idealLinkLength = 1; }
        var _this = this;
        this.nodes = nodes;
        this.links = links;
        this.idealLinkLength = idealLinkLength;
        this.constraints = null;
        this.useJaccardLinkLengths = true;
        this.result = new Array(Layout3D.k);
        for (var i = 0; i < Layout3D.k; ++i) {
            this.result[i] = new Array(nodes.length);
        }
        nodes.forEach(function (v, i) {
            for (var _i = 0, _a = Layout3D.dims; _i < _a.length; _i++) {
                var dim = _a[_i];
                if (typeof v[dim] == 'undefined')
                    v[dim] = Math.random();
            }
            _this.result[0][i] = v.x;
            _this.result[1][i] = v.y;
            _this.result[2][i] = v.z;
        });
    }
    ;
    Layout3D.prototype.linkLength = function (l) {
        return l.actualLength(this.result);
    };
    Layout3D.prototype.start = function (iterations) {
        var _this = this;
        if (iterations === void 0) { iterations = 100; }
        var n = this.nodes.length;
        var linkAccessor = new LinkAccessor();
        if (this.useJaccardLinkLengths)
            linklengths_1.jaccardLinkLengths(this.links, linkAccessor, 1.5);
        this.links.forEach(function (e) { return e.length *= _this.idealLinkLength; });
        var distanceMatrix = (new shortestpaths_1.Calculator(n, this.links, function (e) { return e.source; }, function (e) { return e.target; }, function (e) { return e.length; })).DistanceMatrix();
        var D = descent_1.Descent.createSquareMatrix(n, function (i, j) { return distanceMatrix[i][j]; });
        var G = descent_1.Descent.createSquareMatrix(n, function () { return 2; });
        this.links.forEach(function (_a) {
            var source = _a.source, target = _a.target;
            return G[source][target] = G[target][source] = 1;
        });
        this.descent = new descent_1.Descent(this.result, D);
        this.descent.threshold = 1e-3;
        this.descent.G = G;
        if (this.constraints)
            this.descent.project = new rectangle_1.Projection(this.nodes, null, null, this.constraints).projectFunctions();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        this.descent.run(iterations);
        return this;
    };
    Layout3D.prototype.tick = function () {
        this.descent.locks.clear();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        return this.descent.rungeKutta();
    };
    Layout3D.dims = ['x', 'y', 'z'];
    Layout3D.k = Layout3D.dims.length;
    return Layout3D;
}());
exports.Layout3D = Layout3D;
var LinkAccessor = (function () {
    function LinkAccessor() {
    }
    LinkAccessor.prototype.getSourceIndex = function (e) { return e.source; };
    LinkAccessor.prototype.getTargetIndex = function (e) { return e.target; };
    LinkAccessor.prototype.getLength = function (e) { return e.length; };
    LinkAccessor.prototype.setLength = function (e, l) { e.length = l; };
    return LinkAccessor;
}());

},{"./descent":7,"./linklengths":13,"./rectangle":17,"./shortestpaths":18}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function unionCount(a, b) {
    var u = {};
    for (var i in a)
        u[i] = {};
    for (var i in b)
        u[i] = {};
    return Object.keys(u).length;
}
function intersectionCount(a, b) {
    var n = 0;
    for (var i in a)
        if (typeof b[i] !== 'undefined')
            ++n;
    return n;
}
function getNeighbours(links, la) {
    var neighbours = {};
    var addNeighbours = function (u, v) {
        if (typeof neighbours[u] === 'undefined')
            neighbours[u] = {};
        neighbours[u][v] = {};
    };
    links.forEach(function (e) {
        var u = la.getSourceIndex(e), v = la.getTargetIndex(e);
        addNeighbours(u, v);
        addNeighbours(v, u);
    });
    return neighbours;
}
function computeLinkLengths(links, w, f, la) {
    var neighbours = getNeighbours(links, la);
    links.forEach(function (l) {
        var a = neighbours[la.getSourceIndex(l)];
        var b = neighbours[la.getTargetIndex(l)];
        la.setLength(l, 1 + w * f(a, b));
    });
}
function symmetricDiffLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) { return Math.sqrt(unionCount(a, b) - intersectionCount(a, b)); }, la);
}
exports.symmetricDiffLinkLengths = symmetricDiffLinkLengths;
function jaccardLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) {
        return Math.min(Object.keys(a).length, Object.keys(b).length) < 1.1 ? 0 : intersectionCount(a, b) / unionCount(a, b);
    }, la);
}
exports.jaccardLinkLengths = jaccardLinkLengths;
function generateDirectedEdgeConstraints(n, links, axis, la) {
    var components = stronglyConnectedComponents(n, links, la);
    var nodes = {};
    components.forEach(function (c, i) {
        return c.forEach(function (v) { return nodes[v] = i; });
    });
    var constraints = [];
    links.forEach(function (l) {
        var ui = la.getSourceIndex(l), vi = la.getTargetIndex(l), u = nodes[ui], v = nodes[vi];
        if (u !== v) {
            constraints.push({
                axis: axis,
                left: ui,
                right: vi,
                gap: la.getMinSeparation(l)
            });
        }
    });
    return constraints;
}
exports.generateDirectedEdgeConstraints = generateDirectedEdgeConstraints;
function stronglyConnectedComponents(numVertices, edges, la) {
    var nodes = [];
    var index = 0;
    var stack = [];
    var components = [];
    function strongConnect(v) {
        v.index = v.lowlink = index++;
        stack.push(v);
        v.onStack = true;
        for (var _i = 0, _a = v.out; _i < _a.length; _i++) {
            var w = _a[_i];
            if (typeof w.index === 'undefined') {
                strongConnect(w);
                v.lowlink = Math.min(v.lowlink, w.lowlink);
            }
            else if (w.onStack) {
                v.lowlink = Math.min(v.lowlink, w.index);
            }
        }
        if (v.lowlink === v.index) {
            var component = [];
            while (stack.length) {
                w = stack.pop();
                w.onStack = false;
                component.push(w);
                if (w === v)
                    break;
            }
            components.push(component.map(function (v) { return v.id; }));
        }
    }
    for (var i = 0; i < numVertices; i++) {
        nodes.push({ id: i, out: [] });
    }
    for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
        var e = edges_1[_i];
        var v_1 = nodes[la.getSourceIndex(e)], w = nodes[la.getTargetIndex(e)];
        v_1.out.push(w);
    }
    for (var _a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
        var v = nodes_1[_a];
        if (typeof v.index === 'undefined')
            strongConnect(v);
    }
    return components;
}
exports.stronglyConnectedComponents = stronglyConnectedComponents;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PowerEdge = (function () {
    function PowerEdge(source, target, type) {
        this.source = source;
        this.target = target;
        this.type = type;
    }
    return PowerEdge;
}());
exports.PowerEdge = PowerEdge;
var Configuration = (function () {
    function Configuration(n, edges, linkAccessor, rootGroup) {
        var _this = this;
        this.linkAccessor = linkAccessor;
        this.modules = new Array(n);
        this.roots = [];
        if (rootGroup) {
            this.initModulesFromGroup(rootGroup);
        }
        else {
            this.roots.push(new ModuleSet());
            for (var i = 0; i < n; ++i)
                this.roots[0].add(this.modules[i] = new Module(i));
        }
        this.R = edges.length;
        edges.forEach(function (e) {
            var s = _this.modules[linkAccessor.getSourceIndex(e)], t = _this.modules[linkAccessor.getTargetIndex(e)], type = linkAccessor.getType(e);
            s.outgoing.add(type, t);
            t.incoming.add(type, s);
        });
    }
    Configuration.prototype.initModulesFromGroup = function (group) {
        var moduleSet = new ModuleSet();
        this.roots.push(moduleSet);
        for (var i = 0; i < group.leaves.length; ++i) {
            var node = group.leaves[i];
            var module = new Module(node.id);
            this.modules[node.id] = module;
            moduleSet.add(module);
        }
        if (group.groups) {
            for (var j = 0; j < group.groups.length; ++j) {
                var child = group.groups[j];
                var definition = {};
                for (var prop in child)
                    if (prop !== "leaves" && prop !== "groups" && child.hasOwnProperty(prop))
                        definition[prop] = child[prop];
                moduleSet.add(new Module(-1 - j, new LinkSets(), new LinkSets(), this.initModulesFromGroup(child), definition));
            }
        }
        return moduleSet;
    };
    Configuration.prototype.merge = function (a, b, k) {
        if (k === void 0) { k = 0; }
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        var children = new ModuleSet();
        children.add(a);
        children.add(b);
        var m = new Module(this.modules.length, outInt, inInt, children);
        this.modules.push(m);
        var update = function (s, i, o) {
            s.forAll(function (ms, linktype) {
                ms.forAll(function (n) {
                    var nls = n[i];
                    nls.add(linktype, m);
                    nls.remove(linktype, a);
                    nls.remove(linktype, b);
                    a[o].remove(linktype, n);
                    b[o].remove(linktype, n);
                });
            });
        };
        update(outInt, "incoming", "outgoing");
        update(inInt, "outgoing", "incoming");
        this.R -= inInt.count() + outInt.count();
        this.roots[k].remove(a);
        this.roots[k].remove(b);
        this.roots[k].add(m);
        return m;
    };
    Configuration.prototype.rootMerges = function (k) {
        if (k === void 0) { k = 0; }
        var rs = this.roots[k].modules();
        var n = rs.length;
        var merges = new Array(n * (n - 1));
        var ctr = 0;
        for (var i = 0, i_ = n - 1; i < i_; ++i) {
            for (var j = i + 1; j < n; ++j) {
                var a = rs[i], b = rs[j];
                merges[ctr] = { id: ctr, nEdges: this.nEdges(a, b), a: a, b: b };
                ctr++;
            }
        }
        return merges;
    };
    Configuration.prototype.greedyMerge = function () {
        for (var i = 0; i < this.roots.length; ++i) {
            if (this.roots[i].modules().length < 2)
                continue;
            var ms = this.rootMerges(i).sort(function (a, b) { return a.nEdges == b.nEdges ? a.id - b.id : a.nEdges - b.nEdges; });
            var m = ms[0];
            if (m.nEdges >= this.R)
                continue;
            this.merge(m.a, m.b, i);
            return true;
        }
    };
    Configuration.prototype.nEdges = function (a, b) {
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        return this.R - inInt.count() - outInt.count();
    };
    Configuration.prototype.getGroupHierarchy = function (retargetedEdges) {
        var _this = this;
        var groups = [];
        var root = {};
        toGroups(this.roots[0], root, groups);
        var es = this.allEdges();
        es.forEach(function (e) {
            var a = _this.modules[e.source];
            var b = _this.modules[e.target];
            retargetedEdges.push(new PowerEdge(typeof a.gid === "undefined" ? e.source : groups[a.gid], typeof b.gid === "undefined" ? e.target : groups[b.gid], e.type));
        });
        return groups;
    };
    Configuration.prototype.allEdges = function () {
        var es = [];
        Configuration.getEdges(this.roots[0], es);
        return es;
    };
    Configuration.getEdges = function (modules, es) {
        modules.forAll(function (m) {
            m.getEdges(es);
            Configuration.getEdges(m.children, es);
        });
    };
    return Configuration;
}());
exports.Configuration = Configuration;
function toGroups(modules, group, groups) {
    modules.forAll(function (m) {
        if (m.isLeaf()) {
            if (!group.leaves)
                group.leaves = [];
            group.leaves.push(m.id);
        }
        else {
            var g = group;
            m.gid = groups.length;
            if (!m.isIsland() || m.isPredefined()) {
                g = { id: m.gid };
                if (m.isPredefined())
                    for (var prop in m.definition)
                        g[prop] = m.definition[prop];
                if (!group.groups)
                    group.groups = [];
                group.groups.push(m.gid);
                groups.push(g);
            }
            toGroups(m.children, g, groups);
        }
    });
}
var Module = (function () {
    function Module(id, outgoing, incoming, children, definition) {
        if (outgoing === void 0) { outgoing = new LinkSets(); }
        if (incoming === void 0) { incoming = new LinkSets(); }
        if (children === void 0) { children = new ModuleSet(); }
        this.id = id;
        this.outgoing = outgoing;
        this.incoming = incoming;
        this.children = children;
        this.definition = definition;
    }
    Module.prototype.getEdges = function (es) {
        var _this = this;
        this.outgoing.forAll(function (ms, edgetype) {
            ms.forAll(function (target) {
                es.push(new PowerEdge(_this.id, target.id, edgetype));
            });
        });
    };
    Module.prototype.isLeaf = function () {
        return this.children.count() === 0;
    };
    Module.prototype.isIsland = function () {
        return this.outgoing.count() === 0 && this.incoming.count() === 0;
    };
    Module.prototype.isPredefined = function () {
        return typeof this.definition !== "undefined";
    };
    return Module;
}());
exports.Module = Module;
function intersection(m, n) {
    var i = {};
    for (var v in m)
        if (v in n)
            i[v] = m[v];
    return i;
}
var ModuleSet = (function () {
    function ModuleSet() {
        this.table = {};
    }
    ModuleSet.prototype.count = function () {
        return Object.keys(this.table).length;
    };
    ModuleSet.prototype.intersection = function (other) {
        var result = new ModuleSet();
        result.table = intersection(this.table, other.table);
        return result;
    };
    ModuleSet.prototype.intersectionCount = function (other) {
        return this.intersection(other).count();
    };
    ModuleSet.prototype.contains = function (id) {
        return id in this.table;
    };
    ModuleSet.prototype.add = function (m) {
        this.table[m.id] = m;
    };
    ModuleSet.prototype.remove = function (m) {
        delete this.table[m.id];
    };
    ModuleSet.prototype.forAll = function (f) {
        for (var mid in this.table) {
            f(this.table[mid]);
        }
    };
    ModuleSet.prototype.modules = function () {
        var vs = [];
        this.forAll(function (m) {
            if (!m.isPredefined())
                vs.push(m);
        });
        return vs;
    };
    return ModuleSet;
}());
exports.ModuleSet = ModuleSet;
var LinkSets = (function () {
    function LinkSets() {
        this.sets = {};
        this.n = 0;
    }
    LinkSets.prototype.count = function () {
        return this.n;
    };
    LinkSets.prototype.contains = function (id) {
        var result = false;
        this.forAllModules(function (m) {
            if (!result && m.id == id) {
                result = true;
            }
        });
        return result;
    };
    LinkSets.prototype.add = function (linktype, m) {
        var s = linktype in this.sets ? this.sets[linktype] : this.sets[linktype] = new ModuleSet();
        s.add(m);
        ++this.n;
    };
    LinkSets.prototype.remove = function (linktype, m) {
        var ms = this.sets[linktype];
        ms.remove(m);
        if (ms.count() === 0) {
            delete this.sets[linktype];
        }
        --this.n;
    };
    LinkSets.prototype.forAll = function (f) {
        for (var linktype in this.sets) {
            f(this.sets[linktype], Number(linktype));
        }
    };
    LinkSets.prototype.forAllModules = function (f) {
        this.forAll(function (ms, lt) { return ms.forAll(f); });
    };
    LinkSets.prototype.intersection = function (other) {
        var result = new LinkSets();
        this.forAll(function (ms, lt) {
            if (lt in other.sets) {
                var i = ms.intersection(other.sets[lt]), n = i.count();
                if (n > 0) {
                    result.sets[lt] = i;
                    result.n += n;
                }
            }
        });
        return result;
    };
    return LinkSets;
}());
exports.LinkSets = LinkSets;
function intersectionCount(m, n) {
    return Object.keys(intersection(m, n)).length;
}
function getGroups(nodes, links, la, rootGroup) {
    var n = nodes.length, c = new Configuration(n, links, la, rootGroup);
    while (c.greedyMerge())
        ;
    var powerEdges = [];
    var g = c.getGroupHierarchy(powerEdges);
    powerEdges.forEach(function (e) {
        var f = function (end) {
            var g = e[end];
            if (typeof g == "number")
                e[end] = nodes[g];
        };
        f("source");
        f("target");
    });
    return { groups: g, powerEdges: powerEdges };
}
exports.getGroups = getGroups;

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PairingHeap = (function () {
    function PairingHeap(elem) {
        this.elem = elem;
        this.subheaps = [];
    }
    PairingHeap.prototype.toString = function (selector) {
        var str = "", needComma = false;
        for (var i = 0; i < this.subheaps.length; ++i) {
            var subheap = this.subheaps[i];
            if (!subheap.elem) {
                needComma = false;
                continue;
            }
            if (needComma) {
                str = str + ",";
            }
            str = str + subheap.toString(selector);
            needComma = true;
        }
        if (str !== "") {
            str = "(" + str + ")";
        }
        return (this.elem ? selector(this.elem) : "") + str;
    };
    PairingHeap.prototype.forEach = function (f) {
        if (!this.empty()) {
            f(this.elem, this);
            this.subheaps.forEach(function (s) { return s.forEach(f); });
        }
    };
    PairingHeap.prototype.count = function () {
        return this.empty() ? 0 : 1 + this.subheaps.reduce(function (n, h) {
            return n + h.count();
        }, 0);
    };
    PairingHeap.prototype.min = function () {
        return this.elem;
    };
    PairingHeap.prototype.empty = function () {
        return this.elem == null;
    };
    PairingHeap.prototype.contains = function (h) {
        if (this === h)
            return true;
        for (var i = 0; i < this.subheaps.length; i++) {
            if (this.subheaps[i].contains(h))
                return true;
        }
        return false;
    };
    PairingHeap.prototype.isHeap = function (lessThan) {
        var _this = this;
        return this.subheaps.every(function (h) { return lessThan(_this.elem, h.elem) && h.isHeap(lessThan); });
    };
    PairingHeap.prototype.insert = function (obj, lessThan) {
        return this.merge(new PairingHeap(obj), lessThan);
    };
    PairingHeap.prototype.merge = function (heap2, lessThan) {
        if (this.empty())
            return heap2;
        else if (heap2.empty())
            return this;
        else if (lessThan(this.elem, heap2.elem)) {
            this.subheaps.push(heap2);
            return this;
        }
        else {
            heap2.subheaps.push(this);
            return heap2;
        }
    };
    PairingHeap.prototype.removeMin = function (lessThan) {
        if (this.empty())
            return null;
        else
            return this.mergePairs(lessThan);
    };
    PairingHeap.prototype.mergePairs = function (lessThan) {
        if (this.subheaps.length == 0)
            return new PairingHeap(null);
        else if (this.subheaps.length == 1) {
            return this.subheaps[0];
        }
        else {
            var firstPair = this.subheaps.pop().merge(this.subheaps.pop(), lessThan);
            var remaining = this.mergePairs(lessThan);
            return firstPair.merge(remaining, lessThan);
        }
    };
    PairingHeap.prototype.decreaseKey = function (subheap, newValue, setHeapNode, lessThan) {
        var newHeap = subheap.removeMin(lessThan);
        subheap.elem = newHeap.elem;
        subheap.subheaps = newHeap.subheaps;
        if (setHeapNode !== null && newHeap.elem !== null) {
            setHeapNode(subheap.elem, subheap);
        }
        var pairingNode = new PairingHeap(newValue);
        if (setHeapNode !== null) {
            setHeapNode(newValue, pairingNode);
        }
        return this.merge(pairingNode, lessThan);
    };
    return PairingHeap;
}());
exports.PairingHeap = PairingHeap;
var PriorityQueue = (function () {
    function PriorityQueue(lessThan) {
        this.lessThan = lessThan;
    }
    PriorityQueue.prototype.top = function () {
        if (this.empty()) {
            return null;
        }
        return this.root.elem;
    };
    PriorityQueue.prototype.push = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var pairingNode;
        for (var i = 0, arg; arg = args[i]; ++i) {
            pairingNode = new PairingHeap(arg);
            this.root = this.empty() ?
                pairingNode : this.root.merge(pairingNode, this.lessThan);
        }
        return pairingNode;
    };
    PriorityQueue.prototype.empty = function () {
        return !this.root || !this.root.elem;
    };
    PriorityQueue.prototype.isHeap = function () {
        return this.root.isHeap(this.lessThan);
    };
    PriorityQueue.prototype.forEach = function (f) {
        this.root.forEach(f);
    };
    PriorityQueue.prototype.pop = function () {
        if (this.empty()) {
            return null;
        }
        var obj = this.root.min();
        this.root = this.root.removeMin(this.lessThan);
        return obj;
    };
    PriorityQueue.prototype.reduceKey = function (heapNode, newKey, setHeapNode) {
        if (setHeapNode === void 0) { setHeapNode = null; }
        this.root = this.root.decreaseKey(heapNode, newKey, setHeapNode, this.lessThan);
    };
    PriorityQueue.prototype.toString = function (selector) {
        return this.root.toString(selector);
    };
    PriorityQueue.prototype.count = function () {
        return this.root.count();
    };
    return PriorityQueue;
}());
exports.PriorityQueue = PriorityQueue;

},{}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var TreeBase = (function () {
    function TreeBase() {
        this.findIter = function (data) {
            var res = this._root;
            var iter = this.iterator();
            while (res !== null) {
                var c = this._comparator(data, res.data);
                if (c === 0) {
                    iter._cursor = res;
                    return iter;
                }
                else {
                    iter._ancestors.push(res);
                    res = res.get_child(c > 0);
                }
            }
            return null;
        };
    }
    TreeBase.prototype.clear = function () {
        this._root = null;
        this.size = 0;
    };
    ;
    TreeBase.prototype.find = function (data) {
        var res = this._root;
        while (res !== null) {
            var c = this._comparator(data, res.data);
            if (c === 0) {
                return res.data;
            }
            else {
                res = res.get_child(c > 0);
            }
        }
        return null;
    };
    ;
    TreeBase.prototype.lowerBound = function (data) {
        return this._bound(data, this._comparator);
    };
    ;
    TreeBase.prototype.upperBound = function (data) {
        var cmp = this._comparator;
        function reverse_cmp(a, b) {
            return cmp(b, a);
        }
        return this._bound(data, reverse_cmp);
    };
    ;
    TreeBase.prototype.min = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.left !== null) {
            res = res.left;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.max = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.right !== null) {
            res = res.right;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.iterator = function () {
        return new Iterator(this);
    };
    ;
    TreeBase.prototype.each = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.next()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype.reach = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.prev()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype._bound = function (data, cmp) {
        var cur = this._root;
        var iter = this.iterator();
        while (cur !== null) {
            var c = this._comparator(data, cur.data);
            if (c === 0) {
                iter._cursor = cur;
                return iter;
            }
            iter._ancestors.push(cur);
            cur = cur.get_child(c > 0);
        }
        for (var i = iter._ancestors.length - 1; i >= 0; --i) {
            cur = iter._ancestors[i];
            if (cmp(data, cur.data) > 0) {
                iter._cursor = cur;
                iter._ancestors.length = i;
                return iter;
            }
        }
        iter._ancestors.length = 0;
        return iter;
    };
    ;
    return TreeBase;
}());
exports.TreeBase = TreeBase;
var Iterator = (function () {
    function Iterator(tree) {
        this._tree = tree;
        this._ancestors = [];
        this._cursor = null;
    }
    Iterator.prototype.data = function () {
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.next = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._minNode(root);
            }
        }
        else {
            if (this._cursor.right === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.right === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._minNode(this._cursor.right);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.prev = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._maxNode(root);
            }
        }
        else {
            if (this._cursor.left === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.left === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._maxNode(this._cursor.left);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype._minNode = function (start) {
        while (start.left !== null) {
            this._ancestors.push(start);
            start = start.left;
        }
        this._cursor = start;
    };
    ;
    Iterator.prototype._maxNode = function (start) {
        while (start.right !== null) {
            this._ancestors.push(start);
            start = start.right;
        }
        this._cursor = start;
    };
    ;
    return Iterator;
}());
exports.Iterator = Iterator;
var Node = (function () {
    function Node(data) {
        this.data = data;
        this.left = null;
        this.right = null;
        this.red = true;
    }
    Node.prototype.get_child = function (dir) {
        return dir ? this.right : this.left;
    };
    ;
    Node.prototype.set_child = function (dir, val) {
        if (dir) {
            this.right = val;
        }
        else {
            this.left = val;
        }
    };
    ;
    return Node;
}());
var RBTree = (function (_super) {
    __extends(RBTree, _super);
    function RBTree(comparator) {
        var _this = _super.call(this) || this;
        _this._root = null;
        _this._comparator = comparator;
        _this.size = 0;
        return _this;
    }
    RBTree.prototype.insert = function (data) {
        var ret = false;
        if (this._root === null) {
            this._root = new Node(data);
            ret = true;
            this.size++;
        }
        else {
            var head = new Node(undefined);
            var dir = false;
            var last = false;
            var gp = null;
            var ggp = head;
            var p = null;
            var node = this._root;
            ggp.right = this._root;
            while (true) {
                if (node === null) {
                    node = new Node(data);
                    p.set_child(dir, node);
                    ret = true;
                    this.size++;
                }
                else if (RBTree.is_red(node.left) && RBTree.is_red(node.right)) {
                    node.red = true;
                    node.left.red = false;
                    node.right.red = false;
                }
                if (RBTree.is_red(node) && RBTree.is_red(p)) {
                    var dir2 = ggp.right === gp;
                    if (node === p.get_child(last)) {
                        ggp.set_child(dir2, RBTree.single_rotate(gp, !last));
                    }
                    else {
                        ggp.set_child(dir2, RBTree.double_rotate(gp, !last));
                    }
                }
                var cmp = this._comparator(node.data, data);
                if (cmp === 0) {
                    break;
                }
                last = dir;
                dir = cmp < 0;
                if (gp !== null) {
                    ggp = gp;
                }
                gp = p;
                p = node;
                node = node.get_child(dir);
            }
            this._root = head.right;
        }
        this._root.red = false;
        return ret;
    };
    ;
    RBTree.prototype.remove = function (data) {
        if (this._root === null) {
            return false;
        }
        var head = new Node(undefined);
        var node = head;
        node.right = this._root;
        var p = null;
        var gp = null;
        var found = null;
        var dir = true;
        while (node.get_child(dir) !== null) {
            var last = dir;
            gp = p;
            p = node;
            node = node.get_child(dir);
            var cmp = this._comparator(data, node.data);
            dir = cmp > 0;
            if (cmp === 0) {
                found = node;
            }
            if (!RBTree.is_red(node) && !RBTree.is_red(node.get_child(dir))) {
                if (RBTree.is_red(node.get_child(!dir))) {
                    var sr = RBTree.single_rotate(node, dir);
                    p.set_child(last, sr);
                    p = sr;
                }
                else if (!RBTree.is_red(node.get_child(!dir))) {
                    var sibling = p.get_child(!last);
                    if (sibling !== null) {
                        if (!RBTree.is_red(sibling.get_child(!last)) && !RBTree.is_red(sibling.get_child(last))) {
                            p.red = false;
                            sibling.red = true;
                            node.red = true;
                        }
                        else {
                            var dir2 = gp.right === p;
                            if (RBTree.is_red(sibling.get_child(last))) {
                                gp.set_child(dir2, RBTree.double_rotate(p, last));
                            }
                            else if (RBTree.is_red(sibling.get_child(!last))) {
                                gp.set_child(dir2, RBTree.single_rotate(p, last));
                            }
                            var gpc = gp.get_child(dir2);
                            gpc.red = true;
                            node.red = true;
                            gpc.left.red = false;
                            gpc.right.red = false;
                        }
                    }
                }
            }
        }
        if (found !== null) {
            found.data = node.data;
            p.set_child(p.right === node, node.get_child(node.left === null));
            this.size--;
        }
        this._root = head.right;
        if (this._root !== null) {
            this._root.red = false;
        }
        return found !== null;
    };
    ;
    RBTree.is_red = function (node) {
        return node !== null && node.red;
    };
    RBTree.single_rotate = function (root, dir) {
        var save = root.get_child(!dir);
        root.set_child(!dir, save.get_child(dir));
        save.set_child(dir, root);
        root.red = true;
        save.red = false;
        return save;
    };
    RBTree.double_rotate = function (root, dir) {
        root.set_child(!dir, RBTree.single_rotate(root.get_child(!dir), !dir));
        return RBTree.single_rotate(root, dir);
    };
    return RBTree;
}(TreeBase));
exports.RBTree = RBTree;

},{}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var vpsc_1 = require("./vpsc");
var rbtree_1 = require("./rbtree");
function computeGroupBounds(g) {
    g.bounds = typeof g.leaves !== "undefined" ?
        g.leaves.reduce(function (r, c) { return c.bounds.union(r); }, Rectangle.empty()) :
        Rectangle.empty();
    if (typeof g.groups !== "undefined")
        g.bounds = g.groups.reduce(function (r, c) { return computeGroupBounds(c).union(r); }, g.bounds);
    g.bounds = g.bounds.inflate(g.padding);
    return g.bounds;
}
exports.computeGroupBounds = computeGroupBounds;
var Rectangle = (function () {
    function Rectangle(x, X, y, Y) {
        this.x = x;
        this.X = X;
        this.y = y;
        this.Y = Y;
    }
    Rectangle.empty = function () { return new Rectangle(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY); };
    Rectangle.prototype.cx = function () { return (this.x + this.X) / 2; };
    Rectangle.prototype.cy = function () { return (this.y + this.Y) / 2; };
    Rectangle.prototype.overlapX = function (r) {
        var ux = this.cx(), vx = r.cx();
        if (ux <= vx && r.x < this.X)
            return this.X - r.x;
        if (vx <= ux && this.x < r.X)
            return r.X - this.x;
        return 0;
    };
    Rectangle.prototype.overlapY = function (r) {
        var uy = this.cy(), vy = r.cy();
        if (uy <= vy && r.y < this.Y)
            return this.Y - r.y;
        if (vy <= uy && this.y < r.Y)
            return r.Y - this.y;
        return 0;
    };
    Rectangle.prototype.setXCentre = function (cx) {
        var dx = cx - this.cx();
        this.x += dx;
        this.X += dx;
    };
    Rectangle.prototype.setYCentre = function (cy) {
        var dy = cy - this.cy();
        this.y += dy;
        this.Y += dy;
    };
    Rectangle.prototype.width = function () {
        return this.X - this.x;
    };
    Rectangle.prototype.height = function () {
        return this.Y - this.y;
    };
    Rectangle.prototype.union = function (r) {
        return new Rectangle(Math.min(this.x, r.x), Math.max(this.X, r.X), Math.min(this.y, r.y), Math.max(this.Y, r.Y));
    };
    Rectangle.prototype.lineIntersections = function (x1, y1, x2, y2) {
        var sides = [[this.x, this.y, this.X, this.y],
            [this.X, this.y, this.X, this.Y],
            [this.X, this.Y, this.x, this.Y],
            [this.x, this.Y, this.x, this.y]];
        var intersections = [];
        for (var i = 0; i < 4; ++i) {
            var r = Rectangle.lineIntersection(x1, y1, x2, y2, sides[i][0], sides[i][1], sides[i][2], sides[i][3]);
            if (r !== null)
                intersections.push({ x: r.x, y: r.y });
        }
        return intersections;
    };
    Rectangle.prototype.rayIntersection = function (x2, y2) {
        var ints = this.lineIntersections(this.cx(), this.cy(), x2, y2);
        return ints.length > 0 ? ints[0] : null;
    };
    Rectangle.prototype.vertices = function () {
        return [
            { x: this.x, y: this.y },
            { x: this.X, y: this.y },
            { x: this.X, y: this.Y },
            { x: this.x, y: this.Y },
            { x: this.x, y: this.y }
        ];
    };
    Rectangle.lineIntersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
        var dx12 = x2 - x1, dx34 = x4 - x3, dy12 = y2 - y1, dy34 = y4 - y3, denominator = dy34 * dx12 - dx34 * dy12;
        if (denominator == 0)
            return null;
        var dx31 = x1 - x3, dy31 = y1 - y3, numa = dx34 * dy31 - dy34 * dx31, a = numa / denominator, numb = dx12 * dy31 - dy12 * dx31, b = numb / denominator;
        if (a >= 0 && a <= 1 && b >= 0 && b <= 1) {
            return {
                x: x1 + a * dx12,
                y: y1 + a * dy12
            };
        }
        return null;
    };
    Rectangle.prototype.inflate = function (pad) {
        return new Rectangle(this.x - pad, this.X + pad, this.y - pad, this.Y + pad);
    };
    return Rectangle;
}());
exports.Rectangle = Rectangle;
function makeEdgeBetween(source, target, ah) {
    var si = source.rayIntersection(target.cx(), target.cy()) || { x: source.cx(), y: source.cy() }, ti = target.rayIntersection(source.cx(), source.cy()) || { x: target.cx(), y: target.cy() }, dx = ti.x - si.x, dy = ti.y - si.y, l = Math.sqrt(dx * dx + dy * dy), al = l - ah;
    return {
        sourceIntersection: si,
        targetIntersection: ti,
        arrowStart: { x: si.x + al * dx / l, y: si.y + al * dy / l }
    };
}
exports.makeEdgeBetween = makeEdgeBetween;
function makeEdgeTo(s, target, ah) {
    var ti = target.rayIntersection(s.x, s.y);
    if (!ti)
        ti = { x: target.cx(), y: target.cy() };
    var dx = ti.x - s.x, dy = ti.y - s.y, l = Math.sqrt(dx * dx + dy * dy);
    return { x: ti.x - ah * dx / l, y: ti.y - ah * dy / l };
}
exports.makeEdgeTo = makeEdgeTo;
var Node = (function () {
    function Node(v, r, pos) {
        this.v = v;
        this.r = r;
        this.pos = pos;
        this.prev = makeRBTree();
        this.next = makeRBTree();
    }
    return Node;
}());
var Event = (function () {
    function Event(isOpen, v, pos) {
        this.isOpen = isOpen;
        this.v = v;
        this.pos = pos;
    }
    return Event;
}());
function compareEvents(a, b) {
    if (a.pos > b.pos) {
        return 1;
    }
    if (a.pos < b.pos) {
        return -1;
    }
    if (a.isOpen) {
        return -1;
    }
    if (b.isOpen) {
        return 1;
    }
    return 0;
}
function makeRBTree() {
    return new rbtree_1.RBTree(function (a, b) { return a.pos - b.pos; });
}
var xRect = {
    getCentre: function (r) { return r.cx(); },
    getOpen: function (r) { return r.y; },
    getClose: function (r) { return r.Y; },
    getSize: function (r) { return r.width(); },
    makeRect: function (open, close, center, size) { return new Rectangle(center - size / 2, center + size / 2, open, close); },
    findNeighbours: findXNeighbours
};
var yRect = {
    getCentre: function (r) { return r.cy(); },
    getOpen: function (r) { return r.x; },
    getClose: function (r) { return r.X; },
    getSize: function (r) { return r.height(); },
    makeRect: function (open, close, center, size) { return new Rectangle(open, close, center - size / 2, center + size / 2); },
    findNeighbours: findYNeighbours
};
function generateGroupConstraints(root, f, minSep, isContained) {
    if (isContained === void 0) { isContained = false; }
    var padding = root.padding, gn = typeof root.groups !== 'undefined' ? root.groups.length : 0, ln = typeof root.leaves !== 'undefined' ? root.leaves.length : 0, childConstraints = !gn ? []
        : root.groups.reduce(function (ccs, g) { return ccs.concat(generateGroupConstraints(g, f, minSep, true)); }, []), n = (isContained ? 2 : 0) + ln + gn, vs = new Array(n), rs = new Array(n), i = 0, add = function (r, v) { rs[i] = r; vs[i++] = v; };
    if (isContained) {
        var b = root.bounds, c = f.getCentre(b), s = f.getSize(b) / 2, open = f.getOpen(b), close = f.getClose(b), min = c - s + padding / 2, max = c + s - padding / 2;
        root.minVar.desiredPosition = min;
        add(f.makeRect(open, close, min, padding), root.minVar);
        root.maxVar.desiredPosition = max;
        add(f.makeRect(open, close, max, padding), root.maxVar);
    }
    if (ln)
        root.leaves.forEach(function (l) { return add(l.bounds, l.variable); });
    if (gn)
        root.groups.forEach(function (g) {
            var b = g.bounds;
            add(f.makeRect(f.getOpen(b), f.getClose(b), f.getCentre(b), f.getSize(b)), g.minVar);
        });
    var cs = generateConstraints(rs, vs, f, minSep);
    if (gn) {
        vs.forEach(function (v) { v.cOut = [], v.cIn = []; });
        cs.forEach(function (c) { c.left.cOut.push(c), c.right.cIn.push(c); });
        root.groups.forEach(function (g) {
            var gapAdjustment = (g.padding - f.getSize(g.bounds)) / 2;
            g.minVar.cIn.forEach(function (c) { return c.gap += gapAdjustment; });
            g.minVar.cOut.forEach(function (c) { c.left = g.maxVar; c.gap += gapAdjustment; });
        });
    }
    return childConstraints.concat(cs);
}
function generateConstraints(rs, vars, rect, minSep) {
    var i, n = rs.length;
    var N = 2 * n;
    console.assert(vars.length >= n);
    var events = new Array(N);
    for (i = 0; i < n; ++i) {
        var r = rs[i];
        var v = new Node(vars[i], r, rect.getCentre(r));
        events[i] = new Event(true, v, rect.getOpen(r));
        events[i + n] = new Event(false, v, rect.getClose(r));
    }
    events.sort(compareEvents);
    var cs = [];
    var scanline = makeRBTree();
    for (i = 0; i < N; ++i) {
        var e = events[i];
        var v = e.v;
        if (e.isOpen) {
            scanline.insert(v);
            rect.findNeighbours(v, scanline);
        }
        else {
            scanline.remove(v);
            var makeConstraint = function (l, r) {
                var sep = (rect.getSize(l.r) + rect.getSize(r.r)) / 2 + minSep;
                cs.push(new vpsc_1.Constraint(l.v, r.v, sep));
            };
            var visitNeighbours = function (forward, reverse, mkcon) {
                var u, it = v[forward].iterator();
                while ((u = it[forward]()) !== null) {
                    mkcon(u, v);
                    u[reverse].remove(v);
                }
            };
            visitNeighbours("prev", "next", function (u, v) { return makeConstraint(u, v); });
            visitNeighbours("next", "prev", function (u, v) { return makeConstraint(v, u); });
        }
    }
    console.assert(scanline.size === 0);
    return cs;
}
function findXNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var it = scanline.findIter(v);
        var u;
        while ((u = it[forward]()) !== null) {
            var uovervX = u.r.overlapX(v.r);
            if (uovervX <= 0 || uovervX <= u.r.overlapY(v.r)) {
                v[forward].insert(u);
                u[reverse].insert(v);
            }
            if (uovervX <= 0) {
                break;
            }
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function findYNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var u = scanline.findIter(v)[forward]();
        if (u !== null && u.r.overlapX(v.r) > 0) {
            v[forward].insert(u);
            u[reverse].insert(v);
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function generateXConstraints(rs, vars) {
    return generateConstraints(rs, vars, xRect, 1e-6);
}
exports.generateXConstraints = generateXConstraints;
function generateYConstraints(rs, vars) {
    return generateConstraints(rs, vars, yRect, 1e-6);
}
exports.generateYConstraints = generateYConstraints;
function generateXGroupConstraints(root) {
    return generateGroupConstraints(root, xRect, 1e-6);
}
exports.generateXGroupConstraints = generateXGroupConstraints;
function generateYGroupConstraints(root) {
    return generateGroupConstraints(root, yRect, 1e-6);
}
exports.generateYGroupConstraints = generateYGroupConstraints;
function removeOverlaps(rs) {
    var vs = rs.map(function (r) { return new vpsc_1.Variable(r.cx()); });
    var cs = generateXConstraints(rs, vs);
    var solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setXCentre(v.position()); });
    vs = rs.map(function (r) { return new vpsc_1.Variable(r.cy()); });
    cs = generateYConstraints(rs, vs);
    solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setYCentre(v.position()); });
}
exports.removeOverlaps = removeOverlaps;
var IndexedVariable = (function (_super) {
    __extends(IndexedVariable, _super);
    function IndexedVariable(index, w) {
        var _this = _super.call(this, 0, w) || this;
        _this.index = index;
        return _this;
    }
    return IndexedVariable;
}(vpsc_1.Variable));
exports.IndexedVariable = IndexedVariable;
var Projection = (function () {
    function Projection(nodes, groups, rootGroup, constraints, avoidOverlaps) {
        if (rootGroup === void 0) { rootGroup = null; }
        if (constraints === void 0) { constraints = null; }
        if (avoidOverlaps === void 0) { avoidOverlaps = false; }
        var _this = this;
        this.nodes = nodes;
        this.groups = groups;
        this.rootGroup = rootGroup;
        this.avoidOverlaps = avoidOverlaps;
        this.variables = nodes.map(function (v, i) {
            return v.variable = new IndexedVariable(i, 1);
        });
        if (constraints)
            this.createConstraints(constraints);
        if (avoidOverlaps && rootGroup && typeof rootGroup.groups !== 'undefined') {
            nodes.forEach(function (v) {
                if (!v.width || !v.height) {
                    v.bounds = new Rectangle(v.x, v.x, v.y, v.y);
                    return;
                }
                var w2 = v.width / 2, h2 = v.height / 2;
                v.bounds = new Rectangle(v.x - w2, v.x + w2, v.y - h2, v.y + h2);
            });
            computeGroupBounds(rootGroup);
            var i = nodes.length;
            groups.forEach(function (g) {
                _this.variables[i] = g.minVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
                _this.variables[i] = g.maxVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
            });
        }
    }
    Projection.prototype.createSeparation = function (c) {
        return new vpsc_1.Constraint(this.nodes[c.left].variable, this.nodes[c.right].variable, c.gap, typeof c.equality !== "undefined" ? c.equality : false);
    };
    Projection.prototype.makeFeasible = function (c) {
        var _this = this;
        if (!this.avoidOverlaps)
            return;
        var axis = 'x', dim = 'width';
        if (c.axis === 'x')
            axis = 'y', dim = 'height';
        var vs = c.offsets.map(function (o) { return _this.nodes[o.node]; }).sort(function (a, b) { return a[axis] - b[axis]; });
        var p = null;
        vs.forEach(function (v) {
            if (p) {
                var nextPos = p[axis] + p[dim];
                if (nextPos > v[axis]) {
                    v[axis] = nextPos;
                }
            }
            p = v;
        });
    };
    Projection.prototype.createAlignment = function (c) {
        var _this = this;
        var u = this.nodes[c.offsets[0].node].variable;
        this.makeFeasible(c);
        var cs = c.axis === 'x' ? this.xConstraints : this.yConstraints;
        c.offsets.slice(1).forEach(function (o) {
            var v = _this.nodes[o.node].variable;
            cs.push(new vpsc_1.Constraint(u, v, o.offset, true));
        });
    };
    Projection.prototype.createConstraints = function (constraints) {
        var _this = this;
        var isSep = function (c) { return typeof c.type === 'undefined' || c.type === 'separation'; };
        this.xConstraints = constraints
            .filter(function (c) { return c.axis === "x" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        this.yConstraints = constraints
            .filter(function (c) { return c.axis === "y" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        constraints
            .filter(function (c) { return c.type === 'alignment'; })
            .forEach(function (c) { return _this.createAlignment(c); });
    };
    Projection.prototype.setupVariablesAndBounds = function (x0, y0, desired, getDesired) {
        this.nodes.forEach(function (v, i) {
            if (v.fixed) {
                v.variable.weight = v.fixedWeight ? v.fixedWeight : 1000;
                desired[i] = getDesired(v);
            }
            else {
                v.variable.weight = 1;
            }
            var w = (v.width || 0) / 2, h = (v.height || 0) / 2;
            var ix = x0[i], iy = y0[i];
            v.bounds = new Rectangle(ix - w, ix + w, iy - h, iy + h);
        });
    };
    Projection.prototype.xProject = function (x0, y0, x) {
        if (!this.rootGroup && !(this.avoidOverlaps || this.xConstraints))
            return;
        this.project(x0, y0, x0, x, function (v) { return v.px; }, this.xConstraints, generateXGroupConstraints, function (v) { return v.bounds.setXCentre(x[v.variable.index] = v.variable.position()); }, function (g) {
            var xmin = x[g.minVar.index] = g.minVar.position();
            var xmax = x[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.x = xmin - p2;
            g.bounds.X = xmax + p2;
        });
    };
    Projection.prototype.yProject = function (x0, y0, y) {
        if (!this.rootGroup && !this.yConstraints)
            return;
        this.project(x0, y0, y0, y, function (v) { return v.py; }, this.yConstraints, generateYGroupConstraints, function (v) { return v.bounds.setYCentre(y[v.variable.index] = v.variable.position()); }, function (g) {
            var ymin = y[g.minVar.index] = g.minVar.position();
            var ymax = y[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.y = ymin - p2;
            g.bounds.Y = ymax + p2;
        });
    };
    Projection.prototype.projectFunctions = function () {
        var _this = this;
        return [
            function (x0, y0, x) { return _this.xProject(x0, y0, x); },
            function (x0, y0, y) { return _this.yProject(x0, y0, y); }
        ];
    };
    Projection.prototype.project = function (x0, y0, start, desired, getDesired, cs, generateConstraints, updateNodeBounds, updateGroupBounds) {
        this.setupVariablesAndBounds(x0, y0, desired, getDesired);
        if (this.rootGroup && this.avoidOverlaps) {
            computeGroupBounds(this.rootGroup);
            cs = cs.concat(generateConstraints(this.rootGroup));
        }
        this.solve(this.variables, cs, start, desired);
        this.nodes.forEach(updateNodeBounds);
        if (this.rootGroup && this.avoidOverlaps) {
            this.groups.forEach(updateGroupBounds);
            computeGroupBounds(this.rootGroup);
        }
    };
    Projection.prototype.solve = function (vs, cs, starting, desired) {
        var solver = new vpsc_1.Solver(vs, cs);
        solver.setStartingPositions(starting);
        solver.setDesiredPositions(desired);
        solver.solve();
    };
    return Projection;
}());
exports.Projection = Projection;

},{"./rbtree":16,"./vpsc":19}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pqueue_1 = require("./pqueue");
var Neighbour = (function () {
    function Neighbour(id, distance) {
        this.id = id;
        this.distance = distance;
    }
    return Neighbour;
}());
var Node = (function () {
    function Node(id) {
        this.id = id;
        this.neighbours = [];
    }
    return Node;
}());
var QueueEntry = (function () {
    function QueueEntry(node, prev, d) {
        this.node = node;
        this.prev = prev;
        this.d = d;
    }
    return QueueEntry;
}());
var Calculator = (function () {
    function Calculator(n, es, getSourceIndex, getTargetIndex, getLength) {
        this.n = n;
        this.es = es;
        this.neighbours = new Array(this.n);
        var i = this.n;
        while (i--)
            this.neighbours[i] = new Node(i);
        i = this.es.length;
        while (i--) {
            var e = this.es[i];
            var u = getSourceIndex(e), v = getTargetIndex(e);
            var d = getLength(e);
            this.neighbours[u].neighbours.push(new Neighbour(v, d));
            this.neighbours[v].neighbours.push(new Neighbour(u, d));
        }
    }
    Calculator.prototype.DistanceMatrix = function () {
        var D = new Array(this.n);
        for (var i = 0; i < this.n; ++i) {
            D[i] = this.dijkstraNeighbours(i);
        }
        return D;
    };
    Calculator.prototype.DistancesFromNode = function (start) {
        return this.dijkstraNeighbours(start);
    };
    Calculator.prototype.PathFromNodeToNode = function (start, end) {
        return this.dijkstraNeighbours(start, end);
    };
    Calculator.prototype.PathFromNodeToNodeWithPrevCost = function (start, end, prevCost) {
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), u = this.neighbours[start], qu = new QueueEntry(u, null, 0), visitedFrom = {};
        q.push(qu);
        while (!q.empty()) {
            qu = q.pop();
            u = qu.node;
            if (u.id === end) {
                break;
            }
            var i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i], v = this.neighbours[neighbour.id];
                if (qu.prev && v.id === qu.prev.node.id)
                    continue;
                var viduid = v.id + ',' + u.id;
                if (viduid in visitedFrom && visitedFrom[viduid] <= qu.d)
                    continue;
                var cc = qu.prev ? prevCost(qu.prev.node.id, u.id, v.id) : 0, t = qu.d + neighbour.distance + cc;
                visitedFrom[viduid] = t;
                q.push(new QueueEntry(v, qu, t));
            }
        }
        var path = [];
        while (qu.prev) {
            qu = qu.prev;
            path.push(qu.node.id);
        }
        return path;
    };
    Calculator.prototype.dijkstraNeighbours = function (start, dest) {
        if (dest === void 0) { dest = -1; }
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), i = this.neighbours.length, d = new Array(i);
        while (i--) {
            var node = this.neighbours[i];
            node.d = i === start ? 0 : Number.POSITIVE_INFINITY;
            node.q = q.push(node);
        }
        while (!q.empty()) {
            var u = q.pop();
            d[u.id] = u.d;
            if (u.id === dest) {
                var path = [];
                var v = u;
                while (typeof v.prev !== 'undefined') {
                    path.push(v.prev.id);
                    v = v.prev;
                }
                return path;
            }
            i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i];
                var v = this.neighbours[neighbour.id];
                var t = u.d + neighbour.distance;
                if (u.d !== Number.MAX_VALUE && v.d > t) {
                    v.d = t;
                    v.prev = u;
                    q.reduceKey(v.q, v, function (e, q) { return e.q = q; });
                }
            }
        }
        return d;
    };
    return Calculator;
}());
exports.Calculator = Calculator;

},{"./pqueue":15}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PositionStats = (function () {
    function PositionStats(scale) {
        this.scale = scale;
        this.AB = 0;
        this.AD = 0;
        this.A2 = 0;
    }
    PositionStats.prototype.addVariable = function (v) {
        var ai = this.scale / v.scale;
        var bi = v.offset / v.scale;
        var wi = v.weight;
        this.AB += wi * ai * bi;
        this.AD += wi * ai * v.desiredPosition;
        this.A2 += wi * ai * ai;
    };
    PositionStats.prototype.getPosn = function () {
        return (this.AD - this.AB) / this.A2;
    };
    return PositionStats;
}());
exports.PositionStats = PositionStats;
var Constraint = (function () {
    function Constraint(left, right, gap, equality) {
        if (equality === void 0) { equality = false; }
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
        this.active = false;
        this.unsatisfiable = false;
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
    }
    Constraint.prototype.slack = function () {
        return this.unsatisfiable ? Number.MAX_VALUE
            : this.right.scale * this.right.position() - this.gap
                - this.left.scale * this.left.position();
    };
    return Constraint;
}());
exports.Constraint = Constraint;
var Variable = (function () {
    function Variable(desiredPosition, weight, scale) {
        if (weight === void 0) { weight = 1; }
        if (scale === void 0) { scale = 1; }
        this.desiredPosition = desiredPosition;
        this.weight = weight;
        this.scale = scale;
        this.offset = 0;
    }
    Variable.prototype.dfdv = function () {
        return 2.0 * this.weight * (this.position() - this.desiredPosition);
    };
    Variable.prototype.position = function () {
        return (this.block.ps.scale * this.block.posn + this.offset) / this.scale;
    };
    Variable.prototype.visitNeighbours = function (prev, f) {
        var ff = function (c, next) { return c.active && prev !== next && f(c, next); };
        this.cOut.forEach(function (c) { return ff(c, c.right); });
        this.cIn.forEach(function (c) { return ff(c, c.left); });
    };
    return Variable;
}());
exports.Variable = Variable;
var Block = (function () {
    function Block(v) {
        this.vars = [];
        v.offset = 0;
        this.ps = new PositionStats(v.scale);
        this.addVariable(v);
    }
    Block.prototype.addVariable = function (v) {
        v.block = this;
        this.vars.push(v);
        this.ps.addVariable(v);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.updateWeightedPosition = function () {
        this.ps.AB = this.ps.AD = this.ps.A2 = 0;
        for (var i = 0, n = this.vars.length; i < n; ++i)
            this.ps.addVariable(this.vars[i]);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.compute_lm = function (v, u, postAction) {
        var _this = this;
        var dfdv = v.dfdv();
        v.visitNeighbours(u, function (c, next) {
            var _dfdv = _this.compute_lm(next, v, postAction);
            if (next === c.right) {
                dfdv += _dfdv * c.left.scale;
                c.lm = _dfdv;
            }
            else {
                dfdv += _dfdv * c.right.scale;
                c.lm = -_dfdv;
            }
            postAction(c);
        });
        return dfdv / v.scale;
    };
    Block.prototype.populateSplitBlock = function (v, prev) {
        var _this = this;
        v.visitNeighbours(prev, function (c, next) {
            next.offset = v.offset + (next === c.right ? c.gap : -c.gap);
            _this.addVariable(next);
            _this.populateSplitBlock(next, v);
        });
    };
    Block.prototype.traverse = function (visit, acc, v, prev) {
        var _this = this;
        if (v === void 0) { v = this.vars[0]; }
        if (prev === void 0) { prev = null; }
        v.visitNeighbours(prev, function (c, next) {
            acc.push(visit(c));
            _this.traverse(visit, acc, next, v);
        });
    };
    Block.prototype.findMinLM = function () {
        var m = null;
        this.compute_lm(this.vars[0], null, function (c) {
            if (!c.equality && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findMinLMBetween = function (lv, rv) {
        this.compute_lm(lv, null, function () { });
        var m = null;
        this.findPath(lv, null, rv, function (c, next) {
            if (!c.equality && c.right === next && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findPath = function (v, prev, to, visit) {
        var _this = this;
        var endFound = false;
        v.visitNeighbours(prev, function (c, next) {
            if (!endFound && (next === to || _this.findPath(next, v, to, visit))) {
                endFound = true;
                visit(c, next);
            }
        });
        return endFound;
    };
    Block.prototype.isActiveDirectedPathBetween = function (u, v) {
        if (u === v)
            return true;
        var i = u.cOut.length;
        while (i--) {
            var c = u.cOut[i];
            if (c.active && this.isActiveDirectedPathBetween(c.right, v))
                return true;
        }
        return false;
    };
    Block.split = function (c) {
        c.active = false;
        return [Block.createSplitBlock(c.left), Block.createSplitBlock(c.right)];
    };
    Block.createSplitBlock = function (startVar) {
        var b = new Block(startVar);
        b.populateSplitBlock(startVar, null);
        return b;
    };
    Block.prototype.splitBetween = function (vl, vr) {
        var c = this.findMinLMBetween(vl, vr);
        if (c !== null) {
            var bs = Block.split(c);
            return { constraint: c, lb: bs[0], rb: bs[1] };
        }
        return null;
    };
    Block.prototype.mergeAcross = function (b, c, dist) {
        c.active = true;
        for (var i = 0, n = b.vars.length; i < n; ++i) {
            var v = b.vars[i];
            v.offset += dist;
            this.addVariable(v);
        }
        this.posn = this.ps.getPosn();
    };
    Block.prototype.cost = function () {
        var sum = 0, i = this.vars.length;
        while (i--) {
            var v = this.vars[i], d = v.position() - v.desiredPosition;
            sum += d * d * v.weight;
        }
        return sum;
    };
    return Block;
}());
exports.Block = Block;
var Blocks = (function () {
    function Blocks(vs) {
        this.vs = vs;
        var n = vs.length;
        this.list = new Array(n);
        while (n--) {
            var b = new Block(vs[n]);
            this.list[n] = b;
            b.blockInd = n;
        }
    }
    Blocks.prototype.cost = function () {
        var sum = 0, i = this.list.length;
        while (i--)
            sum += this.list[i].cost();
        return sum;
    };
    Blocks.prototype.insert = function (b) {
        b.blockInd = this.list.length;
        this.list.push(b);
    };
    Blocks.prototype.remove = function (b) {
        var last = this.list.length - 1;
        var swapBlock = this.list[last];
        this.list.length = last;
        if (b !== swapBlock) {
            this.list[b.blockInd] = swapBlock;
            swapBlock.blockInd = b.blockInd;
        }
    };
    Blocks.prototype.merge = function (c) {
        var l = c.left.block, r = c.right.block;
        var dist = c.right.offset - c.left.offset - c.gap;
        if (l.vars.length < r.vars.length) {
            r.mergeAcross(l, c, dist);
            this.remove(l);
        }
        else {
            l.mergeAcross(r, c, -dist);
            this.remove(r);
        }
    };
    Blocks.prototype.forEach = function (f) {
        this.list.forEach(f);
    };
    Blocks.prototype.updateBlockPositions = function () {
        this.list.forEach(function (b) { return b.updateWeightedPosition(); });
    };
    Blocks.prototype.split = function (inactive) {
        var _this = this;
        this.updateBlockPositions();
        this.list.forEach(function (b) {
            var v = b.findMinLM();
            if (v !== null && v.lm < Solver.LAGRANGIAN_TOLERANCE) {
                b = v.left.block;
                Block.split(v).forEach(function (nb) { return _this.insert(nb); });
                _this.remove(b);
                inactive.push(v);
            }
        });
    };
    return Blocks;
}());
exports.Blocks = Blocks;
var Solver = (function () {
    function Solver(vs, cs) {
        this.vs = vs;
        this.cs = cs;
        this.vs = vs;
        vs.forEach(function (v) {
            v.cIn = [], v.cOut = [];
        });
        this.cs = cs;
        cs.forEach(function (c) {
            c.left.cOut.push(c);
            c.right.cIn.push(c);
        });
        this.inactive = cs.map(function (c) { c.active = false; return c; });
        this.bs = null;
    }
    Solver.prototype.cost = function () {
        return this.bs.cost();
    };
    Solver.prototype.setStartingPositions = function (ps) {
        this.inactive = this.cs.map(function (c) { c.active = false; return c; });
        this.bs = new Blocks(this.vs);
        this.bs.forEach(function (b, i) { return b.posn = ps[i]; });
    };
    Solver.prototype.setDesiredPositions = function (ps) {
        this.vs.forEach(function (v, i) { return v.desiredPosition = ps[i]; });
    };
    Solver.prototype.mostViolated = function () {
        var minSlack = Number.MAX_VALUE, v = null, l = this.inactive, n = l.length, deletePoint = n;
        for (var i = 0; i < n; ++i) {
            var c = l[i];
            if (c.unsatisfiable)
                continue;
            var slack = c.slack();
            if (c.equality || slack < minSlack) {
                minSlack = slack;
                v = c;
                deletePoint = i;
                if (c.equality)
                    break;
            }
        }
        if (deletePoint !== n &&
            (minSlack < Solver.ZERO_UPPERBOUND && !v.active || v.equality)) {
            l[deletePoint] = l[n - 1];
            l.length = n - 1;
        }
        return v;
    };
    Solver.prototype.satisfy = function () {
        if (this.bs == null) {
            this.bs = new Blocks(this.vs);
        }
        this.bs.split(this.inactive);
        var v = null;
        while ((v = this.mostViolated()) && (v.equality || v.slack() < Solver.ZERO_UPPERBOUND && !v.active)) {
            var lb = v.left.block, rb = v.right.block;
            if (lb !== rb) {
                this.bs.merge(v);
            }
            else {
                if (lb.isActiveDirectedPathBetween(v.right, v.left)) {
                    v.unsatisfiable = true;
                    continue;
                }
                var split = lb.splitBetween(v.left, v.right);
                if (split !== null) {
                    this.bs.insert(split.lb);
                    this.bs.insert(split.rb);
                    this.bs.remove(lb);
                    this.inactive.push(split.constraint);
                }
                else {
                    v.unsatisfiable = true;
                    continue;
                }
                if (v.slack() >= 0) {
                    this.inactive.push(v);
                }
                else {
                    this.bs.merge(v);
                }
            }
        }
    };
    Solver.prototype.solve = function () {
        this.satisfy();
        var lastcost = Number.MAX_VALUE, cost = this.bs.cost();
        while (Math.abs(lastcost - cost) > 0.0001) {
            this.satisfy();
            lastcost = cost;
            cost = this.bs.cost();
        }
        return cost;
    };
    Solver.LAGRANGIAN_TOLERANCE = -1e-4;
    Solver.ZERO_UPPERBOUND = -1e-10;
    return Solver;
}());
exports.Solver = Solver;
function removeOverlapInOneDimension(spans, lowerBound, upperBound) {
    var vs = spans.map(function (s) { return new Variable(s.desiredCenter); });
    var cs = [];
    var n = spans.length;
    for (var i = 0; i < n - 1; i++) {
        var left = spans[i], right = spans[i + 1];
        cs.push(new Constraint(vs[i], vs[i + 1], (left.size + right.size) / 2));
    }
    var leftMost = vs[0], rightMost = vs[n - 1], leftMostSize = spans[0].size / 2, rightMostSize = spans[n - 1].size / 2;
    var vLower = null, vUpper = null;
    if (lowerBound) {
        vLower = new Variable(lowerBound, leftMost.weight * 1000);
        vs.push(vLower);
        cs.push(new Constraint(vLower, leftMost, leftMostSize));
    }
    if (upperBound) {
        vUpper = new Variable(upperBound, rightMost.weight * 1000);
        vs.push(vUpper);
        cs.push(new Constraint(rightMost, vUpper, rightMostSize));
    }
    var solver = new Solver(vs, cs);
    solver.solve();
    return {
        newCenters: vs.slice(0, spans.length).map(function (v) { return v.position(); }),
        lowerBound: vLower ? vLower.position() : leftMost.position() - leftMostSize,
        upperBound: vUpper ? vUpper.position() : rightMost.position() + rightMostSize
    };
}
exports.removeOverlapInOneDimension = removeOverlapInOneDimension;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2luZGV4LmpzIiwiZGlzdC9zcmMvYWRhcHRvci5qcyIsImRpc3Qvc3JjL2JhdGNoLmpzIiwiZGlzdC9zcmMvZDNhZGFwdG9yLmpzIiwiZGlzdC9zcmMvZDN2M2FkYXB0b3IuanMiLCJkaXN0L3NyYy9kM3Y0YWRhcHRvci5qcyIsImRpc3Qvc3JjL2Rlc2NlbnQuanMiLCJkaXN0L3NyYy9nZW9tLmpzIiwiZGlzdC9zcmMvZ3JpZHJvdXRlci5qcyIsImRpc3Qvc3JjL2hhbmRsZWRpc2Nvbm5lY3RlZC5qcyIsImRpc3Qvc3JjL2xheW91dC5qcyIsImRpc3Qvc3JjL2xheW91dDNkLmpzIiwiZGlzdC9zcmMvbGlua2xlbmd0aHMuanMiLCJkaXN0L3NyYy9wb3dlcmdyYXBoLmpzIiwiZGlzdC9zcmMvcHF1ZXVlLmpzIiwiZGlzdC9zcmMvcmJ0cmVlLmpzIiwiZGlzdC9zcmMvcmVjdGFuZ2xlLmpzIiwiZGlzdC9zcmMvc2hvcnRlc3RwYXRocy5qcyIsImRpc3Qvc3JjL3Zwc2MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBfX2V4cG9ydChtKSB7XG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAoIWV4cG9ydHMuaGFzT3duUHJvcGVydHkocCkpIGV4cG9ydHNbcF0gPSBtW3BdO1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2FkYXB0b3JcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2QzYWRhcHRvclwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZGVzY2VudFwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZ2VvbVwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZ3JpZHJvdXRlclwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvaGFuZGxlZGlzY29ubmVjdGVkXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9sYXlvdXRcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2xheW91dDNkXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9saW5rbGVuZ3Roc1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvcG93ZXJncmFwaFwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvcHF1ZXVlXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9yYnRyZWVcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL3JlY3RhbmdsZVwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvc2hvcnRlc3RwYXRoc1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvdnBzY1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvYmF0Y2hcIikpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsYXlvdXRfMSA9IHJlcXVpcmUoXCIuL2xheW91dFwiKTtcbnZhciBMYXlvdXRBZGFwdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoTGF5b3V0QWRhcHRvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBMYXlvdXRBZGFwdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgdmFyIHNlbGYgPSBfdGhpcztcbiAgICAgICAgdmFyIG8gPSBvcHRpb25zO1xuICAgICAgICBpZiAoby50cmlnZ2VyKSB7XG4gICAgICAgICAgICBfdGhpcy50cmlnZ2VyID0gby50cmlnZ2VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvLmtpY2spIHtcbiAgICAgICAgICAgIF90aGlzLmtpY2sgPSBvLmtpY2s7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG8uZHJhZykge1xuICAgICAgICAgICAgX3RoaXMuZHJhZyA9IG8uZHJhZztcbiAgICAgICAgfVxuICAgICAgICBpZiAoby5vbikge1xuICAgICAgICAgICAgX3RoaXMub24gPSBvLm9uO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmRyYWdzdGFydCA9IF90aGlzLmRyYWdTdGFydCA9IGxheW91dF8xLkxheW91dC5kcmFnU3RhcnQ7XG4gICAgICAgIF90aGlzLmRyYWdlbmQgPSBfdGhpcy5kcmFnRW5kID0gbGF5b3V0XzEuTGF5b3V0LmRyYWdFbmQ7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgTGF5b3V0QWRhcHRvci5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLmtpY2sgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLmRyYWcgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHsgcmV0dXJuIHRoaXM7IH07XG4gICAgO1xuICAgIHJldHVybiBMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuTGF5b3V0QWRhcHRvciA9IExheW91dEFkYXB0b3I7XG5mdW5jdGlvbiBhZGFwdG9yKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IExheW91dEFkYXB0b3Iob3B0aW9ucyk7XG59XG5leHBvcnRzLmFkYXB0b3IgPSBhZGFwdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHRvci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsYXlvdXRfMSA9IHJlcXVpcmUoXCIuL2xheW91dFwiKTtcbnZhciBncmlkcm91dGVyXzEgPSByZXF1aXJlKFwiLi9ncmlkcm91dGVyXCIpO1xuZnVuY3Rpb24gZ3JpZGlmeShwZ0xheW91dCwgbnVkZ2VHYXAsIG1hcmdpbiwgZ3JvdXBNYXJnaW4pIHtcbiAgICBwZ0xheW91dC5jb2xhLnN0YXJ0KDAsIDAsIDAsIDEwLCBmYWxzZSk7XG4gICAgdmFyIGdyaWRyb3V0ZXIgPSByb3V0ZShwZ0xheW91dC5jb2xhLm5vZGVzKCksIHBnTGF5b3V0LmNvbGEuZ3JvdXBzKCksIG1hcmdpbiwgZ3JvdXBNYXJnaW4pO1xuICAgIHJldHVybiBncmlkcm91dGVyLnJvdXRlRWRnZXMocGdMYXlvdXQucG93ZXJHcmFwaC5wb3dlckVkZ2VzLCBudWRnZUdhcCwgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUuc291cmNlLnJvdXRlck5vZGUuaWQ7IH0sIGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldC5yb3V0ZXJOb2RlLmlkOyB9KTtcbn1cbmV4cG9ydHMuZ3JpZGlmeSA9IGdyaWRpZnk7XG5mdW5jdGlvbiByb3V0ZShub2RlcywgZ3JvdXBzLCBtYXJnaW4sIGdyb3VwTWFyZ2luKSB7XG4gICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLnJvdXRlck5vZGUgPSB7XG4gICAgICAgICAgICBuYW1lOiBkLm5hbWUsXG4gICAgICAgICAgICBib3VuZHM6IGQuYm91bmRzLmluZmxhdGUoLW1hcmdpbilcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLnJvdXRlck5vZGUgPSB7XG4gICAgICAgICAgICBib3VuZHM6IGQuYm91bmRzLmluZmxhdGUoLWdyb3VwTWFyZ2luKSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiAodHlwZW9mIGQuZ3JvdXBzICE9PSAndW5kZWZpbmVkJyA/IGQuZ3JvdXBzLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gbm9kZXMubGVuZ3RoICsgYy5pZDsgfSkgOiBbXSlcbiAgICAgICAgICAgICAgICAuY29uY2F0KHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcgPyBkLmxlYXZlcy5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuaW5kZXg7IH0pIDogW10pXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIGdyaWRSb3V0ZXJOb2RlcyA9IG5vZGVzLmNvbmNhdChncm91cHMpLm1hcChmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBkLnJvdXRlck5vZGUuaWQgPSBpO1xuICAgICAgICByZXR1cm4gZC5yb3V0ZXJOb2RlO1xuICAgIH0pO1xuICAgIHJldHVybiBuZXcgZ3JpZHJvdXRlcl8xLkdyaWRSb3V0ZXIoZ3JpZFJvdXRlck5vZGVzLCB7XG4gICAgICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5jaGlsZHJlbjsgfSxcbiAgICAgICAgZ2V0Qm91bmRzOiBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5ib3VuZHM7IH1cbiAgICB9LCBtYXJnaW4gLSBncm91cE1hcmdpbik7XG59XG5mdW5jdGlvbiBwb3dlckdyYXBoR3JpZExheW91dChncmFwaCwgc2l6ZSwgZ3JvdXBwYWRkaW5nKSB7XG4gICAgdmFyIHBvd2VyR3JhcGg7XG4gICAgZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gdi5pbmRleCA9IGk7IH0pO1xuICAgIG5ldyBsYXlvdXRfMS5MYXlvdXQoKVxuICAgICAgICAuYXZvaWRPdmVybGFwcyhmYWxzZSlcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXG4gICAgICAgIC5wb3dlckdyYXBoR3JvdXBzKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHBvd2VyR3JhcGggPSBkO1xuICAgICAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LnBhZGRpbmcgPSBncm91cHBhZGRpbmc7IH0pO1xuICAgIH0pO1xuICAgIHZhciBuID0gZ3JhcGgubm9kZXMubGVuZ3RoO1xuICAgIHZhciBlZGdlcyA9IFtdO1xuICAgIHZhciB2cyA9IGdyYXBoLm5vZGVzLnNsaWNlKDApO1xuICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHYuaW5kZXggPSBpOyB9KTtcbiAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgIHZhciBzb3VyY2VJbmQgPSBnLmluZGV4ID0gZy5pZCArIG47XG4gICAgICAgIHZzLnB1c2goZyk7XG4gICAgICAgIGlmICh0eXBlb2YgZy5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgZy5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gZWRnZXMucHVzaCh7IHNvdXJjZTogc291cmNlSW5kLCB0YXJnZXQ6IHYuaW5kZXggfSk7IH0pO1xuICAgICAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIGcuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdnKSB7IHJldHVybiBlZGdlcy5wdXNoKHsgc291cmNlOiBzb3VyY2VJbmQsIHRhcmdldDogZ2cuaWQgKyBuIH0pOyB9KTtcbiAgICB9KTtcbiAgICBwb3dlckdyYXBoLnBvd2VyRWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICBlZGdlcy5wdXNoKHsgc291cmNlOiBlLnNvdXJjZS5pbmRleCwgdGFyZ2V0OiBlLnRhcmdldC5pbmRleCB9KTtcbiAgICB9KTtcbiAgICBuZXcgbGF5b3V0XzEuTGF5b3V0KClcbiAgICAgICAgLnNpemUoc2l6ZSlcbiAgICAgICAgLm5vZGVzKHZzKVxuICAgICAgICAubGlua3MoZWRnZXMpXG4gICAgICAgIC5hdm9pZE92ZXJsYXBzKGZhbHNlKVxuICAgICAgICAubGlua0Rpc3RhbmNlKDMwKVxuICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgIC5jb252ZXJnZW5jZVRocmVzaG9sZCgxZS00KVxuICAgICAgICAuc3RhcnQoMTAwLCAwLCAwLCAwLCBmYWxzZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29sYTogbmV3IGxheW91dF8xLkxheW91dCgpXG4gICAgICAgICAgICAuY29udmVyZ2VuY2VUaHJlc2hvbGQoMWUtMylcbiAgICAgICAgICAgIC5zaXplKHNpemUpXG4gICAgICAgICAgICAuYXZvaWRPdmVybGFwcyh0cnVlKVxuICAgICAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxuICAgICAgICAgICAgLmdyb3VwQ29tcGFjdG5lc3MoMWUtNClcbiAgICAgICAgICAgIC5saW5rRGlzdGFuY2UoMzApXG4gICAgICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgICAgICAucG93ZXJHcmFwaEdyb3VwcyhmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcG93ZXJHcmFwaCA9IGQ7XG4gICAgICAgICAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdi5wYWRkaW5nID0gZ3JvdXBwYWRkaW5nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLnN0YXJ0KDUwLCAwLCAxMDAsIDAsIGZhbHNlKSxcbiAgICAgICAgcG93ZXJHcmFwaDogcG93ZXJHcmFwaFxuICAgIH07XG59XG5leHBvcnRzLnBvd2VyR3JhcGhHcmlkTGF5b3V0ID0gcG93ZXJHcmFwaEdyaWRMYXlvdXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1iYXRjaC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBkM3YzID0gcmVxdWlyZShcIi4vZDN2M2FkYXB0b3JcIik7XG52YXIgZDN2NCA9IHJlcXVpcmUoXCIuL2QzdjRhZGFwdG9yXCIpO1xuZnVuY3Rpb24gZDNhZGFwdG9yKGQzQ29udGV4dCkge1xuICAgIGlmICghZDNDb250ZXh0IHx8IGlzRDNWMyhkM0NvbnRleHQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgZDN2My5EM1N0eWxlTGF5b3V0QWRhcHRvcigpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IGQzdjQuRDNTdHlsZUxheW91dEFkYXB0b3IoZDNDb250ZXh0KTtcbn1cbmV4cG9ydHMuZDNhZGFwdG9yID0gZDNhZGFwdG9yO1xuZnVuY3Rpb24gaXNEM1YzKGQzQ29udGV4dCkge1xuICAgIHZhciB2M2V4cCA9IC9eM1xcLi87XG4gICAgcmV0dXJuIGQzQ29udGV4dC52ZXJzaW9uICYmIGQzQ29udGV4dC52ZXJzaW9uLm1hdGNoKHYzZXhwKSAhPT0gbnVsbDtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWQzYWRhcHRvci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxheW91dF8xID0gcmVxdWlyZShcIi4vbGF5b3V0XCIpO1xudmFyIEQzU3R5bGVMYXlvdXRBZGFwdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRDNTdHlsZUxheW91dEFkYXB0b3IsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRDNTdHlsZUxheW91dEFkYXB0b3IoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmV2ZW50ID0gZDMuZGlzcGF0Y2gobGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS5zdGFydF0sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUudGlja10sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUuZW5kXSk7XG4gICAgICAgIHZhciBkM2xheW91dCA9IF90aGlzO1xuICAgICAgICB2YXIgZHJhZztcbiAgICAgICAgX3RoaXMuZHJhZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghZHJhZykge1xuICAgICAgICAgICAgICAgIHZhciBkcmFnID0gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAgICAgICAgIC5vcmlnaW4obGF5b3V0XzEuTGF5b3V0LmRyYWdPcmlnaW4pXG4gICAgICAgICAgICAgICAgICAgIC5vbihcImRyYWdzdGFydC5kM2FkYXB0b3JcIiwgbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydClcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZHJhZy5kM2FkYXB0b3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0XzEuTGF5b3V0LmRyYWcoZCwgZDMuZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICBkM2xheW91dC5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAub24oXCJkcmFnZW5kLmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRyYWc7XG4gICAgICAgICAgICB0aGlzXG4gICAgICAgICAgICAgICAgLmNhbGwoZHJhZyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgZDNldmVudCA9IHsgdHlwZTogbGF5b3V0XzEuRXZlbnRUeXBlW2UudHlwZV0sIGFscGhhOiBlLmFscGhhLCBzdHJlc3M6IGUuc3RyZXNzIH07XG4gICAgICAgIHRoaXMuZXZlbnRbZDNldmVudC50eXBlXShkM2V2ZW50KTtcbiAgICB9O1xuICAgIEQzU3R5bGVMYXlvdXRBZGFwdG9yLnByb3RvdHlwZS5raWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBkMy50aW1lcihmdW5jdGlvbiAoKSB7IHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRpY2suY2FsbChfdGhpcyk7IH0pO1xuICAgIH07XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudC5vbihsYXlvdXRfMS5FdmVudFR5cGVbZXZlbnRUeXBlXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuRDNTdHlsZUxheW91dEFkYXB0b3IgPSBEM1N0eWxlTGF5b3V0QWRhcHRvcjtcbmZ1bmN0aW9uIGQzYWRhcHRvcigpIHtcbiAgICByZXR1cm4gbmV3IEQzU3R5bGVMYXlvdXRBZGFwdG9yKCk7XG59XG5leHBvcnRzLmQzYWRhcHRvciA9IGQzYWRhcHRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWQzdjNhZGFwdG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbGF5b3V0XzEgPSByZXF1aXJlKFwiLi9sYXlvdXRcIik7XG52YXIgRDNTdHlsZUxheW91dEFkYXB0b3IgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhEM1N0eWxlTGF5b3V0QWRhcHRvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBEM1N0eWxlTGF5b3V0QWRhcHRvcihkM0NvbnRleHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuZDNDb250ZXh0ID0gZDNDb250ZXh0O1xuICAgICAgICBfdGhpcy5ldmVudCA9IGQzQ29udGV4dC5kaXNwYXRjaChsYXlvdXRfMS5FdmVudFR5cGVbbGF5b3V0XzEuRXZlbnRUeXBlLnN0YXJ0XSwgbGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS50aWNrXSwgbGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS5lbmRdKTtcbiAgICAgICAgdmFyIGQzbGF5b3V0ID0gX3RoaXM7XG4gICAgICAgIHZhciBkcmFnO1xuICAgICAgICBfdGhpcy5kcmFnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFkcmFnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRyYWcgPSBkM0NvbnRleHQuZHJhZygpXG4gICAgICAgICAgICAgICAgICAgIC5zdWJqZWN0KGxheW91dF8xLkxheW91dC5kcmFnT3JpZ2luKVxuICAgICAgICAgICAgICAgICAgICAub24oXCJzdGFydC5kM2FkYXB0b3JcIiwgbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydClcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZHJhZy5kM2FkYXB0b3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0XzEuTGF5b3V0LmRyYWcoZCwgZDNDb250ZXh0LmV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZDNsYXlvdXQucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZW5kLmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRyYWc7XG4gICAgICAgICAgICBhcmd1bWVudHNbMF0uY2FsbChkcmFnKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBEM1N0eWxlTGF5b3V0QWRhcHRvci5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBkM2V2ZW50ID0geyB0eXBlOiBsYXlvdXRfMS5FdmVudFR5cGVbZS50eXBlXSwgYWxwaGE6IGUuYWxwaGEsIHN0cmVzczogZS5zdHJlc3MgfTtcbiAgICAgICAgdGhpcy5ldmVudC5jYWxsKGQzZXZlbnQudHlwZSwgZDNldmVudCk7XG4gICAgfTtcbiAgICBEM1N0eWxlTGF5b3V0QWRhcHRvci5wcm90b3R5cGUua2ljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHQgPSB0aGlzLmQzQ29udGV4dC50aW1lcihmdW5jdGlvbiAoKSB7IHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRpY2suY2FsbChfdGhpcykgJiYgdC5zdG9wKCk7IH0pO1xuICAgIH07XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudC5vbihsYXlvdXRfMS5FdmVudFR5cGVbZXZlbnRUeXBlXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuRDNTdHlsZUxheW91dEFkYXB0b3IgPSBEM1N0eWxlTGF5b3V0QWRhcHRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWQzdjRhZGFwdG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExvY2tzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2NrcygpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH1cbiAgICBMb2Nrcy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGlkLCB4KSB7XG4gICAgICAgIHRoaXMubG9ja3NbaWRdID0geDtcbiAgICB9O1xuICAgIExvY2tzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH07XG4gICAgTG9ja3MucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGwgaW4gdGhpcy5sb2NrcylcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBMb2Nrcy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmb3IgKHZhciBsIGluIHRoaXMubG9ja3MpIHtcbiAgICAgICAgICAgIGYoTnVtYmVyKGwpLCB0aGlzLmxvY2tzW2xdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIExvY2tzO1xufSgpKTtcbmV4cG9ydHMuTG9ja3MgPSBMb2NrcztcbnZhciBEZXNjZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEZXNjZW50KHgsIEQsIEcpIHtcbiAgICAgICAgaWYgKEcgPT09IHZvaWQgMCkgeyBHID0gbnVsbDsgfVxuICAgICAgICB0aGlzLkQgPSBEO1xuICAgICAgICB0aGlzLkcgPSBHO1xuICAgICAgICB0aGlzLnRocmVzaG9sZCA9IDAuMDAwMTtcbiAgICAgICAgdGhpcy5udW1HcmlkU25hcE5vZGVzID0gMDtcbiAgICAgICAgdGhpcy5zbmFwR3JpZFNpemUgPSAxMDA7XG4gICAgICAgIHRoaXMuc25hcFN0cmVuZ3RoID0gMTAwMDtcbiAgICAgICAgdGhpcy5zY2FsZVNuYXBCeU1heEggPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yYW5kb20gPSBuZXcgUHNldWRvUmFuZG9tKCk7XG4gICAgICAgIHRoaXMucHJvamVjdCA9IG51bGw7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMuayA9IHgubGVuZ3RoO1xuICAgICAgICB2YXIgbiA9IHRoaXMubiA9IHhbMF0ubGVuZ3RoO1xuICAgICAgICB0aGlzLkggPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5nID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuSGQgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5hID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuYiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmMgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5kID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuZSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmlhID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuaWIgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy54dG1wID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMubG9ja3MgPSBuZXcgTG9ja3MoKTtcbiAgICAgICAgdGhpcy5taW5EID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGkgPSBuLCBqO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlICgtLWogPiBpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBEW2ldW2pdO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCAmJiBkIDwgdGhpcy5taW5EKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluRCA9IGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1pbkQgPT09IE51bWJlci5NQVhfVkFMVUUpXG4gICAgICAgICAgICB0aGlzLm1pbkQgPSAxO1xuICAgICAgICBpID0gdGhpcy5rO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB0aGlzLmdbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLkhbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLkhbaV1bal0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLkhkW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5hW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5iW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5jW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5kW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5lW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5pYVtpXSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgICAgIHRoaXMuaWJbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLnh0bXBbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXggPSBmdW5jdGlvbiAobiwgZikge1xuICAgICAgICB2YXIgTSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIE1baV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47ICsraikge1xuICAgICAgICAgICAgICAgIE1baV1bal0gPSBmKGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUub2Zmc2V0RGlyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgbCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgIHZhciB4ID0gdVtpXSA9IHRoaXMucmFuZG9tLmdldE5leHRCZXR3ZWVuKDAuMDEsIDEpIC0gMC41O1xuICAgICAgICAgICAgbCArPSB4ICogeDtcbiAgICAgICAgfVxuICAgICAgICBsID0gTWF0aC5zcXJ0KGwpO1xuICAgICAgICByZXR1cm4gdS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggKj0gX3RoaXMubWluRCAvIGw7IH0pO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUuY29tcHV0ZURlcml2YXRpdmVzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG4gPSB0aGlzLm47XG4gICAgICAgIGlmIChuIDwgMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBkID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBkMiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgSHV1ID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBtYXhIID0gMDtcbiAgICAgICAgZm9yICh2YXIgdSA9IDA7IHUgPCBuOyArK3UpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLms7ICsraSlcbiAgICAgICAgICAgICAgICBIdXVbaV0gPSB0aGlzLmdbaV1bdV0gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgdiA9IDA7IHYgPCBuOyArK3YpIHtcbiAgICAgICAgICAgICAgICBpZiAodSA9PT0gdilcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIG1heERpc3BsYWNlcyA9IG47XG4gICAgICAgICAgICAgICAgd2hpbGUgKG1heERpc3BsYWNlcy0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZDIgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkeCA9IGRbaV0gPSB4W2ldW3VdIC0geFtpXVt2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNkMiArPSBkMltpXSA9IGR4ICogZHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNkMiA+IDFlLTkpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJkID0gdGhpcy5vZmZzZXREaXIoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuazsgKytpKVxuICAgICAgICAgICAgICAgICAgICAgICAgeFtpXVt2XSArPSByZFtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGwgPSBNYXRoLnNxcnQoc2QyKTtcbiAgICAgICAgICAgICAgICB2YXIgRCA9IHRoaXMuRFt1XVt2XTtcbiAgICAgICAgICAgICAgICB2YXIgd2VpZ2h0ID0gdGhpcy5HICE9IG51bGwgPyB0aGlzLkdbdV1bdl0gOiAxO1xuICAgICAgICAgICAgICAgIGlmICh3ZWlnaHQgPiAxICYmIGwgPiBEIHx8ICFpc0Zpbml0ZShEKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkhbaV1bdV1bdl0gPSAwO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHdlaWdodCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgd2VpZ2h0ID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIEQyID0gRCAqIEQ7XG4gICAgICAgICAgICAgICAgdmFyIGdzID0gMiAqIHdlaWdodCAqIChsIC0gRCkgLyAoRDIgKiBsKTtcbiAgICAgICAgICAgICAgICB2YXIgbDMgPSBsICogbCAqIGw7XG4gICAgICAgICAgICAgICAgdmFyIGhzID0gMiAqIC13ZWlnaHQgLyAoRDIgKiBsMyk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShncykpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nW2ldW3VdICs9IGRbaV0gKiBncztcbiAgICAgICAgICAgICAgICAgICAgSHV1W2ldIC09IHRoaXMuSFtpXVt1XVt2XSA9IGhzICogKGwzICsgRCAqIChkMltpXSAtIHNkMikgKyBsICogc2QyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgbWF4SCA9IE1hdGgubWF4KG1heEgsIHRoaXMuSFtpXVt1XVt1XSA9IEh1dVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHIgPSB0aGlzLnNuYXBHcmlkU2l6ZSAvIDI7XG4gICAgICAgIHZhciBnID0gdGhpcy5zbmFwR3JpZFNpemU7XG4gICAgICAgIHZhciB3ID0gdGhpcy5zbmFwU3RyZW5ndGg7XG4gICAgICAgIHZhciBrID0gdyAvIChyICogcik7XG4gICAgICAgIHZhciBudW1Ob2RlcyA9IHRoaXMubnVtR3JpZFNuYXBOb2RlcztcbiAgICAgICAgZm9yICh2YXIgdSA9IDA7IHUgPCBudW1Ob2RlczsgKyt1KSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGl1ID0gdGhpcy54W2ldW3VdO1xuICAgICAgICAgICAgICAgIHZhciBtID0geGl1IC8gZztcbiAgICAgICAgICAgICAgICB2YXIgZiA9IG0gJSAxO1xuICAgICAgICAgICAgICAgIHZhciBxID0gbSAtIGY7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSBNYXRoLmFicyhmKTtcbiAgICAgICAgICAgICAgICB2YXIgZHggPSAoYSA8PSAwLjUpID8geGl1IC0gcSAqIGcgOlxuICAgICAgICAgICAgICAgICAgICAoeGl1ID4gMCkgPyB4aXUgLSAocSArIDEpICogZyA6IHhpdSAtIChxIC0gMSkgKiBnO1xuICAgICAgICAgICAgICAgIGlmICgtciA8IGR4ICYmIGR4IDw9IHIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2NhbGVTbmFwQnlNYXhIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdbaV1bdV0gKz0gbWF4SCAqIGsgKiBkeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSFtpXVt1XVt1XSArPSBtYXhIICogaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ1tpXVt1XSArPSBrICogZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkhbaV1bdV1bdV0gKz0gaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMubG9ja3MuaXNFbXB0eSgpKSB7XG4gICAgICAgICAgICB0aGlzLmxvY2tzLmFwcGx5KGZ1bmN0aW9uICh1LCBwKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IF90aGlzLms7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5IW2ldW3VdW3VdICs9IG1heEg7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmdbaV1bdV0gLT0gbWF4SCAqIChwW2ldIC0geFtpXVt1XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIERlc2NlbnQuZG90UHJvZCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciB4ID0gMCwgaSA9IGEubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgeCArPSBhW2ldICogYltpXTtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfTtcbiAgICBEZXNjZW50LnJpZ2h0TXVsdGlwbHkgPSBmdW5jdGlvbiAobSwgdiwgcikge1xuICAgICAgICB2YXIgaSA9IG0ubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgcltpXSA9IERlc2NlbnQuZG90UHJvZChtW2ldLCB2KTtcbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLmNvbXB1dGVTdGVwU2l6ZSA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHZhciBudW1lcmF0b3IgPSAwLCBkZW5vbWluYXRvciA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgIG51bWVyYXRvciArPSBEZXNjZW50LmRvdFByb2QodGhpcy5nW2ldLCBkW2ldKTtcbiAgICAgICAgICAgIERlc2NlbnQucmlnaHRNdWx0aXBseSh0aGlzLkhbaV0sIGRbaV0sIHRoaXMuSGRbaV0pO1xuICAgICAgICAgICAgZGVub21pbmF0b3IgKz0gRGVzY2VudC5kb3RQcm9kKGRbaV0sIHRoaXMuSGRbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZW5vbWluYXRvciA9PT0gMCB8fCAhaXNGaW5pdGUoZGVub21pbmF0b3IpKVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiAxICogbnVtZXJhdG9yIC8gZGVub21pbmF0b3I7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5yZWR1Y2VTdHJlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY29tcHV0ZURlcml2YXRpdmVzKHRoaXMueCk7XG4gICAgICAgIHZhciBhbHBoYSA9IHRoaXMuY29tcHV0ZVN0ZXBTaXplKHRoaXMuZyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMudGFrZURlc2NlbnRTdGVwKHRoaXMueFtpXSwgdGhpcy5nW2ldLCBhbHBoYSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZVN0cmVzcygpO1xuICAgIH07XG4gICAgRGVzY2VudC5jb3B5ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgdmFyIG0gPSBhLmxlbmd0aCwgbiA9IGJbMF0ubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG07ICsraSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuOyArK2opIHtcbiAgICAgICAgICAgICAgICBiW2ldW2pdID0gYVtpXVtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUuc3RlcEFuZFByb2plY3QgPSBmdW5jdGlvbiAoeDAsIHIsIGQsIHN0ZXBTaXplKSB7XG4gICAgICAgIERlc2NlbnQuY29weSh4MCwgcik7XG4gICAgICAgIHRoaXMudGFrZURlc2NlbnRTdGVwKHJbMF0sIGRbMF0sIHN0ZXBTaXplKTtcbiAgICAgICAgaWYgKHRoaXMucHJvamVjdClcbiAgICAgICAgICAgIHRoaXMucHJvamVjdFswXSh4MFswXSwgeDBbMV0sIHJbMF0pO1xuICAgICAgICB0aGlzLnRha2VEZXNjZW50U3RlcChyWzFdLCBkWzFdLCBzdGVwU2l6ZSk7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpXG4gICAgICAgICAgICB0aGlzLnByb2plY3RbMV0oclswXSwgeDBbMV0sIHJbMV0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMjsgaSA8IHRoaXMuazsgaSsrKVxuICAgICAgICAgICAgdGhpcy50YWtlRGVzY2VudFN0ZXAocltpXSwgZFtpXSwgc3RlcFNpemUpO1xuICAgIH07XG4gICAgRGVzY2VudC5tQXBwbHkgPSBmdW5jdGlvbiAobSwgbiwgZikge1xuICAgICAgICB2YXIgaSA9IG07XG4gICAgICAgIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgICAgICAgICB2YXIgaiA9IG47XG4gICAgICAgICAgICB3aGlsZSAoai0tID4gMClcbiAgICAgICAgICAgICAgICBmKGksIGopO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5tYXRyaXhBcHBseSA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIERlc2NlbnQubUFwcGx5KHRoaXMuaywgdGhpcy5uLCBmKTtcbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLmNvbXB1dGVOZXh0UG9zaXRpb24gPSBmdW5jdGlvbiAoeDAsIHIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5jb21wdXRlRGVyaXZhdGl2ZXMoeDApO1xuICAgICAgICB2YXIgYWxwaGEgPSB0aGlzLmNvbXB1dGVTdGVwU2l6ZSh0aGlzLmcpO1xuICAgICAgICB0aGlzLnN0ZXBBbmRQcm9qZWN0KHgwLCByLCB0aGlzLmcsIGFscGhhKTtcbiAgICAgICAgaWYgKHRoaXMucHJvamVjdCkge1xuICAgICAgICAgICAgdGhpcy5tYXRyaXhBcHBseShmdW5jdGlvbiAoaSwgaikgeyByZXR1cm4gX3RoaXMuZVtpXVtqXSA9IHgwW2ldW2pdIC0gcltpXVtqXTsgfSk7XG4gICAgICAgICAgICB2YXIgYmV0YSA9IHRoaXMuY29tcHV0ZVN0ZXBTaXplKHRoaXMuZSk7XG4gICAgICAgICAgICBiZXRhID0gTWF0aC5tYXgoMC4yLCBNYXRoLm1pbihiZXRhLCAxKSk7XG4gICAgICAgICAgICB0aGlzLnN0ZXBBbmRQcm9qZWN0KHgwLCByLCB0aGlzLmUsIGJldGEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoaXRlcmF0aW9ucykge1xuICAgICAgICB2YXIgc3RyZXNzID0gTnVtYmVyLk1BWF9WQUxVRSwgY29udmVyZ2VkID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghY29udmVyZ2VkICYmIGl0ZXJhdGlvbnMtLSA+IDApIHtcbiAgICAgICAgICAgIHZhciBzID0gdGhpcy5ydW5nZUt1dHRhKCk7XG4gICAgICAgICAgICBjb252ZXJnZWQgPSBNYXRoLmFicyhzdHJlc3MgLyBzIC0gMSkgPCB0aGlzLnRocmVzaG9sZDtcbiAgICAgICAgICAgIHN0cmVzcyA9IHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cmVzcztcbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLnJ1bmdlS3V0dGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLngsIHRoaXMuYSk7XG4gICAgICAgIERlc2NlbnQubWlkKHRoaXMueCwgdGhpcy5hLCB0aGlzLmlhKTtcbiAgICAgICAgdGhpcy5jb21wdXRlTmV4dFBvc2l0aW9uKHRoaXMuaWEsIHRoaXMuYik7XG4gICAgICAgIERlc2NlbnQubWlkKHRoaXMueCwgdGhpcy5iLCB0aGlzLmliKTtcbiAgICAgICAgdGhpcy5jb21wdXRlTmV4dFBvc2l0aW9uKHRoaXMuaWIsIHRoaXMuYyk7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLmMsIHRoaXMuZCk7XG4gICAgICAgIHZhciBkaXNwID0gMDtcbiAgICAgICAgdGhpcy5tYXRyaXhBcHBseShmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgdmFyIHggPSAoX3RoaXMuYVtpXVtqXSArIDIuMCAqIF90aGlzLmJbaV1bal0gKyAyLjAgKiBfdGhpcy5jW2ldW2pdICsgX3RoaXMuZFtpXVtqXSkgLyA2LjAsIGQgPSBfdGhpcy54W2ldW2pdIC0geDtcbiAgICAgICAgICAgIGRpc3AgKz0gZCAqIGQ7XG4gICAgICAgICAgICBfdGhpcy54W2ldW2pdID0geDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkaXNwO1xuICAgIH07XG4gICAgRGVzY2VudC5taWQgPSBmdW5jdGlvbiAoYSwgYiwgbSkge1xuICAgICAgICBEZXNjZW50Lm1BcHBseShhLmxlbmd0aCwgYVswXS5sZW5ndGgsIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgICAgICByZXR1cm4gbVtpXVtqXSA9IGFbaV1bal0gKyAoYltpXVtqXSAtIGFbaV1bal0pIC8gMi4wO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLnRha2VEZXNjZW50U3RlcCA9IGZ1bmN0aW9uICh4LCBkLCBzdGVwU2l6ZSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICB4W2ldID0geFtpXSAtIHN0ZXBTaXplICogZFtpXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUuY29tcHV0ZVN0cmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0cmVzcyA9IDA7XG4gICAgICAgIGZvciAodmFyIHUgPSAwLCBuTWludXMxID0gdGhpcy5uIC0gMTsgdSA8IG5NaW51czE7ICsrdSkge1xuICAgICAgICAgICAgZm9yICh2YXIgdiA9IHUgKyAxLCBuID0gdGhpcy5uOyB2IDwgbjsgKyt2KSB7XG4gICAgICAgICAgICAgICAgdmFyIGwgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGR4ID0gdGhpcy54W2ldW3VdIC0gdGhpcy54W2ldW3ZdO1xuICAgICAgICAgICAgICAgICAgICBsICs9IGR4ICogZHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGwgPSBNYXRoLnNxcnQobCk7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSB0aGlzLkRbdV1bdl07XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShkKSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIHJsID0gZCAtIGw7XG4gICAgICAgICAgICAgICAgdmFyIGQyID0gZCAqIGQ7XG4gICAgICAgICAgICAgICAgc3RyZXNzICs9IHJsICogcmwgLyBkMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RyZXNzO1xuICAgIH07XG4gICAgRGVzY2VudC56ZXJvRGlzdGFuY2UgPSAxZS0xMDtcbiAgICByZXR1cm4gRGVzY2VudDtcbn0oKSk7XG5leHBvcnRzLkRlc2NlbnQgPSBEZXNjZW50O1xudmFyIFBzZXVkb1JhbmRvbSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHNldWRvUmFuZG9tKHNlZWQpIHtcbiAgICAgICAgaWYgKHNlZWQgPT09IHZvaWQgMCkgeyBzZWVkID0gMTsgfVxuICAgICAgICB0aGlzLnNlZWQgPSBzZWVkO1xuICAgICAgICB0aGlzLmEgPSAyMTQwMTM7XG4gICAgICAgIHRoaXMuYyA9IDI1MzEwMTE7XG4gICAgICAgIHRoaXMubSA9IDIxNDc0ODM2NDg7XG4gICAgICAgIHRoaXMucmFuZ2UgPSAzMjc2NztcbiAgICB9XG4gICAgUHNldWRvUmFuZG9tLnByb3RvdHlwZS5nZXROZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNlZWQgPSAodGhpcy5zZWVkICogdGhpcy5hICsgdGhpcy5jKSAlIHRoaXMubTtcbiAgICAgICAgcmV0dXJuICh0aGlzLnNlZWQgPj4gMTYpIC8gdGhpcy5yYW5nZTtcbiAgICB9O1xuICAgIFBzZXVkb1JhbmRvbS5wcm90b3R5cGUuZ2V0TmV4dEJldHdlZW4gPSBmdW5jdGlvbiAobWluLCBtYXgpIHtcbiAgICAgICAgcmV0dXJuIG1pbiArIHRoaXMuZ2V0TmV4dCgpICogKG1heCAtIG1pbik7XG4gICAgfTtcbiAgICByZXR1cm4gUHNldWRvUmFuZG9tO1xufSgpKTtcbmV4cG9ydHMuUHNldWRvUmFuZG9tID0gUHNldWRvUmFuZG9tO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGVzY2VudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHJlY3RhbmdsZV8xID0gcmVxdWlyZShcIi4vcmVjdGFuZ2xlXCIpO1xudmFyIFBvaW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQb2ludCgpIHtcbiAgICB9XG4gICAgcmV0dXJuIFBvaW50O1xufSgpKTtcbmV4cG9ydHMuUG9pbnQgPSBQb2ludDtcbnZhciBMaW5lU2VnbWVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGluZVNlZ21lbnQoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgdGhpcy54MSA9IHgxO1xuICAgICAgICB0aGlzLnkxID0geTE7XG4gICAgICAgIHRoaXMueDIgPSB4MjtcbiAgICAgICAgdGhpcy55MiA9IHkyO1xuICAgIH1cbiAgICByZXR1cm4gTGluZVNlZ21lbnQ7XG59KCkpO1xuZXhwb3J0cy5MaW5lU2VnbWVudCA9IExpbmVTZWdtZW50O1xudmFyIFBvbHlQb2ludCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFBvbHlQb2ludCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBQb2x5UG9pbnQoKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIgIT09IG51bGwgJiYgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIFBvbHlQb2ludDtcbn0oUG9pbnQpKTtcbmV4cG9ydHMuUG9seVBvaW50ID0gUG9seVBvaW50O1xuZnVuY3Rpb24gaXNMZWZ0KFAwLCBQMSwgUDIpIHtcbiAgICByZXR1cm4gKFAxLnggLSBQMC54KSAqIChQMi55IC0gUDAueSkgLSAoUDIueCAtIFAwLngpICogKFAxLnkgLSBQMC55KTtcbn1cbmV4cG9ydHMuaXNMZWZ0ID0gaXNMZWZ0O1xuZnVuY3Rpb24gYWJvdmUocCwgdmksIHZqKSB7XG4gICAgcmV0dXJuIGlzTGVmdChwLCB2aSwgdmopID4gMDtcbn1cbmZ1bmN0aW9uIGJlbG93KHAsIHZpLCB2aikge1xuICAgIHJldHVybiBpc0xlZnQocCwgdmksIHZqKSA8IDA7XG59XG5mdW5jdGlvbiBDb252ZXhIdWxsKFMpIHtcbiAgICB2YXIgUCA9IFMuc2xpY2UoMCkuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS54ICE9PSBiLnggPyBiLnggLSBhLnggOiBiLnkgLSBhLnk7IH0pO1xuICAgIHZhciBuID0gUy5sZW5ndGgsIGk7XG4gICAgdmFyIG1pbm1pbiA9IDA7XG4gICAgdmFyIHhtaW4gPSBQWzBdLng7XG4gICAgZm9yIChpID0gMTsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoUFtpXS54ICE9PSB4bWluKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHZhciBtaW5tYXggPSBpIC0gMTtcbiAgICB2YXIgSCA9IFtdO1xuICAgIEgucHVzaChQW21pbm1pbl0pO1xuICAgIGlmIChtaW5tYXggPT09IG4gLSAxKSB7XG4gICAgICAgIGlmIChQW21pbm1heF0ueSAhPT0gUFttaW5taW5dLnkpXG4gICAgICAgICAgICBILnB1c2goUFttaW5tYXhdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciBtYXhtaW4sIG1heG1heCA9IG4gLSAxO1xuICAgICAgICB2YXIgeG1heCA9IFBbbiAtIDFdLng7XG4gICAgICAgIGZvciAoaSA9IG4gLSAyOyBpID49IDA7IGktLSlcbiAgICAgICAgICAgIGlmIChQW2ldLnggIT09IHhtYXgpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIG1heG1pbiA9IGkgKyAxO1xuICAgICAgICBpID0gbWlubWF4O1xuICAgICAgICB3aGlsZSAoKytpIDw9IG1heG1pbikge1xuICAgICAgICAgICAgaWYgKGlzTGVmdChQW21pbm1pbl0sIFBbbWF4bWluXSwgUFtpXSkgPj0gMCAmJiBpIDwgbWF4bWluKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgd2hpbGUgKEgubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGlmIChpc0xlZnQoSFtILmxlbmd0aCAtIDJdLCBIW0gubGVuZ3RoIC0gMV0sIFBbaV0pID4gMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBILmxlbmd0aCAtPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgIT0gbWlubWluKVxuICAgICAgICAgICAgICAgIEgucHVzaChQW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWF4bWF4ICE9IG1heG1pbilcbiAgICAgICAgICAgIEgucHVzaChQW21heG1heF0pO1xuICAgICAgICB2YXIgYm90ID0gSC5sZW5ndGg7XG4gICAgICAgIGkgPSBtYXhtaW47XG4gICAgICAgIHdoaWxlICgtLWkgPj0gbWlubWF4KSB7XG4gICAgICAgICAgICBpZiAoaXNMZWZ0KFBbbWF4bWF4XSwgUFttaW5tYXhdLCBQW2ldKSA+PSAwICYmIGkgPiBtaW5tYXgpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB3aGlsZSAoSC5sZW5ndGggPiBib3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNMZWZ0KEhbSC5sZW5ndGggLSAyXSwgSFtILmxlbmd0aCAtIDFdLCBQW2ldKSA+IDApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgSC5sZW5ndGggLT0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpICE9IG1pbm1pbilcbiAgICAgICAgICAgICAgICBILnB1c2goUFtpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEg7XG59XG5leHBvcnRzLkNvbnZleEh1bGwgPSBDb252ZXhIdWxsO1xuZnVuY3Rpb24gY2xvY2t3aXNlUmFkaWFsU3dlZXAocCwgUCwgZikge1xuICAgIFAuc2xpY2UoMCkuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gTWF0aC5hdGFuMihhLnkgLSBwLnksIGEueCAtIHAueCkgLSBNYXRoLmF0YW4yKGIueSAtIHAueSwgYi54IC0gcC54KTsgfSkuZm9yRWFjaChmKTtcbn1cbmV4cG9ydHMuY2xvY2t3aXNlUmFkaWFsU3dlZXAgPSBjbG9ja3dpc2VSYWRpYWxTd2VlcDtcbmZ1bmN0aW9uIG5leHRQb2x5UG9pbnQocCwgcHMpIHtcbiAgICBpZiAocC5wb2x5SW5kZXggPT09IHBzLmxlbmd0aCAtIDEpXG4gICAgICAgIHJldHVybiBwc1swXTtcbiAgICByZXR1cm4gcHNbcC5wb2x5SW5kZXggKyAxXTtcbn1cbmZ1bmN0aW9uIHByZXZQb2x5UG9pbnQocCwgcHMpIHtcbiAgICBpZiAocC5wb2x5SW5kZXggPT09IDApXG4gICAgICAgIHJldHVybiBwc1twcy5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4gcHNbcC5wb2x5SW5kZXggLSAxXTtcbn1cbmZ1bmN0aW9uIHRhbmdlbnRfUG9pbnRQb2x5QyhQLCBWKSB7XG4gICAgcmV0dXJuIHsgcnRhbjogUnRhbmdlbnRfUG9pbnRQb2x5QyhQLCBWKSwgbHRhbjogTHRhbmdlbnRfUG9pbnRQb2x5QyhQLCBWKSB9O1xufVxuZnVuY3Rpb24gUnRhbmdlbnRfUG9pbnRQb2x5QyhQLCBWKSB7XG4gICAgdmFyIG4gPSBWLmxlbmd0aCAtIDE7XG4gICAgdmFyIGEsIGIsIGM7XG4gICAgdmFyIHVwQSwgZG5DO1xuICAgIGlmIChiZWxvdyhQLCBWWzFdLCBWWzBdKSAmJiAhYWJvdmUoUCwgVltuIC0gMV0sIFZbMF0pKVxuICAgICAgICByZXR1cm4gMDtcbiAgICBmb3IgKGEgPSAwLCBiID0gbjs7KSB7XG4gICAgICAgIGlmIChiIC0gYSA9PT0gMSlcbiAgICAgICAgICAgIGlmIChhYm92ZShQLCBWW2FdLCBWW2JdKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gYjtcbiAgICAgICAgYyA9IE1hdGguZmxvb3IoKGEgKyBiKSAvIDIpO1xuICAgICAgICBkbkMgPSBiZWxvdyhQLCBWW2MgKyAxXSwgVltjXSk7XG4gICAgICAgIGlmIChkbkMgJiYgIWFib3ZlKFAsIFZbYyAtIDFdLCBWW2NdKSlcbiAgICAgICAgICAgIHJldHVybiBjO1xuICAgICAgICB1cEEgPSBhYm92ZShQLCBWW2EgKyAxXSwgVlthXSk7XG4gICAgICAgIGlmICh1cEEpIHtcbiAgICAgICAgICAgIGlmIChkbkMpXG4gICAgICAgICAgICAgICAgYiA9IGM7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYWJvdmUoUCwgVlthXSwgVltjXSkpXG4gICAgICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWRuQylcbiAgICAgICAgICAgICAgICBhID0gYztcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChiZWxvdyhQLCBWW2FdLCBWW2NdKSlcbiAgICAgICAgICAgICAgICAgICAgYiA9IGM7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBhID0gYztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIEx0YW5nZW50X1BvaW50UG9seUMoUCwgVikge1xuICAgIHZhciBuID0gVi5sZW5ndGggLSAxO1xuICAgIHZhciBhLCBiLCBjO1xuICAgIHZhciBkbkEsIGRuQztcbiAgICBpZiAoYWJvdmUoUCwgVltuIC0gMV0sIFZbMF0pICYmICFiZWxvdyhQLCBWWzFdLCBWWzBdKSlcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgZm9yIChhID0gMCwgYiA9IG47Oykge1xuICAgICAgICBpZiAoYiAtIGEgPT09IDEpXG4gICAgICAgICAgICBpZiAoYmVsb3coUCwgVlthXSwgVltiXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGI7XG4gICAgICAgIGMgPSBNYXRoLmZsb29yKChhICsgYikgLyAyKTtcbiAgICAgICAgZG5DID0gYmVsb3coUCwgVltjICsgMV0sIFZbY10pO1xuICAgICAgICBpZiAoYWJvdmUoUCwgVltjIC0gMV0sIFZbY10pICYmICFkbkMpXG4gICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgZG5BID0gYmVsb3coUCwgVlthICsgMV0sIFZbYV0pO1xuICAgICAgICBpZiAoZG5BKSB7XG4gICAgICAgICAgICBpZiAoIWRuQylcbiAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChiZWxvdyhQLCBWW2FdLCBWW2NdKSlcbiAgICAgICAgICAgICAgICAgICAgYiA9IGM7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBhID0gYztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChkbkMpXG4gICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYWJvdmUoUCwgVlthXSwgVltjXSkpXG4gICAgICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiB0YW5nZW50X1BvbHlQb2x5QyhWLCBXLCB0MSwgdDIsIGNtcDEsIGNtcDIpIHtcbiAgICB2YXIgaXgxLCBpeDI7XG4gICAgaXgxID0gdDEoV1swXSwgVik7XG4gICAgaXgyID0gdDIoVltpeDFdLCBXKTtcbiAgICB2YXIgZG9uZSA9IGZhbHNlO1xuICAgIHdoaWxlICghZG9uZSkge1xuICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIGlmIChpeDEgPT09IFYubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgICAgICBpeDEgPSAwO1xuICAgICAgICAgICAgaWYgKGNtcDEoV1tpeDJdLCBWW2l4MV0sIFZbaXgxICsgMV0pKVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgKytpeDE7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIGlmIChpeDIgPT09IDApXG4gICAgICAgICAgICAgICAgaXgyID0gVy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgaWYgKGNtcDIoVltpeDFdLCBXW2l4Ml0sIFdbaXgyIC0gMV0pKVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLS1peDI7XG4gICAgICAgICAgICBkb25lID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgdDE6IGl4MSwgdDI6IGl4MiB9O1xufVxuZXhwb3J0cy50YW5nZW50X1BvbHlQb2x5QyA9IHRhbmdlbnRfUG9seVBvbHlDO1xuZnVuY3Rpb24gTFJ0YW5nZW50X1BvbHlQb2x5QyhWLCBXKSB7XG4gICAgdmFyIHJsID0gUkx0YW5nZW50X1BvbHlQb2x5QyhXLCBWKTtcbiAgICByZXR1cm4geyB0MTogcmwudDIsIHQyOiBybC50MSB9O1xufVxuZXhwb3J0cy5MUnRhbmdlbnRfUG9seVBvbHlDID0gTFJ0YW5nZW50X1BvbHlQb2x5QztcbmZ1bmN0aW9uIFJMdGFuZ2VudF9Qb2x5UG9seUMoViwgVykge1xuICAgIHJldHVybiB0YW5nZW50X1BvbHlQb2x5QyhWLCBXLCBSdGFuZ2VudF9Qb2ludFBvbHlDLCBMdGFuZ2VudF9Qb2ludFBvbHlDLCBhYm92ZSwgYmVsb3cpO1xufVxuZXhwb3J0cy5STHRhbmdlbnRfUG9seVBvbHlDID0gUkx0YW5nZW50X1BvbHlQb2x5QztcbmZ1bmN0aW9uIExMdGFuZ2VudF9Qb2x5UG9seUMoViwgVykge1xuICAgIHJldHVybiB0YW5nZW50X1BvbHlQb2x5QyhWLCBXLCBMdGFuZ2VudF9Qb2ludFBvbHlDLCBMdGFuZ2VudF9Qb2ludFBvbHlDLCBiZWxvdywgYmVsb3cpO1xufVxuZXhwb3J0cy5MTHRhbmdlbnRfUG9seVBvbHlDID0gTEx0YW5nZW50X1BvbHlQb2x5QztcbmZ1bmN0aW9uIFJSdGFuZ2VudF9Qb2x5UG9seUMoViwgVykge1xuICAgIHJldHVybiB0YW5nZW50X1BvbHlQb2x5QyhWLCBXLCBSdGFuZ2VudF9Qb2ludFBvbHlDLCBSdGFuZ2VudF9Qb2ludFBvbHlDLCBhYm92ZSwgYWJvdmUpO1xufVxuZXhwb3J0cy5SUnRhbmdlbnRfUG9seVBvbHlDID0gUlJ0YW5nZW50X1BvbHlQb2x5QztcbnZhciBCaVRhbmdlbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJpVGFuZ2VudCh0MSwgdDIpIHtcbiAgICAgICAgdGhpcy50MSA9IHQxO1xuICAgICAgICB0aGlzLnQyID0gdDI7XG4gICAgfVxuICAgIHJldHVybiBCaVRhbmdlbnQ7XG59KCkpO1xuZXhwb3J0cy5CaVRhbmdlbnQgPSBCaVRhbmdlbnQ7XG52YXIgQmlUYW5nZW50cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmlUYW5nZW50cygpIHtcbiAgICB9XG4gICAgcmV0dXJuIEJpVGFuZ2VudHM7XG59KCkpO1xuZXhwb3J0cy5CaVRhbmdlbnRzID0gQmlUYW5nZW50cztcbnZhciBUVkdQb2ludCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFRWR1BvaW50LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFRWR1BvaW50KCkge1xuICAgICAgICByZXR1cm4gX3N1cGVyICE9PSBudWxsICYmIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpIHx8IHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBUVkdQb2ludDtcbn0oUG9pbnQpKTtcbmV4cG9ydHMuVFZHUG9pbnQgPSBUVkdQb2ludDtcbnZhciBWaXNpYmlsaXR5VmVydGV4ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWaXNpYmlsaXR5VmVydGV4KGlkLCBwb2x5aWQsIHBvbHl2ZXJ0aWQsIHApIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnBvbHlpZCA9IHBvbHlpZDtcbiAgICAgICAgdGhpcy5wb2x5dmVydGlkID0gcG9seXZlcnRpZDtcbiAgICAgICAgdGhpcy5wID0gcDtcbiAgICAgICAgcC52diA9IHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBWaXNpYmlsaXR5VmVydGV4O1xufSgpKTtcbmV4cG9ydHMuVmlzaWJpbGl0eVZlcnRleCA9IFZpc2liaWxpdHlWZXJ0ZXg7XG52YXIgVmlzaWJpbGl0eUVkZ2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFZpc2liaWxpdHlFZGdlKHNvdXJjZSwgdGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB9XG4gICAgVmlzaWJpbGl0eUVkZ2UucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGR4ID0gdGhpcy5zb3VyY2UucC54IC0gdGhpcy50YXJnZXQucC54O1xuICAgICAgICB2YXIgZHkgPSB0aGlzLnNvdXJjZS5wLnkgLSB0aGlzLnRhcmdldC5wLnk7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgIH07XG4gICAgcmV0dXJuIFZpc2liaWxpdHlFZGdlO1xufSgpKTtcbmV4cG9ydHMuVmlzaWJpbGl0eUVkZ2UgPSBWaXNpYmlsaXR5RWRnZTtcbnZhciBUYW5nZW50VmlzaWJpbGl0eUdyYXBoID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUYW5nZW50VmlzaWJpbGl0eUdyYXBoKFAsIGcwKSB7XG4gICAgICAgIHRoaXMuUCA9IFA7XG4gICAgICAgIHRoaXMuViA9IFtdO1xuICAgICAgICB0aGlzLkUgPSBbXTtcbiAgICAgICAgaWYgKCFnMCkge1xuICAgICAgICAgICAgdmFyIG4gPSBQLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBQW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcC5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGogPSBwW2pdLCB2diA9IG5ldyBWaXNpYmlsaXR5VmVydGV4KHRoaXMuVi5sZW5ndGgsIGksIGosIHBqKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5WLnB1c2godnYpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaiA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkUucHVzaChuZXcgVmlzaWJpbGl0eUVkZ2UocFtqIC0gMV0udnYsIHZ2KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIFBpID0gUFtpXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIFBqID0gUFtqXSwgdCA9IHRhbmdlbnRzKFBpLCBQaik7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHEgaW4gdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSB0W3FdLCBzb3VyY2UgPSBQaVtjLnQxXSwgdGFyZ2V0ID0gUGpbYy50Ml07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEVkZ2VJZlZpc2libGUoc291cmNlLCB0YXJnZXQsIGksIGopO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5WID0gZzAuVi5zbGljZSgwKTtcbiAgICAgICAgICAgIHRoaXMuRSA9IGcwLkUuc2xpY2UoMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgVGFuZ2VudFZpc2liaWxpdHlHcmFwaC5wcm90b3R5cGUuYWRkRWRnZUlmVmlzaWJsZSA9IGZ1bmN0aW9uICh1LCB2LCBpMSwgaTIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmludGVyc2VjdHNQb2x5cyhuZXcgTGluZVNlZ21lbnQodS54LCB1LnksIHYueCwgdi55KSwgaTEsIGkyKSkge1xuICAgICAgICAgICAgdGhpcy5FLnB1c2gobmV3IFZpc2liaWxpdHlFZGdlKHUudnYsIHYudnYpKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVGFuZ2VudFZpc2liaWxpdHlHcmFwaC5wcm90b3R5cGUuYWRkUG9pbnQgPSBmdW5jdGlvbiAocCwgaTEpIHtcbiAgICAgICAgdmFyIG4gPSB0aGlzLlAubGVuZ3RoO1xuICAgICAgICB0aGlzLlYucHVzaChuZXcgVmlzaWJpbGl0eVZlcnRleCh0aGlzLlYubGVuZ3RoLCBuLCAwLCBwKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaSA9PT0gaTEpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgcG9seSA9IHRoaXMuUFtpXSwgdCA9IHRhbmdlbnRfUG9pbnRQb2x5QyhwLCBwb2x5KTtcbiAgICAgICAgICAgIHRoaXMuYWRkRWRnZUlmVmlzaWJsZShwLCBwb2x5W3QubHRhbl0sIGkxLCBpKTtcbiAgICAgICAgICAgIHRoaXMuYWRkRWRnZUlmVmlzaWJsZShwLCBwb2x5W3QucnRhbl0sIGkxLCBpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcC52djtcbiAgICB9O1xuICAgIFRhbmdlbnRWaXNpYmlsaXR5R3JhcGgucHJvdG90eXBlLmludGVyc2VjdHNQb2x5cyA9IGZ1bmN0aW9uIChsLCBpMSwgaTIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSB0aGlzLlAubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaSAhPSBpMSAmJiBpICE9IGkyICYmIGludGVyc2VjdHMobCwgdGhpcy5QW2ldKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIFRhbmdlbnRWaXNpYmlsaXR5R3JhcGg7XG59KCkpO1xuZXhwb3J0cy5UYW5nZW50VmlzaWJpbGl0eUdyYXBoID0gVGFuZ2VudFZpc2liaWxpdHlHcmFwaDtcbmZ1bmN0aW9uIGludGVyc2VjdHMobCwgUCkge1xuICAgIHZhciBpbnRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDEsIG4gPSBQLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICB2YXIgaW50ID0gcmVjdGFuZ2xlXzEuUmVjdGFuZ2xlLmxpbmVJbnRlcnNlY3Rpb24obC54MSwgbC55MSwgbC54MiwgbC55MiwgUFtpIC0gMV0ueCwgUFtpIC0gMV0ueSwgUFtpXS54LCBQW2ldLnkpO1xuICAgICAgICBpZiAoaW50KVxuICAgICAgICAgICAgaW50cy5wdXNoKGludCk7XG4gICAgfVxuICAgIHJldHVybiBpbnRzO1xufVxuZnVuY3Rpb24gdGFuZ2VudHMoViwgVykge1xuICAgIHZhciBtID0gVi5sZW5ndGggLSAxLCBuID0gVy5sZW5ndGggLSAxO1xuICAgIHZhciBidCA9IG5ldyBCaVRhbmdlbnRzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtOyArK2kpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuOyArK2opIHtcbiAgICAgICAgICAgIHZhciB2MSA9IFZbaSA9PSAwID8gbSAtIDEgOiBpIC0gMV07XG4gICAgICAgICAgICB2YXIgdjIgPSBWW2ldO1xuICAgICAgICAgICAgdmFyIHYzID0gVltpICsgMV07XG4gICAgICAgICAgICB2YXIgdzEgPSBXW2ogPT0gMCA/IG4gLSAxIDogaiAtIDFdO1xuICAgICAgICAgICAgdmFyIHcyID0gV1tqXTtcbiAgICAgICAgICAgIHZhciB3MyA9IFdbaiArIDFdO1xuICAgICAgICAgICAgdmFyIHYxdjJ3MiA9IGlzTGVmdCh2MSwgdjIsIHcyKTtcbiAgICAgICAgICAgIHZhciB2MncxdzIgPSBpc0xlZnQodjIsIHcxLCB3Mik7XG4gICAgICAgICAgICB2YXIgdjJ3MnczID0gaXNMZWZ0KHYyLCB3MiwgdzMpO1xuICAgICAgICAgICAgdmFyIHcxdzJ2MiA9IGlzTGVmdCh3MSwgdzIsIHYyKTtcbiAgICAgICAgICAgIHZhciB3MnYxdjIgPSBpc0xlZnQodzIsIHYxLCB2Mik7XG4gICAgICAgICAgICB2YXIgdzJ2MnYzID0gaXNMZWZ0KHcyLCB2MiwgdjMpO1xuICAgICAgICAgICAgaWYgKHYxdjJ3MiA+PSAwICYmIHYydzF3MiA+PSAwICYmIHYydzJ3MyA8IDBcbiAgICAgICAgICAgICAgICAmJiB3MXcydjIgPj0gMCAmJiB3MnYxdjIgPj0gMCAmJiB3MnYydjMgPCAwKSB7XG4gICAgICAgICAgICAgICAgYnQubGwgPSBuZXcgQmlUYW5nZW50KGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodjF2MncyIDw9IDAgJiYgdjJ3MXcyIDw9IDAgJiYgdjJ3MnczID4gMFxuICAgICAgICAgICAgICAgICYmIHcxdzJ2MiA8PSAwICYmIHcydjF2MiA8PSAwICYmIHcydjJ2MyA+IDApIHtcbiAgICAgICAgICAgICAgICBidC5yciA9IG5ldyBCaVRhbmdlbnQoaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2MXYydzIgPD0gMCAmJiB2MncxdzIgPiAwICYmIHYydzJ3MyA8PSAwXG4gICAgICAgICAgICAgICAgJiYgdzF3MnYyID49IDAgJiYgdzJ2MXYyIDwgMCAmJiB3MnYydjMgPj0gMCkge1xuICAgICAgICAgICAgICAgIGJ0LnJsID0gbmV3IEJpVGFuZ2VudChpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHYxdjJ3MiA+PSAwICYmIHYydzF3MiA8IDAgJiYgdjJ3MnczID49IDBcbiAgICAgICAgICAgICAgICAmJiB3MXcydjIgPD0gMCAmJiB3MnYxdjIgPiAwICYmIHcydjJ2MyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgYnQubHIgPSBuZXcgQmlUYW5nZW50KGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBidDtcbn1cbmV4cG9ydHMudGFuZ2VudHMgPSB0YW5nZW50cztcbmZ1bmN0aW9uIGlzUG9pbnRJbnNpZGVQb2x5KHAsIHBvbHkpIHtcbiAgICBmb3IgKHZhciBpID0gMSwgbiA9IHBvbHkubGVuZ3RoOyBpIDwgbjsgKytpKVxuICAgICAgICBpZiAoYmVsb3cocG9seVtpIC0gMV0sIHBvbHlbaV0sIHApKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gaXNBbnlQSW5RKHAsIHEpIHtcbiAgICByZXR1cm4gIXAuZXZlcnkoZnVuY3Rpb24gKHYpIHsgcmV0dXJuICFpc1BvaW50SW5zaWRlUG9seSh2LCBxKTsgfSk7XG59XG5mdW5jdGlvbiBwb2x5c092ZXJsYXAocCwgcSkge1xuICAgIGlmIChpc0FueVBJblEocCwgcSkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGlmIChpc0FueVBJblEocSwgcCkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGZvciAodmFyIGkgPSAxLCBuID0gcC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgdmFyIHYgPSBwW2ldLCB1ID0gcFtpIC0gMV07XG4gICAgICAgIGlmIChpbnRlcnNlY3RzKG5ldyBMaW5lU2VnbWVudCh1LngsIHUueSwgdi54LCB2LnkpLCBxKS5sZW5ndGggPiAwKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmV4cG9ydHMucG9seXNPdmVybGFwID0gcG9seXNPdmVybGFwO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2VvbS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciByZWN0YW5nbGVfMSA9IHJlcXVpcmUoXCIuL3JlY3RhbmdsZVwiKTtcbnZhciB2cHNjXzEgPSByZXF1aXJlKFwiLi92cHNjXCIpO1xudmFyIHNob3J0ZXN0cGF0aHNfMSA9IHJlcXVpcmUoXCIuL3Nob3J0ZXN0cGF0aHNcIik7XG52YXIgTm9kZVdyYXBwZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5vZGVXcmFwcGVyKGlkLCByZWN0LCBjaGlsZHJlbikge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMucmVjdCA9IHJlY3Q7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICAgICAgdGhpcy5sZWFmID0gdHlwZW9mIGNoaWxkcmVuID09PSAndW5kZWZpbmVkJyB8fCBjaGlsZHJlbi5sZW5ndGggPT09IDA7XG4gICAgfVxuICAgIHJldHVybiBOb2RlV3JhcHBlcjtcbn0oKSk7XG5leHBvcnRzLk5vZGVXcmFwcGVyID0gTm9kZVdyYXBwZXI7XG52YXIgVmVydCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVmVydChpZCwgeCwgeSwgbm9kZSwgbGluZSkge1xuICAgICAgICBpZiAobm9kZSA9PT0gdm9pZCAwKSB7IG5vZGUgPSBudWxsOyB9XG4gICAgICAgIGlmIChsaW5lID09PSB2b2lkIDApIHsgbGluZSA9IG51bGw7IH1cbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLmxpbmUgPSBsaW5lO1xuICAgIH1cbiAgICByZXR1cm4gVmVydDtcbn0oKSk7XG5leHBvcnRzLlZlcnQgPSBWZXJ0O1xudmFyIExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlKHMsIHQpIHtcbiAgICAgICAgdGhpcy5zID0gcztcbiAgICAgICAgdGhpcy50ID0gdDtcbiAgICAgICAgdmFyIG1mID0gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlLmZpbmRNYXRjaChzLCB0KTtcbiAgICAgICAgdmFyIHRyID0gdC5zbGljZSgwKS5yZXZlcnNlKCk7XG4gICAgICAgIHZhciBtciA9IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZS5maW5kTWF0Y2gocywgdHIpO1xuICAgICAgICBpZiAobWYubGVuZ3RoID49IG1yLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5sZW5ndGggPSBtZi5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLnNpID0gbWYuc2k7XG4gICAgICAgICAgICB0aGlzLnRpID0gbWYudGk7XG4gICAgICAgICAgICB0aGlzLnJldmVyc2VkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxlbmd0aCA9IG1yLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMuc2kgPSBtci5zaTtcbiAgICAgICAgICAgIHRoaXMudGkgPSB0Lmxlbmd0aCAtIG1yLnRpIC0gbXIubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5yZXZlcnNlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlLmZpbmRNYXRjaCA9IGZ1bmN0aW9uIChzLCB0KSB7XG4gICAgICAgIHZhciBtID0gcy5sZW5ndGg7XG4gICAgICAgIHZhciBuID0gdC5sZW5ndGg7XG4gICAgICAgIHZhciBtYXRjaCA9IHsgbGVuZ3RoOiAwLCBzaTogLTEsIHRpOiAtMSB9O1xuICAgICAgICB2YXIgbCA9IG5ldyBBcnJheShtKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtOyBpKyspIHtcbiAgICAgICAgICAgIGxbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47IGorKylcbiAgICAgICAgICAgICAgICBpZiAoc1tpXSA9PT0gdFtqXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IGxbaV1bal0gPSAoaSA9PT0gMCB8fCBqID09PSAwKSA/IDEgOiBsW2kgLSAxXVtqIC0gMV0gKyAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAodiA+IG1hdGNoLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2gubGVuZ3RoID0gdjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoLnNpID0gaSAtIHYgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2gudGkgPSBqIC0gdiArIDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBsW2ldW2pdID0gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfTtcbiAgICBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UucHJvdG90eXBlLmdldFNlcXVlbmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPj0gMCA/IHRoaXMucy5zbGljZSh0aGlzLnNpLCB0aGlzLnNpICsgdGhpcy5sZW5ndGgpIDogW107XG4gICAgfTtcbiAgICByZXR1cm4gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlO1xufSgpKTtcbmV4cG9ydHMuTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlID0gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlO1xudmFyIEdyaWRSb3V0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEdyaWRSb3V0ZXIob3JpZ2luYWxub2RlcywgYWNjZXNzb3IsIGdyb3VwUGFkZGluZykge1xuICAgICAgICBpZiAoZ3JvdXBQYWRkaW5nID09PSB2b2lkIDApIHsgZ3JvdXBQYWRkaW5nID0gMTI7IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5vcmlnaW5hbG5vZGVzID0gb3JpZ2luYWxub2RlcztcbiAgICAgICAgdGhpcy5ncm91cFBhZGRpbmcgPSBncm91cFBhZGRpbmc7XG4gICAgICAgIHRoaXMubGVhdmVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG9yaWdpbmFsbm9kZXMubWFwKGZ1bmN0aW9uICh2LCBpKSB7IHJldHVybiBuZXcgTm9kZVdyYXBwZXIoaSwgYWNjZXNzb3IuZ2V0Qm91bmRzKHYpLCBhY2Nlc3Nvci5nZXRDaGlsZHJlbih2KSk7IH0pO1xuICAgICAgICB0aGlzLmxlYXZlcyA9IHRoaXMubm9kZXMuZmlsdGVyKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmxlYWY7IH0pO1xuICAgICAgICB0aGlzLmdyb3VwcyA9IHRoaXMubm9kZXMuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiAhZy5sZWFmOyB9KTtcbiAgICAgICAgdGhpcy5jb2xzID0gdGhpcy5nZXRHcmlkTGluZXMoJ3gnKTtcbiAgICAgICAgdGhpcy5yb3dzID0gdGhpcy5nZXRHcmlkTGluZXMoJ3knKTtcbiAgICAgICAgdGhpcy5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmV0dXJuIHYuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gX3RoaXMubm9kZXNbY10ucGFyZW50ID0gdjsgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJvb3QgPSB7IGNoaWxkcmVuOiBbXSB9O1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygdi5wYXJlbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdi5wYXJlbnQgPSBfdGhpcy5yb290O1xuICAgICAgICAgICAgICAgIF90aGlzLnJvb3QuY2hpbGRyZW4ucHVzaCh2LmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHYucG9ydHMgPSBbXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYmFja1RvRnJvbnQgPSB0aGlzLm5vZGVzLnNsaWNlKDApO1xuICAgICAgICB0aGlzLmJhY2tUb0Zyb250LnNvcnQoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIF90aGlzLmdldERlcHRoKHgpIC0gX3RoaXMuZ2V0RGVwdGgoeSk7IH0pO1xuICAgICAgICB2YXIgZnJvbnRUb0JhY2tHcm91cHMgPSB0aGlzLmJhY2tUb0Zyb250LnNsaWNlKDApLnJldmVyc2UoKS5maWx0ZXIoZnVuY3Rpb24gKGcpIHsgcmV0dXJuICFnLmxlYWY7IH0pO1xuICAgICAgICBmcm9udFRvQmFja0dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB2YXIgciA9IHJlY3RhbmdsZV8xLlJlY3RhbmdsZS5lbXB0eSgpO1xuICAgICAgICAgICAgdi5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiByID0gci51bmlvbihfdGhpcy5ub2Rlc1tjXS5yZWN0KTsgfSk7XG4gICAgICAgICAgICB2LnJlY3QgPSByLmluZmxhdGUoX3RoaXMuZ3JvdXBQYWRkaW5nKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBjb2xNaWRzID0gdGhpcy5taWRQb2ludHModGhpcy5jb2xzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gci5wb3M7IH0pKTtcbiAgICAgICAgdmFyIHJvd01pZHMgPSB0aGlzLm1pZFBvaW50cyh0aGlzLnJvd3MubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiByLnBvczsgfSkpO1xuICAgICAgICB2YXIgcm93eCA9IGNvbE1pZHNbMF0sIHJvd1ggPSBjb2xNaWRzW2NvbE1pZHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBjb2x5ID0gcm93TWlkc1swXSwgY29sWSA9IHJvd01pZHNbcm93TWlkcy5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIGhsaW5lcyA9IHRoaXMucm93cy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuICh7IHgxOiByb3d4LCB4Mjogcm93WCwgeTE6IHIucG9zLCB5Mjogci5wb3MgfSk7IH0pXG4gICAgICAgICAgICAuY29uY2F0KHJvd01pZHMubWFwKGZ1bmN0aW9uIChtKSB7IHJldHVybiAoeyB4MTogcm93eCwgeDI6IHJvd1gsIHkxOiBtLCB5MjogbSB9KTsgfSkpO1xuICAgICAgICB2YXIgdmxpbmVzID0gdGhpcy5jb2xzLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gKHsgeDE6IGMucG9zLCB4MjogYy5wb3MsIHkxOiBjb2x5LCB5MjogY29sWSB9KTsgfSlcbiAgICAgICAgICAgIC5jb25jYXQoY29sTWlkcy5tYXAoZnVuY3Rpb24gKG0pIHsgcmV0dXJuICh7IHgxOiBtLCB4MjogbSwgeTE6IGNvbHksIHkyOiBjb2xZIH0pOyB9KSk7XG4gICAgICAgIHZhciBsaW5lcyA9IGhsaW5lcy5jb25jYXQodmxpbmVzKTtcbiAgICAgICAgbGluZXMuZm9yRWFjaChmdW5jdGlvbiAobCkgeyByZXR1cm4gbC52ZXJ0cyA9IFtdOyB9KTtcbiAgICAgICAgdGhpcy52ZXJ0cyA9IFtdO1xuICAgICAgICB0aGlzLmVkZ2VzID0gW107XG4gICAgICAgIGhsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmxpbmVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBWZXJ0KF90aGlzLnZlcnRzLmxlbmd0aCwgdi54MSwgaC55MSk7XG4gICAgICAgICAgICAgICAgaC52ZXJ0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgIHYudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICBfdGhpcy52ZXJ0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgIHZhciBpID0gX3RoaXMuYmFja1RvRnJvbnQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub2RlID0gX3RoaXMuYmFja1RvRnJvbnRbaV0sIHIgPSBub2RlLnJlY3Q7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkeCA9IE1hdGguYWJzKHAueCAtIHIuY3goKSksIGR5ID0gTWF0aC5hYnMocC55IC0gci5jeSgpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGR4IDwgci53aWR0aCgpIC8gMiAmJiBkeSA8IHIuaGVpZ2h0KCkgLyAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLm5vZGUgPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGxpbmVzLmZvckVhY2goZnVuY3Rpb24gKGwsIGxpKSB7XG4gICAgICAgICAgICBfdGhpcy5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICAgICAgdi5yZWN0LmxpbmVJbnRlcnNlY3Rpb25zKGwueDEsIGwueTEsIGwueDIsIGwueTIpLmZvckVhY2goZnVuY3Rpb24gKGludGVyc2VjdCwgaikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBWZXJ0KF90aGlzLnZlcnRzLmxlbmd0aCwgaW50ZXJzZWN0LngsIGludGVyc2VjdC55LCB2LCBsKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICAgICAgbC52ZXJ0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgICAgICB2LnBvcnRzLnB1c2gocCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBpc0hvcml6ID0gTWF0aC5hYnMobC55MSAtIGwueTIpIDwgMC4xO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGlzSG9yaXogPyBiLnggLSBhLnggOiBiLnkgLSBhLnk7IH07XG4gICAgICAgICAgICBsLnZlcnRzLnNvcnQoZGVsdGEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsLnZlcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHUgPSBsLnZlcnRzW2kgLSAxXSwgdiA9IGwudmVydHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKHUubm9kZSAmJiB1Lm5vZGUgPT09IHYubm9kZSAmJiB1Lm5vZGUubGVhZilcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgX3RoaXMuZWRnZXMucHVzaCh7IHNvdXJjZTogdS5pZCwgdGFyZ2V0OiB2LmlkLCBsZW5ndGg6IE1hdGguYWJzKGRlbHRhKHUsIHYpKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLmF2ZyA9IGZ1bmN0aW9uIChhKSB7IHJldHVybiBhLnJlZHVjZShmdW5jdGlvbiAoeCwgeSkgeyByZXR1cm4geCArIHk7IH0pIC8gYS5sZW5ndGg7IH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZ2V0R3JpZExpbmVzID0gZnVuY3Rpb24gKGF4aXMpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSBbXTtcbiAgICAgICAgdmFyIGxzID0gdGhpcy5sZWF2ZXMuc2xpY2UoMCwgdGhpcy5sZWF2ZXMubGVuZ3RoKTtcbiAgICAgICAgd2hpbGUgKGxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBvdmVybGFwcGluZyA9IGxzLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5yZWN0WydvdmVybGFwJyArIGF4aXMudG9VcHBlckNhc2UoKV0obHNbMF0ucmVjdCk7IH0pO1xuICAgICAgICAgICAgdmFyIGNvbCA9IHtcbiAgICAgICAgICAgICAgICBub2Rlczogb3ZlcmxhcHBpbmcsXG4gICAgICAgICAgICAgICAgcG9zOiB0aGlzLmF2ZyhvdmVybGFwcGluZy5tYXAoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucmVjdFsnYycgKyBheGlzXSgpOyB9KSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sKTtcbiAgICAgICAgICAgIGNvbC5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiBscy5zcGxpY2UobHMuaW5kZXhPZih2KSwgMSk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbHVtbnMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5wb3MgLSBiLnBvczsgfSk7XG4gICAgICAgIHJldHVybiBjb2x1bW5zO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZ2V0RGVwdGggPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2YXIgZGVwdGggPSAwO1xuICAgICAgICB3aGlsZSAodi5wYXJlbnQgIT09IHRoaXMucm9vdCkge1xuICAgICAgICAgICAgZGVwdGgrKztcbiAgICAgICAgICAgIHYgPSB2LnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVwdGg7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5taWRQb2ludHMgPSBmdW5jdGlvbiAoYSkge1xuICAgICAgICB2YXIgZ2FwID0gYVsxXSAtIGFbMF07XG4gICAgICAgIHZhciBtaWRzID0gW2FbMF0gLSBnYXAgLyAyXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBtaWRzLnB1c2goKGFbaV0gKyBhW2kgLSAxXSkgLyAyKTtcbiAgICAgICAgfVxuICAgICAgICBtaWRzLnB1c2goYVthLmxlbmd0aCAtIDFdICsgZ2FwIC8gMik7XG4gICAgICAgIHJldHVybiBtaWRzO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZmluZExpbmVhZ2UgPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2YXIgbGluZWFnZSA9IFt2XTtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdiA9IHYucGFyZW50O1xuICAgICAgICAgICAgbGluZWFnZS5wdXNoKHYpO1xuICAgICAgICB9IHdoaWxlICh2ICE9PSB0aGlzLnJvb3QpO1xuICAgICAgICByZXR1cm4gbGluZWFnZS5yZXZlcnNlKCk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5maW5kQW5jZXN0b3JQYXRoQmV0d2VlbiA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBhYSA9IHRoaXMuZmluZExpbmVhZ2UoYSksIGJhID0gdGhpcy5maW5kTGluZWFnZShiKSwgaSA9IDA7XG4gICAgICAgIHdoaWxlIChhYVtpXSA9PT0gYmFbaV0pXG4gICAgICAgICAgICBpKys7XG4gICAgICAgIHJldHVybiB7IGNvbW1vbkFuY2VzdG9yOiBhYVtpIC0gMV0sIGxpbmVhZ2VzOiBhYS5zbGljZShpKS5jb25jYXQoYmEuc2xpY2UoaSkpIH07XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5zaWJsaW5nT2JzdGFjbGVzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHBhdGggPSB0aGlzLmZpbmRBbmNlc3RvclBhdGhCZXR3ZWVuKGEsIGIpO1xuICAgICAgICB2YXIgbGluZWFnZUxvb2t1cCA9IHt9O1xuICAgICAgICBwYXRoLmxpbmVhZ2VzLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgcmV0dXJuIGxpbmVhZ2VMb29rdXBbdi5pZF0gPSB7fTsgfSk7XG4gICAgICAgIHZhciBvYnN0YWNsZXMgPSBwYXRoLmNvbW1vbkFuY2VzdG9yLmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gISh2IGluIGxpbmVhZ2VMb29rdXApOyB9KTtcbiAgICAgICAgcGF0aC5saW5lYWdlc1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5wYXJlbnQgIT09IHBhdGguY29tbW9uQW5jZXN0b3I7IH0pXG4gICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gb2JzdGFjbGVzID0gb2JzdGFjbGVzLmNvbmNhdCh2LnBhcmVudC5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMgIT09IHYuaWQ7IH0pKTsgfSk7XG4gICAgICAgIHJldHVybiBvYnN0YWNsZXMubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiBfdGhpcy5ub2Rlc1t2XTsgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmdldFNlZ21lbnRTZXRzID0gZnVuY3Rpb24gKHJvdXRlcywgeCwgeSkge1xuICAgICAgICB2YXIgdnNlZ21lbnRzID0gW107XG4gICAgICAgIGZvciAodmFyIGVpID0gMDsgZWkgPCByb3V0ZXMubGVuZ3RoOyBlaSsrKSB7XG4gICAgICAgICAgICB2YXIgcm91dGUgPSByb3V0ZXNbZWldO1xuICAgICAgICAgICAgZm9yICh2YXIgc2kgPSAwOyBzaSA8IHJvdXRlLmxlbmd0aDsgc2krKykge1xuICAgICAgICAgICAgICAgIHZhciBzID0gcm91dGVbc2ldO1xuICAgICAgICAgICAgICAgIHMuZWRnZWlkID0gZWk7XG4gICAgICAgICAgICAgICAgcy5pID0gc2k7XG4gICAgICAgICAgICAgICAgdmFyIHNkeCA9IHNbMV1beF0gLSBzWzBdW3hdO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhzZHgpIDwgMC4xKSB7XG4gICAgICAgICAgICAgICAgICAgIHZzZWdtZW50cy5wdXNoKHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2c2VnbWVudHMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYVswXVt4XSAtIGJbMF1beF07IH0pO1xuICAgICAgICB2YXIgdnNlZ21lbnRzZXRzID0gW107XG4gICAgICAgIHZhciBzZWdtZW50c2V0ID0gbnVsbDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2c2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzID0gdnNlZ21lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWdtZW50c2V0IHx8IE1hdGguYWJzKHNbMF1beF0gLSBzZWdtZW50c2V0LnBvcykgPiAwLjEpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50c2V0ID0geyBwb3M6IHNbMF1beF0sIHNlZ21lbnRzOiBbXSB9O1xuICAgICAgICAgICAgICAgIHZzZWdtZW50c2V0cy5wdXNoKHNlZ21lbnRzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VnbWVudHNldC5zZWdtZW50cy5wdXNoKHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2c2VnbWVudHNldHM7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm51ZGdlU2VncyA9IGZ1bmN0aW9uICh4LCB5LCByb3V0ZXMsIHNlZ21lbnRzLCBsZWZ0T2YsIGdhcCkge1xuICAgICAgICB2YXIgbiA9IHNlZ21lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKG4gPD0gMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIHZzID0gc2VnbWVudHMubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBuZXcgdnBzY18xLlZhcmlhYmxlKHNbMF1beF0pOyB9KTtcbiAgICAgICAgdmFyIGNzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChpID09PSBqKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB2YXIgczEgPSBzZWdtZW50c1tpXSwgczIgPSBzZWdtZW50c1tqXSwgZTEgPSBzMS5lZGdlaWQsIGUyID0gczIuZWRnZWlkLCBsaW5kID0gLTEsIHJpbmQgPSAtMTtcbiAgICAgICAgICAgICAgICBpZiAoeCA9PSAneCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlZnRPZihlMSwgZTIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczFbMF1beV0gPCBzMVsxXVt5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBqLCByaW5kID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBpLCByaW5kID0gajtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlZnRPZihlMSwgZTIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczFbMF1beV0gPCBzMVsxXVt5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBpLCByaW5kID0gajtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmQgPSBqLCByaW5kID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobGluZCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNzLnB1c2gobmV3IHZwc2NfMS5Db25zdHJhaW50KHZzW2xpbmRdLCB2c1tyaW5kXSwgZ2FwKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBzb2x2ZXIgPSBuZXcgdnBzY18xLlNvbHZlcih2cywgY3MpO1xuICAgICAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICAgICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgdmFyIHMgPSBzZWdtZW50c1tpXTtcbiAgICAgICAgICAgIHZhciBwb3MgPSB2LnBvc2l0aW9uKCk7XG4gICAgICAgICAgICBzWzBdW3hdID0gc1sxXVt4XSA9IHBvcztcbiAgICAgICAgICAgIHZhciByb3V0ZSA9IHJvdXRlc1tzLmVkZ2VpZF07XG4gICAgICAgICAgICBpZiAocy5pID4gMClcbiAgICAgICAgICAgICAgICByb3V0ZVtzLmkgLSAxXVsxXVt4XSA9IHBvcztcbiAgICAgICAgICAgIGlmIChzLmkgPCByb3V0ZS5sZW5ndGggLSAxKVxuICAgICAgICAgICAgICAgIHJvdXRlW3MuaSArIDFdWzBdW3hdID0gcG9zO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIubnVkZ2VTZWdtZW50cyA9IGZ1bmN0aW9uIChyb3V0ZXMsIHgsIHksIGxlZnRPZiwgZ2FwKSB7XG4gICAgICAgIHZhciB2c2VnbWVudHNldHMgPSBHcmlkUm91dGVyLmdldFNlZ21lbnRTZXRzKHJvdXRlcywgeCwgeSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdnNlZ21lbnRzZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3MgPSB2c2VnbWVudHNldHNbaV07XG4gICAgICAgICAgICB2YXIgZXZlbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNzLnNlZ21lbnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBzcy5zZWdtZW50c1tqXTtcbiAgICAgICAgICAgICAgICBldmVudHMucHVzaCh7IHR5cGU6IDAsIHM6IHMsIHBvczogTWF0aC5taW4oc1swXVt5XSwgc1sxXVt5XSkgfSk7XG4gICAgICAgICAgICAgICAgZXZlbnRzLnB1c2goeyB0eXBlOiAxLCBzOiBzLCBwb3M6IE1hdGgubWF4KHNbMF1beV0sIHNbMV1beV0pIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXZlbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEucG9zIC0gYi5wb3MgKyBhLnR5cGUgLSBiLnR5cGU7IH0pO1xuICAgICAgICAgICAgdmFyIG9wZW4gPSBbXTtcbiAgICAgICAgICAgIHZhciBvcGVuQ291bnQgPSAwO1xuICAgICAgICAgICAgZXZlbnRzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS50eXBlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW4ucHVzaChlLnMpO1xuICAgICAgICAgICAgICAgICAgICBvcGVuQ291bnQrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5Db3VudC0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob3BlbkNvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgR3JpZFJvdXRlci5udWRnZVNlZ3MoeCwgeSwgcm91dGVzLCBvcGVuLCBsZWZ0T2YsIGdhcCk7XG4gICAgICAgICAgICAgICAgICAgIG9wZW4gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUucm91dGVFZGdlcyA9IGZ1bmN0aW9uIChlZGdlcywgbnVkZ2VHYXAsIHNvdXJjZSwgdGFyZ2V0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciByb3V0ZVBhdGhzID0gZWRnZXMubWFwKGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5yb3V0ZShzb3VyY2UoZSksIHRhcmdldChlKSk7IH0pO1xuICAgICAgICB2YXIgb3JkZXIgPSBHcmlkUm91dGVyLm9yZGVyRWRnZXMocm91dGVQYXRocyk7XG4gICAgICAgIHZhciByb3V0ZXMgPSByb3V0ZVBhdGhzLm1hcChmdW5jdGlvbiAoZSkgeyByZXR1cm4gR3JpZFJvdXRlci5tYWtlU2VnbWVudHMoZSk7IH0pO1xuICAgICAgICBHcmlkUm91dGVyLm51ZGdlU2VnbWVudHMocm91dGVzLCAneCcsICd5Jywgb3JkZXIsIG51ZGdlR2FwKTtcbiAgICAgICAgR3JpZFJvdXRlci5udWRnZVNlZ21lbnRzKHJvdXRlcywgJ3knLCAneCcsIG9yZGVyLCBudWRnZUdhcCk7XG4gICAgICAgIEdyaWRSb3V0ZXIudW5yZXZlcnNlRWRnZXMocm91dGVzLCByb3V0ZVBhdGhzKTtcbiAgICAgICAgcmV0dXJuIHJvdXRlcztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIudW5yZXZlcnNlRWRnZXMgPSBmdW5jdGlvbiAocm91dGVzLCByb3V0ZVBhdGhzKSB7XG4gICAgICAgIHJvdXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzZWdtZW50cywgaSkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSByb3V0ZVBhdGhzW2ldO1xuICAgICAgICAgICAgaWYgKHBhdGgucmV2ZXJzZWQpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50cy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbiAoc2VnbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBzZWdtZW50LnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmFuZ2xlQmV0d2VlbjJMaW5lcyA9IGZ1bmN0aW9uIChsaW5lMSwgbGluZTIpIHtcbiAgICAgICAgdmFyIGFuZ2xlMSA9IE1hdGguYXRhbjIobGluZTFbMF0ueSAtIGxpbmUxWzFdLnksIGxpbmUxWzBdLnggLSBsaW5lMVsxXS54KTtcbiAgICAgICAgdmFyIGFuZ2xlMiA9IE1hdGguYXRhbjIobGluZTJbMF0ueSAtIGxpbmUyWzFdLnksIGxpbmUyWzBdLnggLSBsaW5lMlsxXS54KTtcbiAgICAgICAgdmFyIGRpZmYgPSBhbmdsZTEgLSBhbmdsZTI7XG4gICAgICAgIGlmIChkaWZmID4gTWF0aC5QSSB8fCBkaWZmIDwgLU1hdGguUEkpIHtcbiAgICAgICAgICAgIGRpZmYgPSBhbmdsZTIgLSBhbmdsZTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRpZmY7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmlzTGVmdCA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICAgIHJldHVybiAoKGIueCAtIGEueCkgKiAoYy55IC0gYS55KSAtIChiLnkgLSBhLnkpICogKGMueCAtIGEueCkpIDw9IDA7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmdldE9yZGVyID0gZnVuY3Rpb24gKHBhaXJzKSB7XG4gICAgICAgIHZhciBvdXRnb2luZyA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhaXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcCA9IHBhaXJzW2ldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvdXRnb2luZ1twLmxdID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICBvdXRnb2luZ1twLmxdID0ge307XG4gICAgICAgICAgICBvdXRnb2luZ1twLmxdW3Aucl0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobCwgcikgeyByZXR1cm4gdHlwZW9mIG91dGdvaW5nW2xdICE9PSAndW5kZWZpbmVkJyAmJiBvdXRnb2luZ1tsXVtyXTsgfTtcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIub3JkZXJFZGdlcyA9IGZ1bmN0aW9uIChlZGdlcykge1xuICAgICAgICB2YXIgZWRnZU9yZGVyID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWRnZXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBlZGdlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBlID0gZWRnZXNbaV0sIGYgPSBlZGdlc1tqXSwgbGNzID0gbmV3IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZShlLCBmKTtcbiAgICAgICAgICAgICAgICB2YXIgdSwgdmksIHZqO1xuICAgICAgICAgICAgICAgIGlmIChsY3MubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBpZiAobGNzLnJldmVyc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGYucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgICAgICBmLnJldmVyc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbGNzID0gbmV3IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZShlLCBmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKChsY3Muc2kgPD0gMCB8fCBsY3MudGkgPD0gMCkgJiZcbiAgICAgICAgICAgICAgICAgICAgKGxjcy5zaSArIGxjcy5sZW5ndGggPj0gZS5sZW5ndGggfHwgbGNzLnRpICsgbGNzLmxlbmd0aCA+PSBmLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRnZU9yZGVyLnB1c2goeyBsOiBpLCByOiBqIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxjcy5zaSArIGxjcy5sZW5ndGggPj0gZS5sZW5ndGggfHwgbGNzLnRpICsgbGNzLmxlbmd0aCA+PSBmLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB1ID0gZVtsY3Muc2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgdmogPSBlW2xjcy5zaSAtIDFdO1xuICAgICAgICAgICAgICAgICAgICB2aSA9IGZbbGNzLnRpIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB1ID0gZVtsY3Muc2kgKyBsY3MubGVuZ3RoIC0gMl07XG4gICAgICAgICAgICAgICAgICAgIHZpID0gZVtsY3Muc2kgKyBsY3MubGVuZ3RoXTtcbiAgICAgICAgICAgICAgICAgICAgdmogPSBmW2xjcy50aSArIGxjcy5sZW5ndGhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoR3JpZFJvdXRlci5pc0xlZnQodSwgdmksIHZqKSkge1xuICAgICAgICAgICAgICAgICAgICBlZGdlT3JkZXIucHVzaCh7IGw6IGosIHI6IGkgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGdlT3JkZXIucHVzaCh7IGw6IGksIHI6IGogfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBHcmlkUm91dGVyLmdldE9yZGVyKGVkZ2VPcmRlcik7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm1ha2VTZWdtZW50cyA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGNvcHlQb2ludChwKSB7XG4gICAgICAgICAgICByZXR1cm4geyB4OiBwLngsIHk6IHAueSB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc1N0cmFpZ2h0ID0gZnVuY3Rpb24gKGEsIGIsIGMpIHsgcmV0dXJuIE1hdGguYWJzKChiLnggLSBhLngpICogKGMueSAtIGEueSkgLSAoYi55IC0gYS55KSAqIChjLnggLSBhLngpKSA8IDAuMDAxOyB9O1xuICAgICAgICB2YXIgc2VnbWVudHMgPSBbXTtcbiAgICAgICAgdmFyIGEgPSBjb3B5UG9pbnQocGF0aFswXSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGIgPSBjb3B5UG9pbnQocGF0aFtpXSksIGMgPSBpIDwgcGF0aC5sZW5ndGggLSAxID8gcGF0aFtpICsgMV0gOiBudWxsO1xuICAgICAgICAgICAgaWYgKCFjIHx8ICFpc1N0cmFpZ2h0KGEsIGIsIGMpKSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMucHVzaChbYSwgYl0pO1xuICAgICAgICAgICAgICAgIGEgPSBiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWdtZW50cztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLnJvdXRlID0gZnVuY3Rpb24gKHMsIHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMubm9kZXNbc10sIHRhcmdldCA9IHRoaXMubm9kZXNbdF07XG4gICAgICAgIHRoaXMub2JzdGFjbGVzID0gdGhpcy5zaWJsaW5nT2JzdGFjbGVzKHNvdXJjZSwgdGFyZ2V0KTtcbiAgICAgICAgdmFyIG9ic3RhY2xlTG9va3VwID0ge307XG4gICAgICAgIHRoaXMub2JzdGFjbGVzLmZvckVhY2goZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG9ic3RhY2xlTG9va3VwW28uaWRdID0gbzsgfSk7XG4gICAgICAgIHRoaXMucGFzc2FibGVFZGdlcyA9IHRoaXMuZWRnZXMuZmlsdGVyKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgdSA9IF90aGlzLnZlcnRzW2Uuc291cmNlXSwgdiA9IF90aGlzLnZlcnRzW2UudGFyZ2V0XTtcbiAgICAgICAgICAgIHJldHVybiAhKHUubm9kZSAmJiB1Lm5vZGUuaWQgaW4gb2JzdGFjbGVMb29rdXBcbiAgICAgICAgICAgICAgICB8fCB2Lm5vZGUgJiYgdi5ub2RlLmlkIGluIG9ic3RhY2xlTG9va3VwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc291cmNlLnBvcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdSA9IHNvdXJjZS5wb3J0c1swXS5pZDtcbiAgICAgICAgICAgIHZhciB2ID0gc291cmNlLnBvcnRzW2ldLmlkO1xuICAgICAgICAgICAgdGhpcy5wYXNzYWJsZUVkZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIHNvdXJjZTogdSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHYsXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRhcmdldC5wb3J0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHUgPSB0YXJnZXQucG9ydHNbMF0uaWQ7XG4gICAgICAgICAgICB2YXIgdiA9IHRhcmdldC5wb3J0c1tpXS5pZDtcbiAgICAgICAgICAgIHRoaXMucGFzc2FibGVFZGdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB2LFxuICAgICAgICAgICAgICAgIGxlbmd0aDogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdldFNvdXJjZSA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNvdXJjZTsgfSwgZ2V0VGFyZ2V0ID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0OyB9LCBnZXRMZW5ndGggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGg7IH07XG4gICAgICAgIHZhciBzaG9ydGVzdFBhdGhDYWxjdWxhdG9yID0gbmV3IHNob3J0ZXN0cGF0aHNfMS5DYWxjdWxhdG9yKHRoaXMudmVydHMubGVuZ3RoLCB0aGlzLnBhc3NhYmxlRWRnZXMsIGdldFNvdXJjZSwgZ2V0VGFyZ2V0LCBnZXRMZW5ndGgpO1xuICAgICAgICB2YXIgYmVuZFBlbmFsdHkgPSBmdW5jdGlvbiAodSwgdiwgdykge1xuICAgICAgICAgICAgdmFyIGEgPSBfdGhpcy52ZXJ0c1t1XSwgYiA9IF90aGlzLnZlcnRzW3ZdLCBjID0gX3RoaXMudmVydHNbd107XG4gICAgICAgICAgICB2YXIgZHggPSBNYXRoLmFicyhjLnggLSBhLngpLCBkeSA9IE1hdGguYWJzKGMueSAtIGEueSk7XG4gICAgICAgICAgICBpZiAoYS5ub2RlID09PSBzb3VyY2UgJiYgYS5ub2RlID09PSBiLm5vZGUgfHwgYi5ub2RlID09PSB0YXJnZXQgJiYgYi5ub2RlID09PSBjLm5vZGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICByZXR1cm4gZHggPiAxICYmIGR5ID4gMSA/IDEwMDAgOiAwO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgc2hvcnRlc3RQYXRoID0gc2hvcnRlc3RQYXRoQ2FsY3VsYXRvci5QYXRoRnJvbU5vZGVUb05vZGVXaXRoUHJldkNvc3Qoc291cmNlLnBvcnRzWzBdLmlkLCB0YXJnZXQucG9ydHNbMF0uaWQsIGJlbmRQZW5hbHR5KTtcbiAgICAgICAgdmFyIHBhdGhQb2ludHMgPSBzaG9ydGVzdFBhdGgucmV2ZXJzZSgpLm1hcChmdW5jdGlvbiAodmkpIHsgcmV0dXJuIF90aGlzLnZlcnRzW3ZpXTsgfSk7XG4gICAgICAgIHBhdGhQb2ludHMucHVzaCh0aGlzLm5vZGVzW3RhcmdldC5pZF0ucG9ydHNbMF0pO1xuICAgICAgICByZXR1cm4gcGF0aFBvaW50cy5maWx0ZXIoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiAhKGkgPCBwYXRoUG9pbnRzLmxlbmd0aCAtIDEgJiYgcGF0aFBvaW50c1tpICsgMV0ubm9kZSA9PT0gc291cmNlICYmIHYubm9kZSA9PT0gc291cmNlXG4gICAgICAgICAgICAgICAgfHwgaSA+IDAgJiYgdi5ub2RlID09PSB0YXJnZXQgJiYgcGF0aFBvaW50c1tpIC0gMV0ubm9kZSA9PT0gdGFyZ2V0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLmdldFJvdXRlUGF0aCA9IGZ1bmN0aW9uIChyb3V0ZSwgY29ybmVycmFkaXVzLCBhcnJvd3dpZHRoLCBhcnJvd2hlaWdodCkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgcm91dGVwYXRoOiAnTSAnICsgcm91dGVbMF1bMF0ueCArICcgJyArIHJvdXRlWzBdWzBdLnkgKyAnICcsXG4gICAgICAgICAgICBhcnJvd3BhdGg6ICcnXG4gICAgICAgIH07XG4gICAgICAgIGlmIChyb3V0ZS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvdXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpID0gcm91dGVbaV07XG4gICAgICAgICAgICAgICAgdmFyIHggPSBsaVsxXS54LCB5ID0gbGlbMV0ueTtcbiAgICAgICAgICAgICAgICB2YXIgZHggPSB4IC0gbGlbMF0ueDtcbiAgICAgICAgICAgICAgICB2YXIgZHkgPSB5IC0gbGlbMF0ueTtcbiAgICAgICAgICAgICAgICBpZiAoaSA8IHJvdXRlLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGR4KSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggLT0gZHggLyBNYXRoLmFicyhkeCkgKiBjb3JuZXJyYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5IC09IGR5IC8gTWF0aC5hYnMoZHkpICogY29ybmVycmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yb3V0ZXBhdGggKz0gJ0wgJyArIHggKyAnICcgKyB5ICsgJyAnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IHJvdXRlW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHgwID0gbFswXS54LCB5MCA9IGxbMF0ueTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHgxID0gbFsxXS54O1xuICAgICAgICAgICAgICAgICAgICB2YXIgeTEgPSBsWzFdLnk7XG4gICAgICAgICAgICAgICAgICAgIGR4ID0geDEgLSB4MDtcbiAgICAgICAgICAgICAgICAgICAgZHkgPSB5MSAtIHkwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYW5nbGUgPSBHcmlkUm91dGVyLmFuZ2xlQmV0d2VlbjJMaW5lcyhsaSwgbCkgPCAwID8gMSA6IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4MiwgeTI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhkeCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IHgwICsgZHggLyBNYXRoLmFicyhkeCkgKiBjb3JuZXJyYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IHkwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSB4MDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyID0geTAgKyBkeSAvIE1hdGguYWJzKGR5KSAqIGNvcm5lcnJhZGl1cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgY3ggPSBNYXRoLmFicyh4MiAtIHgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3kgPSBNYXRoLmFicyh5MiAtIHkpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdBICcgKyBjeCArICcgJyArIGN5ICsgJyAwIDAgJyArIGFuZ2xlICsgJyAnICsgeDIgKyAnICcgKyB5MiArICcgJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJvd3RpcCA9IFt4LCB5XTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFycm93Y29ybmVyMSwgYXJyb3djb3JuZXIyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoZHgpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCAtPSBkeCAvIE1hdGguYWJzKGR4KSAqIGFycm93aGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3djb3JuZXIxID0gW3gsIHkgKyBhcnJvd3dpZHRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4LCB5IC0gYXJyb3d3aWR0aF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5IC09IGR5IC8gTWF0aC5hYnMoZHkpICogYXJyb3doZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjEgPSBbeCArIGFycm93d2lkdGgsIHldO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3djb3JuZXIyID0gW3ggLSBhcnJvd3dpZHRoLCB5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdMICcgKyB4ICsgJyAnICsgeSArICcgJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFycm93aGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmFycm93cGF0aCA9ICdNICcgKyBhcnJvd3RpcFswXSArICcgJyArIGFycm93dGlwWzFdICsgJyBMICcgKyBhcnJvd2Nvcm5lcjFbMF0gKyAnICcgKyBhcnJvd2Nvcm5lcjFbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICcgTCAnICsgYXJyb3djb3JuZXIyWzBdICsgJyAnICsgYXJyb3djb3JuZXIyWzFdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGxpID0gcm91dGVbMF07XG4gICAgICAgICAgICB2YXIgeCA9IGxpWzFdLngsIHkgPSBsaVsxXS55O1xuICAgICAgICAgICAgdmFyIGR4ID0geCAtIGxpWzBdLng7XG4gICAgICAgICAgICB2YXIgZHkgPSB5IC0gbGlbMF0ueTtcbiAgICAgICAgICAgIHZhciBhcnJvd3RpcCA9IFt4LCB5XTtcbiAgICAgICAgICAgIHZhciBhcnJvd2Nvcm5lcjEsIGFycm93Y29ybmVyMjtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhkeCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgeCAtPSBkeCAvIE1hdGguYWJzKGR4KSAqIGFycm93aGVpZ2h0O1xuICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMSA9IFt4LCB5ICsgYXJyb3d3aWR0aF07XG4gICAgICAgICAgICAgICAgYXJyb3djb3JuZXIyID0gW3gsIHkgLSBhcnJvd3dpZHRoXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHkgLT0gZHkgLyBNYXRoLmFicyhkeSkgKiBhcnJvd2hlaWdodDtcbiAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjEgPSBbeCArIGFycm93d2lkdGgsIHldO1xuICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4IC0gYXJyb3d3aWR0aCwgeV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdMICcgKyB4ICsgJyAnICsgeSArICcgJztcbiAgICAgICAgICAgIGlmIChhcnJvd2hlaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuYXJyb3dwYXRoID0gJ00gJyArIGFycm93dGlwWzBdICsgJyAnICsgYXJyb3d0aXBbMV0gKyAnIEwgJyArIGFycm93Y29ybmVyMVswXSArICcgJyArIGFycm93Y29ybmVyMVsxXVxuICAgICAgICAgICAgICAgICAgICArICcgTCAnICsgYXJyb3djb3JuZXIyWzBdICsgJyAnICsgYXJyb3djb3JuZXIyWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gR3JpZFJvdXRlcjtcbn0oKSk7XG5leHBvcnRzLkdyaWRSb3V0ZXIgPSBHcmlkUm91dGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z3JpZHJvdXRlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBwYWNraW5nT3B0aW9ucyA9IHtcbiAgICBQQURESU5HOiAxMCxcbiAgICBHT0xERU5fU0VDVElPTjogKDEgKyBNYXRoLnNxcnQoNSkpIC8gMixcbiAgICBGTE9BVF9FUFNJTE9OOiAwLjAwMDEsXG4gICAgTUFYX0lORVJBVElPTlM6IDEwMFxufTtcbmZ1bmN0aW9uIGFwcGx5UGFja2luZyhncmFwaHMsIHcsIGgsIG5vZGVfc2l6ZSwgZGVzaXJlZF9yYXRpbykge1xuICAgIGlmIChkZXNpcmVkX3JhdGlvID09PSB2b2lkIDApIHsgZGVzaXJlZF9yYXRpbyA9IDE7IH1cbiAgICB2YXIgaW5pdF94ID0gMCwgaW5pdF95ID0gMCwgc3ZnX3dpZHRoID0gdywgc3ZnX2hlaWdodCA9IGgsIGRlc2lyZWRfcmF0aW8gPSB0eXBlb2YgZGVzaXJlZF9yYXRpbyAhPT0gJ3VuZGVmaW5lZCcgPyBkZXNpcmVkX3JhdGlvIDogMSwgbm9kZV9zaXplID0gdHlwZW9mIG5vZGVfc2l6ZSAhPT0gJ3VuZGVmaW5lZCcgPyBub2RlX3NpemUgOiAwLCByZWFsX3dpZHRoID0gMCwgcmVhbF9oZWlnaHQgPSAwLCBtaW5fd2lkdGggPSAwLCBnbG9iYWxfYm90dG9tID0gMCwgbGluZSA9IFtdO1xuICAgIGlmIChncmFwaHMubGVuZ3RoID09IDApXG4gICAgICAgIHJldHVybjtcbiAgICBjYWxjdWxhdGVfYmIoZ3JhcGhzKTtcbiAgICBhcHBseShncmFwaHMsIGRlc2lyZWRfcmF0aW8pO1xuICAgIHB1dF9ub2Rlc190b19yaWdodF9wb3NpdGlvbnMoZ3JhcGhzKTtcbiAgICBmdW5jdGlvbiBjYWxjdWxhdGVfYmIoZ3JhcGhzKSB7XG4gICAgICAgIGdyYXBocy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICBjYWxjdWxhdGVfc2luZ2xlX2JiKGcpO1xuICAgICAgICB9KTtcbiAgICAgICAgZnVuY3Rpb24gY2FsY3VsYXRlX3NpbmdsZV9iYihncmFwaCkge1xuICAgICAgICAgICAgdmFyIG1pbl94ID0gTnVtYmVyLk1BWF9WQUxVRSwgbWluX3kgPSBOdW1iZXIuTUFYX1ZBTFVFLCBtYXhfeCA9IDAsIG1heF95ID0gMDtcbiAgICAgICAgICAgIGdyYXBoLmFycmF5LmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB2YXIgdyA9IHR5cGVvZiB2LndpZHRoICE9PSAndW5kZWZpbmVkJyA/IHYud2lkdGggOiBub2RlX3NpemU7XG4gICAgICAgICAgICAgICAgdmFyIGggPSB0eXBlb2Ygdi5oZWlnaHQgIT09ICd1bmRlZmluZWQnID8gdi5oZWlnaHQgOiBub2RlX3NpemU7XG4gICAgICAgICAgICAgICAgdyAvPSAyO1xuICAgICAgICAgICAgICAgIGggLz0gMjtcbiAgICAgICAgICAgICAgICBtYXhfeCA9IE1hdGgubWF4KHYueCArIHcsIG1heF94KTtcbiAgICAgICAgICAgICAgICBtaW5feCA9IE1hdGgubWluKHYueCAtIHcsIG1pbl94KTtcbiAgICAgICAgICAgICAgICBtYXhfeSA9IE1hdGgubWF4KHYueSArIGgsIG1heF95KTtcbiAgICAgICAgICAgICAgICBtaW5feSA9IE1hdGgubWluKHYueSAtIGgsIG1pbl95KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZ3JhcGgud2lkdGggPSBtYXhfeCAtIG1pbl94O1xuICAgICAgICAgICAgZ3JhcGguaGVpZ2h0ID0gbWF4X3kgLSBtaW5feTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBwdXRfbm9kZXNfdG9fcmlnaHRfcG9zaXRpb25zKGdyYXBocykge1xuICAgICAgICBncmFwaHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgdmFyIGNlbnRlciA9IHsgeDogMCwgeTogMCB9O1xuICAgICAgICAgICAgZy5hcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgY2VudGVyLnggKz0gbm9kZS54O1xuICAgICAgICAgICAgICAgIGNlbnRlci55ICs9IG5vZGUueTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2VudGVyLnggLz0gZy5hcnJheS5sZW5ndGg7XG4gICAgICAgICAgICBjZW50ZXIueSAvPSBnLmFycmF5Lmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBjb3JuZXIgPSB7IHg6IGNlbnRlci54IC0gZy53aWR0aCAvIDIsIHk6IGNlbnRlci55IC0gZy5oZWlnaHQgLyAyIH07XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0geyB4OiBnLnggLSBjb3JuZXIueCArIHN2Z193aWR0aCAvIDIgLSByZWFsX3dpZHRoIC8gMiwgeTogZy55IC0gY29ybmVyLnkgKyBzdmdfaGVpZ2h0IC8gMiAtIHJlYWxfaGVpZ2h0IC8gMiB9O1xuICAgICAgICAgICAgZy5hcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgbm9kZS54ICs9IG9mZnNldC54O1xuICAgICAgICAgICAgICAgIG5vZGUueSArPSBvZmZzZXQueTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXBwbHkoZGF0YSwgZGVzaXJlZF9yYXRpbykge1xuICAgICAgICB2YXIgY3Vycl9iZXN0X2YgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgICAgIHZhciBjdXJyX2Jlc3QgPSAwO1xuICAgICAgICBkYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGIuaGVpZ2h0IC0gYS5oZWlnaHQ7IH0pO1xuICAgICAgICBtaW5fd2lkdGggPSBkYXRhLnJlZHVjZShmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEud2lkdGggPCBiLndpZHRoID8gYS53aWR0aCA6IGIud2lkdGg7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgbGVmdCA9IHgxID0gbWluX3dpZHRoO1xuICAgICAgICB2YXIgcmlnaHQgPSB4MiA9IGdldF9lbnRpcmVfd2lkdGgoZGF0YSk7XG4gICAgICAgIHZhciBpdGVyYXRpb25Db3VudGVyID0gMDtcbiAgICAgICAgdmFyIGZfeDEgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgICB2YXIgZl94MiA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgIHZhciBmbGFnID0gLTE7XG4gICAgICAgIHZhciBkeCA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgIHZhciBkZiA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgIHdoaWxlICgoZHggPiBtaW5fd2lkdGgpIHx8IGRmID4gcGFja2luZ09wdGlvbnMuRkxPQVRfRVBTSUxPTikge1xuICAgICAgICAgICAgaWYgKGZsYWcgIT0gMSkge1xuICAgICAgICAgICAgICAgIHZhciB4MSA9IHJpZ2h0IC0gKHJpZ2h0IC0gbGVmdCkgLyBwYWNraW5nT3B0aW9ucy5HT0xERU5fU0VDVElPTjtcbiAgICAgICAgICAgICAgICB2YXIgZl94MSA9IHN0ZXAoZGF0YSwgeDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZsYWcgIT0gMCkge1xuICAgICAgICAgICAgICAgIHZhciB4MiA9IGxlZnQgKyAocmlnaHQgLSBsZWZ0KSAvIHBhY2tpbmdPcHRpb25zLkdPTERFTl9TRUNUSU9OO1xuICAgICAgICAgICAgICAgIHZhciBmX3gyID0gc3RlcChkYXRhLCB4Mik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkeCA9IE1hdGguYWJzKHgxIC0geDIpO1xuICAgICAgICAgICAgZGYgPSBNYXRoLmFicyhmX3gxIC0gZl94Mik7XG4gICAgICAgICAgICBpZiAoZl94MSA8IGN1cnJfYmVzdF9mKSB7XG4gICAgICAgICAgICAgICAgY3Vycl9iZXN0X2YgPSBmX3gxO1xuICAgICAgICAgICAgICAgIGN1cnJfYmVzdCA9IHgxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZfeDIgPCBjdXJyX2Jlc3RfZikge1xuICAgICAgICAgICAgICAgIGN1cnJfYmVzdF9mID0gZl94MjtcbiAgICAgICAgICAgICAgICBjdXJyX2Jlc3QgPSB4MjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmX3gxID4gZl94Mikge1xuICAgICAgICAgICAgICAgIGxlZnQgPSB4MTtcbiAgICAgICAgICAgICAgICB4MSA9IHgyO1xuICAgICAgICAgICAgICAgIGZfeDEgPSBmX3gyO1xuICAgICAgICAgICAgICAgIGZsYWcgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmlnaHQgPSB4MjtcbiAgICAgICAgICAgICAgICB4MiA9IHgxO1xuICAgICAgICAgICAgICAgIGZfeDIgPSBmX3gxO1xuICAgICAgICAgICAgICAgIGZsYWcgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZXJhdGlvbkNvdW50ZXIrKyA+IDEwMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0ZXAoZGF0YSwgY3Vycl9iZXN0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3RlcChkYXRhLCBtYXhfd2lkdGgpIHtcbiAgICAgICAgbGluZSA9IFtdO1xuICAgICAgICByZWFsX3dpZHRoID0gMDtcbiAgICAgICAgcmVhbF9oZWlnaHQgPSAwO1xuICAgICAgICBnbG9iYWxfYm90dG9tID0gaW5pdF95O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBvID0gZGF0YVtpXTtcbiAgICAgICAgICAgIHB1dF9yZWN0KG8sIG1heF93aWR0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGguYWJzKGdldF9yZWFsX3JhdGlvKCkgLSBkZXNpcmVkX3JhdGlvKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcHV0X3JlY3QocmVjdCwgbWF4X3dpZHRoKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKChsaW5lW2ldLnNwYWNlX2xlZnQgPj0gcmVjdC5oZWlnaHQpICYmIChsaW5lW2ldLnggKyBsaW5lW2ldLndpZHRoICsgcmVjdC53aWR0aCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkcgLSBtYXhfd2lkdGgpIDw9IHBhY2tpbmdPcHRpb25zLkZMT0FUX0VQU0lMT04pIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBsaW5lW2ldO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxpbmUucHVzaChyZWN0KTtcbiAgICAgICAgaWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZWN0LnggPSBwYXJlbnQueCArIHBhcmVudC53aWR0aCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7XG4gICAgICAgICAgICByZWN0LnkgPSBwYXJlbnQuYm90dG9tO1xuICAgICAgICAgICAgcmVjdC5zcGFjZV9sZWZ0ID0gcmVjdC5oZWlnaHQ7XG4gICAgICAgICAgICByZWN0LmJvdHRvbSA9IHJlY3QueTtcbiAgICAgICAgICAgIHBhcmVudC5zcGFjZV9sZWZ0IC09IHJlY3QuaGVpZ2h0ICsgcGFja2luZ09wdGlvbnMuUEFERElORztcbiAgICAgICAgICAgIHBhcmVudC5ib3R0b20gKz0gcmVjdC5oZWlnaHQgKyBwYWNraW5nT3B0aW9ucy5QQURESU5HO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVjdC55ID0gZ2xvYmFsX2JvdHRvbTtcbiAgICAgICAgICAgIGdsb2JhbF9ib3R0b20gKz0gcmVjdC5oZWlnaHQgKyBwYWNraW5nT3B0aW9ucy5QQURESU5HO1xuICAgICAgICAgICAgcmVjdC54ID0gaW5pdF94O1xuICAgICAgICAgICAgcmVjdC5ib3R0b20gPSByZWN0Lnk7XG4gICAgICAgICAgICByZWN0LnNwYWNlX2xlZnQgPSByZWN0LmhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVjdC55ICsgcmVjdC5oZWlnaHQgLSByZWFsX2hlaWdodCA+IC1wYWNraW5nT3B0aW9ucy5GTE9BVF9FUFNJTE9OKVxuICAgICAgICAgICAgcmVhbF9oZWlnaHQgPSByZWN0LnkgKyByZWN0LmhlaWdodCAtIGluaXRfeTtcbiAgICAgICAgaWYgKHJlY3QueCArIHJlY3Qud2lkdGggLSByZWFsX3dpZHRoID4gLXBhY2tpbmdPcHRpb25zLkZMT0FUX0VQU0lMT04pXG4gICAgICAgICAgICByZWFsX3dpZHRoID0gcmVjdC54ICsgcmVjdC53aWR0aCAtIGluaXRfeDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0X2VudGlyZV93aWR0aChkYXRhKSB7XG4gICAgICAgIHZhciB3aWR0aCA9IDA7XG4gICAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbiAoZCkgeyByZXR1cm4gd2lkdGggKz0gZC53aWR0aCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7IH0pO1xuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldF9yZWFsX3JhdGlvKCkge1xuICAgICAgICByZXR1cm4gKHJlYWxfd2lkdGggLyByZWFsX2hlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5hcHBseVBhY2tpbmcgPSBhcHBseVBhY2tpbmc7XG5mdW5jdGlvbiBzZXBhcmF0ZUdyYXBocyhub2RlcywgbGlua3MpIHtcbiAgICB2YXIgbWFya3MgPSB7fTtcbiAgICB2YXIgd2F5cyA9IHt9O1xuICAgIHZhciBncmFwaHMgPSBbXTtcbiAgICB2YXIgY2x1c3RlcnMgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGxpbmsgPSBsaW5rc1tpXTtcbiAgICAgICAgdmFyIG4xID0gbGluay5zb3VyY2U7XG4gICAgICAgIHZhciBuMiA9IGxpbmsudGFyZ2V0O1xuICAgICAgICBpZiAod2F5c1tuMS5pbmRleF0pXG4gICAgICAgICAgICB3YXlzW24xLmluZGV4XS5wdXNoKG4yKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2F5c1tuMS5pbmRleF0gPSBbbjJdO1xuICAgICAgICBpZiAod2F5c1tuMi5pbmRleF0pXG4gICAgICAgICAgICB3YXlzW24yLmluZGV4XS5wdXNoKG4xKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2F5c1tuMi5pbmRleF0gPSBbbjFdO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChtYXJrc1tub2RlLmluZGV4XSlcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBleHBsb3JlX25vZGUobm9kZSwgdHJ1ZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGV4cGxvcmVfbm9kZShuLCBpc19uZXcpIHtcbiAgICAgICAgaWYgKG1hcmtzW24uaW5kZXhdICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChpc19uZXcpIHtcbiAgICAgICAgICAgIGNsdXN0ZXJzKys7XG4gICAgICAgICAgICBncmFwaHMucHVzaCh7IGFycmF5OiBbXSB9KTtcbiAgICAgICAgfVxuICAgICAgICBtYXJrc1tuLmluZGV4XSA9IGNsdXN0ZXJzO1xuICAgICAgICBncmFwaHNbY2x1c3RlcnMgLSAxXS5hcnJheS5wdXNoKG4pO1xuICAgICAgICB2YXIgYWRqYWNlbnQgPSB3YXlzW24uaW5kZXhdO1xuICAgICAgICBpZiAoIWFkamFjZW50KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFkamFjZW50Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBleHBsb3JlX25vZGUoYWRqYWNlbnRbal0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JhcGhzO1xufVxuZXhwb3J0cy5zZXBhcmF0ZUdyYXBocyA9IHNlcGFyYXRlR3JhcGhzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aGFuZGxlZGlzY29ubmVjdGVkLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHBvd2VyZ3JhcGggPSByZXF1aXJlKFwiLi9wb3dlcmdyYXBoXCIpO1xudmFyIGxpbmtsZW5ndGhzXzEgPSByZXF1aXJlKFwiLi9saW5rbGVuZ3Roc1wiKTtcbnZhciBkZXNjZW50XzEgPSByZXF1aXJlKFwiLi9kZXNjZW50XCIpO1xudmFyIHJlY3RhbmdsZV8xID0gcmVxdWlyZShcIi4vcmVjdGFuZ2xlXCIpO1xudmFyIHNob3J0ZXN0cGF0aHNfMSA9IHJlcXVpcmUoXCIuL3Nob3J0ZXN0cGF0aHNcIik7XG52YXIgZ2VvbV8xID0gcmVxdWlyZShcIi4vZ2VvbVwiKTtcbnZhciBoYW5kbGVkaXNjb25uZWN0ZWRfMSA9IHJlcXVpcmUoXCIuL2hhbmRsZWRpc2Nvbm5lY3RlZFwiKTtcbnZhciBFdmVudFR5cGU7XG4oZnVuY3Rpb24gKEV2ZW50VHlwZSkge1xuICAgIEV2ZW50VHlwZVtFdmVudFR5cGVbXCJzdGFydFwiXSA9IDBdID0gXCJzdGFydFwiO1xuICAgIEV2ZW50VHlwZVtFdmVudFR5cGVbXCJ0aWNrXCJdID0gMV0gPSBcInRpY2tcIjtcbiAgICBFdmVudFR5cGVbRXZlbnRUeXBlW1wiZW5kXCJdID0gMl0gPSBcImVuZFwiO1xufSkoRXZlbnRUeXBlID0gZXhwb3J0cy5FdmVudFR5cGUgfHwgKGV4cG9ydHMuRXZlbnRUeXBlID0ge30pKTtcbmZ1bmN0aW9uIGlzR3JvdXAoZykge1xuICAgIHJldHVybiB0eXBlb2YgZy5sZWF2ZXMgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBnLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCc7XG59XG52YXIgTGF5b3V0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMYXlvdXQoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuX2NhbnZhc1NpemUgPSBbMSwgMV07XG4gICAgICAgIHRoaXMuX2xpbmtEaXN0YW5jZSA9IDIwO1xuICAgICAgICB0aGlzLl9kZWZhdWx0Tm9kZVNpemUgPSAxMDtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBudWxsO1xuICAgICAgICB0aGlzLl9saW5rVHlwZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2F2b2lkT3ZlcmxhcHMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9ub2RlcyA9IFtdO1xuICAgICAgICB0aGlzLl9ncm91cHMgPSBbXTtcbiAgICAgICAgdGhpcy5fcm9vdEdyb3VwID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGlua3MgPSBbXTtcbiAgICAgICAgdGhpcy5fY29uc3RyYWludHMgPSBbXTtcbiAgICAgICAgdGhpcy5fZGlzdGFuY2VNYXRyaXggPSBudWxsO1xuICAgICAgICB0aGlzLl9kZXNjZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGlyZWN0ZWRMaW5rQ29uc3RyYWludHMgPSBudWxsO1xuICAgICAgICB0aGlzLl90aHJlc2hvbGQgPSAwLjAxO1xuICAgICAgICB0aGlzLl92aXNpYmlsaXR5R3JhcGggPSBudWxsO1xuICAgICAgICB0aGlzLl9ncm91cENvbXBhY3RuZXNzID0gMWUtNjtcbiAgICAgICAgdGhpcy5ldmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMubGlua0FjY2Vzc29yID0ge1xuICAgICAgICAgICAgZ2V0U291cmNlSW5kZXg6IExheW91dC5nZXRTb3VyY2VJbmRleCxcbiAgICAgICAgICAgIGdldFRhcmdldEluZGV4OiBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgsXG4gICAgICAgICAgICBzZXRMZW5ndGg6IExheW91dC5zZXRMaW5rTGVuZ3RoLFxuICAgICAgICAgICAgZ2V0VHlwZTogZnVuY3Rpb24gKGwpIHsgcmV0dXJuIHR5cGVvZiBfdGhpcy5fbGlua1R5cGUgPT09IFwiZnVuY3Rpb25cIiA/IF90aGlzLl9saW5rVHlwZShsKSA6IDA7IH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgTGF5b3V0LnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChlLCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMuZXZlbnQpXG4gICAgICAgICAgICB0aGlzLmV2ZW50ID0ge307XG4gICAgICAgIGlmICh0eXBlb2YgZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRbRXZlbnRUeXBlW2VdXSA9IGxpc3RlbmVyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudFtlXSA9IGxpc3RlbmVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQgJiYgdHlwZW9mIHRoaXMuZXZlbnRbZS50eXBlXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRbZS50eXBlXShlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5raWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aGlsZSAoIXRoaXMudGljaygpKVxuICAgICAgICAgICAgO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fYWxwaGEgPCB0aGlzLl90aHJlc2hvbGQpIHtcbiAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih7IHR5cGU6IEV2ZW50VHlwZS5lbmQsIGFscGhhOiB0aGlzLl9hbHBoYSA9IDAsIHN0cmVzczogdGhpcy5fbGFzdFN0cmVzcyB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuID0gdGhpcy5fbm9kZXMubGVuZ3RoLCBtID0gdGhpcy5fbGlua3MubGVuZ3RoO1xuICAgICAgICB2YXIgbywgaTtcbiAgICAgICAgdGhpcy5fZGVzY2VudC5sb2Nrcy5jbGVhcigpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBvID0gdGhpcy5fbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAoby5maXhlZCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygby5weCA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIG8ucHkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8ucHggPSBvLng7XG4gICAgICAgICAgICAgICAgICAgIG8ucHkgPSBvLnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBwID0gW28ucHgsIG8ucHldO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuYWRkKGksIHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBzMSA9IHRoaXMuX2Rlc2NlbnQucnVuZ2VLdXR0YSgpO1xuICAgICAgICBpZiAoczEgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2FscGhhID0gMDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgdGhpcy5fbGFzdFN0cmVzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuX2FscGhhID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGFzdFN0cmVzcyA9IHMxO1xuICAgICAgICB0aGlzLnVwZGF0ZU5vZGVQb3NpdGlvbnMoKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHsgdHlwZTogRXZlbnRUeXBlLnRpY2ssIGFscGhhOiB0aGlzLl9hbHBoYSwgc3RyZXNzOiB0aGlzLl9sYXN0U3RyZXNzIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnVwZGF0ZU5vZGVQb3NpdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy5fZGVzY2VudC54WzBdLCB5ID0gdGhpcy5fZGVzY2VudC54WzFdO1xuICAgICAgICB2YXIgbywgaSA9IHRoaXMuX25vZGVzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgbyA9IHRoaXMuX25vZGVzW2ldO1xuICAgICAgICAgICAgby54ID0geFtpXTtcbiAgICAgICAgICAgIG8ueSA9IHlbaV07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubm9kZXMgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIXYpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9ub2Rlcy5sZW5ndGggPT09IDAgJiYgdGhpcy5fbGlua3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBuID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLl9saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICAgICAgICAgIG4gPSBNYXRoLm1heChuLCBsLnNvdXJjZSwgbC50YXJnZXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGVzID0gbmV3IEFycmF5KCsrbik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbm9kZXNbaV0gPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbm9kZXMgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZ3JvdXBzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dyb3VwcztcbiAgICAgICAgdGhpcy5fZ3JvdXBzID0geDtcbiAgICAgICAgdGhpcy5fcm9vdEdyb3VwID0ge307XG4gICAgICAgIHRoaXMuX2dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGcucGFkZGluZyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICBnLnBhZGRpbmcgPSAxO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBnLmxlYXZlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIGcubGVhdmVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIChnLmxlYXZlc1tpXSA9IF90aGlzLl9ub2Rlc1t2XSkucGFyZW50ID0gZztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZy5ncm91cHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBnLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnaSwgaSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdpID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIChnLmdyb3Vwc1tpXSA9IF90aGlzLl9ncm91cHNbZ2ldKS5wYXJlbnQgPSBnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fcm9vdEdyb3VwLmxlYXZlcyA9IHRoaXMuX25vZGVzLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdHlwZW9mIHYucGFyZW50ID09PSAndW5kZWZpbmVkJzsgfSk7XG4gICAgICAgIHRoaXMuX3Jvb3RHcm91cC5ncm91cHMgPSB0aGlzLl9ncm91cHMuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiB0eXBlb2YgZy5wYXJlbnQgPT09ICd1bmRlZmluZWQnOyB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnBvd2VyR3JhcGhHcm91cHMgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB2YXIgZyA9IHBvd2VyZ3JhcGguZ2V0R3JvdXBzKHRoaXMuX25vZGVzLCB0aGlzLl9saW5rcywgdGhpcy5saW5rQWNjZXNzb3IsIHRoaXMuX3Jvb3RHcm91cCk7XG4gICAgICAgIHRoaXMuZ3JvdXBzKGcuZ3JvdXBzKTtcbiAgICAgICAgZihnKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmF2b2lkT3ZlcmxhcHMgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYXZvaWRPdmVybGFwcztcbiAgICAgICAgdGhpcy5fYXZvaWRPdmVybGFwcyA9IHY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5oYW5kbGVEaXNjb25uZWN0ZWQgPSBmdW5jdGlvbiAodikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkO1xuICAgICAgICB0aGlzLl9oYW5kbGVEaXNjb25uZWN0ZWQgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZmxvd0xheW91dCA9IGZ1bmN0aW9uIChheGlzLCBtaW5TZXBhcmF0aW9uKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIGF4aXMgPSAneSc7XG4gICAgICAgIHRoaXMuX2RpcmVjdGVkTGlua0NvbnN0cmFpbnRzID0ge1xuICAgICAgICAgICAgYXhpczogYXhpcyxcbiAgICAgICAgICAgIGdldE1pblNlcGFyYXRpb246IHR5cGVvZiBtaW5TZXBhcmF0aW9uID09PSAnbnVtYmVyJyA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1pblNlcGFyYXRpb247IH0gOiBtaW5TZXBhcmF0aW9uXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5saW5rcyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9saW5rcztcbiAgICAgICAgdGhpcy5fbGlua3MgPSB4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuY29uc3RyYWludHMgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludHM7XG4gICAgICAgIHRoaXMuX2NvbnN0cmFpbnRzID0gYztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmRpc3RhbmNlTWF0cml4ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc3RhbmNlTWF0cml4O1xuICAgICAgICB0aGlzLl9kaXN0YW5jZU1hdHJpeCA9IGQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbnZhc1NpemU7XG4gICAgICAgIHRoaXMuX2NhbnZhc1NpemUgPSB4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZGVmYXVsdE5vZGVTaXplID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlZmF1bHROb2RlU2l6ZTtcbiAgICAgICAgdGhpcy5fZGVmYXVsdE5vZGVTaXplID0geDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmdyb3VwQ29tcGFjdG5lc3MgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIXgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ3JvdXBDb21wYWN0bmVzcztcbiAgICAgICAgdGhpcy5fZ3JvdXBDb21wYWN0bmVzcyA9IHg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5saW5rRGlzdGFuY2UgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIXgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9saW5rRGlzdGFuY2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGlua0Rpc3RhbmNlID0gdHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIiA/IHggOiAreDtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBudWxsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubGlua1R5cGUgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB0aGlzLl9saW5rVHlwZSA9IGY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5jb252ZXJnZW5jZVRocmVzaG9sZCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICgheClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90aHJlc2hvbGQ7XG4gICAgICAgIHRoaXMuX3RocmVzaG9sZCA9IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIgPyB4IDogK3g7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5hbHBoYSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hbHBoYTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB4ID0gK3g7XG4gICAgICAgICAgICBpZiAodGhpcy5fYWxwaGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoeCA+IDApXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FscGhhID0geDtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FscGhhID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHggPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoeyB0eXBlOiBFdmVudFR5cGUuc3RhcnQsIGFscGhhOiB0aGlzLl9hbHBoYSA9IHggfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMua2ljaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmdldExpbmtMZW5ndGggPSBmdW5jdGlvbiAobGluaykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMuX2xpbmtEaXN0YW5jZSA9PT0gXCJmdW5jdGlvblwiID8gKyh0aGlzLl9saW5rRGlzdGFuY2UobGluaykpIDogdGhpcy5fbGlua0Rpc3RhbmNlO1xuICAgIH07XG4gICAgTGF5b3V0LnNldExpbmtMZW5ndGggPSBmdW5jdGlvbiAobGluaywgbGVuZ3RoKSB7XG4gICAgICAgIGxpbmsubGVuZ3RoID0gbGVuZ3RoO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5nZXRMaW5rVHlwZSA9IGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdGhpcy5fbGlua1R5cGUgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMuX2xpbmtUeXBlKGxpbmspIDogMDtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzID0gZnVuY3Rpb24gKGlkZWFsTGVuZ3RoLCB3KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh3ID09PSB2b2lkIDApIHsgdyA9IDE7IH1cbiAgICAgICAgdGhpcy5saW5rRGlzdGFuY2UoZnVuY3Rpb24gKGwpIHsgcmV0dXJuIGlkZWFsTGVuZ3RoICogbC5sZW5ndGg7IH0pO1xuICAgICAgICB0aGlzLl9saW5rTGVuZ3RoQ2FsY3VsYXRvciA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGxpbmtsZW5ndGhzXzEuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKF90aGlzLl9saW5rcywgX3RoaXMubGlua0FjY2Vzc29yLCB3KTsgfTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmphY2NhcmRMaW5rTGVuZ3RocyA9IGZ1bmN0aW9uIChpZGVhbExlbmd0aCwgdykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodyA9PT0gdm9pZCAwKSB7IHcgPSAxOyB9XG4gICAgICAgIHRoaXMubGlua0Rpc3RhbmNlKGZ1bmN0aW9uIChsKSB7IHJldHVybiBpZGVhbExlbmd0aCAqIGwubGVuZ3RoOyB9KTtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBsaW5rbGVuZ3Roc18xLmphY2NhcmRMaW5rTGVuZ3RocyhfdGhpcy5fbGlua3MsIF90aGlzLmxpbmtBY2Nlc3Nvciwgdyk7IH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIChpbml0aWFsVW5jb25zdHJhaW5lZEl0ZXJhdGlvbnMsIGluaXRpYWxVc2VyQ29uc3RyYWludEl0ZXJhdGlvbnMsIGluaXRpYWxBbGxDb25zdHJhaW50c0l0ZXJhdGlvbnMsIGdyaWRTbmFwSXRlcmF0aW9ucywga2VlcFJ1bm5pbmcpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGluaXRpYWxVbmNvbnN0cmFpbmVkSXRlcmF0aW9ucyA9PT0gdm9pZCAwKSB7IGluaXRpYWxVbmNvbnN0cmFpbmVkSXRlcmF0aW9ucyA9IDA7IH1cbiAgICAgICAgaWYgKGluaXRpYWxVc2VyQ29uc3RyYWludEl0ZXJhdGlvbnMgPT09IHZvaWQgMCkgeyBpbml0aWFsVXNlckNvbnN0cmFpbnRJdGVyYXRpb25zID0gMDsgfVxuICAgICAgICBpZiAoaW5pdGlhbEFsbENvbnN0cmFpbnRzSXRlcmF0aW9ucyA9PT0gdm9pZCAwKSB7IGluaXRpYWxBbGxDb25zdHJhaW50c0l0ZXJhdGlvbnMgPSAwOyB9XG4gICAgICAgIGlmIChncmlkU25hcEl0ZXJhdGlvbnMgPT09IHZvaWQgMCkgeyBncmlkU25hcEl0ZXJhdGlvbnMgPSAwOyB9XG4gICAgICAgIGlmIChrZWVwUnVubmluZyA9PT0gdm9pZCAwKSB7IGtlZXBSdW5uaW5nID0gdHJ1ZTsgfVxuICAgICAgICB2YXIgaSwgaiwgbiA9IHRoaXMubm9kZXMoKS5sZW5ndGgsIE4gPSBuICsgMiAqIHRoaXMuX2dyb3Vwcy5sZW5ndGgsIG0gPSB0aGlzLl9saW5rcy5sZW5ndGgsIHcgPSB0aGlzLl9jYW52YXNTaXplWzBdLCBoID0gdGhpcy5fY2FudmFzU2l6ZVsxXTtcbiAgICAgICAgdmFyIHggPSBuZXcgQXJyYXkoTiksIHkgPSBuZXcgQXJyYXkoTik7XG4gICAgICAgIHZhciBHID0gbnVsbDtcbiAgICAgICAgdmFyIGFvID0gdGhpcy5fYXZvaWRPdmVybGFwcztcbiAgICAgICAgdGhpcy5fbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgdi5pbmRleCA9IGk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHYueCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB2LnggPSB3IC8gMiwgdi55ID0gaCAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4W2ldID0gdi54LCB5W2ldID0gdi55O1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuX2xpbmtMZW5ndGhDYWxjdWxhdG9yKVxuICAgICAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IoKTtcbiAgICAgICAgdmFyIGRpc3RhbmNlcztcbiAgICAgICAgaWYgKHRoaXMuX2Rpc3RhbmNlTWF0cml4KSB7XG4gICAgICAgICAgICBkaXN0YW5jZXMgPSB0aGlzLl9kaXN0YW5jZU1hdHJpeDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRpc3RhbmNlcyA9IChuZXcgc2hvcnRlc3RwYXRoc18xLkNhbGN1bGF0b3IoTiwgdGhpcy5fbGlua3MsIExheW91dC5nZXRTb3VyY2VJbmRleCwgTGF5b3V0LmdldFRhcmdldEluZGV4LCBmdW5jdGlvbiAobCkgeyByZXR1cm4gX3RoaXMuZ2V0TGlua0xlbmd0aChsKTsgfSkpLkRpc3RhbmNlTWF0cml4KCk7XG4gICAgICAgICAgICBHID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KE4sIGZ1bmN0aW9uICgpIHsgcmV0dXJuIDI7IH0pO1xuICAgICAgICAgICAgdGhpcy5fbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbC5zb3VyY2UgPT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgICAgICAgICAgbC5zb3VyY2UgPSBfdGhpcy5fbm9kZXNbbC5zb3VyY2VdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbC50YXJnZXQgPT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgICAgICAgICAgbC50YXJnZXQgPSBfdGhpcy5fbm9kZXNbbC50YXJnZXRdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHUgPSBMYXlvdXQuZ2V0U291cmNlSW5kZXgoZSksIHYgPSBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgICAgICAgICAgICAgR1t1XVt2XSA9IEdbdl1bdV0gPSBlLndlaWdodCB8fCAxO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIEQgPSBkZXNjZW50XzEuRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXgoTiwgZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgICAgIHJldHVybiBkaXN0YW5jZXNbaV1bal07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fcm9vdEdyb3VwICYmIHR5cGVvZiB0aGlzLl9yb290R3JvdXAuZ3JvdXBzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdmFyIGkgPSBuO1xuICAgICAgICAgICAgdmFyIGFkZEF0dHJhY3Rpb24gPSBmdW5jdGlvbiAoaSwgaiwgc3RyZW5ndGgsIGlkZWFsRGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBHW2ldW2pdID0gR1tqXVtpXSA9IHN0cmVuZ3RoO1xuICAgICAgICAgICAgICAgIERbaV1bal0gPSBEW2pdW2ldID0gaWRlYWxEaXN0YW5jZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgICAgIGFkZEF0dHJhY3Rpb24oaSwgaSArIDEsIF90aGlzLl9ncm91cENvbXBhY3RuZXNzLCAwLjEpO1xuICAgICAgICAgICAgICAgIHhbaV0gPSAwLCB5W2krK10gPSAwO1xuICAgICAgICAgICAgICAgIHhbaV0gPSAwLCB5W2krK10gPSAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5fcm9vdEdyb3VwID0geyBsZWF2ZXM6IHRoaXMuX25vZGVzLCBncm91cHM6IFtdIH07XG4gICAgICAgIHZhciBjdXJDb25zdHJhaW50cyA9IHRoaXMuX2NvbnN0cmFpbnRzIHx8IFtdO1xuICAgICAgICBpZiAodGhpcy5fZGlyZWN0ZWRMaW5rQ29uc3RyYWludHMpIHtcbiAgICAgICAgICAgIHRoaXMubGlua0FjY2Vzc29yLmdldE1pblNlcGFyYXRpb24gPSB0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cy5nZXRNaW5TZXBhcmF0aW9uO1xuICAgICAgICAgICAgY3VyQ29uc3RyYWludHMgPSBjdXJDb25zdHJhaW50cy5jb25jYXQobGlua2xlbmd0aHNfMS5nZW5lcmF0ZURpcmVjdGVkRWRnZUNvbnN0cmFpbnRzKG4sIHRoaXMuX2xpbmtzLCB0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cy5heGlzLCAodGhpcy5saW5rQWNjZXNzb3IpKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdm9pZE92ZXJsYXBzKGZhbHNlKTtcbiAgICAgICAgdGhpcy5fZGVzY2VudCA9IG5ldyBkZXNjZW50XzEuRGVzY2VudChbeCwgeV0sIEQpO1xuICAgICAgICB0aGlzLl9kZXNjZW50LmxvY2tzLmNsZWFyKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMuX25vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKG8uZml4ZWQpIHtcbiAgICAgICAgICAgICAgICBvLnB4ID0gby54O1xuICAgICAgICAgICAgICAgIG8ucHkgPSBvLnk7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBbby54LCBvLnldO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuYWRkKGksIHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQudGhyZXNob2xkID0gdGhpcy5fdGhyZXNob2xkO1xuICAgICAgICB0aGlzLmluaXRpYWxMYXlvdXQoaW5pdGlhbFVuY29uc3RyYWluZWRJdGVyYXRpb25zLCB4LCB5KTtcbiAgICAgICAgaWYgKGN1ckNvbnN0cmFpbnRzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnByb2plY3QgPSBuZXcgcmVjdGFuZ2xlXzEuUHJvamVjdGlvbih0aGlzLl9ub2RlcywgdGhpcy5fZ3JvdXBzLCB0aGlzLl9yb290R3JvdXAsIGN1ckNvbnN0cmFpbnRzKS5wcm9qZWN0RnVuY3Rpb25zKCk7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGluaXRpYWxVc2VyQ29uc3RyYWludEl0ZXJhdGlvbnMpO1xuICAgICAgICB0aGlzLnNlcGFyYXRlT3ZlcmxhcHBpbmdDb21wb25lbnRzKHcsIGgpO1xuICAgICAgICB0aGlzLmF2b2lkT3ZlcmxhcHMoYW8pO1xuICAgICAgICBpZiAoYW8pIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgdi54ID0geFtpXSwgdi55ID0geVtpXTsgfSk7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnByb2plY3QgPSBuZXcgcmVjdGFuZ2xlXzEuUHJvamVjdGlvbih0aGlzLl9ub2RlcywgdGhpcy5fZ3JvdXBzLCB0aGlzLl9yb290R3JvdXAsIGN1ckNvbnN0cmFpbnRzLCB0cnVlKS5wcm9qZWN0RnVuY3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHhbaV0gPSB2LngsIHlbaV0gPSB2Lnk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQuRyA9IEc7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGluaXRpYWxBbGxDb25zdHJhaW50c0l0ZXJhdGlvbnMpO1xuICAgICAgICBpZiAoZ3JpZFNuYXBJdGVyYXRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnNuYXBTdHJlbmd0aCA9IDEwMDA7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnNuYXBHcmlkU2l6ZSA9IHRoaXMuX25vZGVzWzBdLndpZHRoO1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5udW1HcmlkU25hcE5vZGVzID0gbjtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQuc2NhbGVTbmFwQnlNYXhIID0gbiAhPSBOO1xuICAgICAgICAgICAgdmFyIEcwID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KE4sIGZ1bmN0aW9uIChpLCBqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPj0gbiB8fCBqID49IG4pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBHW2ldW2pdO1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LkcgPSBHMDtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGdyaWRTbmFwSXRlcmF0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVOb2RlUG9zaXRpb25zKCk7XG4gICAgICAgIHRoaXMuc2VwYXJhdGVPdmVybGFwcGluZ0NvbXBvbmVudHModywgaCk7XG4gICAgICAgIHJldHVybiBrZWVwUnVubmluZyA/IHRoaXMucmVzdW1lKCkgOiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5pbml0aWFsTGF5b3V0ID0gZnVuY3Rpb24gKGl0ZXJhdGlvbnMsIHgsIHkpIHtcbiAgICAgICAgaWYgKHRoaXMuX2dyb3Vwcy5sZW5ndGggPiAwICYmIGl0ZXJhdGlvbnMgPiAwKSB7XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMuX25vZGVzLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBlZGdlcyA9IHRoaXMuX2xpbmtzLm1hcChmdW5jdGlvbiAoZSkgeyByZXR1cm4gKHsgc291cmNlOiBlLnNvdXJjZS5pbmRleCwgdGFyZ2V0OiBlLnRhcmdldC5pbmRleCB9KTsgfSk7XG4gICAgICAgICAgICB2YXIgdnMgPSB0aGlzLl9ub2Rlcy5tYXAoZnVuY3Rpb24gKHYpIHsgcmV0dXJuICh7IGluZGV4OiB2LmluZGV4IH0pOyB9KTtcbiAgICAgICAgICAgIHRoaXMuX2dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnLCBpKSB7XG4gICAgICAgICAgICAgICAgdnMucHVzaCh7IGluZGV4OiBnLmluZGV4ID0gbiArIGkgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX2dyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnLCBpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICAgICAgICAgIGcubGVhdmVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgcmV0dXJuIGVkZ2VzLnB1c2goeyBzb3VyY2U6IGcuaW5kZXgsIHRhcmdldDogdi5pbmRleCB9KTsgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICAgICAgICAgIGcuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdnKSB7IHJldHVybiBlZGdlcy5wdXNoKHsgc291cmNlOiBnLmluZGV4LCB0YXJnZXQ6IGdnLmluZGV4IH0pOyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbmV3IExheW91dCgpXG4gICAgICAgICAgICAgICAgLnNpemUodGhpcy5zaXplKCkpXG4gICAgICAgICAgICAgICAgLm5vZGVzKHZzKVxuICAgICAgICAgICAgICAgIC5saW5rcyhlZGdlcylcbiAgICAgICAgICAgICAgICAuYXZvaWRPdmVybGFwcyhmYWxzZSlcbiAgICAgICAgICAgICAgICAubGlua0Rpc3RhbmNlKHRoaXMubGlua0Rpc3RhbmNlKCkpXG4gICAgICAgICAgICAgICAgLnN5bW1ldHJpY0RpZmZMaW5rTGVuZ3Rocyg1KVxuICAgICAgICAgICAgICAgIC5jb252ZXJnZW5jZVRocmVzaG9sZCgxZS00KVxuICAgICAgICAgICAgICAgIC5zdGFydChpdGVyYXRpb25zLCAwLCAwLCAwLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgeFt2LmluZGV4XSA9IHZzW3YuaW5kZXhdLng7XG4gICAgICAgICAgICAgICAgeVt2LmluZGV4XSA9IHZzW3YuaW5kZXhdLnk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGl0ZXJhdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnNlcGFyYXRlT3ZlcmxhcHBpbmdDb21wb25lbnRzID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCF0aGlzLl9kaXN0YW5jZU1hdHJpeCAmJiB0aGlzLl9oYW5kbGVEaXNjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHZhciB4XzEgPSB0aGlzLl9kZXNjZW50LnhbMF0sIHlfMSA9IHRoaXMuX2Rlc2NlbnQueFsxXTtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgdi54ID0geF8xW2ldLCB2LnkgPSB5XzFbaV07IH0pO1xuICAgICAgICAgICAgdmFyIGdyYXBocyA9IGhhbmRsZWRpc2Nvbm5lY3RlZF8xLnNlcGFyYXRlR3JhcGhzKHRoaXMuX25vZGVzLCB0aGlzLl9saW5rcyk7XG4gICAgICAgICAgICBoYW5kbGVkaXNjb25uZWN0ZWRfMS5hcHBseVBhY2tpbmcoZ3JhcGhzLCB3aWR0aCwgaGVpZ2h0LCB0aGlzLl9kZWZhdWx0Tm9kZVNpemUpO1xuICAgICAgICAgICAgdGhpcy5fbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgICAgIF90aGlzLl9kZXNjZW50LnhbMF1baV0gPSB2LngsIF90aGlzLl9kZXNjZW50LnhbMV1baV0gPSB2Lnk7XG4gICAgICAgICAgICAgICAgaWYgKHYuYm91bmRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHYuYm91bmRzLnNldFhDZW50cmUodi54KTtcbiAgICAgICAgICAgICAgICAgICAgdi5ib3VuZHMuc2V0WUNlbnRyZSh2LnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWxwaGEoMC4xKTtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWxwaGEoMCk7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnByZXBhcmVFZGdlUm91dGluZyA9IGZ1bmN0aW9uIChub2RlTWFyZ2luKSB7XG4gICAgICAgIGlmIChub2RlTWFyZ2luID09PSB2b2lkIDApIHsgbm9kZU1hcmdpbiA9IDA7IH1cbiAgICAgICAgdGhpcy5fdmlzaWJpbGl0eUdyYXBoID0gbmV3IGdlb21fMS5UYW5nZW50VmlzaWJpbGl0eUdyYXBoKHRoaXMuX25vZGVzLm1hcChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmV0dXJuIHYuYm91bmRzLmluZmxhdGUoLW5vZGVNYXJnaW4pLnZlcnRpY2VzKCk7XG4gICAgICAgIH0pKTtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUucm91dGVFZGdlID0gZnVuY3Rpb24gKGVkZ2UsIGRyYXcpIHtcbiAgICAgICAgdmFyIGxpbmVEYXRhID0gW107XG4gICAgICAgIHZhciB2ZzIgPSBuZXcgZ2VvbV8xLlRhbmdlbnRWaXNpYmlsaXR5R3JhcGgodGhpcy5fdmlzaWJpbGl0eUdyYXBoLlAsIHsgVjogdGhpcy5fdmlzaWJpbGl0eUdyYXBoLlYsIEU6IHRoaXMuX3Zpc2liaWxpdHlHcmFwaC5FIH0pLCBwb3J0MSA9IHsgeDogZWRnZS5zb3VyY2UueCwgeTogZWRnZS5zb3VyY2UueSB9LCBwb3J0MiA9IHsgeDogZWRnZS50YXJnZXQueCwgeTogZWRnZS50YXJnZXQueSB9LCBzdGFydCA9IHZnMi5hZGRQb2ludChwb3J0MSwgZWRnZS5zb3VyY2UuaW5kZXgpLCBlbmQgPSB2ZzIuYWRkUG9pbnQocG9ydDIsIGVkZ2UudGFyZ2V0LmluZGV4KTtcbiAgICAgICAgdmcyLmFkZEVkZ2VJZlZpc2libGUocG9ydDEsIHBvcnQyLCBlZGdlLnNvdXJjZS5pbmRleCwgZWRnZS50YXJnZXQuaW5kZXgpO1xuICAgICAgICBpZiAodHlwZW9mIGRyYXcgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBkcmF3KHZnMik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNvdXJjZUluZCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNvdXJjZS5pZDsgfSwgdGFyZ2V0SW5kID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0LmlkOyB9LCBsZW5ndGggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGgoKTsgfSwgc3BDYWxjID0gbmV3IHNob3J0ZXN0cGF0aHNfMS5DYWxjdWxhdG9yKHZnMi5WLmxlbmd0aCwgdmcyLkUsIHNvdXJjZUluZCwgdGFyZ2V0SW5kLCBsZW5ndGgpLCBzaG9ydGVzdFBhdGggPSBzcENhbGMuUGF0aEZyb21Ob2RlVG9Ob2RlKHN0YXJ0LmlkLCBlbmQuaWQpO1xuICAgICAgICBpZiAoc2hvcnRlc3RQYXRoLmxlbmd0aCA9PT0gMSB8fCBzaG9ydGVzdFBhdGgubGVuZ3RoID09PSB2ZzIuVi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciByb3V0ZSA9IHJlY3RhbmdsZV8xLm1ha2VFZGdlQmV0d2VlbihlZGdlLnNvdXJjZS5pbm5lckJvdW5kcywgZWRnZS50YXJnZXQuaW5uZXJCb3VuZHMsIDUpO1xuICAgICAgICAgICAgbGluZURhdGEgPSBbcm91dGUuc291cmNlSW50ZXJzZWN0aW9uLCByb3V0ZS5hcnJvd1N0YXJ0XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBuID0gc2hvcnRlc3RQYXRoLmxlbmd0aCAtIDIsIHAgPSB2ZzIuVltzaG9ydGVzdFBhdGhbbl1dLnAsIHEgPSB2ZzIuVltzaG9ydGVzdFBhdGhbMF1dLnAsIGxpbmVEYXRhID0gW2VkZ2Uuc291cmNlLmlubmVyQm91bmRzLnJheUludGVyc2VjdGlvbihwLngsIHAueSldO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IG47IGkgPj0gMDsgLS1pKVxuICAgICAgICAgICAgICAgIGxpbmVEYXRhLnB1c2godmcyLlZbc2hvcnRlc3RQYXRoW2ldXS5wKTtcbiAgICAgICAgICAgIGxpbmVEYXRhLnB1c2gocmVjdGFuZ2xlXzEubWFrZUVkZ2VUbyhxLCBlZGdlLnRhcmdldC5pbm5lckJvdW5kcywgNSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaW5lRGF0YTtcbiAgICB9O1xuICAgIExheW91dC5nZXRTb3VyY2VJbmRleCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgZS5zb3VyY2UgPT09ICdudW1iZXInID8gZS5zb3VyY2UgOiBlLnNvdXJjZS5pbmRleDtcbiAgICB9O1xuICAgIExheW91dC5nZXRUYXJnZXRJbmRleCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgZS50YXJnZXQgPT09ICdudW1iZXInID8gZS50YXJnZXQgOiBlLnRhcmdldC5pbmRleDtcbiAgICB9O1xuICAgIExheW91dC5saW5rSWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gTGF5b3V0LmdldFNvdXJjZUluZGV4KGUpICsgXCItXCIgKyBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgfTtcbiAgICBMYXlvdXQuZHJhZ1N0YXJ0ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKGlzR3JvdXAoZCkpIHtcbiAgICAgICAgICAgIExheW91dC5zdG9yZU9mZnNldChkLCBMYXlvdXQuZHJhZ09yaWdpbihkKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBMYXlvdXQuc3RvcE5vZGUoZCk7XG4gICAgICAgICAgICBkLmZpeGVkIHw9IDI7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5zdG9wTm9kZSA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHYucHggPSB2Lng7XG4gICAgICAgIHYucHkgPSB2Lnk7XG4gICAgfTtcbiAgICBMYXlvdXQuc3RvcmVPZmZzZXQgPSBmdW5jdGlvbiAoZCwgb3JpZ2luKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBkLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdi5maXhlZCB8PSAyO1xuICAgICAgICAgICAgICAgIExheW91dC5zdG9wTm9kZSh2KTtcbiAgICAgICAgICAgICAgICB2Ll9kcmFnR3JvdXBPZmZzZXRYID0gdi54IC0gb3JpZ2luLng7XG4gICAgICAgICAgICAgICAgdi5fZHJhZ0dyb3VwT2Zmc2V0WSA9IHYueSAtIG9yaWdpbi55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGQuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcpIHsgcmV0dXJuIExheW91dC5zdG9yZU9mZnNldChnLCBvcmlnaW4pOyB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LmRyYWdPcmlnaW4gPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBpZiAoaXNHcm91cChkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBkLmJvdW5kcy5jeCgpLFxuICAgICAgICAgICAgICAgIHk6IGQuYm91bmRzLmN5KClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LmRyYWcgPSBmdW5jdGlvbiAoZCwgcG9zaXRpb24pIHtcbiAgICAgICAgaWYgKGlzR3JvdXAoZCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZC5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBkLmJvdW5kcy5zZXRYQ2VudHJlKHBvc2l0aW9uLngpO1xuICAgICAgICAgICAgICAgICAgICBkLmJvdW5kcy5zZXRZQ2VudHJlKHBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICB2LnB4ID0gdi5fZHJhZ0dyb3VwT2Zmc2V0WCArIHBvc2l0aW9uLng7XG4gICAgICAgICAgICAgICAgICAgIHYucHkgPSB2Ll9kcmFnR3JvdXBPZmZzZXRZICsgcG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5ncm91cHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZC5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykgeyByZXR1cm4gTGF5b3V0LmRyYWcoZywgcG9zaXRpb24pOyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGQucHggPSBwb3NpdGlvbi54O1xuICAgICAgICAgICAgZC5weSA9IHBvc2l0aW9uLnk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5kcmFnRW5kID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKGlzR3JvdXAoZCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZC5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBMYXlvdXQuZHJhZ0VuZCh2KTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHYuX2RyYWdHcm91cE9mZnNldFg7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB2Ll9kcmFnR3JvdXBPZmZzZXRZO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkLmdyb3Vwcy5mb3JFYWNoKExheW91dC5kcmFnRW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGQuZml4ZWQgJj0gfjY7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5tb3VzZU92ZXIgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLmZpeGVkIHw9IDQ7XG4gICAgICAgIGQucHggPSBkLngsIGQucHkgPSBkLnk7XG4gICAgfTtcbiAgICBMYXlvdXQubW91c2VPdXQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLmZpeGVkICY9IH40O1xuICAgIH07XG4gICAgcmV0dXJuIExheW91dDtcbn0oKSk7XG5leHBvcnRzLkxheW91dCA9IExheW91dDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWxheW91dC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzaG9ydGVzdHBhdGhzXzEgPSByZXF1aXJlKFwiLi9zaG9ydGVzdHBhdGhzXCIpO1xudmFyIGRlc2NlbnRfMSA9IHJlcXVpcmUoXCIuL2Rlc2NlbnRcIik7XG52YXIgcmVjdGFuZ2xlXzEgPSByZXF1aXJlKFwiLi9yZWN0YW5nbGVcIik7XG52YXIgbGlua2xlbmd0aHNfMSA9IHJlcXVpcmUoXCIuL2xpbmtsZW5ndGhzXCIpO1xudmFyIExpbmszRCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGluazNEKHNvdXJjZSwgdGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB9XG4gICAgTGluazNELnByb3RvdHlwZS5hY3R1YWxMZW5ndGggPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHgucmVkdWNlKGZ1bmN0aW9uIChjLCB2KSB7XG4gICAgICAgICAgICB2YXIgZHggPSB2W190aGlzLnRhcmdldF0gLSB2W190aGlzLnNvdXJjZV07XG4gICAgICAgICAgICByZXR1cm4gYyArIGR4ICogZHg7XG4gICAgICAgIH0sIDApKTtcbiAgICB9O1xuICAgIHJldHVybiBMaW5rM0Q7XG59KCkpO1xuZXhwb3J0cy5MaW5rM0QgPSBMaW5rM0Q7XG52YXIgTm9kZTNEID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlM0QoeCwgeSwgeikge1xuICAgICAgICBpZiAoeCA9PT0gdm9pZCAwKSB7IHggPSAwOyB9XG4gICAgICAgIGlmICh5ID09PSB2b2lkIDApIHsgeSA9IDA7IH1cbiAgICAgICAgaWYgKHogPT09IHZvaWQgMCkgeyB6ID0gMDsgfVxuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLnogPSB6O1xuICAgIH1cbiAgICByZXR1cm4gTm9kZTNEO1xufSgpKTtcbmV4cG9ydHMuTm9kZTNEID0gTm9kZTNEO1xudmFyIExheW91dDNEID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMYXlvdXQzRChub2RlcywgbGlua3MsIGlkZWFsTGlua0xlbmd0aCkge1xuICAgICAgICBpZiAoaWRlYWxMaW5rTGVuZ3RoID09PSB2b2lkIDApIHsgaWRlYWxMaW5rTGVuZ3RoID0gMTsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgICAgIHRoaXMubGlua3MgPSBsaW5rcztcbiAgICAgICAgdGhpcy5pZGVhbExpbmtMZW5ndGggPSBpZGVhbExpbmtMZW5ndGg7XG4gICAgICAgIHRoaXMuY29uc3RyYWludHMgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZUphY2NhcmRMaW5rTGVuZ3RocyA9IHRydWU7XG4gICAgICAgIHRoaXMucmVzdWx0ID0gbmV3IEFycmF5KExheW91dDNELmspO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IExheW91dDNELms7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5yZXN1bHRbaV0gPSBuZXcgQXJyYXkobm9kZXMubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gTGF5b3V0M0QuZGltczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZGltID0gX2FbX2ldO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdltkaW1dID09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgICAgICB2W2RpbV0gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMucmVzdWx0WzBdW2ldID0gdi54O1xuICAgICAgICAgICAgX3RoaXMucmVzdWx0WzFdW2ldID0gdi55O1xuICAgICAgICAgICAgX3RoaXMucmVzdWx0WzJdW2ldID0gdi56O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgO1xuICAgIExheW91dDNELnByb3RvdHlwZS5saW5rTGVuZ3RoID0gZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgcmV0dXJuIGwuYWN0dWFsTGVuZ3RoKHRoaXMucmVzdWx0KTtcbiAgICB9O1xuICAgIExheW91dDNELnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIChpdGVyYXRpb25zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChpdGVyYXRpb25zID09PSB2b2lkIDApIHsgaXRlcmF0aW9ucyA9IDEwMDsgfVxuICAgICAgICB2YXIgbiA9IHRoaXMubm9kZXMubGVuZ3RoO1xuICAgICAgICB2YXIgbGlua0FjY2Vzc29yID0gbmV3IExpbmtBY2Nlc3NvcigpO1xuICAgICAgICBpZiAodGhpcy51c2VKYWNjYXJkTGlua0xlbmd0aHMpXG4gICAgICAgICAgICBsaW5rbGVuZ3Roc18xLmphY2NhcmRMaW5rTGVuZ3Rocyh0aGlzLmxpbmtzLCBsaW5rQWNjZXNzb3IsIDEuNSk7XG4gICAgICAgIHRoaXMubGlua3MuZm9yRWFjaChmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGggKj0gX3RoaXMuaWRlYWxMaW5rTGVuZ3RoOyB9KTtcbiAgICAgICAgdmFyIGRpc3RhbmNlTWF0cml4ID0gKG5ldyBzaG9ydGVzdHBhdGhzXzEuQ2FsY3VsYXRvcihuLCB0aGlzLmxpbmtzLCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5zb3VyY2U7IH0sIGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldDsgfSwgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoOyB9KSkuRGlzdGFuY2VNYXRyaXgoKTtcbiAgICAgICAgdmFyIEQgPSBkZXNjZW50XzEuRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXgobiwgZnVuY3Rpb24gKGksIGopIHsgcmV0dXJuIGRpc3RhbmNlTWF0cml4W2ldW2pdOyB9KTtcbiAgICAgICAgdmFyIEcgPSBkZXNjZW50XzEuRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXgobiwgZnVuY3Rpb24gKCkgeyByZXR1cm4gMjsgfSk7XG4gICAgICAgIHRoaXMubGlua3MuZm9yRWFjaChmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBfYS5zb3VyY2UsIHRhcmdldCA9IF9hLnRhcmdldDtcbiAgICAgICAgICAgIHJldHVybiBHW3NvdXJjZV1bdGFyZ2V0XSA9IEdbdGFyZ2V0XVtzb3VyY2VdID0gMTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGVzY2VudCA9IG5ldyBkZXNjZW50XzEuRGVzY2VudCh0aGlzLnJlc3VsdCwgRCk7XG4gICAgICAgIHRoaXMuZGVzY2VudC50aHJlc2hvbGQgPSAxZS0zO1xuICAgICAgICB0aGlzLmRlc2NlbnQuRyA9IEc7XG4gICAgICAgIGlmICh0aGlzLmNvbnN0cmFpbnRzKVxuICAgICAgICAgICAgdGhpcy5kZXNjZW50LnByb2plY3QgPSBuZXcgcmVjdGFuZ2xlXzEuUHJvamVjdGlvbih0aGlzLm5vZGVzLCBudWxsLCBudWxsLCB0aGlzLmNvbnN0cmFpbnRzKS5wcm9qZWN0RnVuY3Rpb25zKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHYgPSB0aGlzLm5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHYuZml4ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc2NlbnQubG9ja3MuYWRkKGksIFt2LngsIHYueSwgdi56XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZXNjZW50LnJ1bihpdGVyYXRpb25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQzRC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5kZXNjZW50LmxvY2tzLmNsZWFyKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHYgPSB0aGlzLm5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKHYuZml4ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc2NlbnQubG9ja3MuYWRkKGksIFt2LngsIHYueSwgdi56XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZGVzY2VudC5ydW5nZUt1dHRhKCk7XG4gICAgfTtcbiAgICBMYXlvdXQzRC5kaW1zID0gWyd4JywgJ3knLCAneiddO1xuICAgIExheW91dDNELmsgPSBMYXlvdXQzRC5kaW1zLmxlbmd0aDtcbiAgICByZXR1cm4gTGF5b3V0M0Q7XG59KCkpO1xuZXhwb3J0cy5MYXlvdXQzRCA9IExheW91dDNEO1xudmFyIExpbmtBY2Nlc3NvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlua0FjY2Vzc29yKCkge1xuICAgIH1cbiAgICBMaW5rQWNjZXNzb3IucHJvdG90eXBlLmdldFNvdXJjZUluZGV4ID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUuc291cmNlOyB9O1xuICAgIExpbmtBY2Nlc3Nvci5wcm90b3R5cGUuZ2V0VGFyZ2V0SW5kZXggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS50YXJnZXQ7IH07XG4gICAgTGlua0FjY2Vzc29yLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5sZW5ndGg7IH07XG4gICAgTGlua0FjY2Vzc29yLnByb3RvdHlwZS5zZXRMZW5ndGggPSBmdW5jdGlvbiAoZSwgbCkgeyBlLmxlbmd0aCA9IGw7IH07XG4gICAgcmV0dXJuIExpbmtBY2Nlc3Nvcjtcbn0oKSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1sYXlvdXQzZC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIHVuaW9uQ291bnQoYSwgYikge1xuICAgIHZhciB1ID0ge307XG4gICAgZm9yICh2YXIgaSBpbiBhKVxuICAgICAgICB1W2ldID0ge307XG4gICAgZm9yICh2YXIgaSBpbiBiKVxuICAgICAgICB1W2ldID0ge307XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHUpLmxlbmd0aDtcbn1cbmZ1bmN0aW9uIGludGVyc2VjdGlvbkNvdW50KGEsIGIpIHtcbiAgICB2YXIgbiA9IDA7XG4gICAgZm9yICh2YXIgaSBpbiBhKVxuICAgICAgICBpZiAodHlwZW9mIGJbaV0gIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgKytuO1xuICAgIHJldHVybiBuO1xufVxuZnVuY3Rpb24gZ2V0TmVpZ2hib3VycyhsaW5rcywgbGEpIHtcbiAgICB2YXIgbmVpZ2hib3VycyA9IHt9O1xuICAgIHZhciBhZGROZWlnaGJvdXJzID0gZnVuY3Rpb24gKHUsIHYpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuZWlnaGJvdXJzW3VdID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIG5laWdoYm91cnNbdV0gPSB7fTtcbiAgICAgICAgbmVpZ2hib3Vyc1t1XVt2XSA9IHt9O1xuICAgIH07XG4gICAgbGlua3MuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgdSA9IGxhLmdldFNvdXJjZUluZGV4KGUpLCB2ID0gbGEuZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgICAgIGFkZE5laWdoYm91cnModSwgdik7XG4gICAgICAgIGFkZE5laWdoYm91cnModiwgdSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5laWdoYm91cnM7XG59XG5mdW5jdGlvbiBjb21wdXRlTGlua0xlbmd0aHMobGlua3MsIHcsIGYsIGxhKSB7XG4gICAgdmFyIG5laWdoYm91cnMgPSBnZXROZWlnaGJvdXJzKGxpbmtzLCBsYSk7XG4gICAgbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICB2YXIgYSA9IG5laWdoYm91cnNbbGEuZ2V0U291cmNlSW5kZXgobCldO1xuICAgICAgICB2YXIgYiA9IG5laWdoYm91cnNbbGEuZ2V0VGFyZ2V0SW5kZXgobCldO1xuICAgICAgICBsYS5zZXRMZW5ndGgobCwgMSArIHcgKiBmKGEsIGIpKTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIHN5bW1ldHJpY0RpZmZMaW5rTGVuZ3RocyhsaW5rcywgbGEsIHcpIHtcbiAgICBpZiAodyA9PT0gdm9pZCAwKSB7IHcgPSAxOyB9XG4gICAgY29tcHV0ZUxpbmtMZW5ndGhzKGxpbmtzLCB3LCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gTWF0aC5zcXJ0KHVuaW9uQ291bnQoYSwgYikgLSBpbnRlcnNlY3Rpb25Db3VudChhLCBiKSk7IH0sIGxhKTtcbn1cbmV4cG9ydHMuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzID0gc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzO1xuZnVuY3Rpb24gamFjY2FyZExpbmtMZW5ndGhzKGxpbmtzLCBsYSwgdykge1xuICAgIGlmICh3ID09PSB2b2lkIDApIHsgdyA9IDE7IH1cbiAgICBjb21wdXRlTGlua0xlbmd0aHMobGlua3MsIHcsIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1pbihPYmplY3Qua2V5cyhhKS5sZW5ndGgsIE9iamVjdC5rZXlzKGIpLmxlbmd0aCkgPCAxLjEgPyAwIDogaW50ZXJzZWN0aW9uQ291bnQoYSwgYikgLyB1bmlvbkNvdW50KGEsIGIpO1xuICAgIH0sIGxhKTtcbn1cbmV4cG9ydHMuamFjY2FyZExpbmtMZW5ndGhzID0gamFjY2FyZExpbmtMZW5ndGhzO1xuZnVuY3Rpb24gZ2VuZXJhdGVEaXJlY3RlZEVkZ2VDb25zdHJhaW50cyhuLCBsaW5rcywgYXhpcywgbGEpIHtcbiAgICB2YXIgY29tcG9uZW50cyA9IHN0cm9uZ2x5Q29ubmVjdGVkQ29tcG9uZW50cyhuLCBsaW5rcywgbGEpO1xuICAgIHZhciBub2RlcyA9IHt9O1xuICAgIGNvbXBvbmVudHMuZm9yRWFjaChmdW5jdGlvbiAoYywgaSkge1xuICAgICAgICByZXR1cm4gYy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiBub2Rlc1t2XSA9IGk7IH0pO1xuICAgIH0pO1xuICAgIHZhciBjb25zdHJhaW50cyA9IFtdO1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgdmFyIHVpID0gbGEuZ2V0U291cmNlSW5kZXgobCksIHZpID0gbGEuZ2V0VGFyZ2V0SW5kZXgobCksIHUgPSBub2Rlc1t1aV0sIHYgPSBub2Rlc1t2aV07XG4gICAgICAgIGlmICh1ICE9PSB2KSB7XG4gICAgICAgICAgICBjb25zdHJhaW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICBheGlzOiBheGlzLFxuICAgICAgICAgICAgICAgIGxlZnQ6IHVpLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiB2aSxcbiAgICAgICAgICAgICAgICBnYXA6IGxhLmdldE1pblNlcGFyYXRpb24obClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbnN0cmFpbnRzO1xufVxuZXhwb3J0cy5nZW5lcmF0ZURpcmVjdGVkRWRnZUNvbnN0cmFpbnRzID0gZ2VuZXJhdGVEaXJlY3RlZEVkZ2VDb25zdHJhaW50cztcbmZ1bmN0aW9uIHN0cm9uZ2x5Q29ubmVjdGVkQ29tcG9uZW50cyhudW1WZXJ0aWNlcywgZWRnZXMsIGxhKSB7XG4gICAgdmFyIG5vZGVzID0gW107XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc3RhY2sgPSBbXTtcbiAgICB2YXIgY29tcG9uZW50cyA9IFtdO1xuICAgIGZ1bmN0aW9uIHN0cm9uZ0Nvbm5lY3Qodikge1xuICAgICAgICB2LmluZGV4ID0gdi5sb3dsaW5rID0gaW5kZXgrKztcbiAgICAgICAgc3RhY2sucHVzaCh2KTtcbiAgICAgICAgdi5vblN0YWNrID0gdHJ1ZTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHYub3V0OyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIHcgPSBfYVtfaV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIHcuaW5kZXggPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc3Ryb25nQ29ubmVjdCh3KTtcbiAgICAgICAgICAgICAgICB2Lmxvd2xpbmsgPSBNYXRoLm1pbih2Lmxvd2xpbmssIHcubG93bGluayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh3Lm9uU3RhY2spIHtcbiAgICAgICAgICAgICAgICB2Lmxvd2xpbmsgPSBNYXRoLm1pbih2Lmxvd2xpbmssIHcuaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh2Lmxvd2xpbmsgPT09IHYuaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBjb21wb25lbnQgPSBbXTtcbiAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB3ID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgdy5vblN0YWNrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnB1c2godyk7XG4gICAgICAgICAgICAgICAgaWYgKHcgPT09IHYpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudC5tYXAoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYuaWQ7IH0pKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVZlcnRpY2VzOyBpKyspIHtcbiAgICAgICAgbm9kZXMucHVzaCh7IGlkOiBpLCBvdXQ6IFtdIH0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBfaSA9IDAsIGVkZ2VzXzEgPSBlZGdlczsgX2kgPCBlZGdlc18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgZSA9IGVkZ2VzXzFbX2ldO1xuICAgICAgICB2YXIgdl8xID0gbm9kZXNbbGEuZ2V0U291cmNlSW5kZXgoZSldLCB3ID0gbm9kZXNbbGEuZ2V0VGFyZ2V0SW5kZXgoZSldO1xuICAgICAgICB2XzEub3V0LnB1c2godyk7XG4gICAgfVxuICAgIGZvciAodmFyIF9hID0gMCwgbm9kZXNfMSA9IG5vZGVzOyBfYSA8IG5vZGVzXzEubGVuZ3RoOyBfYSsrKSB7XG4gICAgICAgIHZhciB2ID0gbm9kZXNfMVtfYV07XG4gICAgICAgIGlmICh0eXBlb2Ygdi5pbmRleCA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICBzdHJvbmdDb25uZWN0KHYpO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50cztcbn1cbmV4cG9ydHMuc3Ryb25nbHlDb25uZWN0ZWRDb21wb25lbnRzID0gc3Ryb25nbHlDb25uZWN0ZWRDb21wb25lbnRzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGlua2xlbmd0aHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgUG93ZXJFZGdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQb3dlckVkZ2Uoc291cmNlLCB0YXJnZXQsIHR5cGUpIHtcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICByZXR1cm4gUG93ZXJFZGdlO1xufSgpKTtcbmV4cG9ydHMuUG93ZXJFZGdlID0gUG93ZXJFZGdlO1xudmFyIENvbmZpZ3VyYXRpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbmZpZ3VyYXRpb24obiwgZWRnZXMsIGxpbmtBY2Nlc3Nvciwgcm9vdEdyb3VwKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMubGlua0FjY2Vzc29yID0gbGlua0FjY2Vzc29yO1xuICAgICAgICB0aGlzLm1vZHVsZXMgPSBuZXcgQXJyYXkobik7XG4gICAgICAgIHRoaXMucm9vdHMgPSBbXTtcbiAgICAgICAgaWYgKHJvb3RHcm91cCkge1xuICAgICAgICAgICAgdGhpcy5pbml0TW9kdWxlc0Zyb21Hcm91cChyb290R3JvdXApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yb290cy5wdXNoKG5ldyBNb2R1bGVTZXQoKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSlcbiAgICAgICAgICAgICAgICB0aGlzLnJvb3RzWzBdLmFkZCh0aGlzLm1vZHVsZXNbaV0gPSBuZXcgTW9kdWxlKGkpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLlIgPSBlZGdlcy5sZW5ndGg7XG4gICAgICAgIGVkZ2VzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBzID0gX3RoaXMubW9kdWxlc1tsaW5rQWNjZXNzb3IuZ2V0U291cmNlSW5kZXgoZSldLCB0ID0gX3RoaXMubW9kdWxlc1tsaW5rQWNjZXNzb3IuZ2V0VGFyZ2V0SW5kZXgoZSldLCB0eXBlID0gbGlua0FjY2Vzc29yLmdldFR5cGUoZSk7XG4gICAgICAgICAgICBzLm91dGdvaW5nLmFkZCh0eXBlLCB0KTtcbiAgICAgICAgICAgIHQuaW5jb21pbmcuYWRkKHR5cGUsIHMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuaW5pdE1vZHVsZXNGcm9tR3JvdXAgPSBmdW5jdGlvbiAoZ3JvdXApIHtcbiAgICAgICAgdmFyIG1vZHVsZVNldCA9IG5ldyBNb2R1bGVTZXQoKTtcbiAgICAgICAgdGhpcy5yb290cy5wdXNoKG1vZHVsZVNldCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXAubGVhdmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IGdyb3VwLmxlYXZlc1tpXTtcbiAgICAgICAgICAgIHZhciBtb2R1bGUgPSBuZXcgTW9kdWxlKG5vZGUuaWQpO1xuICAgICAgICAgICAgdGhpcy5tb2R1bGVzW25vZGUuaWRdID0gbW9kdWxlO1xuICAgICAgICAgICAgbW9kdWxlU2V0LmFkZChtb2R1bGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncm91cC5ncm91cHMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZ3JvdXAuZ3JvdXBzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gZ3JvdXAuZ3JvdXBzW2pdO1xuICAgICAgICAgICAgICAgIHZhciBkZWZpbml0aW9uID0ge307XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBjaGlsZClcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3AgIT09IFwibGVhdmVzXCIgJiYgcHJvcCAhPT0gXCJncm91cHNcIiAmJiBjaGlsZC5oYXNPd25Qcm9wZXJ0eShwcm9wKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluaXRpb25bcHJvcF0gPSBjaGlsZFtwcm9wXTtcbiAgICAgICAgICAgICAgICBtb2R1bGVTZXQuYWRkKG5ldyBNb2R1bGUoLTEgLSBqLCBuZXcgTGlua1NldHMoKSwgbmV3IExpbmtTZXRzKCksIHRoaXMuaW5pdE1vZHVsZXNGcm9tR3JvdXAoY2hpbGQpLCBkZWZpbml0aW9uKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1vZHVsZVNldDtcbiAgICB9O1xuICAgIENvbmZpZ3VyYXRpb24ucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24gKGEsIGIsIGspIHtcbiAgICAgICAgaWYgKGsgPT09IHZvaWQgMCkgeyBrID0gMDsgfVxuICAgICAgICB2YXIgaW5JbnQgPSBhLmluY29taW5nLmludGVyc2VjdGlvbihiLmluY29taW5nKSwgb3V0SW50ID0gYS5vdXRnb2luZy5pbnRlcnNlY3Rpb24oYi5vdXRnb2luZyk7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IG5ldyBNb2R1bGVTZXQoKTtcbiAgICAgICAgY2hpbGRyZW4uYWRkKGEpO1xuICAgICAgICBjaGlsZHJlbi5hZGQoYik7XG4gICAgICAgIHZhciBtID0gbmV3IE1vZHVsZSh0aGlzLm1vZHVsZXMubGVuZ3RoLCBvdXRJbnQsIGluSW50LCBjaGlsZHJlbik7XG4gICAgICAgIHRoaXMubW9kdWxlcy5wdXNoKG0pO1xuICAgICAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24gKHMsIGksIG8pIHtcbiAgICAgICAgICAgIHMuZm9yQWxsKGZ1bmN0aW9uIChtcywgbGlua3R5cGUpIHtcbiAgICAgICAgICAgICAgICBtcy5mb3JBbGwoZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5scyA9IG5baV07XG4gICAgICAgICAgICAgICAgICAgIG5scy5hZGQobGlua3R5cGUsIG0pO1xuICAgICAgICAgICAgICAgICAgICBubHMucmVtb3ZlKGxpbmt0eXBlLCBhKTtcbiAgICAgICAgICAgICAgICAgICAgbmxzLnJlbW92ZShsaW5rdHlwZSwgYik7XG4gICAgICAgICAgICAgICAgICAgIGFbb10ucmVtb3ZlKGxpbmt0eXBlLCBuKTtcbiAgICAgICAgICAgICAgICAgICAgYltvXS5yZW1vdmUobGlua3R5cGUsIG4pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHVwZGF0ZShvdXRJbnQsIFwiaW5jb21pbmdcIiwgXCJvdXRnb2luZ1wiKTtcbiAgICAgICAgdXBkYXRlKGluSW50LCBcIm91dGdvaW5nXCIsIFwiaW5jb21pbmdcIik7XG4gICAgICAgIHRoaXMuUiAtPSBpbkludC5jb3VudCgpICsgb3V0SW50LmNvdW50KCk7XG4gICAgICAgIHRoaXMucm9vdHNba10ucmVtb3ZlKGEpO1xuICAgICAgICB0aGlzLnJvb3RzW2tdLnJlbW92ZShiKTtcbiAgICAgICAgdGhpcy5yb290c1trXS5hZGQobSk7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUucm9vdE1lcmdlcyA9IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIGlmIChrID09PSB2b2lkIDApIHsgayA9IDA7IH1cbiAgICAgICAgdmFyIHJzID0gdGhpcy5yb290c1trXS5tb2R1bGVzKCk7XG4gICAgICAgIHZhciBuID0gcnMubGVuZ3RoO1xuICAgICAgICB2YXIgbWVyZ2VzID0gbmV3IEFycmF5KG4gKiAobiAtIDEpKTtcbiAgICAgICAgdmFyIGN0ciA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpXyA9IG4gLSAxOyBpIDwgaV87ICsraSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IGkgKyAxOyBqIDwgbjsgKytqKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSByc1tpXSwgYiA9IHJzW2pdO1xuICAgICAgICAgICAgICAgIG1lcmdlc1tjdHJdID0geyBpZDogY3RyLCBuRWRnZXM6IHRoaXMubkVkZ2VzKGEsIGIpLCBhOiBhLCBiOiBiIH07XG4gICAgICAgICAgICAgICAgY3RyKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lcmdlcztcbiAgICB9O1xuICAgIENvbmZpZ3VyYXRpb24ucHJvdG90eXBlLmdyZWVkeU1lcmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucm9vdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJvb3RzW2ldLm1vZHVsZXMoKS5sZW5ndGggPCAyKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgdmFyIG1zID0gdGhpcy5yb290TWVyZ2VzKGkpLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEubkVkZ2VzID09IGIubkVkZ2VzID8gYS5pZCAtIGIuaWQgOiBhLm5FZGdlcyAtIGIubkVkZ2VzOyB9KTtcbiAgICAgICAgICAgIHZhciBtID0gbXNbMF07XG4gICAgICAgICAgICBpZiAobS5uRWRnZXMgPj0gdGhpcy5SKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgdGhpcy5tZXJnZShtLmEsIG0uYiwgaSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUubkVkZ2VzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgdmFyIGluSW50ID0gYS5pbmNvbWluZy5pbnRlcnNlY3Rpb24oYi5pbmNvbWluZyksIG91dEludCA9IGEub3V0Z29pbmcuaW50ZXJzZWN0aW9uKGIub3V0Z29pbmcpO1xuICAgICAgICByZXR1cm4gdGhpcy5SIC0gaW5JbnQuY291bnQoKSAtIG91dEludC5jb3VudCgpO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuZ2V0R3JvdXBIaWVyYXJjaHkgPSBmdW5jdGlvbiAocmV0YXJnZXRlZEVkZ2VzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBncm91cHMgPSBbXTtcbiAgICAgICAgdmFyIHJvb3QgPSB7fTtcbiAgICAgICAgdG9Hcm91cHModGhpcy5yb290c1swXSwgcm9vdCwgZ3JvdXBzKTtcbiAgICAgICAgdmFyIGVzID0gdGhpcy5hbGxFZGdlcygpO1xuICAgICAgICBlcy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgYSA9IF90aGlzLm1vZHVsZXNbZS5zb3VyY2VdO1xuICAgICAgICAgICAgdmFyIGIgPSBfdGhpcy5tb2R1bGVzW2UudGFyZ2V0XTtcbiAgICAgICAgICAgIHJldGFyZ2V0ZWRFZGdlcy5wdXNoKG5ldyBQb3dlckVkZ2UodHlwZW9mIGEuZ2lkID09PSBcInVuZGVmaW5lZFwiID8gZS5zb3VyY2UgOiBncm91cHNbYS5naWRdLCB0eXBlb2YgYi5naWQgPT09IFwidW5kZWZpbmVkXCIgPyBlLnRhcmdldCA6IGdyb3Vwc1tiLmdpZF0sIGUudHlwZSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICB9O1xuICAgIENvbmZpZ3VyYXRpb24ucHJvdG90eXBlLmFsbEVkZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZXMgPSBbXTtcbiAgICAgICAgQ29uZmlndXJhdGlvbi5nZXRFZGdlcyh0aGlzLnJvb3RzWzBdLCBlcyk7XG4gICAgICAgIHJldHVybiBlcztcbiAgICB9O1xuICAgIENvbmZpZ3VyYXRpb24uZ2V0RWRnZXMgPSBmdW5jdGlvbiAobW9kdWxlcywgZXMpIHtcbiAgICAgICAgbW9kdWxlcy5mb3JBbGwoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIG0uZ2V0RWRnZXMoZXMpO1xuICAgICAgICAgICAgQ29uZmlndXJhdGlvbi5nZXRFZGdlcyhtLmNoaWxkcmVuLCBlcyk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIENvbmZpZ3VyYXRpb247XG59KCkpO1xuZXhwb3J0cy5Db25maWd1cmF0aW9uID0gQ29uZmlndXJhdGlvbjtcbmZ1bmN0aW9uIHRvR3JvdXBzKG1vZHVsZXMsIGdyb3VwLCBncm91cHMpIHtcbiAgICBtb2R1bGVzLmZvckFsbChmdW5jdGlvbiAobSkge1xuICAgICAgICBpZiAobS5pc0xlYWYoKSkge1xuICAgICAgICAgICAgaWYgKCFncm91cC5sZWF2ZXMpXG4gICAgICAgICAgICAgICAgZ3JvdXAubGVhdmVzID0gW107XG4gICAgICAgICAgICBncm91cC5sZWF2ZXMucHVzaChtLmlkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBnID0gZ3JvdXA7XG4gICAgICAgICAgICBtLmdpZCA9IGdyb3Vwcy5sZW5ndGg7XG4gICAgICAgICAgICBpZiAoIW0uaXNJc2xhbmQoKSB8fCBtLmlzUHJlZGVmaW5lZCgpKSB7XG4gICAgICAgICAgICAgICAgZyA9IHsgaWQ6IG0uZ2lkIH07XG4gICAgICAgICAgICAgICAgaWYgKG0uaXNQcmVkZWZpbmVkKCkpXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gbS5kZWZpbml0aW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgZ1twcm9wXSA9IG0uZGVmaW5pdGlvbltwcm9wXTtcbiAgICAgICAgICAgICAgICBpZiAoIWdyb3VwLmdyb3VwcylcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAuZ3JvdXBzID0gW107XG4gICAgICAgICAgICAgICAgZ3JvdXAuZ3JvdXBzLnB1c2gobS5naWQpO1xuICAgICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKGcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9Hcm91cHMobS5jaGlsZHJlbiwgZywgZ3JvdXBzKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxudmFyIE1vZHVsZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTW9kdWxlKGlkLCBvdXRnb2luZywgaW5jb21pbmcsIGNoaWxkcmVuLCBkZWZpbml0aW9uKSB7XG4gICAgICAgIGlmIChvdXRnb2luZyA9PT0gdm9pZCAwKSB7IG91dGdvaW5nID0gbmV3IExpbmtTZXRzKCk7IH1cbiAgICAgICAgaWYgKGluY29taW5nID09PSB2b2lkIDApIHsgaW5jb21pbmcgPSBuZXcgTGlua1NldHMoKTsgfVxuICAgICAgICBpZiAoY2hpbGRyZW4gPT09IHZvaWQgMCkgeyBjaGlsZHJlbiA9IG5ldyBNb2R1bGVTZXQoKTsgfVxuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMub3V0Z29pbmcgPSBvdXRnb2luZztcbiAgICAgICAgdGhpcy5pbmNvbWluZyA9IGluY29taW5nO1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgICAgIHRoaXMuZGVmaW5pdGlvbiA9IGRlZmluaXRpb247XG4gICAgfVxuICAgIE1vZHVsZS5wcm90b3R5cGUuZ2V0RWRnZXMgPSBmdW5jdGlvbiAoZXMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5vdXRnb2luZy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBlZGdldHlwZSkge1xuICAgICAgICAgICAgbXMuZm9yQWxsKGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBlcy5wdXNoKG5ldyBQb3dlckVkZ2UoX3RoaXMuaWQsIHRhcmdldC5pZCwgZWRnZXR5cGUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIE1vZHVsZS5wcm90b3R5cGUuaXNMZWFmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbi5jb3VudCgpID09PSAwO1xuICAgIH07XG4gICAgTW9kdWxlLnByb3RvdHlwZS5pc0lzbGFuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0Z29pbmcuY291bnQoKSA9PT0gMCAmJiB0aGlzLmluY29taW5nLmNvdW50KCkgPT09IDA7XG4gICAgfTtcbiAgICBNb2R1bGUucHJvdG90eXBlLmlzUHJlZGVmaW5lZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB0aGlzLmRlZmluaXRpb24gIT09IFwidW5kZWZpbmVkXCI7XG4gICAgfTtcbiAgICByZXR1cm4gTW9kdWxlO1xufSgpKTtcbmV4cG9ydHMuTW9kdWxlID0gTW9kdWxlO1xuZnVuY3Rpb24gaW50ZXJzZWN0aW9uKG0sIG4pIHtcbiAgICB2YXIgaSA9IHt9O1xuICAgIGZvciAodmFyIHYgaW4gbSlcbiAgICAgICAgaWYgKHYgaW4gbilcbiAgICAgICAgICAgIGlbdl0gPSBtW3ZdO1xuICAgIHJldHVybiBpO1xufVxudmFyIE1vZHVsZVNldCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTW9kdWxlU2V0KCkge1xuICAgICAgICB0aGlzLnRhYmxlID0ge307XG4gICAgfVxuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnRhYmxlKS5sZW5ndGg7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IE1vZHVsZVNldCgpO1xuICAgICAgICByZXN1bHQudGFibGUgPSBpbnRlcnNlY3Rpb24odGhpcy50YWJsZSwgb3RoZXIudGFibGUpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5pbnRlcnNlY3Rpb25Db3VudCA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcnNlY3Rpb24ob3RoZXIpLmNvdW50KCk7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHJldHVybiBpZCBpbiB0aGlzLnRhYmxlO1xuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICB0aGlzLnRhYmxlW20uaWRdID0gbTtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgZGVsZXRlIHRoaXMudGFibGVbbS5pZF07XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmZvckFsbCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGZvciAodmFyIG1pZCBpbiB0aGlzLnRhYmxlKSB7XG4gICAgICAgICAgICBmKHRoaXMudGFibGVbbWlkXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUubW9kdWxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZzID0gW107XG4gICAgICAgIHRoaXMuZm9yQWxsKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICBpZiAoIW0uaXNQcmVkZWZpbmVkKCkpXG4gICAgICAgICAgICAgICAgdnMucHVzaChtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2cztcbiAgICB9O1xuICAgIHJldHVybiBNb2R1bGVTZXQ7XG59KCkpO1xuZXhwb3J0cy5Nb2R1bGVTZXQgPSBNb2R1bGVTZXQ7XG52YXIgTGlua1NldHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpbmtTZXRzKCkge1xuICAgICAgICB0aGlzLnNldHMgPSB7fTtcbiAgICAgICAgdGhpcy5uID0gMDtcbiAgICB9XG4gICAgTGlua1NldHMucHJvdG90eXBlLmNvdW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uO1xuICAgIH07XG4gICAgTGlua1NldHMucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5mb3JBbGxNb2R1bGVzKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdCAmJiBtLmlkID09IGlkKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGxpbmt0eXBlLCBtKSB7XG4gICAgICAgIHZhciBzID0gbGlua3R5cGUgaW4gdGhpcy5zZXRzID8gdGhpcy5zZXRzW2xpbmt0eXBlXSA6IHRoaXMuc2V0c1tsaW5rdHlwZV0gPSBuZXcgTW9kdWxlU2V0KCk7XG4gICAgICAgIHMuYWRkKG0pO1xuICAgICAgICArK3RoaXMubjtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAobGlua3R5cGUsIG0pIHtcbiAgICAgICAgdmFyIG1zID0gdGhpcy5zZXRzW2xpbmt0eXBlXTtcbiAgICAgICAgbXMucmVtb3ZlKG0pO1xuICAgICAgICBpZiAobXMuY291bnQoKSA9PT0gMCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuc2V0c1tsaW5rdHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgLS10aGlzLm47XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuZm9yQWxsID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZm9yICh2YXIgbGlua3R5cGUgaW4gdGhpcy5zZXRzKSB7XG4gICAgICAgICAgICBmKHRoaXMuc2V0c1tsaW5rdHlwZV0sIE51bWJlcihsaW5rdHlwZSkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuZm9yQWxsTW9kdWxlcyA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHRoaXMuZm9yQWxsKGZ1bmN0aW9uIChtcywgbHQpIHsgcmV0dXJuIG1zLmZvckFsbChmKTsgfSk7XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgTGlua1NldHMoKTtcbiAgICAgICAgdGhpcy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBsdCkge1xuICAgICAgICAgICAgaWYgKGx0IGluIG90aGVyLnNldHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IG1zLmludGVyc2VjdGlvbihvdGhlci5zZXRzW2x0XSksIG4gPSBpLmNvdW50KCk7XG4gICAgICAgICAgICAgICAgaWYgKG4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5zZXRzW2x0XSA9IGk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5uICs9IG47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIHJldHVybiBMaW5rU2V0cztcbn0oKSk7XG5leHBvcnRzLkxpbmtTZXRzID0gTGlua1NldHM7XG5mdW5jdGlvbiBpbnRlcnNlY3Rpb25Db3VudChtLCBuKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGludGVyc2VjdGlvbihtLCBuKSkubGVuZ3RoO1xufVxuZnVuY3Rpb24gZ2V0R3JvdXBzKG5vZGVzLCBsaW5rcywgbGEsIHJvb3RHcm91cCkge1xuICAgIHZhciBuID0gbm9kZXMubGVuZ3RoLCBjID0gbmV3IENvbmZpZ3VyYXRpb24obiwgbGlua3MsIGxhLCByb290R3JvdXApO1xuICAgIHdoaWxlIChjLmdyZWVkeU1lcmdlKCkpXG4gICAgICAgIDtcbiAgICB2YXIgcG93ZXJFZGdlcyA9IFtdO1xuICAgIHZhciBnID0gYy5nZXRHcm91cEhpZXJhcmNoeShwb3dlckVkZ2VzKTtcbiAgICBwb3dlckVkZ2VzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoZW5kKSB7XG4gICAgICAgICAgICB2YXIgZyA9IGVbZW5kXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZyA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgIGVbZW5kXSA9IG5vZGVzW2ddO1xuICAgICAgICB9O1xuICAgICAgICBmKFwic291cmNlXCIpO1xuICAgICAgICBmKFwidGFyZ2V0XCIpO1xuICAgIH0pO1xuICAgIHJldHVybiB7IGdyb3VwczogZywgcG93ZXJFZGdlczogcG93ZXJFZGdlcyB9O1xufVxuZXhwb3J0cy5nZXRHcm91cHMgPSBnZXRHcm91cHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wb3dlcmdyYXBoLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFBhaXJpbmdIZWFwID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQYWlyaW5nSGVhcChlbGVtKSB7XG4gICAgICAgIHRoaXMuZWxlbSA9IGVsZW07XG4gICAgICAgIHRoaXMuc3ViaGVhcHMgPSBbXTtcbiAgICB9XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBzdHIgPSBcIlwiLCBuZWVkQ29tbWEgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YmhlYXBzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc3ViaGVhcCA9IHRoaXMuc3ViaGVhcHNbaV07XG4gICAgICAgICAgICBpZiAoIXN1YmhlYXAuZWxlbSkge1xuICAgICAgICAgICAgICAgIG5lZWRDb21tYSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5lZWRDb21tYSkge1xuICAgICAgICAgICAgICAgIHN0ciA9IHN0ciArIFwiLFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyID0gc3RyICsgc3ViaGVhcC50b1N0cmluZyhzZWxlY3Rvcik7XG4gICAgICAgICAgICBuZWVkQ29tbWEgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdHIgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHN0ciA9IFwiKFwiICsgc3RyICsgXCIpXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICh0aGlzLmVsZW0gPyBzZWxlY3Rvcih0aGlzLmVsZW0pIDogXCJcIikgKyBzdHI7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGlmICghdGhpcy5lbXB0eSgpKSB7XG4gICAgICAgICAgICBmKHRoaXMuZWxlbSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLnN1YmhlYXBzLmZvckVhY2goZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuZm9yRWFjaChmKTsgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW1wdHkoKSA/IDAgOiAxICsgdGhpcy5zdWJoZWFwcy5yZWR1Y2UoZnVuY3Rpb24gKG4sIGgpIHtcbiAgICAgICAgICAgIHJldHVybiBuICsgaC5jb3VudCgpO1xuICAgICAgICB9LCAwKTtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5taW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW07XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW0gPT0gbnVsbDtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChoKSB7XG4gICAgICAgIGlmICh0aGlzID09PSBoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJoZWFwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3ViaGVhcHNbaV0uY29udGFpbnMoaCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmlzSGVhcCA9IGZ1bmN0aW9uIChsZXNzVGhhbikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gdGhpcy5zdWJoZWFwcy5ldmVyeShmdW5jdGlvbiAoaCkgeyByZXR1cm4gbGVzc1RoYW4oX3RoaXMuZWxlbSwgaC5lbGVtKSAmJiBoLmlzSGVhcChsZXNzVGhhbik7IH0pO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChvYmosIGxlc3NUaGFuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1lcmdlKG5ldyBQYWlyaW5nSGVhcChvYmopLCBsZXNzVGhhbik7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoaGVhcDIsIGxlc3NUaGFuKSB7XG4gICAgICAgIGlmICh0aGlzLmVtcHR5KCkpXG4gICAgICAgICAgICByZXR1cm4gaGVhcDI7XG4gICAgICAgIGVsc2UgaWYgKGhlYXAyLmVtcHR5KCkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgZWxzZSBpZiAobGVzc1RoYW4odGhpcy5lbGVtLCBoZWFwMi5lbGVtKSkge1xuICAgICAgICAgICAgdGhpcy5zdWJoZWFwcy5wdXNoKGhlYXAyKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaGVhcDIuc3ViaGVhcHMucHVzaCh0aGlzKTtcbiAgICAgICAgICAgIHJldHVybiBoZWFwMjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLnJlbW92ZU1pbiA9IGZ1bmN0aW9uIChsZXNzVGhhbikge1xuICAgICAgICBpZiAodGhpcy5lbXB0eSgpKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1lcmdlUGFpcnMobGVzc1RoYW4pO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLm1lcmdlUGFpcnMgPSBmdW5jdGlvbiAobGVzc1RoYW4pIHtcbiAgICAgICAgaWYgKHRoaXMuc3ViaGVhcHMubGVuZ3RoID09IDApXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBhaXJpbmdIZWFwKG51bGwpO1xuICAgICAgICBlbHNlIGlmICh0aGlzLnN1YmhlYXBzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJoZWFwc1swXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBmaXJzdFBhaXIgPSB0aGlzLnN1YmhlYXBzLnBvcCgpLm1lcmdlKHRoaXMuc3ViaGVhcHMucG9wKCksIGxlc3NUaGFuKTtcbiAgICAgICAgICAgIHZhciByZW1haW5pbmcgPSB0aGlzLm1lcmdlUGFpcnMobGVzc1RoYW4pO1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0UGFpci5tZXJnZShyZW1haW5pbmcsIGxlc3NUaGFuKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmRlY3JlYXNlS2V5ID0gZnVuY3Rpb24gKHN1YmhlYXAsIG5ld1ZhbHVlLCBzZXRIZWFwTm9kZSwgbGVzc1RoYW4pIHtcbiAgICAgICAgdmFyIG5ld0hlYXAgPSBzdWJoZWFwLnJlbW92ZU1pbihsZXNzVGhhbik7XG4gICAgICAgIHN1YmhlYXAuZWxlbSA9IG5ld0hlYXAuZWxlbTtcbiAgICAgICAgc3ViaGVhcC5zdWJoZWFwcyA9IG5ld0hlYXAuc3ViaGVhcHM7XG4gICAgICAgIGlmIChzZXRIZWFwTm9kZSAhPT0gbnVsbCAmJiBuZXdIZWFwLmVsZW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNldEhlYXBOb2RlKHN1YmhlYXAuZWxlbSwgc3ViaGVhcCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhaXJpbmdOb2RlID0gbmV3IFBhaXJpbmdIZWFwKG5ld1ZhbHVlKTtcbiAgICAgICAgaWYgKHNldEhlYXBOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZXRIZWFwTm9kZShuZXdWYWx1ZSwgcGFpcmluZ05vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1lcmdlKHBhaXJpbmdOb2RlLCBsZXNzVGhhbik7XG4gICAgfTtcbiAgICByZXR1cm4gUGFpcmluZ0hlYXA7XG59KCkpO1xuZXhwb3J0cy5QYWlyaW5nSGVhcCA9IFBhaXJpbmdIZWFwO1xudmFyIFByaW9yaXR5UXVldWUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFByaW9yaXR5UXVldWUobGVzc1RoYW4pIHtcbiAgICAgICAgdGhpcy5sZXNzVGhhbiA9IGxlc3NUaGFuO1xuICAgIH1cbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS50b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuZWxlbTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhaXJpbmdOb2RlO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgYXJnOyBhcmcgPSBhcmdzW2ldOyArK2kpIHtcbiAgICAgICAgICAgIHBhaXJpbmdOb2RlID0gbmV3IFBhaXJpbmdIZWFwKGFyZyk7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSB0aGlzLmVtcHR5KCkgP1xuICAgICAgICAgICAgICAgIHBhaXJpbmdOb2RlIDogdGhpcy5yb290Lm1lcmdlKHBhaXJpbmdOb2RlLCB0aGlzLmxlc3NUaGFuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFpcmluZ05vZGU7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLnJvb3QgfHwgIXRoaXMucm9vdC5lbGVtO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuaXNIZWFwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290LmlzSGVhcCh0aGlzLmxlc3NUaGFuKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB0aGlzLnJvb3QuZm9yRWFjaChmKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9iaiA9IHRoaXMucm9vdC5taW4oKTtcbiAgICAgICAgdGhpcy5yb290ID0gdGhpcy5yb290LnJlbW92ZU1pbih0aGlzLmxlc3NUaGFuKTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnJlZHVjZUtleSA9IGZ1bmN0aW9uIChoZWFwTm9kZSwgbmV3S2V5LCBzZXRIZWFwTm9kZSkge1xuICAgICAgICBpZiAoc2V0SGVhcE5vZGUgPT09IHZvaWQgMCkgeyBzZXRIZWFwTm9kZSA9IG51bGw7IH1cbiAgICAgICAgdGhpcy5yb290ID0gdGhpcy5yb290LmRlY3JlYXNlS2V5KGhlYXBOb2RlLCBuZXdLZXksIHNldEhlYXBOb2RlLCB0aGlzLmxlc3NUaGFuKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QudG9TdHJpbmcoc2VsZWN0b3IpO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuY291bnQoKTtcbiAgICB9O1xuICAgIHJldHVybiBQcmlvcml0eVF1ZXVlO1xufSgpKTtcbmV4cG9ydHMuUHJpb3JpdHlRdWV1ZSA9IFByaW9yaXR5UXVldWU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcXVldWUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBUcmVlQmFzZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVHJlZUJhc2UoKSB7XG4gICAgICAgIHRoaXMuZmluZEl0ZXIgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgICAgICB2YXIgaXRlciA9IHRoaXMuaXRlcmF0b3IoKTtcbiAgICAgICAgICAgIHdoaWxlIChyZXMgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYyA9IHRoaXMuX2NvbXBhcmF0b3IoZGF0YSwgcmVzLmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChjID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXIuX2N1cnNvciA9IHJlcztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpdGVyLl9hbmNlc3RvcnMucHVzaChyZXMpO1xuICAgICAgICAgICAgICAgICAgICByZXMgPSByZXMuZ2V0X2NoaWxkKGMgPiAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9yb290ID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaXplID0gMDtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHZhciByZXMgPSB0aGlzLl9yb290O1xuICAgICAgICB3aGlsZSAocmVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYyA9IHRoaXMuX2NvbXBhcmF0b3IoZGF0YSwgcmVzLmRhdGEpO1xuICAgICAgICAgICAgaWYgKGMgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMgPSByZXMuZ2V0X2NoaWxkKGMgPiAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUubG93ZXJCb3VuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ib3VuZChkYXRhLCB0aGlzLl9jb21wYXJhdG9yKTtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUudXBwZXJCb3VuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHZhciBjbXAgPSB0aGlzLl9jb21wYXJhdG9yO1xuICAgICAgICBmdW5jdGlvbiByZXZlcnNlX2NtcChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gY21wKGIsIGEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9ib3VuZChkYXRhLCByZXZlcnNlX2NtcCk7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLm1pbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJlcyA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgIGlmIChyZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChyZXMubGVmdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVzID0gcmVzLmxlZnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5tYXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXMgPSB0aGlzLl9yb290O1xuICAgICAgICBpZiAocmVzID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAocmVzLnJpZ2h0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXMgPSByZXMucmlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5pdGVyYXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJdGVyYXRvcih0aGlzKTtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUuZWFjaCA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICB2YXIgaXQgPSB0aGlzLml0ZXJhdG9yKCksIGRhdGE7XG4gICAgICAgIHdoaWxlICgoZGF0YSA9IGl0Lm5leHQoKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNiKGRhdGEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLnJlYWNoID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHZhciBpdCA9IHRoaXMuaXRlcmF0b3IoKSwgZGF0YTtcbiAgICAgICAgd2hpbGUgKChkYXRhID0gaXQucHJldigpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY2IoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUuX2JvdW5kID0gZnVuY3Rpb24gKGRhdGEsIGNtcCkge1xuICAgICAgICB2YXIgY3VyID0gdGhpcy5fcm9vdDtcbiAgICAgICAgdmFyIGl0ZXIgPSB0aGlzLml0ZXJhdG9yKCk7XG4gICAgICAgIHdoaWxlIChjdXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBjID0gdGhpcy5fY29tcGFyYXRvcihkYXRhLCBjdXIuZGF0YSk7XG4gICAgICAgICAgICBpZiAoYyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGl0ZXIuX2N1cnNvciA9IGN1cjtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZXIuX2FuY2VzdG9ycy5wdXNoKGN1cik7XG4gICAgICAgICAgICBjdXIgPSBjdXIuZ2V0X2NoaWxkKGMgPiAwKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gaXRlci5fYW5jZXN0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBjdXIgPSBpdGVyLl9hbmNlc3RvcnNbaV07XG4gICAgICAgICAgICBpZiAoY21wKGRhdGEsIGN1ci5kYXRhKSA+IDApIHtcbiAgICAgICAgICAgICAgICBpdGVyLl9jdXJzb3IgPSBjdXI7XG4gICAgICAgICAgICAgICAgaXRlci5fYW5jZXN0b3JzLmxlbmd0aCA9IGk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaXRlci5fYW5jZXN0b3JzLmxlbmd0aCA9IDA7XG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIH07XG4gICAgO1xuICAgIHJldHVybiBUcmVlQmFzZTtcbn0oKSk7XG5leHBvcnRzLlRyZWVCYXNlID0gVHJlZUJhc2U7XG52YXIgSXRlcmF0b3IgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEl0ZXJhdG9yKHRyZWUpIHtcbiAgICAgICAgdGhpcy5fdHJlZSA9IHRyZWU7XG4gICAgICAgIHRoaXMuX2FuY2VzdG9ycyA9IFtdO1xuICAgICAgICB0aGlzLl9jdXJzb3IgPSBudWxsO1xuICAgIH1cbiAgICBJdGVyYXRvci5wcm90b3R5cGUuZGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnNvciAhPT0gbnVsbCA/IHRoaXMuX2N1cnNvci5kYXRhIDogbnVsbDtcbiAgICB9O1xuICAgIDtcbiAgICBJdGVyYXRvci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnNvciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl90cmVlLl9yb290O1xuICAgICAgICAgICAgaWYgKHJvb3QgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9taW5Ob2RlKHJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnNvci5yaWdodCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhciBzYXZlO1xuICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgc2F2ZSA9IHRoaXMuX2N1cnNvcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2FuY2VzdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnNvciA9IHRoaXMuX2FuY2VzdG9ycy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnNvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gd2hpbGUgKHRoaXMuX2N1cnNvci5yaWdodCA9PT0gc2F2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hbmNlc3RvcnMucHVzaCh0aGlzLl9jdXJzb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21pbk5vZGUodGhpcy5fY3Vyc29yLnJpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fY3Vyc29yICE9PSBudWxsID8gdGhpcy5fY3Vyc29yLmRhdGEgOiBudWxsO1xuICAgIH07XG4gICAgO1xuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS5wcmV2ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fY3Vyc29yID09PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgcm9vdCA9IHRoaXMuX3RyZWUuX3Jvb3Q7XG4gICAgICAgICAgICBpZiAocm9vdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX21heE5vZGUocm9vdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fY3Vyc29yLmxlZnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2F2ZTtcbiAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgIHNhdmUgPSB0aGlzLl9jdXJzb3I7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hbmNlc3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJzb3IgPSB0aGlzLl9hbmNlc3RvcnMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJzb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IHdoaWxlICh0aGlzLl9jdXJzb3IubGVmdCA9PT0gc2F2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hbmNlc3RvcnMucHVzaCh0aGlzLl9jdXJzb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21heE5vZGUodGhpcy5fY3Vyc29yLmxlZnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9jdXJzb3IgIT09IG51bGwgPyB0aGlzLl9jdXJzb3IuZGF0YSA6IG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgSXRlcmF0b3IucHJvdG90eXBlLl9taW5Ob2RlID0gZnVuY3Rpb24gKHN0YXJ0KSB7XG4gICAgICAgIHdoaWxlIChzdGFydC5sZWZ0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9hbmNlc3RvcnMucHVzaChzdGFydCk7XG4gICAgICAgICAgICBzdGFydCA9IHN0YXJ0LmxlZnQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY3Vyc29yID0gc3RhcnQ7XG4gICAgfTtcbiAgICA7XG4gICAgSXRlcmF0b3IucHJvdG90eXBlLl9tYXhOb2RlID0gZnVuY3Rpb24gKHN0YXJ0KSB7XG4gICAgICAgIHdoaWxlIChzdGFydC5yaWdodCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2goc3RhcnQpO1xuICAgICAgICAgICAgc3RhcnQgPSBzdGFydC5yaWdodDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jdXJzb3IgPSBzdGFydDtcbiAgICB9O1xuICAgIDtcbiAgICByZXR1cm4gSXRlcmF0b3I7XG59KCkpO1xuZXhwb3J0cy5JdGVyYXRvciA9IEl0ZXJhdG9yO1xudmFyIE5vZGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5vZGUoZGF0YSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLmxlZnQgPSBudWxsO1xuICAgICAgICB0aGlzLnJpZ2h0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZWQgPSB0cnVlO1xuICAgIH1cbiAgICBOb2RlLnByb3RvdHlwZS5nZXRfY2hpbGQgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgICAgIHJldHVybiBkaXIgPyB0aGlzLnJpZ2h0IDogdGhpcy5sZWZ0O1xuICAgIH07XG4gICAgO1xuICAgIE5vZGUucHJvdG90eXBlLnNldF9jaGlsZCA9IGZ1bmN0aW9uIChkaXIsIHZhbCkge1xuICAgICAgICBpZiAoZGlyKSB7XG4gICAgICAgICAgICB0aGlzLnJpZ2h0ID0gdmFsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sZWZ0ID0gdmFsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICA7XG4gICAgcmV0dXJuIE5vZGU7XG59KCkpO1xudmFyIFJCVHJlZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFJCVHJlZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBSQlRyZWUoY29tcGFyYXRvcikge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5fcm9vdCA9IG51bGw7XG4gICAgICAgIF90aGlzLl9jb21wYXJhdG9yID0gY29tcGFyYXRvcjtcbiAgICAgICAgX3RoaXMuc2l6ZSA9IDA7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgUkJUcmVlLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgcmV0ID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLl9yb290ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9yb290ID0gbmV3IE5vZGUoZGF0YSk7XG4gICAgICAgICAgICByZXQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zaXplKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgaGVhZCA9IG5ldyBOb2RlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB2YXIgZGlyID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgbGFzdCA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIGdwID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBnZ3AgPSBoZWFkO1xuICAgICAgICAgICAgdmFyIHAgPSBudWxsO1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9yb290O1xuICAgICAgICAgICAgZ2dwLnJpZ2h0ID0gdGhpcy5fcm9vdDtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG5ldyBOb2RlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBwLnNldF9jaGlsZChkaXIsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICByZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNpemUrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoUkJUcmVlLmlzX3JlZChub2RlLmxlZnQpICYmIFJCVHJlZS5pc19yZWQobm9kZS5yaWdodCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBub2RlLmxlZnQucmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmlnaHQucmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChSQlRyZWUuaXNfcmVkKG5vZGUpICYmIFJCVHJlZS5pc19yZWQocCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcjIgPSBnZ3AucmlnaHQgPT09IGdwO1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZSA9PT0gcC5nZXRfY2hpbGQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdncC5zZXRfY2hpbGQoZGlyMiwgUkJUcmVlLnNpbmdsZV9yb3RhdGUoZ3AsICFsYXN0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZ3Auc2V0X2NoaWxkKGRpcjIsIFJCVHJlZS5kb3VibGVfcm90YXRlKGdwLCAhbGFzdCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjbXAgPSB0aGlzLl9jb21wYXJhdG9yKG5vZGUuZGF0YSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgaWYgKGNtcCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGFzdCA9IGRpcjtcbiAgICAgICAgICAgICAgICBkaXIgPSBjbXAgPCAwO1xuICAgICAgICAgICAgICAgIGlmIChncCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBnZ3AgPSBncDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZ3AgPSBwO1xuICAgICAgICAgICAgICAgIHAgPSBub2RlO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLmdldF9jaGlsZChkaXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcm9vdCA9IGhlYWQucmlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcm9vdC5yZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuICAgIDtcbiAgICBSQlRyZWUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGlmICh0aGlzLl9yb290ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhlYWQgPSBuZXcgTm9kZSh1bmRlZmluZWQpO1xuICAgICAgICB2YXIgbm9kZSA9IGhlYWQ7XG4gICAgICAgIG5vZGUucmlnaHQgPSB0aGlzLl9yb290O1xuICAgICAgICB2YXIgcCA9IG51bGw7XG4gICAgICAgIHZhciBncCA9IG51bGw7XG4gICAgICAgIHZhciBmb3VuZCA9IG51bGw7XG4gICAgICAgIHZhciBkaXIgPSB0cnVlO1xuICAgICAgICB3aGlsZSAobm9kZS5nZXRfY2hpbGQoZGlyKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGxhc3QgPSBkaXI7XG4gICAgICAgICAgICBncCA9IHA7XG4gICAgICAgICAgICBwID0gbm9kZTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLmdldF9jaGlsZChkaXIpO1xuICAgICAgICAgICAgdmFyIGNtcCA9IHRoaXMuX2NvbXBhcmF0b3IoZGF0YSwgbm9kZS5kYXRhKTtcbiAgICAgICAgICAgIGRpciA9IGNtcCA+IDA7XG4gICAgICAgICAgICBpZiAoY21wID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFSQlRyZWUuaXNfcmVkKG5vZGUpICYmICFSQlRyZWUuaXNfcmVkKG5vZGUuZ2V0X2NoaWxkKGRpcikpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFJCVHJlZS5pc19yZWQobm9kZS5nZXRfY2hpbGQoIWRpcikpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzciA9IFJCVHJlZS5zaW5nbGVfcm90YXRlKG5vZGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgIHAuc2V0X2NoaWxkKGxhc3QsIHNyKTtcbiAgICAgICAgICAgICAgICAgICAgcCA9IHNyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICghUkJUcmVlLmlzX3JlZChub2RlLmdldF9jaGlsZCghZGlyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpYmxpbmcgPSBwLmdldF9jaGlsZCghbGFzdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaWJsaW5nICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIVJCVHJlZS5pc19yZWQoc2libGluZy5nZXRfY2hpbGQoIWxhc3QpKSAmJiAhUkJUcmVlLmlzX3JlZChzaWJsaW5nLmdldF9jaGlsZChsYXN0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwLnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmcucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGlyMiA9IGdwLnJpZ2h0ID09PSBwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSQlRyZWUuaXNfcmVkKHNpYmxpbmcuZ2V0X2NoaWxkKGxhc3QpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncC5zZXRfY2hpbGQoZGlyMiwgUkJUcmVlLmRvdWJsZV9yb3RhdGUocCwgbGFzdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChSQlRyZWUuaXNfcmVkKHNpYmxpbmcuZ2V0X2NoaWxkKCFsYXN0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3Auc2V0X2NoaWxkKGRpcjIsIFJCVHJlZS5zaW5nbGVfcm90YXRlKHAsIGxhc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGdwYyA9IGdwLmdldF9jaGlsZChkaXIyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncGMucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3BjLmxlZnQucmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3BjLnJpZ2h0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChmb3VuZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgZm91bmQuZGF0YSA9IG5vZGUuZGF0YTtcbiAgICAgICAgICAgIHAuc2V0X2NoaWxkKHAucmlnaHQgPT09IG5vZGUsIG5vZGUuZ2V0X2NoaWxkKG5vZGUubGVmdCA9PT0gbnVsbCkpO1xuICAgICAgICAgICAgdGhpcy5zaXplLS07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcm9vdCA9IGhlYWQucmlnaHQ7XG4gICAgICAgIGlmICh0aGlzLl9yb290ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9yb290LnJlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3VuZCAhPT0gbnVsbDtcbiAgICB9O1xuICAgIDtcbiAgICBSQlRyZWUuaXNfcmVkID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUgIT09IG51bGwgJiYgbm9kZS5yZWQ7XG4gICAgfTtcbiAgICBSQlRyZWUuc2luZ2xlX3JvdGF0ZSA9IGZ1bmN0aW9uIChyb290LCBkaXIpIHtcbiAgICAgICAgdmFyIHNhdmUgPSByb290LmdldF9jaGlsZCghZGlyKTtcbiAgICAgICAgcm9vdC5zZXRfY2hpbGQoIWRpciwgc2F2ZS5nZXRfY2hpbGQoZGlyKSk7XG4gICAgICAgIHNhdmUuc2V0X2NoaWxkKGRpciwgcm9vdCk7XG4gICAgICAgIHJvb3QucmVkID0gdHJ1ZTtcbiAgICAgICAgc2F2ZS5yZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHNhdmU7XG4gICAgfTtcbiAgICBSQlRyZWUuZG91YmxlX3JvdGF0ZSA9IGZ1bmN0aW9uIChyb290LCBkaXIpIHtcbiAgICAgICAgcm9vdC5zZXRfY2hpbGQoIWRpciwgUkJUcmVlLnNpbmdsZV9yb3RhdGUocm9vdC5nZXRfY2hpbGQoIWRpciksICFkaXIpKTtcbiAgICAgICAgcmV0dXJuIFJCVHJlZS5zaW5nbGVfcm90YXRlKHJvb3QsIGRpcik7XG4gICAgfTtcbiAgICByZXR1cm4gUkJUcmVlO1xufShUcmVlQmFzZSkpO1xuZXhwb3J0cy5SQlRyZWUgPSBSQlRyZWU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yYnRyZWUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2cHNjXzEgPSByZXF1aXJlKFwiLi92cHNjXCIpO1xudmFyIHJidHJlZV8xID0gcmVxdWlyZShcIi4vcmJ0cmVlXCIpO1xuZnVuY3Rpb24gY29tcHV0ZUdyb3VwQm91bmRzKGcpIHtcbiAgICBnLmJvdW5kcyA9IHR5cGVvZiBnLmxlYXZlcyAhPT0gXCJ1bmRlZmluZWRcIiA/XG4gICAgICAgIGcubGVhdmVzLnJlZHVjZShmdW5jdGlvbiAociwgYykgeyByZXR1cm4gYy5ib3VuZHMudW5pb24ocik7IH0sIFJlY3RhbmdsZS5lbXB0eSgpKSA6XG4gICAgICAgIFJlY3RhbmdsZS5lbXB0eSgpO1xuICAgIGlmICh0eXBlb2YgZy5ncm91cHMgIT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgIGcuYm91bmRzID0gZy5ncm91cHMucmVkdWNlKGZ1bmN0aW9uIChyLCBjKSB7IHJldHVybiBjb21wdXRlR3JvdXBCb3VuZHMoYykudW5pb24ocik7IH0sIGcuYm91bmRzKTtcbiAgICBnLmJvdW5kcyA9IGcuYm91bmRzLmluZmxhdGUoZy5wYWRkaW5nKTtcbiAgICByZXR1cm4gZy5ib3VuZHM7XG59XG5leHBvcnRzLmNvbXB1dGVHcm91cEJvdW5kcyA9IGNvbXB1dGVHcm91cEJvdW5kcztcbnZhciBSZWN0YW5nbGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlY3RhbmdsZSh4LCBYLCB5LCBZKSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMuWCA9IFg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMuWSA9IFk7XG4gICAgfVxuICAgIFJlY3RhbmdsZS5lbXB0eSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBSZWN0YW5nbGUoTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksIE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZKTsgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmN4ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMueCArIHRoaXMuWCkgLyAyOyB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuY3kgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAodGhpcy55ICsgdGhpcy5ZKSAvIDI7IH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5vdmVybGFwWCA9IGZ1bmN0aW9uIChyKSB7XG4gICAgICAgIHZhciB1eCA9IHRoaXMuY3goKSwgdnggPSByLmN4KCk7XG4gICAgICAgIGlmICh1eCA8PSB2eCAmJiByLnggPCB0aGlzLlgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5YIC0gci54O1xuICAgICAgICBpZiAodnggPD0gdXggJiYgdGhpcy54IDwgci5YKVxuICAgICAgICAgICAgcmV0dXJuIHIuWCAtIHRoaXMueDtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLm92ZXJsYXBZID0gZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgdmFyIHV5ID0gdGhpcy5jeSgpLCB2eSA9IHIuY3koKTtcbiAgICAgICAgaWYgKHV5IDw9IHZ5ICYmIHIueSA8IHRoaXMuWSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLlkgLSByLnk7XG4gICAgICAgIGlmICh2eSA8PSB1eSAmJiB0aGlzLnkgPCByLlkpXG4gICAgICAgICAgICByZXR1cm4gci5ZIC0gdGhpcy55O1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuc2V0WENlbnRyZSA9IGZ1bmN0aW9uIChjeCkge1xuICAgICAgICB2YXIgZHggPSBjeCAtIHRoaXMuY3goKTtcbiAgICAgICAgdGhpcy54ICs9IGR4O1xuICAgICAgICB0aGlzLlggKz0gZHg7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLnNldFlDZW50cmUgPSBmdW5jdGlvbiAoY3kpIHtcbiAgICAgICAgdmFyIGR5ID0gY3kgLSB0aGlzLmN5KCk7XG4gICAgICAgIHRoaXMueSArPSBkeTtcbiAgICAgICAgdGhpcy5ZICs9IGR5O1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS53aWR0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuWCAtIHRoaXMueDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuaGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ZIC0gdGhpcy55O1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS51bmlvbiA9IGZ1bmN0aW9uIChyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlKE1hdGgubWluKHRoaXMueCwgci54KSwgTWF0aC5tYXgodGhpcy5YLCByLlgpLCBNYXRoLm1pbih0aGlzLnksIHIueSksIE1hdGgubWF4KHRoaXMuWSwgci5ZKSk7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmxpbmVJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgIHZhciBzaWRlcyA9IFtbdGhpcy54LCB0aGlzLnksIHRoaXMuWCwgdGhpcy55XSxcbiAgICAgICAgICAgIFt0aGlzLlgsIHRoaXMueSwgdGhpcy5YLCB0aGlzLlldLFxuICAgICAgICAgICAgW3RoaXMuWCwgdGhpcy5ZLCB0aGlzLngsIHRoaXMuWV0sXG4gICAgICAgICAgICBbdGhpcy54LCB0aGlzLlksIHRoaXMueCwgdGhpcy55XV07XG4gICAgICAgIHZhciBpbnRlcnNlY3Rpb25zID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgciA9IFJlY3RhbmdsZS5saW5lSW50ZXJzZWN0aW9uKHgxLCB5MSwgeDIsIHkyLCBzaWRlc1tpXVswXSwgc2lkZXNbaV1bMV0sIHNpZGVzW2ldWzJdLCBzaWRlc1tpXVszXSk7XG4gICAgICAgICAgICBpZiAociAhPT0gbnVsbClcbiAgICAgICAgICAgICAgICBpbnRlcnNlY3Rpb25zLnB1c2goeyB4OiByLngsIHk6IHIueSB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW50ZXJzZWN0aW9ucztcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUucmF5SW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKHgyLCB5Mikge1xuICAgICAgICB2YXIgaW50cyA9IHRoaXMubGluZUludGVyc2VjdGlvbnModGhpcy5jeCgpLCB0aGlzLmN5KCksIHgyLCB5Mik7XG4gICAgICAgIHJldHVybiBpbnRzLmxlbmd0aCA+IDAgPyBpbnRzWzBdIDogbnVsbDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUudmVydGljZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IHg6IHRoaXMueCwgeTogdGhpcy55IH0sXG4gICAgICAgICAgICB7IHg6IHRoaXMuWCwgeTogdGhpcy55IH0sXG4gICAgICAgICAgICB7IHg6IHRoaXMuWCwgeTogdGhpcy5ZIH0sXG4gICAgICAgICAgICB7IHg6IHRoaXMueCwgeTogdGhpcy5ZIH0sXG4gICAgICAgICAgICB7IHg6IHRoaXMueCwgeTogdGhpcy55IH1cbiAgICAgICAgXTtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5saW5lSW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCkge1xuICAgICAgICB2YXIgZHgxMiA9IHgyIC0geDEsIGR4MzQgPSB4NCAtIHgzLCBkeTEyID0geTIgLSB5MSwgZHkzNCA9IHk0IC0geTMsIGRlbm9taW5hdG9yID0gZHkzNCAqIGR4MTIgLSBkeDM0ICogZHkxMjtcbiAgICAgICAgaWYgKGRlbm9taW5hdG9yID09IDApXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgdmFyIGR4MzEgPSB4MSAtIHgzLCBkeTMxID0geTEgLSB5MywgbnVtYSA9IGR4MzQgKiBkeTMxIC0gZHkzNCAqIGR4MzEsIGEgPSBudW1hIC8gZGVub21pbmF0b3IsIG51bWIgPSBkeDEyICogZHkzMSAtIGR5MTIgKiBkeDMxLCBiID0gbnVtYiAvIGRlbm9taW5hdG9yO1xuICAgICAgICBpZiAoYSA+PSAwICYmIGEgPD0gMSAmJiBiID49IDAgJiYgYiA8PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IHgxICsgYSAqIGR4MTIsXG4gICAgICAgICAgICAgICAgeTogeTEgKyBhICogZHkxMlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuaW5mbGF0ZSA9IGZ1bmN0aW9uIChwYWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0YW5nbGUodGhpcy54IC0gcGFkLCB0aGlzLlggKyBwYWQsIHRoaXMueSAtIHBhZCwgdGhpcy5ZICsgcGFkKTtcbiAgICB9O1xuICAgIHJldHVybiBSZWN0YW5nbGU7XG59KCkpO1xuZXhwb3J0cy5SZWN0YW5nbGUgPSBSZWN0YW5nbGU7XG5mdW5jdGlvbiBtYWtlRWRnZUJldHdlZW4oc291cmNlLCB0YXJnZXQsIGFoKSB7XG4gICAgdmFyIHNpID0gc291cmNlLnJheUludGVyc2VjdGlvbih0YXJnZXQuY3goKSwgdGFyZ2V0LmN5KCkpIHx8IHsgeDogc291cmNlLmN4KCksIHk6IHNvdXJjZS5jeSgpIH0sIHRpID0gdGFyZ2V0LnJheUludGVyc2VjdGlvbihzb3VyY2UuY3goKSwgc291cmNlLmN5KCkpIHx8IHsgeDogdGFyZ2V0LmN4KCksIHk6IHRhcmdldC5jeSgpIH0sIGR4ID0gdGkueCAtIHNpLngsIGR5ID0gdGkueSAtIHNpLnksIGwgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpLCBhbCA9IGwgLSBhaDtcbiAgICByZXR1cm4ge1xuICAgICAgICBzb3VyY2VJbnRlcnNlY3Rpb246IHNpLFxuICAgICAgICB0YXJnZXRJbnRlcnNlY3Rpb246IHRpLFxuICAgICAgICBhcnJvd1N0YXJ0OiB7IHg6IHNpLnggKyBhbCAqIGR4IC8gbCwgeTogc2kueSArIGFsICogZHkgLyBsIH1cbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlRWRnZUJldHdlZW4gPSBtYWtlRWRnZUJldHdlZW47XG5mdW5jdGlvbiBtYWtlRWRnZVRvKHMsIHRhcmdldCwgYWgpIHtcbiAgICB2YXIgdGkgPSB0YXJnZXQucmF5SW50ZXJzZWN0aW9uKHMueCwgcy55KTtcbiAgICBpZiAoIXRpKVxuICAgICAgICB0aSA9IHsgeDogdGFyZ2V0LmN4KCksIHk6IHRhcmdldC5jeSgpIH07XG4gICAgdmFyIGR4ID0gdGkueCAtIHMueCwgZHkgPSB0aS55IC0gcy55LCBsID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICByZXR1cm4geyB4OiB0aS54IC0gYWggKiBkeCAvIGwsIHk6IHRpLnkgLSBhaCAqIGR5IC8gbCB9O1xufVxuZXhwb3J0cy5tYWtlRWRnZVRvID0gbWFrZUVkZ2VUbztcbnZhciBOb2RlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlKHYsIHIsIHBvcykge1xuICAgICAgICB0aGlzLnYgPSB2O1xuICAgICAgICB0aGlzLnIgPSByO1xuICAgICAgICB0aGlzLnBvcyA9IHBvcztcbiAgICAgICAgdGhpcy5wcmV2ID0gbWFrZVJCVHJlZSgpO1xuICAgICAgICB0aGlzLm5leHQgPSBtYWtlUkJUcmVlKCk7XG4gICAgfVxuICAgIHJldHVybiBOb2RlO1xufSgpKTtcbnZhciBFdmVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXZlbnQoaXNPcGVuLCB2LCBwb3MpIHtcbiAgICAgICAgdGhpcy5pc09wZW4gPSBpc09wZW47XG4gICAgICAgIHRoaXMudiA9IHY7XG4gICAgICAgIHRoaXMucG9zID0gcG9zO1xuICAgIH1cbiAgICByZXR1cm4gRXZlbnQ7XG59KCkpO1xuZnVuY3Rpb24gY29tcGFyZUV2ZW50cyhhLCBiKSB7XG4gICAgaWYgKGEucG9zID4gYi5wb3MpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGlmIChhLnBvcyA8IGIucG9zKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKGEuaXNPcGVuKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKGIuaXNPcGVuKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIG1ha2VSQlRyZWUoKSB7XG4gICAgcmV0dXJuIG5ldyByYnRyZWVfMS5SQlRyZWUoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEucG9zIC0gYi5wb3M7IH0pO1xufVxudmFyIHhSZWN0ID0ge1xuICAgIGdldENlbnRyZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIuY3goKTsgfSxcbiAgICBnZXRPcGVuOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci55OyB9LFxuICAgIGdldENsb3NlOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci5ZOyB9LFxuICAgIGdldFNpemU6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLndpZHRoKCk7IH0sXG4gICAgbWFrZVJlY3Q6IGZ1bmN0aW9uIChvcGVuLCBjbG9zZSwgY2VudGVyLCBzaXplKSB7IHJldHVybiBuZXcgUmVjdGFuZ2xlKGNlbnRlciAtIHNpemUgLyAyLCBjZW50ZXIgKyBzaXplIC8gMiwgb3BlbiwgY2xvc2UpOyB9LFxuICAgIGZpbmROZWlnaGJvdXJzOiBmaW5kWE5laWdoYm91cnNcbn07XG52YXIgeVJlY3QgPSB7XG4gICAgZ2V0Q2VudHJlOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci5jeSgpOyB9LFxuICAgIGdldE9wZW46IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLng7IH0sXG4gICAgZ2V0Q2xvc2U6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLlg7IH0sXG4gICAgZ2V0U2l6ZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIuaGVpZ2h0KCk7IH0sXG4gICAgbWFrZVJlY3Q6IGZ1bmN0aW9uIChvcGVuLCBjbG9zZSwgY2VudGVyLCBzaXplKSB7IHJldHVybiBuZXcgUmVjdGFuZ2xlKG9wZW4sIGNsb3NlLCBjZW50ZXIgLSBzaXplIC8gMiwgY2VudGVyICsgc2l6ZSAvIDIpOyB9LFxuICAgIGZpbmROZWlnaGJvdXJzOiBmaW5kWU5laWdoYm91cnNcbn07XG5mdW5jdGlvbiBnZW5lcmF0ZUdyb3VwQ29uc3RyYWludHMocm9vdCwgZiwgbWluU2VwLCBpc0NvbnRhaW5lZCkge1xuICAgIGlmIChpc0NvbnRhaW5lZCA9PT0gdm9pZCAwKSB7IGlzQ29udGFpbmVkID0gZmFsc2U7IH1cbiAgICB2YXIgcGFkZGluZyA9IHJvb3QucGFkZGluZywgZ24gPSB0eXBlb2Ygcm9vdC5ncm91cHMgIT09ICd1bmRlZmluZWQnID8gcm9vdC5ncm91cHMubGVuZ3RoIDogMCwgbG4gPSB0eXBlb2Ygcm9vdC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnID8gcm9vdC5sZWF2ZXMubGVuZ3RoIDogMCwgY2hpbGRDb25zdHJhaW50cyA9ICFnbiA/IFtdXG4gICAgICAgIDogcm9vdC5ncm91cHMucmVkdWNlKGZ1bmN0aW9uIChjY3MsIGcpIHsgcmV0dXJuIGNjcy5jb25jYXQoZ2VuZXJhdGVHcm91cENvbnN0cmFpbnRzKGcsIGYsIG1pblNlcCwgdHJ1ZSkpOyB9LCBbXSksIG4gPSAoaXNDb250YWluZWQgPyAyIDogMCkgKyBsbiArIGduLCB2cyA9IG5ldyBBcnJheShuKSwgcnMgPSBuZXcgQXJyYXkobiksIGkgPSAwLCBhZGQgPSBmdW5jdGlvbiAociwgdikgeyByc1tpXSA9IHI7IHZzW2krK10gPSB2OyB9O1xuICAgIGlmIChpc0NvbnRhaW5lZCkge1xuICAgICAgICB2YXIgYiA9IHJvb3QuYm91bmRzLCBjID0gZi5nZXRDZW50cmUoYiksIHMgPSBmLmdldFNpemUoYikgLyAyLCBvcGVuID0gZi5nZXRPcGVuKGIpLCBjbG9zZSA9IGYuZ2V0Q2xvc2UoYiksIG1pbiA9IGMgLSBzICsgcGFkZGluZyAvIDIsIG1heCA9IGMgKyBzIC0gcGFkZGluZyAvIDI7XG4gICAgICAgIHJvb3QubWluVmFyLmRlc2lyZWRQb3NpdGlvbiA9IG1pbjtcbiAgICAgICAgYWRkKGYubWFrZVJlY3Qob3BlbiwgY2xvc2UsIG1pbiwgcGFkZGluZyksIHJvb3QubWluVmFyKTtcbiAgICAgICAgcm9vdC5tYXhWYXIuZGVzaXJlZFBvc2l0aW9uID0gbWF4O1xuICAgICAgICBhZGQoZi5tYWtlUmVjdChvcGVuLCBjbG9zZSwgbWF4LCBwYWRkaW5nKSwgcm9vdC5tYXhWYXIpO1xuICAgIH1cbiAgICBpZiAobG4pXG4gICAgICAgIHJvb3QubGVhdmVzLmZvckVhY2goZnVuY3Rpb24gKGwpIHsgcmV0dXJuIGFkZChsLmJvdW5kcywgbC52YXJpYWJsZSk7IH0pO1xuICAgIGlmIChnbilcbiAgICAgICAgcm9vdC5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgdmFyIGIgPSBnLmJvdW5kcztcbiAgICAgICAgICAgIGFkZChmLm1ha2VSZWN0KGYuZ2V0T3BlbihiKSwgZi5nZXRDbG9zZShiKSwgZi5nZXRDZW50cmUoYiksIGYuZ2V0U2l6ZShiKSksIGcubWluVmFyKTtcbiAgICAgICAgfSk7XG4gICAgdmFyIGNzID0gZ2VuZXJhdGVDb25zdHJhaW50cyhycywgdnMsIGYsIG1pblNlcCk7XG4gICAgaWYgKGduKSB7XG4gICAgICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgdi5jT3V0ID0gW10sIHYuY0luID0gW107IH0pO1xuICAgICAgICBjcy5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IGMubGVmdC5jT3V0LnB1c2goYyksIGMucmlnaHQuY0luLnB1c2goYyk7IH0pO1xuICAgICAgICByb290Lmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICB2YXIgZ2FwQWRqdXN0bWVudCA9IChnLnBhZGRpbmcgLSBmLmdldFNpemUoZy5ib3VuZHMpKSAvIDI7XG4gICAgICAgICAgICBnLm1pblZhci5jSW4uZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5nYXAgKz0gZ2FwQWRqdXN0bWVudDsgfSk7XG4gICAgICAgICAgICBnLm1pblZhci5jT3V0LmZvckVhY2goZnVuY3Rpb24gKGMpIHsgYy5sZWZ0ID0gZy5tYXhWYXI7IGMuZ2FwICs9IGdhcEFkanVzdG1lbnQ7IH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkQ29uc3RyYWludHMuY29uY2F0KGNzKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQ29uc3RyYWludHMocnMsIHZhcnMsIHJlY3QsIG1pblNlcCkge1xuICAgIHZhciBpLCBuID0gcnMubGVuZ3RoO1xuICAgIHZhciBOID0gMiAqIG47XG4gICAgY29uc29sZS5hc3NlcnQodmFycy5sZW5ndGggPj0gbik7XG4gICAgdmFyIGV2ZW50cyA9IG5ldyBBcnJheShOKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHZhciByID0gcnNbaV07XG4gICAgICAgIHZhciB2ID0gbmV3IE5vZGUodmFyc1tpXSwgciwgcmVjdC5nZXRDZW50cmUocikpO1xuICAgICAgICBldmVudHNbaV0gPSBuZXcgRXZlbnQodHJ1ZSwgdiwgcmVjdC5nZXRPcGVuKHIpKTtcbiAgICAgICAgZXZlbnRzW2kgKyBuXSA9IG5ldyBFdmVudChmYWxzZSwgdiwgcmVjdC5nZXRDbG9zZShyKSk7XG4gICAgfVxuICAgIGV2ZW50cy5zb3J0KGNvbXBhcmVFdmVudHMpO1xuICAgIHZhciBjcyA9IFtdO1xuICAgIHZhciBzY2FubGluZSA9IG1ha2VSQlRyZWUoKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgTjsgKytpKSB7XG4gICAgICAgIHZhciBlID0gZXZlbnRzW2ldO1xuICAgICAgICB2YXIgdiA9IGUudjtcbiAgICAgICAgaWYgKGUuaXNPcGVuKSB7XG4gICAgICAgICAgICBzY2FubGluZS5pbnNlcnQodik7XG4gICAgICAgICAgICByZWN0LmZpbmROZWlnaGJvdXJzKHYsIHNjYW5saW5lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNjYW5saW5lLnJlbW92ZSh2KTtcbiAgICAgICAgICAgIHZhciBtYWtlQ29uc3RyYWludCA9IGZ1bmN0aW9uIChsLCByKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlcCA9IChyZWN0LmdldFNpemUobC5yKSArIHJlY3QuZ2V0U2l6ZShyLnIpKSAvIDIgKyBtaW5TZXA7XG4gICAgICAgICAgICAgICAgY3MucHVzaChuZXcgdnBzY18xLkNvbnN0cmFpbnQobC52LCByLnYsIHNlcCkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciB2aXNpdE5laWdoYm91cnMgPSBmdW5jdGlvbiAoZm9yd2FyZCwgcmV2ZXJzZSwgbWtjb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgdSwgaXQgPSB2W2ZvcndhcmRdLml0ZXJhdG9yKCk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKCh1ID0gaXRbZm9yd2FyZF0oKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbWtjb24odSwgdik7XG4gICAgICAgICAgICAgICAgICAgIHVbcmV2ZXJzZV0ucmVtb3ZlKHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2aXNpdE5laWdoYm91cnMoXCJwcmV2XCIsIFwibmV4dFwiLCBmdW5jdGlvbiAodSwgdikgeyByZXR1cm4gbWFrZUNvbnN0cmFpbnQodSwgdik7IH0pO1xuICAgICAgICAgICAgdmlzaXROZWlnaGJvdXJzKFwibmV4dFwiLCBcInByZXZcIiwgZnVuY3Rpb24gKHUsIHYpIHsgcmV0dXJuIG1ha2VDb25zdHJhaW50KHYsIHUpOyB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmFzc2VydChzY2FubGluZS5zaXplID09PSAwKTtcbiAgICByZXR1cm4gY3M7XG59XG5mdW5jdGlvbiBmaW5kWE5laWdoYm91cnModiwgc2NhbmxpbmUpIHtcbiAgICB2YXIgZiA9IGZ1bmN0aW9uIChmb3J3YXJkLCByZXZlcnNlKSB7XG4gICAgICAgIHZhciBpdCA9IHNjYW5saW5lLmZpbmRJdGVyKHYpO1xuICAgICAgICB2YXIgdTtcbiAgICAgICAgd2hpbGUgKCh1ID0gaXRbZm9yd2FyZF0oKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciB1b3ZlcnZYID0gdS5yLm92ZXJsYXBYKHYucik7XG4gICAgICAgICAgICBpZiAodW92ZXJ2WCA8PSAwIHx8IHVvdmVydlggPD0gdS5yLm92ZXJsYXBZKHYucikpIHtcbiAgICAgICAgICAgICAgICB2W2ZvcndhcmRdLmluc2VydCh1KTtcbiAgICAgICAgICAgICAgICB1W3JldmVyc2VdLmluc2VydCh2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1b3ZlcnZYIDw9IDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgZihcIm5leHRcIiwgXCJwcmV2XCIpO1xuICAgIGYoXCJwcmV2XCIsIFwibmV4dFwiKTtcbn1cbmZ1bmN0aW9uIGZpbmRZTmVpZ2hib3Vycyh2LCBzY2FubGluZSkge1xuICAgIHZhciBmID0gZnVuY3Rpb24gKGZvcndhcmQsIHJldmVyc2UpIHtcbiAgICAgICAgdmFyIHUgPSBzY2FubGluZS5maW5kSXRlcih2KVtmb3J3YXJkXSgpO1xuICAgICAgICBpZiAodSAhPT0gbnVsbCAmJiB1LnIub3ZlcmxhcFgodi5yKSA+IDApIHtcbiAgICAgICAgICAgIHZbZm9yd2FyZF0uaW5zZXJ0KHUpO1xuICAgICAgICAgICAgdVtyZXZlcnNlXS5pbnNlcnQodik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGYoXCJuZXh0XCIsIFwicHJldlwiKTtcbiAgICBmKFwicHJldlwiLCBcIm5leHRcIik7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVhDb25zdHJhaW50cyhycywgdmFycykge1xuICAgIHJldHVybiBnZW5lcmF0ZUNvbnN0cmFpbnRzKHJzLCB2YXJzLCB4UmVjdCwgMWUtNik7XG59XG5leHBvcnRzLmdlbmVyYXRlWENvbnN0cmFpbnRzID0gZ2VuZXJhdGVYQ29uc3RyYWludHM7XG5mdW5jdGlvbiBnZW5lcmF0ZVlDb25zdHJhaW50cyhycywgdmFycykge1xuICAgIHJldHVybiBnZW5lcmF0ZUNvbnN0cmFpbnRzKHJzLCB2YXJzLCB5UmVjdCwgMWUtNik7XG59XG5leHBvcnRzLmdlbmVyYXRlWUNvbnN0cmFpbnRzID0gZ2VuZXJhdGVZQ29uc3RyYWludHM7XG5mdW5jdGlvbiBnZW5lcmF0ZVhHcm91cENvbnN0cmFpbnRzKHJvb3QpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVHcm91cENvbnN0cmFpbnRzKHJvb3QsIHhSZWN0LCAxZS02KTtcbn1cbmV4cG9ydHMuZ2VuZXJhdGVYR3JvdXBDb25zdHJhaW50cyA9IGdlbmVyYXRlWEdyb3VwQ29uc3RyYWludHM7XG5mdW5jdGlvbiBnZW5lcmF0ZVlHcm91cENvbnN0cmFpbnRzKHJvb3QpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVHcm91cENvbnN0cmFpbnRzKHJvb3QsIHlSZWN0LCAxZS02KTtcbn1cbmV4cG9ydHMuZ2VuZXJhdGVZR3JvdXBDb25zdHJhaW50cyA9IGdlbmVyYXRlWUdyb3VwQ29uc3RyYWludHM7XG5mdW5jdGlvbiByZW1vdmVPdmVybGFwcyhycykge1xuICAgIHZhciB2cyA9IHJzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gbmV3IHZwc2NfMS5WYXJpYWJsZShyLmN4KCkpOyB9KTtcbiAgICB2YXIgY3MgPSBnZW5lcmF0ZVhDb25zdHJhaW50cyhycywgdnMpO1xuICAgIHZhciBzb2x2ZXIgPSBuZXcgdnBzY18xLlNvbHZlcih2cywgY3MpO1xuICAgIHNvbHZlci5zb2x2ZSgpO1xuICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHJzW2ldLnNldFhDZW50cmUodi5wb3NpdGlvbigpKTsgfSk7XG4gICAgdnMgPSBycy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIG5ldyB2cHNjXzEuVmFyaWFibGUoci5jeSgpKTsgfSk7XG4gICAgY3MgPSBnZW5lcmF0ZVlDb25zdHJhaW50cyhycywgdnMpO1xuICAgIHNvbHZlciA9IG5ldyB2cHNjXzEuU29sdmVyKHZzLCBjcyk7XG4gICAgc29sdmVyLnNvbHZlKCk7XG4gICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gcnNbaV0uc2V0WUNlbnRyZSh2LnBvc2l0aW9uKCkpOyB9KTtcbn1cbmV4cG9ydHMucmVtb3ZlT3ZlcmxhcHMgPSByZW1vdmVPdmVybGFwcztcbnZhciBJbmRleGVkVmFyaWFibGUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhJbmRleGVkVmFyaWFibGUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gSW5kZXhlZFZhcmlhYmxlKGluZGV4LCB3KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIDAsIHcpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIEluZGV4ZWRWYXJpYWJsZTtcbn0odnBzY18xLlZhcmlhYmxlKSk7XG5leHBvcnRzLkluZGV4ZWRWYXJpYWJsZSA9IEluZGV4ZWRWYXJpYWJsZTtcbnZhciBQcm9qZWN0aW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQcm9qZWN0aW9uKG5vZGVzLCBncm91cHMsIHJvb3RHcm91cCwgY29uc3RyYWludHMsIGF2b2lkT3ZlcmxhcHMpIHtcbiAgICAgICAgaWYgKHJvb3RHcm91cCA9PT0gdm9pZCAwKSB7IHJvb3RHcm91cCA9IG51bGw7IH1cbiAgICAgICAgaWYgKGNvbnN0cmFpbnRzID09PSB2b2lkIDApIHsgY29uc3RyYWludHMgPSBudWxsOyB9XG4gICAgICAgIGlmIChhdm9pZE92ZXJsYXBzID09PSB2b2lkIDApIHsgYXZvaWRPdmVybGFwcyA9IGZhbHNlOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMubm9kZXMgPSBub2RlcztcbiAgICAgICAgdGhpcy5ncm91cHMgPSBncm91cHM7XG4gICAgICAgIHRoaXMucm9vdEdyb3VwID0gcm9vdEdyb3VwO1xuICAgICAgICB0aGlzLmF2b2lkT3ZlcmxhcHMgPSBhdm9pZE92ZXJsYXBzO1xuICAgICAgICB0aGlzLnZhcmlhYmxlcyA9IG5vZGVzLm1hcChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIHYudmFyaWFibGUgPSBuZXcgSW5kZXhlZFZhcmlhYmxlKGksIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNvbnN0cmFpbnRzKVxuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25zdHJhaW50cyhjb25zdHJhaW50cyk7XG4gICAgICAgIGlmIChhdm9pZE92ZXJsYXBzICYmIHJvb3RHcm91cCAmJiB0eXBlb2Ygcm9vdEdyb3VwLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXYud2lkdGggfHwgIXYuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHYuYm91bmRzID0gbmV3IFJlY3RhbmdsZSh2LngsIHYueCwgdi55LCB2LnkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB3MiA9IHYud2lkdGggLyAyLCBoMiA9IHYuaGVpZ2h0IC8gMjtcbiAgICAgICAgICAgICAgICB2LmJvdW5kcyA9IG5ldyBSZWN0YW5nbGUodi54IC0gdzIsIHYueCArIHcyLCB2LnkgLSBoMiwgdi55ICsgaDIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb21wdXRlR3JvdXBCb3VuZHMocm9vdEdyb3VwKTtcbiAgICAgICAgICAgIHZhciBpID0gbm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy52YXJpYWJsZXNbaV0gPSBnLm1pblZhciA9IG5ldyBJbmRleGVkVmFyaWFibGUoaSsrLCB0eXBlb2YgZy5zdGlmZm5lc3MgIT09IFwidW5kZWZpbmVkXCIgPyBnLnN0aWZmbmVzcyA6IDAuMDEpO1xuICAgICAgICAgICAgICAgIF90aGlzLnZhcmlhYmxlc1tpXSA9IGcubWF4VmFyID0gbmV3IEluZGV4ZWRWYXJpYWJsZShpKyssIHR5cGVvZiBnLnN0aWZmbmVzcyAhPT0gXCJ1bmRlZmluZWRcIiA/IGcuc3RpZmZuZXNzIDogMC4wMSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5jcmVhdGVTZXBhcmF0aW9uID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB2cHNjXzEuQ29uc3RyYWludCh0aGlzLm5vZGVzW2MubGVmdF0udmFyaWFibGUsIHRoaXMubm9kZXNbYy5yaWdodF0udmFyaWFibGUsIGMuZ2FwLCB0eXBlb2YgYy5lcXVhbGl0eSAhPT0gXCJ1bmRlZmluZWRcIiA/IGMuZXF1YWxpdHkgOiBmYWxzZSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5tYWtlRmVhc2libGUgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoIXRoaXMuYXZvaWRPdmVybGFwcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGF4aXMgPSAneCcsIGRpbSA9ICd3aWR0aCc7XG4gICAgICAgIGlmIChjLmF4aXMgPT09ICd4JylcbiAgICAgICAgICAgIGF4aXMgPSAneScsIGRpbSA9ICdoZWlnaHQnO1xuICAgICAgICB2YXIgdnMgPSBjLm9mZnNldHMubWFwKGZ1bmN0aW9uIChvKSB7IHJldHVybiBfdGhpcy5ub2Rlc1tvLm5vZGVdOyB9KS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhW2F4aXNdIC0gYltheGlzXTsgfSk7XG4gICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKHApIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dFBvcyA9IHBbYXhpc10gKyBwW2RpbV07XG4gICAgICAgICAgICAgICAgaWYgKG5leHRQb3MgPiB2W2F4aXNdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZbYXhpc10gPSBuZXh0UG9zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHAgPSB2O1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLmNyZWF0ZUFsaWdubWVudCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciB1ID0gdGhpcy5ub2Rlc1tjLm9mZnNldHNbMF0ubm9kZV0udmFyaWFibGU7XG4gICAgICAgIHRoaXMubWFrZUZlYXNpYmxlKGMpO1xuICAgICAgICB2YXIgY3MgPSBjLmF4aXMgPT09ICd4JyA/IHRoaXMueENvbnN0cmFpbnRzIDogdGhpcy55Q29uc3RyYWludHM7XG4gICAgICAgIGMub2Zmc2V0cy5zbGljZSgxKS5mb3JFYWNoKGZ1bmN0aW9uIChvKSB7XG4gICAgICAgICAgICB2YXIgdiA9IF90aGlzLm5vZGVzW28ubm9kZV0udmFyaWFibGU7XG4gICAgICAgICAgICBjcy5wdXNoKG5ldyB2cHNjXzEuQ29uc3RyYWludCh1LCB2LCBvLm9mZnNldCwgdHJ1ZSkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLmNyZWF0ZUNvbnN0cmFpbnRzID0gZnVuY3Rpb24gKGNvbnN0cmFpbnRzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBpc1NlcCA9IGZ1bmN0aW9uIChjKSB7IHJldHVybiB0eXBlb2YgYy50eXBlID09PSAndW5kZWZpbmVkJyB8fCBjLnR5cGUgPT09ICdzZXBhcmF0aW9uJzsgfTtcbiAgICAgICAgdGhpcy54Q29uc3RyYWludHMgPSBjb25zdHJhaW50c1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5heGlzID09PSBcInhcIiAmJiBpc1NlcChjKTsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIF90aGlzLmNyZWF0ZVNlcGFyYXRpb24oYyk7IH0pO1xuICAgICAgICB0aGlzLnlDb25zdHJhaW50cyA9IGNvbnN0cmFpbnRzXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmF4aXMgPT09IFwieVwiICYmIGlzU2VwKGMpOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gX3RoaXMuY3JlYXRlU2VwYXJhdGlvbihjKTsgfSk7XG4gICAgICAgIGNvbnN0cmFpbnRzXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLnR5cGUgPT09ICdhbGlnbm1lbnQnOyB9KVxuICAgICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgcmV0dXJuIF90aGlzLmNyZWF0ZUFsaWdubWVudChjKTsgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5zZXR1cFZhcmlhYmxlc0FuZEJvdW5kcyA9IGZ1bmN0aW9uICh4MCwgeTAsIGRlc2lyZWQsIGdldERlc2lyZWQpIHtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICBpZiAodi5maXhlZCkge1xuICAgICAgICAgICAgICAgIHYudmFyaWFibGUud2VpZ2h0ID0gdi5maXhlZFdlaWdodCA/IHYuZml4ZWRXZWlnaHQgOiAxMDAwO1xuICAgICAgICAgICAgICAgIGRlc2lyZWRbaV0gPSBnZXREZXNpcmVkKHYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdi52YXJpYWJsZS53ZWlnaHQgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHcgPSAodi53aWR0aCB8fCAwKSAvIDIsIGggPSAodi5oZWlnaHQgfHwgMCkgLyAyO1xuICAgICAgICAgICAgdmFyIGl4ID0geDBbaV0sIGl5ID0geTBbaV07XG4gICAgICAgICAgICB2LmJvdW5kcyA9IG5ldyBSZWN0YW5nbGUoaXggLSB3LCBpeCArIHcsIGl5IC0gaCwgaXkgKyBoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS54UHJvamVjdCA9IGZ1bmN0aW9uICh4MCwgeTAsIHgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJvb3RHcm91cCAmJiAhKHRoaXMuYXZvaWRPdmVybGFwcyB8fCB0aGlzLnhDb25zdHJhaW50cykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucHJvamVjdCh4MCwgeTAsIHgwLCB4LCBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5weDsgfSwgdGhpcy54Q29uc3RyYWludHMsIGdlbmVyYXRlWEdyb3VwQ29uc3RyYWludHMsIGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmJvdW5kcy5zZXRYQ2VudHJlKHhbdi52YXJpYWJsZS5pbmRleF0gPSB2LnZhcmlhYmxlLnBvc2l0aW9uKCkpOyB9LCBmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgdmFyIHhtaW4gPSB4W2cubWluVmFyLmluZGV4XSA9IGcubWluVmFyLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgeG1heCA9IHhbZy5tYXhWYXIuaW5kZXhdID0gZy5tYXhWYXIucG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciBwMiA9IGcucGFkZGluZyAvIDI7XG4gICAgICAgICAgICBnLmJvdW5kcy54ID0geG1pbiAtIHAyO1xuICAgICAgICAgICAgZy5ib3VuZHMuWCA9IHhtYXggKyBwMjtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS55UHJvamVjdCA9IGZ1bmN0aW9uICh4MCwgeTAsIHkpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJvb3RHcm91cCAmJiAhdGhpcy55Q29uc3RyYWludHMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucHJvamVjdCh4MCwgeTAsIHkwLCB5LCBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5weTsgfSwgdGhpcy55Q29uc3RyYWludHMsIGdlbmVyYXRlWUdyb3VwQ29uc3RyYWludHMsIGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmJvdW5kcy5zZXRZQ2VudHJlKHlbdi52YXJpYWJsZS5pbmRleF0gPSB2LnZhcmlhYmxlLnBvc2l0aW9uKCkpOyB9LCBmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgdmFyIHltaW4gPSB5W2cubWluVmFyLmluZGV4XSA9IGcubWluVmFyLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgeW1heCA9IHlbZy5tYXhWYXIuaW5kZXhdID0gZy5tYXhWYXIucG9zaXRpb24oKTtcbiAgICAgICAgICAgIHZhciBwMiA9IGcucGFkZGluZyAvIDI7XG4gICAgICAgICAgICBnLmJvdW5kcy55ID0geW1pbiAtIHAyO1xuICAgICAgICAgICAgZy5ib3VuZHMuWSA9IHltYXggKyBwMjtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5wcm9qZWN0RnVuY3Rpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgZnVuY3Rpb24gKHgwLCB5MCwgeCkgeyByZXR1cm4gX3RoaXMueFByb2plY3QoeDAsIHkwLCB4KTsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICh4MCwgeTAsIHkpIHsgcmV0dXJuIF90aGlzLnlQcm9qZWN0KHgwLCB5MCwgeSk7IH1cbiAgICAgICAgXTtcbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLnByb2plY3QgPSBmdW5jdGlvbiAoeDAsIHkwLCBzdGFydCwgZGVzaXJlZCwgZ2V0RGVzaXJlZCwgY3MsIGdlbmVyYXRlQ29uc3RyYWludHMsIHVwZGF0ZU5vZGVCb3VuZHMsIHVwZGF0ZUdyb3VwQm91bmRzKSB7XG4gICAgICAgIHRoaXMuc2V0dXBWYXJpYWJsZXNBbmRCb3VuZHMoeDAsIHkwLCBkZXNpcmVkLCBnZXREZXNpcmVkKTtcbiAgICAgICAgaWYgKHRoaXMucm9vdEdyb3VwICYmIHRoaXMuYXZvaWRPdmVybGFwcykge1xuICAgICAgICAgICAgY29tcHV0ZUdyb3VwQm91bmRzKHRoaXMucm9vdEdyb3VwKTtcbiAgICAgICAgICAgIGNzID0gY3MuY29uY2F0KGdlbmVyYXRlQ29uc3RyYWludHModGhpcy5yb290R3JvdXApKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNvbHZlKHRoaXMudmFyaWFibGVzLCBjcywgc3RhcnQsIGRlc2lyZWQpO1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2godXBkYXRlTm9kZUJvdW5kcyk7XG4gICAgICAgIGlmICh0aGlzLnJvb3RHcm91cCAmJiB0aGlzLmF2b2lkT3ZlcmxhcHMpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzLmZvckVhY2godXBkYXRlR3JvdXBCb3VuZHMpO1xuICAgICAgICAgICAgY29tcHV0ZUdyb3VwQm91bmRzKHRoaXMucm9vdEdyb3VwKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbiAodnMsIGNzLCBzdGFydGluZywgZGVzaXJlZCkge1xuICAgICAgICB2YXIgc29sdmVyID0gbmV3IHZwc2NfMS5Tb2x2ZXIodnMsIGNzKTtcbiAgICAgICAgc29sdmVyLnNldFN0YXJ0aW5nUG9zaXRpb25zKHN0YXJ0aW5nKTtcbiAgICAgICAgc29sdmVyLnNldERlc2lyZWRQb3NpdGlvbnMoZGVzaXJlZCk7XG4gICAgICAgIHNvbHZlci5zb2x2ZSgpO1xuICAgIH07XG4gICAgcmV0dXJuIFByb2plY3Rpb247XG59KCkpO1xuZXhwb3J0cy5Qcm9qZWN0aW9uID0gUHJvamVjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlY3RhbmdsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBwcXVldWVfMSA9IHJlcXVpcmUoXCIuL3BxdWV1ZVwiKTtcbnZhciBOZWlnaGJvdXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5laWdoYm91cihpZCwgZGlzdGFuY2UpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLmRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgfVxuICAgIHJldHVybiBOZWlnaGJvdXI7XG59KCkpO1xudmFyIE5vZGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5vZGUoaWQpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLm5laWdoYm91cnMgPSBbXTtcbiAgICB9XG4gICAgcmV0dXJuIE5vZGU7XG59KCkpO1xudmFyIFF1ZXVlRW50cnkgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFF1ZXVlRW50cnkobm9kZSwgcHJldiwgZCkge1xuICAgICAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLnByZXYgPSBwcmV2O1xuICAgICAgICB0aGlzLmQgPSBkO1xuICAgIH1cbiAgICByZXR1cm4gUXVldWVFbnRyeTtcbn0oKSk7XG52YXIgQ2FsY3VsYXRvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2FsY3VsYXRvcihuLCBlcywgZ2V0U291cmNlSW5kZXgsIGdldFRhcmdldEluZGV4LCBnZXRMZW5ndGgpIHtcbiAgICAgICAgdGhpcy5uID0gbjtcbiAgICAgICAgdGhpcy5lcyA9IGVzO1xuICAgICAgICB0aGlzLm5laWdoYm91cnMgPSBuZXcgQXJyYXkodGhpcy5uKTtcbiAgICAgICAgdmFyIGkgPSB0aGlzLm47XG4gICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICB0aGlzLm5laWdoYm91cnNbaV0gPSBuZXcgTm9kZShpKTtcbiAgICAgICAgaSA9IHRoaXMuZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgZSA9IHRoaXMuZXNbaV07XG4gICAgICAgICAgICB2YXIgdSA9IGdldFNvdXJjZUluZGV4KGUpLCB2ID0gZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgICAgICAgICB2YXIgZCA9IGdldExlbmd0aChlKTtcbiAgICAgICAgICAgIHRoaXMubmVpZ2hib3Vyc1t1XS5uZWlnaGJvdXJzLnB1c2gobmV3IE5laWdoYm91cih2LCBkKSk7XG4gICAgICAgICAgICB0aGlzLm5laWdoYm91cnNbdl0ubmVpZ2hib3Vycy5wdXNoKG5ldyBOZWlnaGJvdXIodSwgZCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIENhbGN1bGF0b3IucHJvdG90eXBlLkRpc3RhbmNlTWF0cml4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgRCA9IG5ldyBBcnJheSh0aGlzLm4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICBEW2ldID0gdGhpcy5kaWprc3RyYU5laWdoYm91cnMoaSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEQ7XG4gICAgfTtcbiAgICBDYWxjdWxhdG9yLnByb3RvdHlwZS5EaXN0YW5jZXNGcm9tTm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaWprc3RyYU5laWdoYm91cnMoc3RhcnQpO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuUGF0aEZyb21Ob2RlVG9Ob2RlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlqa3N0cmFOZWlnaGJvdXJzKHN0YXJ0LCBlbmQpO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuUGF0aEZyb21Ob2RlVG9Ob2RlV2l0aFByZXZDb3N0ID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIHByZXZDb3N0KSB7XG4gICAgICAgIHZhciBxID0gbmV3IHBxdWV1ZV8xLlByaW9yaXR5UXVldWUoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuZCA8PSBiLmQ7IH0pLCB1ID0gdGhpcy5uZWlnaGJvdXJzW3N0YXJ0XSwgcXUgPSBuZXcgUXVldWVFbnRyeSh1LCBudWxsLCAwKSwgdmlzaXRlZEZyb20gPSB7fTtcbiAgICAgICAgcS5wdXNoKHF1KTtcbiAgICAgICAgd2hpbGUgKCFxLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHF1ID0gcS5wb3AoKTtcbiAgICAgICAgICAgIHUgPSBxdS5ub2RlO1xuICAgICAgICAgICAgaWYgKHUuaWQgPT09IGVuZCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGkgPSB1Lm5laWdoYm91cnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvdXIgPSB1Lm5laWdoYm91cnNbaV0sIHYgPSB0aGlzLm5laWdoYm91cnNbbmVpZ2hib3VyLmlkXTtcbiAgICAgICAgICAgICAgICBpZiAocXUucHJldiAmJiB2LmlkID09PSBxdS5wcmV2Lm5vZGUuaWQpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciB2aWR1aWQgPSB2LmlkICsgJywnICsgdS5pZDtcbiAgICAgICAgICAgICAgICBpZiAodmlkdWlkIGluIHZpc2l0ZWRGcm9tICYmIHZpc2l0ZWRGcm9tW3ZpZHVpZF0gPD0gcXUuZClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIGNjID0gcXUucHJldiA/IHByZXZDb3N0KHF1LnByZXYubm9kZS5pZCwgdS5pZCwgdi5pZCkgOiAwLCB0ID0gcXUuZCArIG5laWdoYm91ci5kaXN0YW5jZSArIGNjO1xuICAgICAgICAgICAgICAgIHZpc2l0ZWRGcm9tW3ZpZHVpZF0gPSB0O1xuICAgICAgICAgICAgICAgIHEucHVzaChuZXcgUXVldWVFbnRyeSh2LCBxdSwgdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBwYXRoID0gW107XG4gICAgICAgIHdoaWxlIChxdS5wcmV2KSB7XG4gICAgICAgICAgICBxdSA9IHF1LnByZXY7XG4gICAgICAgICAgICBwYXRoLnB1c2gocXUubm9kZS5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfTtcbiAgICBDYWxjdWxhdG9yLnByb3RvdHlwZS5kaWprc3RyYU5laWdoYm91cnMgPSBmdW5jdGlvbiAoc3RhcnQsIGRlc3QpIHtcbiAgICAgICAgaWYgKGRlc3QgPT09IHZvaWQgMCkgeyBkZXN0ID0gLTE7IH1cbiAgICAgICAgdmFyIHEgPSBuZXcgcHF1ZXVlXzEuUHJpb3JpdHlRdWV1ZShmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5kIDw9IGIuZDsgfSksIGkgPSB0aGlzLm5laWdoYm91cnMubGVuZ3RoLCBkID0gbmV3IEFycmF5KGkpO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMubmVpZ2hib3Vyc1tpXTtcbiAgICAgICAgICAgIG5vZGUuZCA9IGkgPT09IHN0YXJ0ID8gMCA6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgICAgICAgIG5vZGUucSA9IHEucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoIXEuZW1wdHkoKSkge1xuICAgICAgICAgICAgdmFyIHUgPSBxLnBvcCgpO1xuICAgICAgICAgICAgZFt1LmlkXSA9IHUuZDtcbiAgICAgICAgICAgIGlmICh1LmlkID09PSBkZXN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHU7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHR5cGVvZiB2LnByZXYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGgucHVzaCh2LnByZXYuaWQpO1xuICAgICAgICAgICAgICAgICAgICB2ID0gdi5wcmV2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSB1Lm5laWdoYm91cnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvdXIgPSB1Lm5laWdoYm91cnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB0aGlzLm5laWdoYm91cnNbbmVpZ2hib3VyLmlkXTtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IHUuZCArIG5laWdoYm91ci5kaXN0YW5jZTtcbiAgICAgICAgICAgICAgICBpZiAodS5kICE9PSBOdW1iZXIuTUFYX1ZBTFVFICYmIHYuZCA+IHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdi5kID0gdDtcbiAgICAgICAgICAgICAgICAgICAgdi5wcmV2ID0gdTtcbiAgICAgICAgICAgICAgICAgICAgcS5yZWR1Y2VLZXkodi5xLCB2LCBmdW5jdGlvbiAoZSwgcSkgeyByZXR1cm4gZS5xID0gcTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkO1xuICAgIH07XG4gICAgcmV0dXJuIENhbGN1bGF0b3I7XG59KCkpO1xuZXhwb3J0cy5DYWxjdWxhdG9yID0gQ2FsY3VsYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNob3J0ZXN0cGF0aHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgUG9zaXRpb25TdGF0cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUG9zaXRpb25TdGF0cyhzY2FsZSkge1xuICAgICAgICB0aGlzLnNjYWxlID0gc2NhbGU7XG4gICAgICAgIHRoaXMuQUIgPSAwO1xuICAgICAgICB0aGlzLkFEID0gMDtcbiAgICAgICAgdGhpcy5BMiA9IDA7XG4gICAgfVxuICAgIFBvc2l0aW9uU3RhdHMucHJvdG90eXBlLmFkZFZhcmlhYmxlID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdmFyIGFpID0gdGhpcy5zY2FsZSAvIHYuc2NhbGU7XG4gICAgICAgIHZhciBiaSA9IHYub2Zmc2V0IC8gdi5zY2FsZTtcbiAgICAgICAgdmFyIHdpID0gdi53ZWlnaHQ7XG4gICAgICAgIHRoaXMuQUIgKz0gd2kgKiBhaSAqIGJpO1xuICAgICAgICB0aGlzLkFEICs9IHdpICogYWkgKiB2LmRlc2lyZWRQb3NpdGlvbjtcbiAgICAgICAgdGhpcy5BMiArPSB3aSAqIGFpICogYWk7XG4gICAgfTtcbiAgICBQb3NpdGlvblN0YXRzLnByb3RvdHlwZS5nZXRQb3NuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuQUQgLSB0aGlzLkFCKSAvIHRoaXMuQTI7XG4gICAgfTtcbiAgICByZXR1cm4gUG9zaXRpb25TdGF0cztcbn0oKSk7XG5leHBvcnRzLlBvc2l0aW9uU3RhdHMgPSBQb3NpdGlvblN0YXRzO1xudmFyIENvbnN0cmFpbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbnN0cmFpbnQobGVmdCwgcmlnaHQsIGdhcCwgZXF1YWxpdHkpIHtcbiAgICAgICAgaWYgKGVxdWFsaXR5ID09PSB2b2lkIDApIHsgZXF1YWxpdHkgPSBmYWxzZTsgfVxuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgIHRoaXMuZ2FwID0gZ2FwO1xuICAgICAgICB0aGlzLmVxdWFsaXR5ID0gZXF1YWxpdHk7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMudW5zYXRpc2ZpYWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgIHRoaXMuZ2FwID0gZ2FwO1xuICAgICAgICB0aGlzLmVxdWFsaXR5ID0gZXF1YWxpdHk7XG4gICAgfVxuICAgIENvbnN0cmFpbnQucHJvdG90eXBlLnNsYWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy51bnNhdGlzZmlhYmxlID8gTnVtYmVyLk1BWF9WQUxVRVxuICAgICAgICAgICAgOiB0aGlzLnJpZ2h0LnNjYWxlICogdGhpcy5yaWdodC5wb3NpdGlvbigpIC0gdGhpcy5nYXBcbiAgICAgICAgICAgICAgICAtIHRoaXMubGVmdC5zY2FsZSAqIHRoaXMubGVmdC5wb3NpdGlvbigpO1xuICAgIH07XG4gICAgcmV0dXJuIENvbnN0cmFpbnQ7XG59KCkpO1xuZXhwb3J0cy5Db25zdHJhaW50ID0gQ29uc3RyYWludDtcbnZhciBWYXJpYWJsZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVmFyaWFibGUoZGVzaXJlZFBvc2l0aW9uLCB3ZWlnaHQsIHNjYWxlKSB7XG4gICAgICAgIGlmICh3ZWlnaHQgPT09IHZvaWQgMCkgeyB3ZWlnaHQgPSAxOyB9XG4gICAgICAgIGlmIChzY2FsZSA9PT0gdm9pZCAwKSB7IHNjYWxlID0gMTsgfVxuICAgICAgICB0aGlzLmRlc2lyZWRQb3NpdGlvbiA9IGRlc2lyZWRQb3NpdGlvbjtcbiAgICAgICAgdGhpcy53ZWlnaHQgPSB3ZWlnaHQ7XG4gICAgICAgIHRoaXMuc2NhbGUgPSBzY2FsZTtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSAwO1xuICAgIH1cbiAgICBWYXJpYWJsZS5wcm90b3R5cGUuZGZkdiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIDIuMCAqIHRoaXMud2VpZ2h0ICogKHRoaXMucG9zaXRpb24oKSAtIHRoaXMuZGVzaXJlZFBvc2l0aW9uKTtcbiAgICB9O1xuICAgIFZhcmlhYmxlLnByb3RvdHlwZS5wb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmJsb2NrLnBzLnNjYWxlICogdGhpcy5ibG9jay5wb3NuICsgdGhpcy5vZmZzZXQpIC8gdGhpcy5zY2FsZTtcbiAgICB9O1xuICAgIFZhcmlhYmxlLnByb3RvdHlwZS52aXNpdE5laWdoYm91cnMgPSBmdW5jdGlvbiAocHJldiwgZikge1xuICAgICAgICB2YXIgZmYgPSBmdW5jdGlvbiAoYywgbmV4dCkgeyByZXR1cm4gYy5hY3RpdmUgJiYgcHJldiAhPT0gbmV4dCAmJiBmKGMsIG5leHQpOyB9O1xuICAgICAgICB0aGlzLmNPdXQuZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gZmYoYywgYy5yaWdodCk7IH0pO1xuICAgICAgICB0aGlzLmNJbi5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiBmZihjLCBjLmxlZnQpOyB9KTtcbiAgICB9O1xuICAgIHJldHVybiBWYXJpYWJsZTtcbn0oKSk7XG5leHBvcnRzLlZhcmlhYmxlID0gVmFyaWFibGU7XG52YXIgQmxvY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJsb2NrKHYpIHtcbiAgICAgICAgdGhpcy52YXJzID0gW107XG4gICAgICAgIHYub2Zmc2V0ID0gMDtcbiAgICAgICAgdGhpcy5wcyA9IG5ldyBQb3NpdGlvblN0YXRzKHYuc2NhbGUpO1xuICAgICAgICB0aGlzLmFkZFZhcmlhYmxlKHYpO1xuICAgIH1cbiAgICBCbG9jay5wcm90b3R5cGUuYWRkVmFyaWFibGUgPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2LmJsb2NrID0gdGhpcztcbiAgICAgICAgdGhpcy52YXJzLnB1c2godik7XG4gICAgICAgIHRoaXMucHMuYWRkVmFyaWFibGUodik7XG4gICAgICAgIHRoaXMucG9zbiA9IHRoaXMucHMuZ2V0UG9zbigpO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLnVwZGF0ZVdlaWdodGVkUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHMuQUIgPSB0aGlzLnBzLkFEID0gdGhpcy5wcy5BMiA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gdGhpcy52YXJzLmxlbmd0aDsgaSA8IG47ICsraSlcbiAgICAgICAgICAgIHRoaXMucHMuYWRkVmFyaWFibGUodGhpcy52YXJzW2ldKTtcbiAgICAgICAgdGhpcy5wb3NuID0gdGhpcy5wcy5nZXRQb3NuKCk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuY29tcHV0ZV9sbSA9IGZ1bmN0aW9uICh2LCB1LCBwb3N0QWN0aW9uKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBkZmR2ID0gdi5kZmR2KCk7XG4gICAgICAgIHYudmlzaXROZWlnaGJvdXJzKHUsIGZ1bmN0aW9uIChjLCBuZXh0KSB7XG4gICAgICAgICAgICB2YXIgX2RmZHYgPSBfdGhpcy5jb21wdXRlX2xtKG5leHQsIHYsIHBvc3RBY3Rpb24pO1xuICAgICAgICAgICAgaWYgKG5leHQgPT09IGMucmlnaHQpIHtcbiAgICAgICAgICAgICAgICBkZmR2ICs9IF9kZmR2ICogYy5sZWZ0LnNjYWxlO1xuICAgICAgICAgICAgICAgIGMubG0gPSBfZGZkdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRmZHYgKz0gX2RmZHYgKiBjLnJpZ2h0LnNjYWxlO1xuICAgICAgICAgICAgICAgIGMubG0gPSAtX2RmZHY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb3N0QWN0aW9uKGMpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRmZHYgLyB2LnNjYWxlO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLnBvcHVsYXRlU3BsaXRCbG9jayA9IGZ1bmN0aW9uICh2LCBwcmV2KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHYudmlzaXROZWlnaGJvdXJzKHByZXYsIGZ1bmN0aW9uIChjLCBuZXh0KSB7XG4gICAgICAgICAgICBuZXh0Lm9mZnNldCA9IHYub2Zmc2V0ICsgKG5leHQgPT09IGMucmlnaHQgPyBjLmdhcCA6IC1jLmdhcCk7XG4gICAgICAgICAgICBfdGhpcy5hZGRWYXJpYWJsZShuZXh0KTtcbiAgICAgICAgICAgIF90aGlzLnBvcHVsYXRlU3BsaXRCbG9jayhuZXh0LCB2KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUudHJhdmVyc2UgPSBmdW5jdGlvbiAodmlzaXQsIGFjYywgdiwgcHJldikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodiA9PT0gdm9pZCAwKSB7IHYgPSB0aGlzLnZhcnNbMF07IH1cbiAgICAgICAgaWYgKHByZXYgPT09IHZvaWQgMCkgeyBwcmV2ID0gbnVsbDsgfVxuICAgICAgICB2LnZpc2l0TmVpZ2hib3VycyhwcmV2LCBmdW5jdGlvbiAoYywgbmV4dCkge1xuICAgICAgICAgICAgYWNjLnB1c2godmlzaXQoYykpO1xuICAgICAgICAgICAgX3RoaXMudHJhdmVyc2UodmlzaXQsIGFjYywgbmV4dCwgdik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmZpbmRNaW5MTSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG0gPSBudWxsO1xuICAgICAgICB0aGlzLmNvbXB1dGVfbG0odGhpcy52YXJzWzBdLCBudWxsLCBmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgaWYgKCFjLmVxdWFsaXR5ICYmIChtID09PSBudWxsIHx8IGMubG0gPCBtLmxtKSlcbiAgICAgICAgICAgICAgICBtID0gYztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmZpbmRNaW5MTUJldHdlZW4gPSBmdW5jdGlvbiAobHYsIHJ2KSB7XG4gICAgICAgIHRoaXMuY29tcHV0ZV9sbShsdiwgbnVsbCwgZnVuY3Rpb24gKCkgeyB9KTtcbiAgICAgICAgdmFyIG0gPSBudWxsO1xuICAgICAgICB0aGlzLmZpbmRQYXRoKGx2LCBudWxsLCBydiwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIGlmICghYy5lcXVhbGl0eSAmJiBjLnJpZ2h0ID09PSBuZXh0ICYmIChtID09PSBudWxsIHx8IGMubG0gPCBtLmxtKSlcbiAgICAgICAgICAgICAgICBtID0gYztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmZpbmRQYXRoID0gZnVuY3Rpb24gKHYsIHByZXYsIHRvLCB2aXNpdCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZW5kRm91bmQgPSBmYWxzZTtcbiAgICAgICAgdi52aXNpdE5laWdoYm91cnMocHJldiwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIGlmICghZW5kRm91bmQgJiYgKG5leHQgPT09IHRvIHx8IF90aGlzLmZpbmRQYXRoKG5leHQsIHYsIHRvLCB2aXNpdCkpKSB7XG4gICAgICAgICAgICAgICAgZW5kRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHZpc2l0KGMsIG5leHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVuZEZvdW5kO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmlzQWN0aXZlRGlyZWN0ZWRQYXRoQmV0d2VlbiA9IGZ1bmN0aW9uICh1LCB2KSB7XG4gICAgICAgIGlmICh1ID09PSB2KVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHZhciBpID0gdS5jT3V0Lmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdmFyIGMgPSB1LmNPdXRbaV07XG4gICAgICAgICAgICBpZiAoYy5hY3RpdmUgJiYgdGhpcy5pc0FjdGl2ZURpcmVjdGVkUGF0aEJldHdlZW4oYy5yaWdodCwgdikpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgQmxvY2suc3BsaXQgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICBjLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gW0Jsb2NrLmNyZWF0ZVNwbGl0QmxvY2soYy5sZWZ0KSwgQmxvY2suY3JlYXRlU3BsaXRCbG9jayhjLnJpZ2h0KV07XG4gICAgfTtcbiAgICBCbG9jay5jcmVhdGVTcGxpdEJsb2NrID0gZnVuY3Rpb24gKHN0YXJ0VmFyKSB7XG4gICAgICAgIHZhciBiID0gbmV3IEJsb2NrKHN0YXJ0VmFyKTtcbiAgICAgICAgYi5wb3B1bGF0ZVNwbGl0QmxvY2soc3RhcnRWYXIsIG51bGwpO1xuICAgICAgICByZXR1cm4gYjtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5zcGxpdEJldHdlZW4gPSBmdW5jdGlvbiAodmwsIHZyKSB7XG4gICAgICAgIHZhciBjID0gdGhpcy5maW5kTWluTE1CZXR3ZWVuKHZsLCB2cik7XG4gICAgICAgIGlmIChjICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYnMgPSBCbG9jay5zcGxpdChjKTtcbiAgICAgICAgICAgIHJldHVybiB7IGNvbnN0cmFpbnQ6IGMsIGxiOiBic1swXSwgcmI6IGJzWzFdIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUubWVyZ2VBY3Jvc3MgPSBmdW5jdGlvbiAoYiwgYywgZGlzdCkge1xuICAgICAgICBjLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYi52YXJzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIHYgPSBiLnZhcnNbaV07XG4gICAgICAgICAgICB2Lm9mZnNldCArPSBkaXN0O1xuICAgICAgICAgICAgdGhpcy5hZGRWYXJpYWJsZSh2KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBvc24gPSB0aGlzLnBzLmdldFBvc24oKTtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5jb3N0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc3VtID0gMCwgaSA9IHRoaXMudmFycy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIHZhciB2ID0gdGhpcy52YXJzW2ldLCBkID0gdi5wb3NpdGlvbigpIC0gdi5kZXNpcmVkUG9zaXRpb247XG4gICAgICAgICAgICBzdW0gKz0gZCAqIGQgKiB2LndlaWdodDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH07XG4gICAgcmV0dXJuIEJsb2NrO1xufSgpKTtcbmV4cG9ydHMuQmxvY2sgPSBCbG9jaztcbnZhciBCbG9ja3MgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJsb2Nrcyh2cykge1xuICAgICAgICB0aGlzLnZzID0gdnM7XG4gICAgICAgIHZhciBuID0gdnMubGVuZ3RoO1xuICAgICAgICB0aGlzLmxpc3QgPSBuZXcgQXJyYXkobik7XG4gICAgICAgIHdoaWxlIChuLS0pIHtcbiAgICAgICAgICAgIHZhciBiID0gbmV3IEJsb2NrKHZzW25dKTtcbiAgICAgICAgICAgIHRoaXMubGlzdFtuXSA9IGI7XG4gICAgICAgICAgICBiLmJsb2NrSW5kID0gbjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBCbG9ja3MucHJvdG90eXBlLmNvc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdW0gPSAwLCBpID0gdGhpcy5saXN0Lmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgIHN1bSArPSB0aGlzLmxpc3RbaV0uY29zdCgpO1xuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbiAoYikge1xuICAgICAgICBiLmJsb2NrSW5kID0gdGhpcy5saXN0Lmxlbmd0aDtcbiAgICAgICAgdGhpcy5saXN0LnB1c2goYik7XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChiKSB7XG4gICAgICAgIHZhciBsYXN0ID0gdGhpcy5saXN0Lmxlbmd0aCAtIDE7XG4gICAgICAgIHZhciBzd2FwQmxvY2sgPSB0aGlzLmxpc3RbbGFzdF07XG4gICAgICAgIHRoaXMubGlzdC5sZW5ndGggPSBsYXN0O1xuICAgICAgICBpZiAoYiAhPT0gc3dhcEJsb2NrKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RbYi5ibG9ja0luZF0gPSBzd2FwQmxvY2s7XG4gICAgICAgICAgICBzd2FwQmxvY2suYmxvY2tJbmQgPSBiLmJsb2NrSW5kO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgdmFyIGwgPSBjLmxlZnQuYmxvY2ssIHIgPSBjLnJpZ2h0LmJsb2NrO1xuICAgICAgICB2YXIgZGlzdCA9IGMucmlnaHQub2Zmc2V0IC0gYy5sZWZ0Lm9mZnNldCAtIGMuZ2FwO1xuICAgICAgICBpZiAobC52YXJzLmxlbmd0aCA8IHIudmFycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHIubWVyZ2VBY3Jvc3MobCwgYywgZGlzdCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGwubWVyZ2VBY3Jvc3MociwgYywgLWRpc3QpO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUocik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHRoaXMubGlzdC5mb3JFYWNoKGYpO1xuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS51cGRhdGVCbG9ja1Bvc2l0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5saXN0LmZvckVhY2goZnVuY3Rpb24gKGIpIHsgcmV0dXJuIGIudXBkYXRlV2VpZ2h0ZWRQb3NpdGlvbigpOyB9KTtcbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUuc3BsaXQgPSBmdW5jdGlvbiAoaW5hY3RpdmUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy51cGRhdGVCbG9ja1Bvc2l0aW9ucygpO1xuICAgICAgICB0aGlzLmxpc3QuZm9yRWFjaChmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgdmFyIHYgPSBiLmZpbmRNaW5MTSgpO1xuICAgICAgICAgICAgaWYgKHYgIT09IG51bGwgJiYgdi5sbSA8IFNvbHZlci5MQUdSQU5HSUFOX1RPTEVSQU5DRSkge1xuICAgICAgICAgICAgICAgIGIgPSB2LmxlZnQuYmxvY2s7XG4gICAgICAgICAgICAgICAgQmxvY2suc3BsaXQodikuZm9yRWFjaChmdW5jdGlvbiAobmIpIHsgcmV0dXJuIF90aGlzLmluc2VydChuYik7IH0pO1xuICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZShiKTtcbiAgICAgICAgICAgICAgICBpbmFjdGl2ZS5wdXNoKHYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBCbG9ja3M7XG59KCkpO1xuZXhwb3J0cy5CbG9ja3MgPSBCbG9ja3M7XG52YXIgU29sdmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb2x2ZXIodnMsIGNzKSB7XG4gICAgICAgIHRoaXMudnMgPSB2cztcbiAgICAgICAgdGhpcy5jcyA9IGNzO1xuICAgICAgICB0aGlzLnZzID0gdnM7XG4gICAgICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHYuY0luID0gW10sIHYuY091dCA9IFtdO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jcyA9IGNzO1xuICAgICAgICBjcy5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICBjLmxlZnQuY091dC5wdXNoKGMpO1xuICAgICAgICAgICAgYy5yaWdodC5jSW4ucHVzaChjKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaW5hY3RpdmUgPSBjcy5tYXAoZnVuY3Rpb24gKGMpIHsgYy5hY3RpdmUgPSBmYWxzZTsgcmV0dXJuIGM7IH0pO1xuICAgICAgICB0aGlzLmJzID0gbnVsbDtcbiAgICB9XG4gICAgU29sdmVyLnByb3RvdHlwZS5jb3N0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5icy5jb3N0KCk7XG4gICAgfTtcbiAgICBTb2x2ZXIucHJvdG90eXBlLnNldFN0YXJ0aW5nUG9zaXRpb25zID0gZnVuY3Rpb24gKHBzKSB7XG4gICAgICAgIHRoaXMuaW5hY3RpdmUgPSB0aGlzLmNzLm1hcChmdW5jdGlvbiAoYykgeyBjLmFjdGl2ZSA9IGZhbHNlOyByZXR1cm4gYzsgfSk7XG4gICAgICAgIHRoaXMuYnMgPSBuZXcgQmxvY2tzKHRoaXMudnMpO1xuICAgICAgICB0aGlzLmJzLmZvckVhY2goZnVuY3Rpb24gKGIsIGkpIHsgcmV0dXJuIGIucG9zbiA9IHBzW2ldOyB9KTtcbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc2V0RGVzaXJlZFBvc2l0aW9ucyA9IGZ1bmN0aW9uIChwcykge1xuICAgICAgICB0aGlzLnZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHYuZGVzaXJlZFBvc2l0aW9uID0gcHNbaV07IH0pO1xuICAgIH07XG4gICAgU29sdmVyLnByb3RvdHlwZS5tb3N0VmlvbGF0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtaW5TbGFjayA9IE51bWJlci5NQVhfVkFMVUUsIHYgPSBudWxsLCBsID0gdGhpcy5pbmFjdGl2ZSwgbiA9IGwubGVuZ3RoLCBkZWxldGVQb2ludCA9IG47XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgYyA9IGxbaV07XG4gICAgICAgICAgICBpZiAoYy51bnNhdGlzZmlhYmxlKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgdmFyIHNsYWNrID0gYy5zbGFjaygpO1xuICAgICAgICAgICAgaWYgKGMuZXF1YWxpdHkgfHwgc2xhY2sgPCBtaW5TbGFjaykge1xuICAgICAgICAgICAgICAgIG1pblNsYWNrID0gc2xhY2s7XG4gICAgICAgICAgICAgICAgdiA9IGM7XG4gICAgICAgICAgICAgICAgZGVsZXRlUG9pbnQgPSBpO1xuICAgICAgICAgICAgICAgIGlmIChjLmVxdWFsaXR5KVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVsZXRlUG9pbnQgIT09IG4gJiZcbiAgICAgICAgICAgIChtaW5TbGFjayA8IFNvbHZlci5aRVJPX1VQUEVSQk9VTkQgJiYgIXYuYWN0aXZlIHx8IHYuZXF1YWxpdHkpKSB7XG4gICAgICAgICAgICBsW2RlbGV0ZVBvaW50XSA9IGxbbiAtIDFdO1xuICAgICAgICAgICAgbC5sZW5ndGggPSBuIC0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdjtcbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc2F0aXNmeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuYnMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5icyA9IG5ldyBCbG9ja3ModGhpcy52cyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5icy5zcGxpdCh0aGlzLmluYWN0aXZlKTtcbiAgICAgICAgdmFyIHYgPSBudWxsO1xuICAgICAgICB3aGlsZSAoKHYgPSB0aGlzLm1vc3RWaW9sYXRlZCgpKSAmJiAodi5lcXVhbGl0eSB8fCB2LnNsYWNrKCkgPCBTb2x2ZXIuWkVST19VUFBFUkJPVU5EICYmICF2LmFjdGl2ZSkpIHtcbiAgICAgICAgICAgIHZhciBsYiA9IHYubGVmdC5ibG9jaywgcmIgPSB2LnJpZ2h0LmJsb2NrO1xuICAgICAgICAgICAgaWYgKGxiICE9PSByYikge1xuICAgICAgICAgICAgICAgIHRoaXMuYnMubWVyZ2Uodik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobGIuaXNBY3RpdmVEaXJlY3RlZFBhdGhCZXR3ZWVuKHYucmlnaHQsIHYubGVmdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdi51bnNhdGlzZmlhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzcGxpdCA9IGxiLnNwbGl0QmV0d2Vlbih2LmxlZnQsIHYucmlnaHQpO1xuICAgICAgICAgICAgICAgIGlmIChzcGxpdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJzLmluc2VydChzcGxpdC5sYik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnMuaW5zZXJ0KHNwbGl0LnJiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icy5yZW1vdmUobGIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluYWN0aXZlLnB1c2goc3BsaXQuY29uc3RyYWludCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2LnVuc2F0aXNmaWFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHYuc2xhY2soKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5hY3RpdmUucHVzaCh2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnMubWVyZ2Uodik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBTb2x2ZXIucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNhdGlzZnkoKTtcbiAgICAgICAgdmFyIGxhc3Rjb3N0ID0gTnVtYmVyLk1BWF9WQUxVRSwgY29zdCA9IHRoaXMuYnMuY29zdCgpO1xuICAgICAgICB3aGlsZSAoTWF0aC5hYnMobGFzdGNvc3QgLSBjb3N0KSA+IDAuMDAwMSkge1xuICAgICAgICAgICAgdGhpcy5zYXRpc2Z5KCk7XG4gICAgICAgICAgICBsYXN0Y29zdCA9IGNvc3Q7XG4gICAgICAgICAgICBjb3N0ID0gdGhpcy5icy5jb3N0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvc3Q7XG4gICAgfTtcbiAgICBTb2x2ZXIuTEFHUkFOR0lBTl9UT0xFUkFOQ0UgPSAtMWUtNDtcbiAgICBTb2x2ZXIuWkVST19VUFBFUkJPVU5EID0gLTFlLTEwO1xuICAgIHJldHVybiBTb2x2ZXI7XG59KCkpO1xuZXhwb3J0cy5Tb2x2ZXIgPSBTb2x2ZXI7XG5mdW5jdGlvbiByZW1vdmVPdmVybGFwSW5PbmVEaW1lbnNpb24oc3BhbnMsIGxvd2VyQm91bmQsIHVwcGVyQm91bmQpIHtcbiAgICB2YXIgdnMgPSBzcGFucy5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIG5ldyBWYXJpYWJsZShzLmRlc2lyZWRDZW50ZXIpOyB9KTtcbiAgICB2YXIgY3MgPSBbXTtcbiAgICB2YXIgbiA9IHNwYW5zLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4gLSAxOyBpKyspIHtcbiAgICAgICAgdmFyIGxlZnQgPSBzcGFuc1tpXSwgcmlnaHQgPSBzcGFuc1tpICsgMV07XG4gICAgICAgIGNzLnB1c2gobmV3IENvbnN0cmFpbnQodnNbaV0sIHZzW2kgKyAxXSwgKGxlZnQuc2l6ZSArIHJpZ2h0LnNpemUpIC8gMikpO1xuICAgIH1cbiAgICB2YXIgbGVmdE1vc3QgPSB2c1swXSwgcmlnaHRNb3N0ID0gdnNbbiAtIDFdLCBsZWZ0TW9zdFNpemUgPSBzcGFuc1swXS5zaXplIC8gMiwgcmlnaHRNb3N0U2l6ZSA9IHNwYW5zW24gLSAxXS5zaXplIC8gMjtcbiAgICB2YXIgdkxvd2VyID0gbnVsbCwgdlVwcGVyID0gbnVsbDtcbiAgICBpZiAobG93ZXJCb3VuZCkge1xuICAgICAgICB2TG93ZXIgPSBuZXcgVmFyaWFibGUobG93ZXJCb3VuZCwgbGVmdE1vc3Qud2VpZ2h0ICogMTAwMCk7XG4gICAgICAgIHZzLnB1c2godkxvd2VyKTtcbiAgICAgICAgY3MucHVzaChuZXcgQ29uc3RyYWludCh2TG93ZXIsIGxlZnRNb3N0LCBsZWZ0TW9zdFNpemUpKTtcbiAgICB9XG4gICAgaWYgKHVwcGVyQm91bmQpIHtcbiAgICAgICAgdlVwcGVyID0gbmV3IFZhcmlhYmxlKHVwcGVyQm91bmQsIHJpZ2h0TW9zdC53ZWlnaHQgKiAxMDAwKTtcbiAgICAgICAgdnMucHVzaCh2VXBwZXIpO1xuICAgICAgICBjcy5wdXNoKG5ldyBDb25zdHJhaW50KHJpZ2h0TW9zdCwgdlVwcGVyLCByaWdodE1vc3RTaXplKSk7XG4gICAgfVxuICAgIHZhciBzb2x2ZXIgPSBuZXcgU29sdmVyKHZzLCBjcyk7XG4gICAgc29sdmVyLnNvbHZlKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmV3Q2VudGVyczogdnMuc2xpY2UoMCwgc3BhbnMubGVuZ3RoKS5tYXAoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucG9zaXRpb24oKTsgfSksXG4gICAgICAgIGxvd2VyQm91bmQ6IHZMb3dlciA/IHZMb3dlci5wb3NpdGlvbigpIDogbGVmdE1vc3QucG9zaXRpb24oKSAtIGxlZnRNb3N0U2l6ZSxcbiAgICAgICAgdXBwZXJCb3VuZDogdlVwcGVyID8gdlVwcGVyLnBvc2l0aW9uKCkgOiByaWdodE1vc3QucG9zaXRpb24oKSArIHJpZ2h0TW9zdFNpemVcbiAgICB9O1xufVxuZXhwb3J0cy5yZW1vdmVPdmVybGFwSW5PbmVEaW1lbnNpb24gPSByZW1vdmVPdmVybGFwSW5PbmVEaW1lbnNpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD12cHNjLmpzLm1hcCJdfQ==
