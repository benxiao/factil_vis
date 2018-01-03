import * as cola from "./webcola/dist/index"
import * as d3 from "d3"


class Point {
    x:number;
    y:number;
}


interface Link {
    source: Node|Rect|number
    target: Node|Rect|number
    role: number

}

interface Rect {
    x:number
    y:number
    width:number
    height:number
}

interface Node {
    name: string;
    type: string;
    id: number;
}

const d3cola = cola.d3adaptor(d3)
    .convergenceThreshold(0.1);

/* should be put into a separate file for code organization*/

/*
    computing the aesthetically pleasing points that connects an edge and a fact
 */
function get_connected_points(rect:{x:number, y:number, width:number, height:number} , n:number, pos:number): Point[] {
    const x = rect.x;
    const y = rect.y;
    const width = rect.width;
    const height = rect.height;
    const w = width / (n * 2);
    if (pos == 1) { // if it is the leftmost element
        if (n == 1) {
            return [{x: x, y: y + height / 2},
                {x: x + width / 2, y: y},
                {x: x + width / 2, y: y + height},
                {x: x + width, y: y + height / 2}]
        }
        return [{x: x, y: y + height / 2}, {x: x + w, y: y}, {x: x + w, y: y + height}]
    }
    if (pos == n) {
        return [{x: x + width - w, y: y}, {x: x + width, y: y + height / 2}, {x: x + width - w, y: y + height}]
    }
    const cx = x + w + (w * 2) * (pos - 1);
    return [{x: cx, y: y}, {x: cx, y: y + height}]
}




function findIndex<T>(array:T[], predicate:(x:T)=>boolean): number{
    const element = array.find(predicate);
    if (!element) {
        return -1;
    }
    return array.indexOf(element);
}

/*
 primarily constraints on x alignment
 generate constraints
 assume the root node is the first node
*/
function generate_constraints(json:any):any {
    const nodes: Node[] = json.nodes;
    const links: Link[] = json.links;
    let constraints = [];
    const facts = nodes.filter((x) => x.type == "fact");
    const LEFT = 0, RIGHT = 1;
    let whichSide = facts.map(function (fact) {
        const i = findIndex(links, function (l) {
            return l.target == fact.id && l.source == 0;
        });
        return links[i].role <= (<any>fact).roles / 2 ? RIGHT : LEFT;
    });

    const d = 220;
    const x_aligned_constraints = facts.map(
        function (fact, i) {
            let result;
            if (whichSide[i] == LEFT) {
                const left = findIndex(links, function (l) {
                    return (l.target == fact.id) && (l.role == 1)
                });
                result = {
                    type: "alignment",
                    axis: "x",
                    offsets: [
                        {node: links[left].source, offset: 0},
                        {node: fact.id, offset: d},
                        {node: 0, offset: d * 2}]
                };

                //debugger

            } else {
                const right = findIndex(links, function (l) {
                    return (l.target == fact.id) && (l.role == (<any>fact).roles)
                });

                result = {
                    type: "alignment",
                    axis: "x",
                    offsets: [
                        {node: 0, offset: 0},
                        {node: fact.id, offset: d},
                        {node: links[right].source, offset: d * 2}]
                };

                //debugger
            }
            return result;
        });
    return constraints.concat(x_aligned_constraints);
}


/*
    compute distance between two points
 */

function distance(p1:Point, p2:Point):number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

const width = 1500, height = 700;

const outer = d3.select("body").append("svg")
    .attr('width', width)
    .attr('height', height)
    .attr('pointer-events', "all");

outer.append('rect')
    .attr('class', 'background')
    .attr('width', "100%")
    .attr('height', "100%")
    .call(d3.zoom().on("zoom", redraw));

const vis = outer
    .append('g')
    .attr('transform', 'translate(250,250) scale(0.3)');

function redraw() {
    vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
}

outer.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5L2,0')
    .attr('stroke-width', '0px')
    .attr('fill', '#000');

d3.json("graphdata/elementalViewMockData.json", function (error:any, json:any) {
    debugger
    const margin = 10, pad = 12;
    const nodes = json.nodes;
    const links = json.links;
    nodes.forEach(function (x, i) {
        x.index = i
    });
    const constraints = generate_constraints(json);
    const _objects = nodes.filter((x) => x.type.indexOf("object") !== -1);
    const _facts = nodes.filter((x) => x.type === "fact");
    const _namedfacts = nodes.filter((x) => {
        return x.type === "fact" && x.named === true
    });
    const roleboxes = new Array(_facts.map((x) => x.roles).reduce((x, y) => x + y, 0));

    // need to be refactored later
    for (let i = 0; i !== roleboxes.length; i++) {
        let d = {x:0, y:0, width:30, height:30};
        roleboxes[i] = <Rect>d;
    }
    let i = 0;
    for (let x of _facts) {
        x.roleboxes = [];
        for (let y = 0; y !== x.roles; y++) {
            x.roleboxes.push(roleboxes[i]);
            i++;
        }
    }

    d3cola
        .avoidOverlaps(true)
        .convergenceThreshold(1e-3)
        .size([width, height])
        .nodes(nodes)
        .links(links)
        .constraints(constraints)
        .linkDistance(130);

    const temp = vis.selectAll(".objectLabel")
        .data(_objects)
        .enter().append("text")
        .attr("class", "objectLabel")
        .text(function (d:Node) {
            return d.name;
        })
        // need to be replaced
        .each(function (d:any) {
            const b = (<SVGGraphicsElement>this).getBBox();
            const extra = 2 * pad;
            nodes[d.index].width = b.width + extra;
            nodes[d.index].height = b.height + extra;
            //may be changed to
            // d.width = b.width  + extra;
            // d.height = b.height + extra;


        });

    vis.selectAll(".objectLabel").data([]).exit().remove();


    // links: line between object type and fact type
    const link = vis.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link");


    // object type can be further divided into entity type or value type
    const _object = vis.selectAll(".object")
        .data(_objects)
        .enter().append("rect")
        .attr('rx', 5)
        .attr('ry', 5)
        .call(d3cola.drag);

    _object.filter((d:Node) => d.type === "object.value").attr("class", "valueObject");
    _object.filter((d:Node) => d.type === "object").attr("class", "object");


    // text that describe object
    const _objectLabel = vis.selectAll(".objectLabel")
        .data(_objects)
        .enter().append("text")
        .attr("class", "objectLabel")
        .text(function (d:Node) {
            return d.name;
        })
        .call(d3cola.drag)
        .each(function (d:any) {
            const b = (<SVGGraphicsElement>this).getBBox();
            const extra = 2 * margin + 2 * pad;
            d.width = b.width + extra;
            d.height = b.height + extra;
        });


    // boxes equally divided facts
    const factRoleBox = vis.selectAll(".factRoleBox")
        .data(roleboxes)
        .enter().append("rect")
        .attr("class", "factRoleBox")
        .attr("width", (d:any) => d.width)
        .attr("height", (d:any) => d.height);

    // fact type
    const fact = vis.selectAll(".fact")
        .data(_facts)
        .enter().append("rect")
        .attr("class", "fact")
        .each(
            function (d:any) {
                nodes[d.index].height = 30;
                nodes[d.index].width = d.roles * 30;
            }
        ).call(d3cola.drag);

    // label on top of the fact
    const factLabel = vis.selectAll(".factLabel")
        .data(_facts)
        .enter().append("text")
        .attr("class", "factLabel")
        .text(function (d:Node) {
            return d.name
        });

    // box outside the factbox that indicate whether a given fact type is named or not
    const factNamedFactBox = vis.selectAll(".factNamedFactBox")
        .data(_namedfacts)
        .enter().append("rect")
        .attr("class", "factNamedFactBox")
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("width", function (d:Rect) {
            return d.width * 1.5;
        })
        .attr("height", function (d:Rect) {
            return d.height * 1.5;
        })
        .call(d3cola.drag);

    // endpoint at the two ends of edges that indicates "unique constraints" not sure?
    const linkEndPoint = vis.selectAll(".endPoint")
        .data(links)
        .enter().append("circle")
        .attr("class", "linkEndPoint")
        .attr("visibility", function (d:any) {
            return (d.role != 0) ? "visible" : "hidden";
        })
        .attr("r", 5);

    // where all the magic happens
    d3cola.start(50, 100, 200).on("tick", function () {
        _object.each(function (d:any) {
            d.innerBounds = d.bounds.inflate(-margin);
        })
            .attr("x", function (d:any) {
                return d.innerBounds.x;
            })
            .attr("y", function (d:any) {
                return d.innerBounds.y;
            })
            .attr("width", function (d:any) {
                return d.innerBounds.width();
            })
            .attr("height", function (d:any) {
                return d.innerBounds.height();
            });

        fact.attr("x", function (d:Rect) {
            return d.x - d.width / 2;
        })
            .attr("y", function (d:Rect) {
                return d.y - d.height / 2;
            })
            .attr("width", function (d:Rect) {
                return d.width;
            })
            .attr("height", function (d:Rect) {
                return d.height;
            })
            .each(
                function (d:any) {
                    const bwidth = d.width / d.roles;
                    const xOffset = d.width / 2;
                    const yOffset = d.height / 2;
                    d.roleboxes.forEach(
                        function (box, i) {
                            box.x = d.x + bwidth * i - xOffset;
                            box.y = d.y - yOffset;
                        }
                    )
                }
            );

        factNamedFactBox
            .attr("x", function (d:Rect) {
                return d.x - d.width / 2 * 1.5;
            })
            .attr("y", function (d:Rect) {
                return d.y - d.height / 2 * 1.5;
            });

        link.each(
            function (d:any) {
                const topLeft = {
                    x: d.target.x - d.target.width / 2,
                    y: d.target.y - d.target.height / 2,
                    width: d.target.width,
                    height: d.target.height
                };
                const points = get_connected_points(topLeft, d.target.roles, d.role);
                const dists = points.map((p) => distance(p, d.source));
                const p = points[dists.indexOf(Math.min(...dists))];
                d.edgeX = p.x;
                d.edgeY = p.y;
            })
            .attr("x1", function (d:any) {
                return d.source.x;
            })
            .attr("y1", function (d:any) {
                return d.source.y;
            })
            .attr("x2", function (d:any) {
                return d.edgeX;
            })
            .attr("y2", function (d:any) {
                return d.edgeY;
            });

        _objectLabel
            .attr("x", function (d:Rect) {
                return d.x
            })
            .attr("y", function (d:Rect) {
                return d.y + (margin + pad) / 2
            });

        linkEndPoint
            .attr("cx", function (d:any) {
                return d.edgeX;
            })
            .attr("cy", function (d:any) {
                return d.edgeY;
            });

        factLabel
            .attr("x", function (d:Rect) {
                return d.x;
            })
            .attr("y", function (d:Rect) {
                return d.y - 35;
            });

        factRoleBox
            .attr("x", function (d:Rect) {
                return d.x;
            })
            .attr("y", function (d:Rect) {
                return d.y;
            })
    });
});